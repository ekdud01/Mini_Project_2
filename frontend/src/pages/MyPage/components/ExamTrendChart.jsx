import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { SurveyResultShape } from '@/types/propTypes';
import { formatDate, formatDateOnly } from '@/utils/date';
import { EXAM_TYPE_LABEL, MAX_SCORE, RISK_LEVEL } from '@/utils/kdsq';
import { toTrendData } from '../history';

const CHART_CONFIG = { score: { label: '검사 점수', color: 'var(--primary)' } };

function TrendTooltip({ active = false, payload = [] }) {
  const result = payload[0]?.payload;
  if (!active || !result) return null;
  return (
    <div className="space-y-1 rounded-lg border bg-white p-3 text-base shadow-sm">
      <p className="font-semibold">{formatDateOnly(result.createdAt)}</p>
      <p>{EXAM_TYPE_LABEL[result.examType]}</p>
      <p>점수: {result.score == null ? '-' : `${result.score} / ${MAX_SCORE[result.examType]}점`}</p>
      <p>판정: {RISK_LEVEL[result.riskLevel] ?? '-'}</p>
    </div>
  );
}

TrendTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(PropTypes.shape({ payload: SurveyResultShape })),
};

function ExamTrendChart({ results = [] }) {
  const data = useMemo(() => toTrendData(results), [results]);
  const datesById = useMemo(() => new Map(data.map((result) => [result.id, result.createdAt])), [data]);
  if (!data.length) return null;

  return (
    <section aria-labelledby="mypage-trend-title" className="min-w-0 space-y-4">
      <h2 id="mypage-trend-title" className="text-2xl font-bold">검사 결과 추이</h2>
      <div className="min-w-0 space-y-4 rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        <p id="mypage-trend-description" className="break-keep text-sm text-muted-foreground">
          KDSQ-P는 10점, KDSQ-C는 30점 만점으로 검사 종류가 다르면 점수만으로 개선이나 악화를 비교할 수 없습니다
        </p>
        <p className="text-sm text-muted-foreground">점수 · 오래된 검사부터 표시</p>
        <ChartContainer config={CHART_CONFIG} className="h-64 w-full aspect-auto text-sm [&_.recharts-surface]:focus-visible:outline-2 [&_.recharts-surface]:focus-visible:outline-primary">
          <LineChart data={data} accessibilityLayer aria-label="검사 결과 추이" aria-describedby="mypage-trend-description"
            margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="id" type="category" tickFormatter={(id) => formatDate(datesById.get(id))}
              tickLine={false} axisLine={false} minTickGap={32} padding={{ left: 12, right: 12 }} />
            <YAxis domain={[0, 30]} ticks={[0, 6, 12, 18, 24, 30]} width={32} tickLine={false} axisLine={false} />
            <ChartTooltip content={<TrendTooltip />} filterNull={false} />
            <Line dataKey="score" type="linear" stroke="var(--color-score)" strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-score)' }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
        <p className="break-keep text-sm text-muted-foreground">날짜·검사 종류·점수·판정은 위 검사 이력에서도 확인할 수 있습니다</p>
      </div>
    </section>
  );
}

ExamTrendChart.propTypes = { results: PropTypes.arrayOf(SurveyResultShape) };

export default memo(ExamTrendChart);
