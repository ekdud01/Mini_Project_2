import PropTypes from 'prop-types';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SurveyResultShape } from '@/types/propTypes';
import { formatDateOnly, formatKoreanDate } from '@/utils/date';
import { EXAM_TYPE_LABEL } from '@/utils/kdsq';
import { getScoreDisplay } from '../history';
import RiskBadge from './RiskBadge';

function scoreContent(score, label) {
  if (score === '—') {
    return <><span aria-hidden="true">—</span><span className="sr-only">2차 검사 없음</span></>;
  }
  if (score === '-') return '-';
  return (
    <>
      <span className="whitespace-nowrap"><strong className="text-3xl font-bold tabular-nums">{score}</strong>점</span>
      <span className="whitespace-nowrap text-base font-normal text-muted-foreground">{label.slice(score.length)}점</span>
    </>
  );
}

export default function ExamHistoryCard({ result, onDetail }) {
  const display = getScoreDisplay(result);
  return (
    <li className="space-y-4 rounded-2xl border bg-white p-4 text-base shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <dl className="min-w-0 space-y-1">
          <dt className="text-base text-muted-foreground">검사일</dt>
          <dd className="text-xl font-bold">
            <time dateTime={formatDateOnly(result.createdAt)}>{formatKoreanDate(result.createdAt)}</time>
          </dd>
        </dl>
        <dl>
          <dt className="sr-only">위험도</dt>
          <dd><RiskBadge riskLevel={result.riskLevel} /></dd>
        </dl>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {[
          ['1차 검사', 'KDSQ-P', display.firstScore, display.firstLabel],
          ['2차 검사', 'KDSQ-C', display.secondScore, display.secondLabel],
        ].map(([title, type, score, label]) => (
          <div key={type} className="min-w-0 space-y-2 rounded-xl bg-slate-50 p-3">
            <dt className="text-base font-medium">
              {title} <span className="block font-normal text-muted-foreground sm:inline">({type})</span>
            </dt>
            <dd className="flex min-h-9 flex-wrap items-baseline gap-x-1 text-lg font-semibold">
              {scoreContent(score, label)}
            </dd>
          </div>
        ))}
      </dl>
      <Button type="button" className="min-h-12 w-full rounded-xl text-base font-semibold"
        aria-label={`${formatDateOnly(result.createdAt)} ${EXAM_TYPE_LABEL[result.examType]} 결과 ${result.id} 상세 보기`}
        onClick={() => onDetail(result.id)}>
        결과 자세히 보기 <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </li>
  );
}

ExamHistoryCard.propTypes = {
  result: SurveyResultShape.isRequired,
  onDetail: PropTypes.func.isRequired,
};
