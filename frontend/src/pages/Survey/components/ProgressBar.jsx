/** 
 * 진행률 
 * "진행률 47%" · "7 / 15 문항" 
 * 퍼센트에 따른 막대
 */

import PropTypes from 'prop-types';
import { Progress } from '@/components/ui/progress';

function ProgressBar({ current, total }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-primary">진행률 {percent}%</span>
        <span className="text-slate-600">
          {current} / {total} 문항
        </span>
      </div>
      <Progress
        value={percent}
        className="h-3 bg-slate-200"
        aria-label={`전체 ${total}문항 중 ${current}번째 문항`}
      />
    </div>
  );
}

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

export default ProgressBar;
