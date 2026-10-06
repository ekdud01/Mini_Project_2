import { Chart } from 'chart.js';
import { getScoreDisplay, toTrendData } from '@/pages/MyPage/history';
import { useMemberStore } from '@/store/memberStore';

// Chart.js 인스턴스와 실제 점 메타데이터를 확인하는 수동/자동 브라우저 검증 공용 진입점.
export function inspectTrendChart() {
  const canvas = document.querySelector('[aria-labelledby="mypage-trend-title"] canvas');
  const chart = canvas && Chart.getChart(canvas);
  if (!chart) return { instances: Object.keys(Chart.instances).length, count: 0 };
  const rows = toTrendData(useMemberStore.getState().history);
  const points = chart.getDatasetMeta(0).data;
  const scroller = canvas.parentElement.parentElement;
  return {
    id: chart.id, instances: Object.keys(Chart.instances).length,
    count: rows.length, drawnPoints: points.filter((point) => !point.skip).length,
    dashPills: points.filter((point, index) => !point.skip && getScoreDisplay(rows[index]).scoreLabel === '-').length,
    latestIds: rows.filter((row) => row.isLatest).map((row) => row.id),
    points: points.map((point) => ({ x: point.x, y: point.y, skip: point.skip })),
    labels: chart.data.labels, levels: chart.data.datasets[0].data,
    scrollLeft: scroller.scrollLeft, scrollWidth: scroller.scrollWidth, clientWidth: scroller.clientWidth,
    chipOffsets: [...scroller.previousElementSibling.children].map((chip, value) =>
      Number.parseFloat(chip.style.top) - chart.scales.y.getPixelForValue(value)),
    description: canvas.getAttribute('aria-label'),
    tooltip: chart.tooltip.opacity ? {
      title: chart.tooltip.title, lines: chart.tooltip.body.flatMap((body) => body.lines),
      left: chart.tooltip.x - scroller.scrollLeft, right: chart.tooltip.x + chart.tooltip.width - scroller.scrollLeft,
    } : null,
  };
}
