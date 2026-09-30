import { getDisplayScore } from '../../utils/kdsq.js';

export const HISTORY_PAGE_SIZE = 10;

// 동일 시각의 결과도 id로 순서를 고정하고 store의 원본 배열은 보존한다.
export function sortHistory(results, newestFirst = false) {
  return [...results].sort((a, b) => {
    const order = new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id;
    return newestFirst ? -order : order;
  });
}

export function getHistoryPage(results, page) {
  const sorted = sortHistory(results, true);
  const totalPages = Math.max(1, Math.ceil(sorted.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    rows: sorted.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE),
    currentPage,
    totalPages,
  };
}

export function toTrendData(results) {
  return sortHistory(results).map((result) => ({
    ...result,
    // null은 선의 빈 구간으로 유지하며 0점은 그대로 표시한다.
    score: getDisplayScore(result) ?? null,
  }));
}
