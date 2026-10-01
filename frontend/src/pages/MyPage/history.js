import { getDisplayScore, RISK_LEVEL } from '../../utils/kdsq.js';
import { formatDateOnly, formatMonthDay } from '../../utils/date.js';

export const HISTORY_PAGE_SIZE = 10;
export const MOBILE_HISTORY_PAGE_SIZE = 5;

const TREND_LEVEL = new Map([['Normal', 0], ['Borderline', 1], ['HighRisk', 2]]);

/** 표의 숫자/전체 표기, 차트 알약, 툴팁·접근성 설명에서 함께 쓰는 표시 규칙. */
export function getScoreDisplay(result) {
  const hasSecondTest = result.examType === 'KDSQ_C';
  const firstScore = result.firstScore == null ? '-' : String(result.firstScore);
  const secondScore = hasSecondTest ? String(result.totalScore ?? '-') : '—';
  const score = getDisplayScore(result);
  const riskLabel = RISK_LEVEL[result.riskLevel] ?? '-';
  const firstText = result.firstScore == null ? '-' : `${firstScore}점`;
  const secondText = result.totalScore == null ? '-' : `${secondScore}점`;

  return {
    firstScore,
    secondScore,
    firstLabel: result.firstScore == null ? '-' : `${firstScore} / 10`,
    secondLabel: hasSecondTest && result.totalScore != null ? `${secondScore} / 30` : secondScore,
    scoreLabel: score == null ? '-' : `${score}점`,
    tooltip: hasSecondTest
      ? `1차 ${firstText} / 2차 ${secondText} · ${riskLabel}`
      : `1차 ${firstText} (1차에서 종료) · ${riskLabel}`,
  };
}

// 동일 시각의 결과도 id로 순서를 고정하고 store의 원본 배열은 보존한다.
export function sortHistory(results, newestFirst = false) {
  return [...results].sort((a, b) => {
    const order = new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id;
    return newestFirst ? -order : order;
  });
}

export function getHistoryPage(results, page, pageSize = HISTORY_PAGE_SIZE) {
  const sorted = sortHistory(results, true);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    rows: sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
}

export function toTrendData(results) {
  const sorted = sortHistory(results);
  return sorted.map((result, index) => {
    const year = formatDateOnly(result.createdAt).slice(0, 4);
    const previousYear = index > 0 ? formatDateOnly(sorted[index - 1].createdAt).slice(0, 4) : '';
    // Chart.js 다중 행 눈금: 첫 검사와 연도가 바뀌는 검사에만 둘째 줄 연도 표시.
    const label = [formatMonthDay(result.createdAt)];
    if (year && year !== previousYear) label.push(`${year}년`);
    return {
      ...result,
      // 점수 null과 판정 위치는 독립적이다. 판정 null만 새 차트의 빈 구간이다.
      score: getDisplayScore(result) ?? null,
      level: TREND_LEVEL.get(result.riskLevel) ?? null,
      isLatest: index === sorted.length - 1,
      label,
    };
  });
}
