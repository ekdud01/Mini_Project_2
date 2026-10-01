import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getHistoryPage, getScoreDisplay, toTrendData } from '../src/pages/MyPage/history.js';
import { formatDateOnly, formatMonthDay, formatKoreanDate } from '../src/utils/date.js';

const result = (id, overrides = {}) => ({
  id, createdAt: '2026-09-30T10:00:00', examType: 'KDSQ_P', firstScore: 3,
  totalScore: null, riskLevel: 'Normal', ...overrides,
});

for (const count of [0, 1, 10, 11, 100]) {
  test(`${count}건의 이력을 중복·누락 없이 10건씩 표시하고 마지막 페이지 범위를 제한한다`, () => {
    const input = Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze(result(index + 1))));
    const { totalPages } = getHistoryPage(input, 1);
    assert.equal(totalPages, Math.max(1, Math.ceil(count / 10)));
    const displayed = Array.from({ length: totalPages }, (_, index) => getHistoryPage(input, index + 1).rows);
    assert.ok(displayed.every((rows) => rows.length <= 10));
    assert.deepEqual(displayed.flat().map((row) => row.id), Array.from({ length: count }, (_, index) => count - index));
    assert.equal(getHistoryPage(input, 999).currentPage, totalPages);
    assert.equal(getHistoryPage(input, 0).currentPage, 1);
    assert.deepEqual(input.map((row) => row.id), Array.from({ length: count }, (_, index) => index + 1));
  });
}

test('시각을 우선 정렬하고 같은 시각의 결과는 id로 정렬하며 같은 날짜 결과도 모두 유지한다', () => {
  const input = [result(2), result(4, { createdAt: '2026-09-30T09:00:00' }), result(1), result(3)];
  assert.deepEqual(getHistoryPage(input, 1).rows.map((row) => row.id), [3, 2, 1, 4]);
  assert.deepEqual(toTrendData(input).map((row) => row.id), [4, 1, 2, 3]);
  assert.deepEqual(input.map((row) => row.id), [2, 4, 1, 3]);
});

test('P의 firstScore와 C의 totalScore를 선택하고 0·null·서버 판정을 보존한다', () => {
  const data = toTrendData([
    result(1, { firstScore: 0, totalScore: 20 }),
    result(2, { examType: 'KDSQ_C', firstScore: 4, totalScore: 0, riskLevel: 'Borderline' }),
    result(3, { examType: 'KDSQ_C', firstScore: 5, totalScore: null, riskLevel: 'HighRisk' }),
  ]);
  assert.deepEqual(data.map((row) => row.score), [0, 0, null]);
  assert.deepEqual(data.map((row) => row.riskLevel), ['Normal', 'Borderline', 'HighRisk']);
});

test('표의 마지막 페이지를 조회해도 차트에는 전체 결과가 남는다', () => {
  const input = Array.from({ length: 11 }, (_, index) => result(index + 1));
  const before = toTrendData(input);
  assert.equal(getHistoryPage(input, 2).rows.length, 1);
  assert.deepEqual(toTrendData(input), before);
  assert.equal(before.length, 11);
});

test('검사일은 시각 없이 연월일을 표시한다', () => {
  assert.equal(formatDateOnly('2026-01-02T23:59:59'), '2026-01-02');
  assert.equal(formatDateOnly('2024-02-29T00:00:00'), '2024-02-29');
  assert.equal(formatDateOnly(null), '');
  assert.equal(formatDateOnly('invalid'), '');
});

test('P는 총점 유무와 관계없이 1차 점수를 표시하며 0점을 보존한다', () => {
  assert.deepEqual(getScoreDisplay(result(1, { firstScore: 0, totalScore: 20 })), {
    firstScore: '0', secondScore: '—', firstLabel: '0 / 10', secondLabel: '—',
    scoreLabel: '0점', tooltip: '1차 0점 (1차에서 종료) · 정상',
  });
});

