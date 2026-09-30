import api from '@/api/axiosInstance';

/** POST /api/results — 검사 결과 제출 */
export const submitResult = (body) => api.post('/results', body).then((res) => res.data.data);

/** GET /api/results/{resultId} — 결과 조회 */
export const getResult = (resultId) => api.get(`/results/${resultId}`).then((res) => res.data.data);
