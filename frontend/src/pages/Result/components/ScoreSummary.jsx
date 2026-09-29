/**
 * KDSQ-C 영역별 점수 (각 10점 만점)
 * 해석 문구 없이 점수 · 막대 · 문항 범위만 표시 (숫자는 중립색)
 */

import { Progress } from "@/components/ui/progress";
import { DOMAIN_MAX_SCORE, DOMAINS } from "@/utils/kdsq";
import PropTypes from "prop-types";

function ScoreSummary({ memoryScore, otherScore, adlScore }) {
  const scores = { memoryScore, otherScore, adlScore };

  return (
    <section aria-labelledby="score-summary-title" className="space-y-4">
      <h2 id="score-summary-title" className="text-xl font-bold">영역별 점수</h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {DOMAINS.map(({ key, label, range }) => {
          const score = scores[key];
          return (
            <li key={key} className="space-y-3 rounded-xl border bg-white p-5">
              <p className="font-bold">{label}</p>
              <p>
                <strong className="text-3xl font-extrabold">{score ?? '-'}</strong>
                <span className="font-bold text-slate-500"> / {DOMAIN_MAX_SCORE}점</span>
              </p>
              <Progress
                value={((score ?? 0) / DOMAIN_MAX_SCORE) * 100}
                className="h-1.5 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-slate-500"
                aria-label={`${label} ${score ?? 0}점 / ${DOMAIN_MAX_SCORE}점`}
              />
              <p className="text-xs text-slate-500">KDSQ-C {range} 문항 합계</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

ScoreSummary.propTypes = {
  memoryScore: PropTypes.number.isRequired,
  otherScore: PropTypes.number.isRequired,
  adlScore: PropTypes.number.isRequired,
};

export default ScoreSummary;
