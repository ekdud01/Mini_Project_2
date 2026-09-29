import api from '@/api/axiosInstance';

/** GET /api/surveys — 설문 목록 (surveyId 확보) */
export const getSurveys = () => api.get('/surveys').then((res) => res.data.data);

/** GET /api/surveys/{surveyId}/questions — 문항 조회 */
export const getQuestions = (surveyId) => api.get(`/surveys/${surveyId}/questions`).then((res) => res.data.data);
