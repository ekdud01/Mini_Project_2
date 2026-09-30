import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getHistoryPage, toTrendData } from '../src/pages/MyPage/history.js';
import { formatDateOnly } from '../src/utils/date.js';

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
