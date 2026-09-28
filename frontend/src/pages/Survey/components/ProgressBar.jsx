/** 진행률 */

import { Progress } from "@/components/ui/progress";
import PropTypes from "prop-types";

function ProgressBar({ current, total }) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="space-y-2">
            <p className="text-center text-sm font-medium text-muted-foreground">
                진행률 <span className="text-foreground">{current} / {total}</span>
            </p>
            <Progress value={percent} aria-label={`전체 ${total}문항 중 ${current}번째 문항`} />
        </div>
    );
};

ProgressBar.propTypes = {
    current: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
};

export default ProgressBar;