import api from '@/api/axiosInstance';

export const login = (credentials) =>
  api.post('/auth/login', credentials, { skipAuth: true }).then((res) => res.data.data);

// 204 응답은 본문이 없으므로 data.data를 읽지 않는다.
export const logout = () => api.post('/auth/logout').then(() => undefined);
