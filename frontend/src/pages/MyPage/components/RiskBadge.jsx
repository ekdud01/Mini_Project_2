import { Badge } from '@/components/ui/badge';
import { RiskLevelType } from '@/types/propTypes';
import { RISK_LEVEL } from '@/utils/kdsq';

// 관리자 배지의 색 값만 사용하며 전역 admin.css는 가져오지 않는다.
const BADGE_CLASS = {
  Normal: 'bg-[#dcfce7] text-[#15803d]',
  Borderline: 'bg-[#fef3c7] text-[#b45309]',
  HighRisk: 'bg-[#fee2e2] text-[#b91c1c]',
};

export default function RiskBadge({ riskLevel = null }) {
  return (
    <Badge variant="outline" className={`gap-1.5 rounded-full border-transparent px-3 py-1 text-base font-bold ${BADGE_CLASS[riskLevel] ?? 'bg-slate-100 text-slate-600'}`}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {RISK_LEVEL[riskLevel] ?? '-'}
    </Badge>
  );
}

RiskBadge.propTypes = { riskLevel: RiskLevelType };
