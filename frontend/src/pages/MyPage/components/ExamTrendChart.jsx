import { memo, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { SurveyResultShape } from '@/types/propTypes';
import { formatDateOnly } from '@/utils/date';
import { EXAM_TYPE_LABEL, RISK_COLOR, RISK_LEVEL } from '@/utils/kdsq';
import { getScoreDisplay, toTrendData } from '../history';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

// 관리자 회원 상세의 판정색·알약·판정축을 사용자 화면 크기로 이식한다.
const LEVELS = {
  Normal: { value: 0, foreground: '#15803d', background: '#dcfce7' },
  Borderline: { value: 1, foreground: '#b45309', background: '#fef3c7' },
  HighRisk: { value: 2, foreground: '#b91c1c', background: '#fee2e2' },
};
const POINT_WIDTH = 96;

function pill(ctx, x, y, text, foreground, border) {
  const width = ctx.measureText(text).width + 20;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - 15, width, 30, 15);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = foreground;
  ctx.fillText(text, x, y);
}

function ExamTrendChart({ results = [], totalElements }) {
  const data = useMemo(() => toTrendData(results), [results]);
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const chipsRef = useRef({});
  const [isOverflowing, setIsOverflowing] = useState(false);
  const isLimited = (totalElements ?? results.length) > results.length;
  const latest = data.at(-1);

  useEffect(() => {
    if (!data.length) return;
    const scroller = scrollRef.current;
    const font = getComputedStyle(document.body).fontFamily;
    const latestIndex = data.findIndex((result) => result.isLatest);
    const decorate = {
      id: 'mypageTrendDecorate',
      afterLayout(chart) {
        // HTML 칩은 스크롤 밖에 두고 실제 판정축의 픽셀 위치를 따른다.
        Object.entries(LEVELS).forEach(([risk, level]) => {
          const chip = chipsRef.current[risk];
          if (chip) chip.style.top = `${chart.scales.y.getPixelForValue(level.value)}px`;
        });
      },
      beforeDatasetsDraw(chart) {
        const { ctx, scales, chartArea } = chart;
        const x = scales.x.getPixelForValue(latestIndex);
        ctx.save();
        ctx.fillStyle = '#eff6ff';
        ctx.beginPath();
        ctx.roundRect(x - 46, 2, 92, chartArea.bottom - 2, 14);
        ctx.fill();
        ctx.fillStyle = '#1d4ed8';
        ctx.font = `700 16px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('최근 검사', x, 20);
        ctx.restore();
      },
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = `700 16px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        chart.getDatasetMeta(0).data.forEach((point, index) => {
          const result = data[index];
          if (point.skip || result.level == null) return;
          pill(ctx, point.x, point.y - 29, getScoreDisplay(result).scoreLabel,
            LEVELS[result.riskLevel].foreground, RISK_COLOR[result.riskLevel]);
        });
        ctx.restore();
      },
    };
    const chart = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: data.map((result) => result.label),
        datasets: [{
          data: data.map((result) => result.level),
          borderColor: '#94a3b8', borderWidth: 2, tension: 0, spanGaps: false,
          pointRadius: 8, pointHoverRadius: 10, pointBorderWidth: 2, pointBorderColor: '#fff',
          pointBackgroundColor: data.map((result) => RISK_COLOR[result.riskLevel] ?? 'transparent'),
        }],
      },
      options: {
        maintainAspectRatio: false,
        animation: false,
        font: { family: font, size: 16, weight: 'bold' },
        layout: { padding: { top: 56, left: 24, right: 24, bottom: 8 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          tooltip: {
            titleFont: { family: font, size: 16 },
            bodyFont: { family: font, size: 16 },
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (items) => formatDateOnly(data[items[0].dataIndex].createdAt),
              // 좁은 화면에서도 같은 문장을 줄바꿈해 표시한다.
              label: (context) => getScoreDisplay(data[context.dataIndex]).tooltip.split(/ (?=\/|\(|·)/),
            },
          },
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false }, offset: true,
            ticks: {
              autoSkip: false, maxRotation: 0, padding: 12,
              color: (context) => context.index === latestIndex ? '#1d4ed8' : '#475569',
              font: { family: font, size: 16, weight: 'bold' },
            },
          },
          y: {
            min: -0.3, max: 2.3,
            ticks: { display: false }, border: { display: false },
            grid: { color: '#e2e8f0', drawTicks: false },
            afterBuildTicks: (axis) => { axis.ticks = [0, 1, 2].map((value) => ({ value })); },
          },
        },
      },
      plugins: [decorate],
    });
    let followLatest = true;
    let previousWidth;
    let previousScrollWidth;
    const updateOverflow = () => {
      setIsOverflowing(scroller.scrollWidth > scroller.clientWidth);
      // 첫 표시·새 데이터와 최근 끝을 보고 있던 경우에만 최근 검사를 유지한다.
      // viewport/Chart.js 레이아웃이 늦게 확정돼도 ResizeObserver에서 다시 맞춘다.
      if (followLatest) scroller.scrollLeft = scroller.scrollWidth;
      previousWidth = scroller.clientWidth;
      previousScrollWidth = scroller.scrollWidth;
    };
    const handleScroll = () => {
      // 크기 변경이 만든 scroll 이벤트를 사용자의 과거 탐색으로 오인하지 않는다.
      if (scroller.clientWidth !== previousWidth || scroller.scrollWidth !== previousScrollWidth) return;
      followLatest = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft <= 1;
    };
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(scroller);
    observer.observe(canvasRef.current.parentElement);
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    updateOverflow();
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      chart.destroy();
    };
  }, [data]);

  if (!latest) return null;
  const description = `${isLimited ? '최근 100건' : `조회한 ${data.length}건`} 표시, `
    + `${formatDateOnly(data[0].createdAt)}부터 ${formatDateOnly(latest.createdAt)}까지, `
    + `최근 검사 ${formatDateOnly(latest.createdAt)} ${EXAM_TYPE_LABEL[latest.examType]}, `
    + `${getScoreDisplay(latest).tooltip}, 자세한 수치는 아래 검사 이력 참고`;

  return (
    <section aria-labelledby="mypage-trend-title" className="min-w-0 space-y-4">
      <h2 id="mypage-trend-title" tabIndex={-1} className="scroll-mt-[var(--mypage-scroll-offset,1rem)] text-2xl font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">검사 결과 추이</h2>
      <div className="min-w-0 space-y-4 rounded-2xl border bg-white p-4 shadow-sm md:p-6">
        {isLimited && <p className="text-base text-muted-foreground">최근 100건을 표시합니다</p>}
        <div className="flex min-w-0">
          <div className="relative w-20 shrink-0" aria-hidden="true">
            {Object.entries(LEVELS).map(([risk, level]) => (
              <span key={risk} ref={(node) => { chipsRef.current[risk] = node; }}
                className="absolute left-0 flex -translate-y-1/2 items-center gap-2 rounded-full px-3 py-1 text-base font-bold"
                style={{ color: level.foreground, backgroundColor: level.background }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: RISK_COLOR[risk] }} />
                {RISK_LEVEL[risk]}
              </span>
            ))}
          </div>
          <div ref={scrollRef} tabIndex={isOverflowing ? 0 : undefined}
            role={isOverflowing ? 'region' : undefined}
            aria-label={isOverflowing ? '검사 결과 추이 가로 스크롤' : undefined}
            aria-describedby={isOverflowing ? 'mypage-trend-scroll-help' : undefined}
            className="min-w-0 flex-1 overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <div className="relative h-[300px] md:h-[340px]" style={{ width: `max(100%, ${data.length * POINT_WIDTH + 48}px)` }}>
              <canvas ref={canvasRef} role="img" aria-label={description} />
            </div>
          </div>
        </div>
        {isOverflowing && <p id="mypage-trend-scroll-help" className="text-base text-muted-foreground">좌우로 움직여 이전 검사도 볼 수 있습니다</p>}
        <div className="space-y-2 break-keep rounded-xl bg-blue-50 p-4 text-base leading-relaxed text-slate-700">
          <p>위로 올라갈수록 위험도가 높다는 뜻입니다</p>
          <p>동그라미 위 숫자는 점수입니다 (1차 10점, 2차 30점 만점)</p>
        </div>
      </div>
    </section>
  );
}

ExamTrendChart.propTypes = {
  results: PropTypes.arrayOf(SurveyResultShape),
  totalElements: PropTypes.number,
};

export default memo(ExamTrendChart);
