/** 관리·추가 검진 안내 (KDSQ-C) */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolutionShape } from "@/types/propTypes";
import PropTypes from "prop-types";

function Recommendation({ solutions }) {
  if (solutions.length === 0) return null;

  return (
    <section aria-labelledby="recommendation-title" className="space-y-3">
      <h2 id="recommendation-title" className="text-xl text-center font-semibold">권장 안내</h2>
      <p className="text-sm text-center text-muted-foreground">
        인지 건강을 위한 관리 정보 및 추가적인 검진 관련 안내를 확인하세요.
      </p>
      <ul className="space-y-3">
        {solutions.map((solution) => (
          <li key={solution.id}>
            <Card className="gap-2 py-4">
              <CardHeader className="px-4 text-center">
                <CardTitle>{solution.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 text-center whitespace-pre-line leading-relaxed">
                {solution.content}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

Recommendation.propTypes = {
  solutions: PropTypes.arrayOf(SolutionShape).isRequired,
};

export default Recommendation;