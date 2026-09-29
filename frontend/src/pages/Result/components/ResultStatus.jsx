/** 판정 배너: 정상(초록) / 주의(노랑) / 위험(빨강) */

import { cn } from "@/lib/utils";
import { RISK_BANNER, RISK_MESSAGE, RISK_TEXT_CLASS } from "@/utils/kdsq";
import PropTypes from "prop-types";

function ResultStatus({ riskLevel }) {
    const banner = RISK_BANNER[riskLevel];

    return (
        <div role="status" className={cn('space-y-2 rounded-xl border px-6 py-5 text-center', banner.className)}>
            <p className={cn('text-xl font-bold', RISK_TEXT_CLASS[riskLevel])}>{RISK_MESSAGE[riskLevel]}</p>
            <p className="leading-relaxed text-slate-700">{banner.description}</p>
        </div>
    );
}

ResultStatus.propTypes = {
    riskLevel: PropTypes.oneOf(['Normal', 'Borderline', 'HighRisk']).isRequired,
};

export default ResultStatus;