test('C는 1차·2차 점수를 모두 표시하고 2차 0점도 종료로 취급하지 않는다', () => {
  assert.deepEqual(getScoreDisplay(result(1, { examType: 'KDSQ_C', firstScore: 4, totalScore: 0, riskLevel: 'Borderline' })), {
    firstScore: '4', secondScore: '0', firstLabel: '4 / 10', secondLabel: '0 / 30',
    scoreLabel: '0점', tooltip: '1차 4점 / 2차 0점 · 주의',
  });
  assert.equal(getScoreDisplay(result(2, { examType: 'KDSQ_C', firstScore: 4, totalScore: 9, riskLevel: 'HighRisk' })).tooltip,
    '1차 4점 / 2차 9점 · 위험');
});

test('C 총점 null은 알약·2차 점수만 -로 표시하고 판정 위치는 유지한다', () => {
  const input = result(1, { examType: 'KDSQ_C', firstScore: 4, totalScore: null, riskLevel: 'HighRisk' });
  assert.deepEqual(getScoreDisplay(input), {
    firstScore: '4', secondScore: '-', firstLabel: '4 / 10', secondLabel: '-',
    scoreLabel: '-', tooltip: '1차 4점 / 2차 - · 위험',
  });
  const [point] = toTrendData([input]);
  assert.equal(point.score, null);
  assert.equal(point.level, 2);
});

test('서버 판정을 0·1·2로 매핑하고 원본을 변경하지 않으며 최근 결과만 표시한다', () => {
  const input = Object.freeze(['Normal', 'Borderline', 'HighRisk'].map((riskLevel, index) =>
    Object.freeze(result(index + 1, { riskLevel }))));
  const data = toTrendData(input);
  assert.deepEqual(data.map((row) => row.level), [0, 1, 2]);
  assert.deepEqual(data.map((row) => row.isLatest), [false, false, true]);
  assert.ok(input.every((row) => !Object.hasOwn(row, 'level') && !Object.hasOwn(row, 'label')));
  assert.deepEqual(toTrendData([]), []);
  assert.equal(toTrendData([result(1)])[0].isLatest, true);
});

test('알 수 없는 판정은 빈 위치로 유지하고 이전 결과를 최근 검사로 바꾸지 않는다', () => {
  const data = toTrendData([result(1), result(2, { riskLevel: 'Unknown' })]);
  assert.equal(data.length, 2);
  assert.equal(data[1].level, null);
  assert.deepEqual(data.map((row) => row.isLatest), [false, true]);
  assert.equal(getScoreDisplay(data[1]).tooltip, '1차 3점 (1차에서 종료) · -');
});

test('정렬 후 첫 점과 연도 전환점에만 연도 줄을 붙이고 같은 날짜 검사도 유지한다', () => {
  const data = toTrendData([
    result(4, { createdAt: '2026-04-12T10:00:00' }),
    result(2, { createdAt: '2026-01-01T09:00:00' }),
    result(1, { createdAt: '2025-12-31T23:59:59' }),
    result(3, { createdAt: '2026-01-01T09:00:00' }),
  ]);
  assert.deepEqual(data.map((row) => row.id), [1, 2, 3, 4]);
  assert.deepEqual(data.map((row) => row.label), [
    ['12월 31일', '2025년'], ['1월 1일', '2026년'], ['1월 1일'], ['4월 12일'],
  ]);
  assert.deepEqual(data.filter((row) => row.isLatest).map((row) => row.id), [4]);
});

test('한글 날짜는 앞자리 0 없이 표시하고 누락·잘못된 날짜는 빈 문자열로 반환한다', () => {
  assert.equal(formatMonthDay('2026-04-12T23:59:59'), '4월 12일');
  assert.equal(formatKoreanDate('2024-03-15T00:00:00'), '2024년 3월 15일');
  assert.equal(formatMonthDay('2024-02-29T00:00:00'), '2월 29일');
  assert.equal(formatKoreanDate('2024-02-29T00:00:00'), '2024년 2월 29일');
  for (const value of [null, undefined, '', 'invalid']) {
    assert.equal(formatMonthDay(value), '');
    assert.equal(formatKoreanDate(value), '');
  }
});
