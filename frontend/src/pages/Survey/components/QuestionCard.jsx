/** 
 * 문항 제목 
 * 바깥 카드 안에 들어가므로 별도 Card 없이 제목만
 */

import { memo } from 'react';
import { QuestionShape } from '@/types/propTypes';

const splitNote = (content) => {
  const match = content.match(/^(.*?)(\(.*\))$/);
  return match ? { main: match[1], note: match[2] } : { main: content, note: null };
};

function QuestionCard({ question }) {
  const { main, note } = splitNote(question.content);

  return (
    <h2 id={`question-${question.id}`} className="text-xl leading-snug font-bold">
      Q{question.questionNumber}. {main}
      {note && (
        <span className="mt-1 block pl-9 text-base font-medium text-slate-600">{note}</span>
      )}
    </h2>
  );
}

QuestionCard.propTypes = {
  question: QuestionShape.isRequired,
};

export default memo(QuestionCard);
