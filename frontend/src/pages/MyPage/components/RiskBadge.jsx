import { Badge } from '@/components/ui/badge';
import { RiskLevelType } from '@/types/propTypes';
import { RISK_BADGE_CLASS, RISK_LEVEL } from '@/utils/kdsq';

export default function RiskBadge({ riskLevel = null }) {
  return (
    <Badge variant="outline" className={`px-3 py-1 text-base ${RISK_BADGE_CLASS[riskLevel] ?? ''}`}>
      {RISK_LEVEL[riskLevel] ?? '-'}
    </Badge>
  );
}

RiskBadge.propTypes = { riskLevel: RiskLevelType };
