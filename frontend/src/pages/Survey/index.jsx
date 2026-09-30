/**
 * SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 *
 * 흐름
 *   P(/surveys/p): 시작 안내 → 5문항 → 합계 0~3점: 제출 후 결과 화면
 *                                     합계 4점 이상: 답변 보관 후 /surveys/c
 *   C(/surveys/c): 15문항 → 1차 답변과 함께 제출 → 결과 화면
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useResultStore } from '@/store/resultStore';
import { useSurveyStore } from '@/store/surveyStore';
import { getErrorCode } from '@/utils/apiError';
import { EXAM_TYPE_BY_ROUTE, needsSecondTest, sumScores } from '@/utils/kdsq';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import SurveyIntro from './components/SurveyIntro';
import SurveyHeader from './components/SurveyHeader';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import AnswerOptions from './components/AnswerOptions';
import PreviousButton from './components/PreviousButton';
import NextButton from './components/NextButton';
import SubmitButton from './components/SubmitButton';

const PAGE_TITLES = { P: 'KDSQ-P 1차 검사', C: 'KDSQ-C 2차 검사' };

const MESSAGES = {
  selectAnswer: '답변을 선택해주세요.',
  answerAll: '모든 문항에 답해주세요.',
  restart: '1차 검사부터 다시 진행해주세요.',
  loadFail: '문항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  submitFail: '검사 제출에 실패했습니다. 다시 시도해주세요.',
  network: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

/** 이 오류 코드를 받으면 1차부터 다시 시작 */
const RESTART_ERROR_CODES = ['KDSQ_C_NOT_ALLOWED', 'KDSQ_C_REQUIRED'];

