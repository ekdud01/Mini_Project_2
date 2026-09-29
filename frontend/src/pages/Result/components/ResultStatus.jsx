/** 정상/주의/위험 표시 */

import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { SurveyResultShape } from "@/types/propTypes";
import { EXAM_TYPE_LABEL, RISK_BADGE_CLASS, RISK_LEVEL, RISK_MESSAGE, RISK_TEXT_CLASS } from "@/utils/kdsq";

function ResultStatus({ result }) {
    const { riskLevel, examType } = result;

    return (
        <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
                <Badge variant="outline">{EXAM_TYPE_LABEL[examType]}</Badge>
                <Badge className={cn('px-3 text-sm', RISK_BADGE_CLASS[riskLevel])}>{RISK_LEVEL[riskLevel]}</Badge>
            </div>
            <p className={cn('text-2xl font-bold', RISK_TEXT_CLASS[riskLevel])}>{RISK_MESSAGE[riskLevel]}</p>
        </div>
    );
}

ResultStatus.propTypes = {
    result: SurveyResultShape.isRequired,
};

export default ResultStatus;