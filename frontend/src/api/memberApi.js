import api from '@/api/axiosInstance';

export const register = (body) =>
  api.post('/members', body, { skipAuth: true }).then((response) => response.data.data);

export const getMe = ({ signal } = {}) =>
  api.get('/members/me', { signal }).then((response) => response.data.data);

export const getMyResults = ({ signal } = {}) =>
  api.get('/members/me/results', { params: { page: 0, size: 100 }, signal })
    .then((response) => response.data.data);

// 204 응답은 본문 없이 상태 코드만 확인한다.
export const withdraw = () => api.delete('/members/me').then((response) => response.status === 204);
