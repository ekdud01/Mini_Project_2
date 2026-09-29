/** 관리·추가 검진 안내 (KDSQ-C) — 초록 박스 안에 솔루션별 제목 + 내용 */

import { SolutionShape } from "@/types/propTypes";
import { HeartIcon } from "lucide-react";
import PropTypes from "prop-types";

function Recommendation({ solutions }) {
  if (solutions.length === 0) return null;

  return (
    <section aria-labelledby="recommendation-title" className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6">
      <div className="space-y-1">
        <h2 id="recommendation-title" className="flex items-center gap-1.5 text-lg font-bold text-green-700">
          <HeartIcon className="size-5" aria-hidden="true" />
          권장 안내
        </h2>
      </div>
      <ul className="space-y-3">
        {solutions.map((solution) => (
          <li key={solution.id} className="space-y-1">
            <p className="font-bold">• {solution.title}</p>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{solution.content}</p>
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
