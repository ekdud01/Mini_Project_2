/**
 * 날짜 표시 형식 (React 설계서 5.4)
 * 서버는 한국 시간 "2026-09-24T10:30:00"(시간대 표시 없음)으로 보낸다.
 */
const pad = (n) => String(n).padStart(2, '0');

/** "2026-09-24T10:30:00" → "2026-09-24" (검사 이력) */
export function formatDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-04-12T10:30:00" → "4월 12일" (추이 차트 날짜) */
export function formatMonthDay(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "2024-03-15T10:30:00" → "2024년 3월 15일" (가입일) */
export function formatKoreanDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** "2026-09-24T10:30:00" → "2026-09-24 10:30" */
export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "2026-09-24T10:30:00" → "09.24" (그래프 축) */
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
