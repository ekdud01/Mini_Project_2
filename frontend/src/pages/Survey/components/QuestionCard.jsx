/** 
 * 문항 제목 
 * 바깥 카드 안에 들어가므로 별도 Card 없이 제목만
 */

import { memo } from 'react';
import { QuestionShape } from '@/types/propTypes';

function QuestionCard({ question }) {
  return (
    <h2 id={`question-${question.id}`} className="text-xl leading-snug font-bold">
      Q{question.questionNumber}. {question.content}
    </h2>
  );
}

QuestionCard.propTypes = {
  question: QuestionShape.isRequired,
};

export default memo(QuestionCard);
