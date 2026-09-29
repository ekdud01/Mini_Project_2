/** 문항 표시 (바깥 카드 안에 들어가므로 별도 Card 없이 제목만) */

import { QuestionShape } from "@/types/propTypes";
import React from "react";

function QuestionCard({ question }) {
    const headingId = `question-${question.id}`;

    return (
        <h2 id={headingId} className="text-xl leading-snug font-bold">
            Q{question.questionNumber}. {question.content}
        </h2>
    );
};

QuestionCard.propTypes = {
    question: QuestionShape.isRequired,
}

export default React.memo(QuestionCard);
