/** 
 * KDSQ-C 영역별 점수 (각 10점 만점)
 * memoryScore, otherScore, adlScore
 */

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DOMAIN_MAX_SCORE } from "@/utils/kdsq";
import PropTypes from "prop-types";

function ScoreSummary({ memoryScore, otherScore, adlScore }) {
  const domains = [
    { label: '기억력', score: memoryScore },
    { label: '기타 인지기능', score: otherScore },
    { label: '일상생활수행능력', score: adlScore },
  ];

  return (
    <section aria-labelledby="score-summary-title" className="space-y-3">
      <h2 id="score-summary-title" className="text-xl text-center font-semibold">영역별 점수</h2>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {domains.map(({ label, score }) => (
          <li key={label}>
            <Card className="gap-3 py-4">
              <CardContent className="space-y-2 px-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{label}</span>
                  <span>
                    <strong className="text-lg">{score ?? '-'}</strong>
                    <span className="text-sm text-muted-foreground"> / {DOMAIN_MAX_SCORE}점</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
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