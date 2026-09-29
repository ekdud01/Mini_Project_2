/**
 * 총점 + 판정 기준 막대(cut-line)
 * - KDSQ-P: "1차 점수" firstScore / 10점 (0~3 정상 / 4~10 2차 진행)
 * - KDSQ-C: "총점" totalScore / 30점 (0~5 주의 / 6~30 위험)
 * - 점수가 null이면 "-"로 표시하고 막대는 그리지 않는다.
 */

import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { EXAM_TYPE_LABEL, RISK_BADGE_CLASS, RISK_LEVEL, RISK_TEXT_CLASS, SCORE_RANGES } from '@/utils/kdsq';
import { ExamTypeType, RiskLevelType } from '@/types/propTypes';
import { Badge } from '@/components/ui/badge';

const SCORE_TITLE = { KDSQ_P: '1차 점수', KDSQ_C: '총점' };

/** 점수 → 막대 위치(%) (예: KDSQ-C 6점 → 20%) */
const toPercent = (value, maxScore) => Math.min(100, Math.max(0, (value / maxScore) * 100));

/** 구간별 시작 위치·폭(%) 계산. 첫 구간은 0%, 마지막 구간은 100%까지 채운다 */
function toSegments(ranges, maxScore) {
  return ranges.map((range, i) => {
    const start = i === 0 ? 0 : toPercent(range.from, maxScore);
    const end = i === ranges.length - 1 ? 100 : toPercent(ranges[i + 1].from, maxScore);
    return { ...range, start, width: end - start };
  });
}

function TotalScore({ score, maxScore, examType, riskLevel }) {
  const hasScore = score !== null && score !== undefined;

  return (
    <section aria-label="점수" className="space-y-6 rounded-xl bg-slate-50 p-6">
      {/* 제목·배지 (왼쪽) + 점수 (오른쪽) */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{SCORE_TITLE[examType]}</h2>
            <Badge className={cn('border-0 px-2.5', RISK_BADGE_CLASS[riskLevel])}>{RISK_LEVEL[riskLevel]}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {EXAM_TYPE_LABEL[examType]} {maxScore}점 만점
          </p>
        </div>

        <p className="shrink-0">
          <strong className={cn('text-5xl font-extrabold', RISK_TEXT_CLASS[riskLevel])}>
            {hasScore ? score : '-'}
          </strong>
          <span className="text-xl font-bold text-slate-500"> / {maxScore}점</span>
        </p>
      </div>

      {hasScore && <ScoreRangeBar score={score} maxScore={maxScore} ranges={SCORE_RANGES[examType]} />}
    </section>
  );
}

TotalScore.propTypes = {
  score: PropTypes.number,
  maxScore: PropTypes.number.isRequired,
  examType: ExamTypeType.isRequired,
  riskLevel: RiskLevelType.isRequired,
};

/** 판정 기준 막대 + "내 점수" 마커 + 구간 라벨 */
function ScoreRangeBar({ score, maxScore, ranges }) {
  const segments = toSegments(ranges, maxScore);

  return (
    <div className="space-y-2 pt-6">
      <div className="relative">
        {/* 구간 막대 */}
        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
          {segments.map((s) => (
            <div key={s.label} className={s.barClass} style={{ width: `${s.width}%` }} />
          ))}
        </div>

        {/* 내 점수 마커 */}
        <div className="absolute -top-9 -translate-x-1/2" style={{ left: `${toPercent(score, maxScore)}%` }}>
          <span className="block whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">
            내 점수 {score}점
          </span>
          <span className="mx-auto mt-0.5 block h-7 w-0.5 bg-slate-900" aria-hidden="true" />
        </div>
      </div>

      {/* 구간 라벨 */}
      <div className="relative h-5 text-sm text-slate-500">
        {segments.map((s) => (
          <span key={s.label} className="absolute whitespace-nowrap" style={{ left: `${s.start}%` }}>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

ScoreRangeBar.propTypes = {
  score: PropTypes.number.isRequired,
  maxScore: PropTypes.number.isRequired,
  ranges: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
      barClass: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default TotalScore;
