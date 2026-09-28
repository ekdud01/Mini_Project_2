/** 정상/주의/위험 표시 */

import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { SurveyResultShape } from "@/types/propTypes";
import { EXAM_TYPE_LABEL, RISK_LEVEL, RISK_MESSAGE } from "@/utils/kdsq";

const BADGE_CLASS = {
    Normal: 'border-normal bg-normal/15 text-green-800',
    Borderline: 'border-borderline bg-borderline/15 text-amber-800',
    HighRisk: 'border-highrisk bg-highrisk/10 text-red-700',
};

const TEXT_CLASS = {
    Normal: 'text-green-700',
    Borderline: 'text-amber-700',
    HighRisk: 'text-red-600',
};

function ResultStatus({ result }) {
    const { riskLevel, examType } = result;

    return (
        <div className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2">
                <Badge variant="outline">{EXAM_TYPE_LABEL[examType]}</Badge>
                <Badge className={cn('px-3 text-sm', BADGE_CLASS[riskLevel])}>{RISK_LEVEL[riskLevel]}</Badge>
            </div>
            <p className={cn('text-2xl font-bold', TEXT_CLASS[riskLevel])}>{RISK_MESSAGE[riskLevel]}</p>
        </div>
    );
}

ResultStatus.propTypes = {
    result: SurveyResultShape.isRequired,
};

export default ResultStatus;