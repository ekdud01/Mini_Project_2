import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * 모든 API 호출은 이 인스턴스를 사용한다 (React 설계서 5.4).
 * baseURL '/api' → Mock(MSW) 또는 Vite 프록시를 거쳐 Spring 서버로 전달된다.
 */
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: 저장된 액세스 토큰을 Authorization 헤더에 붙인다
axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// TODO(강찬식): 응답 인터셉터 — React 설계서 5.3 에러 처리
//  - ACCESS_TOKEN_EXPIRED → POST /api/auth/reissue 후 원래 요청 1회 재시도
//  - INVALID_REFRESH_TOKEN, UNAUTHORIZED → authStore.logout() 후 /login

export default axiosInstance;
