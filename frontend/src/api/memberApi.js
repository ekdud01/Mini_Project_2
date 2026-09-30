import api from '@/api/axiosInstance';

export const register = (body) =>
  api.post('/members', body, { skipAuth: true }).then((response) => response.data.data);
