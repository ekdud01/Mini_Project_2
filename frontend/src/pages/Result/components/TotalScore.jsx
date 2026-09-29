/**
 * 총점 + 판정 기준 막대(cut-line)
 * KDSQ-P: "1차 점수" firstScore / 10점 (0~3 정상 / 4~10 2차 진행)
 * KDSQ-C: "총점" totalScore / 30점 (0~5 주의 / 6~30 위험)
 * null인 경우 "-" 이고 막대 표시 없음
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXAM_TYPE_LABEL, RISK_BADGE_CLASS, RISK_LEVEL, RISK_TEXT_CLASS, SCORE_RANGES } from "@/utils/kdsq";
import PropTypes from "prop-types";

function TotalScore({ score, maxScore, examType, riskLevel }) {
    const hasScore = score !== null && score !== undefined;
    const ranges = SCORE_RANGES[examType];
    // 구간 경계 = 점수 비율 (예: KDSQ-C 6점 → 20%)
    const toPercent = (value) => Math.min(100, Math.max(0, (value / maxScore) * 100));

    return (
        <section aria-label="점수" className="space-y-6 rounded-xl bg-slate-50 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">{examType === 'KDSQ_P' ? '1차 점수' : '총점'}</h2>
                        <Badge className={cn('border-0 px-2.5', RISK_BADGE_CLASS[riskLevel])}>{RISK_LEVEL[riskLevel]}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">{EXAM_TYPE_LABEL[examType]} {maxScore}점 만점</p>
                </div>
                <p className="shrink-0">
                    <strong className={cn('text-5xl font-extrabold', RISK_TEXT_CLASS[riskLevel])}>{hasScore ? score : '-'}</strong>
                    <span className="text-xl font-bold text-slate-500"> / {maxScore}점</span>
                </p>
            </div>

            {hasScore && (
                <div className="space-y-2 pt-6">
                    <div className="relative">
                        <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
                            {ranges.map((r, i) => {
                                const start = i === 0 ? 0 : toPercent(r.from);
                                const end = i === ranges.length - 1 ? 100 : toPercent(ranges[i + 1].from);
                                return <div key={r.label} className={r.barClass} style={{ width: `${end - start}%` }} />;
                            })}
                        </div>
                        {/* 내 점수 마커 */}
                        <div className="absolute -top-9 -translate-x-1/2" style={{ left: `${toPercent(score)}%` }}>
                            <span className="block whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                                내 점수 {score}점
                            </span>
                            <span className="mx-auto mt-0.5 block h-7 w-0.5 bg-slate-900" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="relative h-5 text-sm text-slate-500">
                        {ranges.map((r, i) => (
                            <span key={r.label} className="absolute whitespace-nowrap" style={{ left: `${i === 0 ? 0 : toPercent(r.from)}%` }}>
                                {r.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

TotalScore.propTypes = {
    score: PropTypes.number,
    maxScore: PropTypes.number.isRequired,
    examType: PropTypes.oneOf(['KDSQ_P', 'KDSQ_C']).isRequired,
    riskLevel: PropTypes.oneOf(['Normal', 'Borderline', 'HighRisk']).isRequired,
};

export default TotalScore;