export default function SurveyPage({ type }) {
  const examType = EXAM_TYPE_BY_ROUTE[type];

  // ── 1. 라우터 ──
  const navigate = useNavigate();
  const location = useLocation();

  // ── 2. 전역 상태 ──
  const survey = useSurveyStore((s) => s.surveys.find((x) => x.examType === examType));
  const questions = useSurveyStore((s) => s.questions);
  const questionsSurveyId = useSurveyStore((s) => s.questionsSurveyId);
  const loading = useSurveyStore((s) => s.loading);
  const loadError = useSurveyStore((s) => s.error);
  const fetchSurveys = useSurveyStore((s) => s.fetchSurveys);
  const fetchQuestions = useSurveyStore((s) => s.fetchQuestions);
  const resetSurveys = useSurveyStore((s) => s.reset);

  const pendingFirstAnswers = useResultStore((s) => s.pendingFirstAnswers);
  const setPendingFirstAnswers = useResultStore((s) => s.setPendingFirstAnswers);
  const clearPendingFirstAnswers = useResultStore((s) => s.clearPendingFirstAnswers);
  const submitResult = useResultStore((s) => s.submitResult);

  // ── 3. 로컬 상태 ──
  /** 1차(P)는 시작 안내를 먼저 보여주고 [검사 시작하기]를 눌러야 문항이 나온다. 2차(C)는 바로 시작 */
  const [isStarted, setIsStarted] = useState(type === 'C');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: score }
  const [submitting, setSubmitting] = useState(false);
  const [noQuestions, setNoQuestions] = useState(false);
  const [notice, setNotice] = useState(''); // 다른 화면에서 전달된 안내
  const [validationMessage, setValidationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // ── 4. 파생 값 ──
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const isCurrentAnswered = answers[currentQuestionId] !== undefined;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  // ── 5. 데이터 로드 ──
  /** 검사 종류(P/C)에 맞는 설문의 문항 불러오기 (조회 실패 시 재시도에도 사용) */
  const loadQuestions = useCallback(async () => {
    setNoQuestions(false);
    const surveys = await fetchSurveys();
    const target = surveys.find((s) => s.examType === examType);
    if (!target) {
      resetSurveys(); // 다시 시도할 때 설문 목록을 새로 받도록 캐시 비움
      setNoQuestions(true);
      return;
    }
    const list = await fetchQuestions(target.id);
    if (list.length === 0) setNoQuestions(true);
  }, [examType, fetchSurveys, fetchQuestions, resetSurveys]);

  /** 진행 상황을 처음으로 되돌린다 */
  const resetProgress = (started) => {
    setIsStarted(started);
    setCurrentIndex(0);
    setAnswers({});
  };

  /**
   * 다른 화면에서 전달한 안내 문구를 로컬 상태로 옮기고 기록(history)에서는 지운다
   * 지우지 않으면 새로고침해도 문구가 남는다
   */
  useEffect(() => {
    const message = location.state?.message;
    if (!message) return;
    setNotice(message);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  /** 검사 화면 진입 (pendingFirstAnswers는 진입 시 한 번만 확인하므로 의존성에서 제외) */
  useEffect(() => {
    document.title = PAGE_TITLES[type];

    /** /surveys/p 진입 시 보관된 1차 답변 비우기 */
    if (type === 'P') clearPendingFirstAnswers();
    if (type === 'C' && !pendingFirstAnswers) {
      /** 1차 답변 없이 /surveys/c에 들어온 경우 (주소 직접 접근 등) */
      navigate('/surveys/p', { replace: true, state: { message: MESSAGES.restart } });
      return;
    }

    resetProgress(type === 'C');
    setErrorMessage('');
    loadQuestions().catch((error) => console.error('[문항 조회 실패]', error));
  }, [type, loadQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. 이벤트 핸들러 ──
  const handleSelect = useCallback(
    (score) => {
      setAnswers((prev) => ({ ...prev, [currentQuestionId]: score }));
      setValidationMessage('');
      /** 검사를 다시 시작했으므로 안내 숨기기 */
      setNotice('');
    },
    [currentQuestionId],
  );

  const handlePrevious = () => {
    setValidationMessage('');
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    if (!isCurrentAnswered) {
      setValidationMessage(MESSAGES.selectAnswer);
      return;
    }
    setValidationMessage('');
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  };

  /** 1차 합계 4점 이상: 제출하지 않고 답변을 보관한 뒤 KDSQ-C로 이동 */
  const goToSecondTest = (answerList) => {
    setPendingFirstAnswers(answerList);
    navigate('/surveys/c', { replace: true });
  };

  /** 1차 답변이 없거나 서버가 2차 검사를 거절하면 처음부터 다시 시작 */
  const restartFromFirst = () => {
    clearPendingFirstAnswers();
    /** 이미 /surveys/p에 있으면 화면이 다시 마운트되지 않으므로 직접 초기화 */
    resetProgress(false);
    navigate('/surveys/p', { replace: true, state: { message: MESSAGES.restart } });
  };

  const handleSubmit = async () => {
    /** (1) 현재 문항 → (2) 빠진 문항 순서로 확인 */
    if (!isCurrentAnswered) {
      setValidationMessage(MESSAGES.selectAnswer);
      return;
    }
    const firstUnanswered = questions.findIndex((q) => answers[q.id] === undefined);
    if (firstUnanswered !== -1) {
      setCurrentIndex(firstUnanswered);
      setValidationMessage(MESSAGES.selectAnswer);
      return;
    }

    const answerList = questions.map((q) => ({ questionId: q.id, score: answers[q.id] }));

    if (type === 'P' && needsSecondTest(sumScores(answerList))) {
      goToSecondTest(answerList);
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const result = await submitResult({
        surveyId: questionsSurveyId,
        firstAnswers: type === 'C' ? pendingFirstAnswers : undefined,
        answers: answerList,
      });
      navigate(`/results/${result.id}`, { replace: true });
      if (type === 'C') clearPendingFirstAnswers();
    } catch (error) {
      setSubmitting(false);
      const code = getErrorCode(error);

      if (RESTART_ERROR_CODES.includes(code)) {
        restartFromFirst();
      } else if (code === 'INVALID_ANSWER_COUNT') {
        setErrorMessage(MESSAGES.answerAll);
      } else if (!error.response) {
        setErrorMessage(MESSAGES.network);
      } else {
        console.error('[검사 제출 실패]', error);
        setErrorMessage(MESSAGES.submitFail);
      }
    }
  };

  // ── 7. 렌더링 ──
  /** 문항 조회 실패 또는 문항 없음: 오류 메시지 + 재시도 */
  if (loadError || noQuestions) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <Alert variant="destructive">
          <AlertDescription>{MESSAGES.loadFail}</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="h-12" onClick={() => loadQuestions().catch(() => { })}>
          다시 시도
        </Button>
      </div>
    );
  }

  /** 
   * 시작 전: 안내 + [검사 시작하기] 
   * 문항은 뒤에서 미리 불러온다
   */
  if (!isStarted) {
    return (
      <section className="mx-auto max-w-2xl space-y-4">
        <Notice message={notice} />
        <SurveyIntro description={survey?.description} onStart={() => setIsStarted(true)} />
      </section>
    );
  }

  /** 문항이 준비되기 전에는 QuestionCard를 그리지 않는다 */
  if (loading || !currentQuestion) return <LoadingSpinner />;

  /** 
   * 검사 진행 검사 
   * 전체를 하나의 흰 카드로
   */
  return (
    <section className="mx-auto max-w-2xl space-y-4 pb-24 md:pb-0">
      <Notice message={notice} />

      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <SurveyHeader type={type} description={survey?.description} />

        <ProgressBar current={currentIndex + 1} total={questions.length} />

        <hr className="border-slate-200" />

        <div className="space-y-5">
          <QuestionCard question={currentQuestion} />
          <AnswerOptions
            value={answers[currentQuestionId] ?? null}
            onChange={handleSelect}
            invalid={Boolean(validationMessage)}
          />
          {validationMessage && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {validationMessage}
            </p>
          )}
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* 모바일: 화면 하단 고정 / md 이상: 카드 안에 배치 */}
        <div className="fixed inset-x-0 bottom-0 z-10 flex gap-3 border-t bg-background p-4 md:static md:border-0 md:bg-transparent md:p-0">
          <PreviousButton isDisabled={isFirst || submitting} onClick={handlePrevious} />
          {isLast ? (
            <SubmitButton isSubmitting={submitting} onClick={handleSubmit} />
          ) : (
            <NextButton onClick={handleNext} />
          )}
        </div>
      </div>
    </section>
  );
}

SurveyPage.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
};

/** 다른 화면에서 전달된 안내 문구 (없으면 표시하지 않음) */
function Notice({ message }) {
  if (!message) return null;
  return (
    <Alert>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

Notice.propTypes = {
  message: PropTypes.string,
};
