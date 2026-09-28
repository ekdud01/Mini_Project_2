/** 문항 표시 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { QuestionShape } from "@/types/propTypes";
import PropTypes from "prop-types";
import React from "react";

function QuestionCard({ question, children = null }) {
    const headingId = `question-${question.id}`;

    return (
        <Card>
            <CardHeader>
                <h2 id={headingId} className="flex gap-2 text-xl leading-snug font-semibold">
                    <span className="shrink-0 text-primary">Q{question.questionNumber}.</span>
                    <span>{question.content}</span>
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