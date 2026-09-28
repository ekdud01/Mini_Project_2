/** 문항 표시 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuestionShape } from "@/types/propTypes";
import PropTypes from "prop-types";
import React from "react";

function QuestionCard({ question, children = null }) {
    // question이 없을 때 대신 보여줄 임시 데이터
    const dummyQuestion = {
        id: 999,
        questionNumber: 1,
        content: '데이터를 불러오는 중이거나 임시 질문입니다.'
    };
    const currentQuestion = question || dummyQuestion;
    const headingId = `question-${currentQuestion.id}`;
    // const headingId = `question-${question.id}`;

    return (
        <Card>
            <CardHeader>
                <h2 id={headingId} className="flex gap-2 text-xl leading-snug font-semibold">
                    {/* 임시 데이터 표시 */}
                    <span className="shrink-0 text-primary">Q{currentQuestion.questionNumber}.</span>
                    <span>{currentQuestion.content}</span>
                    {/* <span className="shrink-0 text-primary">Q{question.questionNumber}.</span> */}
                    {/* <span>{question.content}</span> */}
                </h2>
            </CardHeader>
            {children && <CardContent>{children}</CardContent>}
        </Card>
    );
};

QuestionCard.propTypes = {
    question: QuestionShape.isRequired,
    children: PropTypes.node,
}

export default React.memo(QuestionCard);