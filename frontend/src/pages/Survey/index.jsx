/**
 * SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import PropTypes from 'prop-types';
import SurveyHeader from './components/SurveyHeader';
import ProgressBar from './components/ProgressBar';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/store/surveyStore';
import QuestionCard from './components/QuestionCard';
import AnswerOptions from './components/AnswerOptions';
import PreviousButton from './components/PreviousButton';
import SubmitButton from './components/SubmitButton';
import NextButton from './components/NextButton';
import { needsSecondTest, sumScores } from '@/utils/kdsq';

const SELECT_ANSWER_MESSAGE = '답변을 선택해주세요.';

// fe-result 머지 전까지 쓰는 임시 대체 코드
// TODO(fe-result 머지 후 삭제): useResultStore의 submitResult 등으로 교체
const submitResult = async () => ({ id: 'preview' });
const pendingFirstAnswers = null;
const setPendingFirstAnswers = () => {};
const clearPendingFirstAnswers = () => {};

export default function SurveyPage({ type }) {
  const navigate = useNavigate();
  const questions = useSurveyStore((s) => s.questions);
  const questionsSurveyId = useSurveyStore((s) => s.questionsSurveyId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const isLast = currentIndex === questions.length - 1;

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

  // 서버가 2차 검사를 거절하면 처음부터 다시 시작
  const restartFromFirst = () => {
    clearPendingFirstAnswers();
    navigate('/surveys/p', { replace: true });
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
      if (type === 'P' && code === 'KDSQ_C_REQUIRED') {
        goToSecondTest(answerList);
      } else if (code === 'KDSQ_C_NOT_ALLOWED' || code === 'KDSQ_C_REQUIRED') {
        restartFromFirst();
      } else if (code === 'INVALID_ANSWER_COUNT') {
        setErrorMessage('모든 문항에 답해주세요.');
      } else {
        console.error('[검사 제출 실패]', error);
        setErrorMessage('검사 제출에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-0">
      <SurveyHeader type={type} />

      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <QuestionCard question={currentQuestion}>
        <AnswerOptions
          value={answers[currentQuestionId] ?? null}
          onChange={handleSelect}
          invalid={Boolean(validationMessage)}
        />
        {validationMessage && (
          <p role="alert" className="mt-3 text-sm font-medium text-destructive">
            {validationMessage}
          </p>
        )}
      </QuestionCard>

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
