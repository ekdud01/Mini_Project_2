import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 인증 상태 (React 설계서 4.3). 새로고침해도 유지되도록 localStorage에 저장한다.
 * [뼈대] login()·logout()의 API 호출은 강찬식이 로그인 기능과 함께 완성한다.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      email: null,

      setTokens: ({ accessToken, refreshToken, email }) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          email: email ?? state.email,
        })),

      clear: () => set({ accessToken: null, refreshToken: null, email: null }),

      // TODO(강찬식): login(email, password) — POST /api/auth/login
      // TODO(강찬식): logout() — POST /api/auth/logout 후 clear(), 다른 스토어 초기화
    }),
    { name: 'auth-storage' },
  ),
);

/**
 * [개발용] Mock 테스트 계정으로 로그인해 토큰을 저장한다.
 * main.jsx가 Mock 모드에서만 window.devLogin으로 연결한다. (브라우저 콘솔에서 devLogin() 입력)
 */
export async function devLogin(email = 'hong@test.com', password = 'Test1234!') {
  const { data } = await axios.post('/api/auth/login', { email, password });
  useAuthStore.getState().setTokens({ ...data.data, email });
  console.info(`[dev] ${email} 로 로그인했습니다. 새로고침 후 보호된 화면에 들어갈 수 있습니다.`);
}
