/**
 * 날짜 표시 형식 (React 설계서 5.4)
 * 서버는 한국 시간 "2026-09-24T10:30:00"(시간대 표시 없음)으로 보낸다.
 */
const pad = (n) => String(n).padStart(2, '0');

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
