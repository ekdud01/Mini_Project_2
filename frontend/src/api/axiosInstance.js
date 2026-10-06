import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { getErrorCode } from '@/utils/apiError';

/**
 * 모든 API 호출은 이 인스턴스를 사용한다 (React 설계서 5.4).
 * baseURL '/api' → Mock(MSW) 또는 Vite 프록시를 거쳐 Spring 서버로 전달된다.
 */
const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const reissues = new Map(); // refreshToken이 같은 세션끼리만 재발급을 공유한다.
const sessionChanged = () => new axios.CanceledError('인증 세션이 변경되어 이전 요청을 취소했습니다.');
const isCurrentSession = (session) => useAuthStore.getState().refreshToken === session;

axiosInstance.interceptors.request.use((config) => {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (!config.skipAuth) {
    if (Object.hasOwn(config, '_authSession') && !isCurrentSession(config._authSession)) {
      throw sessionChanged();
    }
    config._authSession = refreshToken;
  }
  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    config.headers.delete('Authorization');
  }
  return config;
});

function reissue(session) {
  if (!reissues.has(session)) {
    // 기본 axios 사용: 만료 토큰 부착과 응답 인터셉터 재진입을 피한다.
    const pending = axios.post('/api/auth/reissue', { refreshToken: session }, { timeout: 10000 })
      .then(({ data }) => {
        if (!isCurrentSession(session)) throw sessionChanged();
        const token = data?.data?.accessToken;
        if (typeof token !== 'string' || !token) throw new Error('재발급 응답에 액세스 토큰이 없습니다.');
        useAuthStore.getState().setAccessToken(token);
      })
      .finally(() => reissues.delete(session));
    reissues.set(session, pending);
  }
  return reissues.get(session);
}

axiosInstance.interceptors.response.use(
  (response) => {
    // 이전 계정의 늦은 성공 응답도 새 계정의 화면/스토어에 반영하지 않는다.
    if (!response.config.skipAuth && !isCurrentSession(response.config._authSession)) {
      throw sessionChanged();
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    if (!config || config.skipAuth) return Promise.reject(error);
    const session = config._authSession;
    if (!isCurrentSession(session)) return Promise.reject(sessionChanged());
    if (response?.status !== 401) return Promise.reject(error);

    const code = getErrorCode(error);
    if (code === 'ACCESS_TOKEN_EXPIRED' && session && !config._retry) {
      config._retry = true;
      const { accessToken } = useAuthStore.getState();
      // 먼저 완료된 재발급 이후 늦게 도착한 401은 새 토큰으로 바로 재시도한다.
      if (accessToken && config.headers.get('Authorization') !== `Bearer ${accessToken}`) {
        return axiosInstance(config);
      }
      try {
        await reissue(session);
      } catch (refreshError) {
        if (!isCurrentSession(session)) return Promise.reject(sessionChanged());
        if (refreshError.response?.status === 401) {
          useAuthStore.getState().clear({ reason: '다시 로그인해주세요' });
        }
        // 네트워크/5xx는 세션을 유지하고 실제 재발급 오류를 화면에 전달한다.
        return Promise.reject(refreshError);
      }
      if (!isCurrentSession(session)) return Promise.reject(sessionChanged());
      return axiosInstance(config);
    }

    if (['ACCESS_TOKEN_EXPIRED', 'INVALID_REFRESH_TOKEN', 'UNAUTHORIZED'].includes(code)) {
      useAuthStore.getState().clear({ reason: '다시 로그인해주세요' });
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
