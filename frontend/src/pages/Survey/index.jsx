/**
 * SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import PropTypes from 'prop-types';
import SurveyHeader from './components/SurveyHeader';
import ProgressBar from './components/ProgressBar';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/surveyStore';
import { useResultStore } from '@/store/resultStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import QuestionCard from './components/QuestionCard';
import AnswerOptions from './components/AnswerOptions';
import PreviousButton from './components/PreviousButton';
import SubmitButton from './components/SubmitButton';
import NextButton from './components/NextButton';
import { EXAM_TYPE_BY_ROUTE, needsSecondTest, sumScores } from '@/utils/kdsq';

const SELECT_ANSWER_MESSAGE = '답변을 선택해주세요.';
const RESTART_MESSAGE = '1차 검사부터 다시 진행해주세요.';
const SUBMIT_FAIL_MESSAGE = '검사 제출에 실패했습니다. 다시 시도해주세요.';
const NETWORK_ERROR_MESSAGE = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
const PAGE_TITLES = { P: 'KDSQ-P 1차 검사', C: 'KDSQ-C 2차 검사' };

export default function SurveyPage({ type }) {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message ?? '';
  const submitResult = useResultStore((s) => s.submitResult);
  const pendingFirstAnswers = useResultStore((s) => s.pendingFirstAnswers);
  const setPendingFirstAnswers = useResultStore((s) => s.setPendingFirstAnswers);
  const clearPendingFirstAnswers = useResultStore((s) => s.clearPendingFirstAnswers);
  const questions = useSurveyStore((s) => s.questions);
  const questionsSurveyId = useSurveyStore((s) => s.questionsSurveyId);
  const survey = useSurveyStore((s) => s.surveys.find((x) => x.examType === EXAM_TYPE_BY_ROUTE[type]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const isLast = currentIndex === questions.length - 1;
  const fetchSurveys = useSurveyStore((s) => s.fetchSurveys);
  const fetchQuestions = useSurveyStore((s) => s.fetchQuestions);
  const loading = useSurveyStore((s) => s.loading);
  const loadError = useSurveyStore((s) => s.error);

  // 검사 종류(P/C)에 맞는 설문의 문항 불러오기 (조회 실패 시 재시도에도 사용)
  const loadQuestions = useCallback(async () => {
    const surveys = await fetchSurveys();
    const target = surveys.find((s) => s.examType === EXAM_TYPE_BY_ROUTE[type]);
    if (target) await fetchQuestions(target.id);
  }, [type, fetchSurveys, fetchQuestions]);

  // 검사 화면 진입 (pendingFirstAnswers는 진입 시 한 번만 확인하므로 의존성에서 제외)
  useEffect(() => {
    document.title = PAGE_TITLES[type];
    if (type === 'P') clearPendingFirstAnswers(); // /surveys/p 진입 시 보관된 1차 답변 비우기
    if (type === 'C' && !pendingFirstAnswers) {
      // 1차 답변 없이 /surveys/c에 들어온 경우 (주소 직접 접근 등)
      navigate('/surveys/p', { replace: true, state: { message: RESTART_MESSAGE } });
      return;
    }
    setCurrentIndex(0);
    setAnswers({});
    setErrorMessage('');
    loadQuestions().catch((error) => console.error('[문항 조회 실패]', error));
  }, [type, loadQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback(
    (score) => {
      setAnswers((prev) => ({ ...prev, [currentQuestionId]: score }));
      setValidationMessage('');
    },
    [currentQuestionId],
  );

  const handlePrevious = () => {
    setValidationMessage('');
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    if (answers[currentQuestionId] === undefined) {
      setValidationMessage(SELECT_ANSWER_MESSAGE);
      return;
    }
    setValidationMessage('');
    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
  };

  // 1차 합계 4점 이상이면 KDSQ-C로 이동
  const goToSecondTest = (answerList) => {
    setPendingFirstAnswers(answerList);
    navigate('/surveys/c', { replace: true });
  };

  // 1차 답변이 없거나 서버가 2차 검사를 거절하면 처음부터 다시 시작
  const restartFromFirst = () => {
    clearPendingFirstAnswers();
    setCurrentIndex(0); // 이미 /surveys/p에 있으면 화면이 다시 마운트되지 않으므로 직접 초기화
    setAnswers({});
    navigate('/surveys/p', { replace: true, state: { message: RESTART_MESSAGE } });
  };

  const handleSubmit = async () => {
    if (answers[currentQuestionId] === undefined) {
      setValidationMessage(SELECT_ANSWER_MESSAGE);
      return;
    }

    const firstUnanswered = questions.findIndex((q) => answers[q.id] === undefined);
    if (firstUnanswered !== -1) {
      setCurrentIndex(firstUnanswered);
      setValidationMessage(SELECT_ANSWER_MESSAGE);
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
      const result = await submitResult(
        type === 'P'
          ? { surveyId: questionsSurveyId, answers: answerList }
          : { surveyId: questionsSurveyId, firstAnswers: pendingFirstAnswers, answers: answerList },
      );
      navigate(`/results/${result.id}`, { replace: true });
      if (type === 'C') clearPendingFirstAnswers();
    } catch (error) {
      setSubmitting(false);
      const code = error.response?.data?.error?.code;
      if (code === 'KDSQ_C_NOT_ALLOWED' || code === 'KDSQ_C_REQUIRED') {
        restartFromFirst(); // React 설계서 5.3: 두 코드 모두 1차부터 다시
      } else if (code === 'INVALID_ANSWER_COUNT') {
        setErrorMessage('모든 문항에 답해주세요.');
      } else if (!error.response) {
        setErrorMessage(NETWORK_ERROR_MESSAGE); // 서버 응답 자체가 없음
      } else {
        console.error('[검사 제출 실패]', error);
        setErrorMessage(SUBMIT_FAIL_MESSAGE);
      }
    }
  };

  // 문항 조회 실패: 오류 메시지 + 재시도
  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <Alert variant="destructive">
          <AlertDescription>문항을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</AlertDescription>
        </Alert>
        <Button type="button" variant="outline" className="h-12" onClick={() => loadQuestions().catch(() => {})}>
          다시 시도
        </Button>
      </div>
    );
  }
  
  // 문항이 준비되기 전에는 QuestionCard를 그리지 않는다
  if (loading || !currentQuestion) return <LoadingSpinner />;

  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-0">
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <SurveyHeader type={type} description={survey?.description} />

      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="space-y-3">
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

      <div className="fixed inset-x-0 bottom-0 z-10 flex gap-2 border-t bg-background p-4 md:static md:justify-between md:border-0 md:bg-transparent md:p-0">
        <PreviousButton isDisabled={currentIndex === 0 || submitting} onClick={handlePrevious} />
        {isLast ? (
          <SubmitButton isSubmitting={submitting} onClick={handleSubmit} />
        ) : (
          <NextButton onClick={handleNext} />
        )}
      </div>

    </section>
  );
}

SurveyPage.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
};
