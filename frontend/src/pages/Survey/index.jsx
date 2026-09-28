/**
 * SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import PropTypes from 'prop-types';
import SurveyHeader from './components/SurveyHeader';
import ProgressBar from './components/ProgressBar';
import { useCallback, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';
import QuestionCard from './components/QuestionCard';
import AnswerOptions from './components/AnswerOptions';

export default function SurveyPage({ type }) {
  const questions = useSurveyStore((s) => s.questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [validationMessage, setValidationMessage] = useState('');
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;

  const handleSelect = useCallback(
    (score) => {
      setAnswers((prev) => ({ ...prev, [currentQuestionId]: score }));
      setValidationMessage('');
    },
    [currentQuestionId],
  );

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

    </section>
  );
}

SurveyPage.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
};
