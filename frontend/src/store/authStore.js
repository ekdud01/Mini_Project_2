import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/api/authApi';
import { resetStores } from '@/store/resetStores';

/**
 * 인증 상태 (React 설계서 4.3). 새로고침해도 유지되도록 localStorage에 저장한다.
 * logoutReason은 화면에서 한 번 표시하며 저장하지 않는다.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      email: null,
      logoutReason: null,

      setTokens: ({ accessToken, refreshToken, email }) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          email: email ?? state.email,
          logoutReason: null,
        })),

      setAccessToken: (accessToken) => set({ accessToken }),
      clearLogoutReason: () => set({ logoutReason: null }),

      clear: ({ reason = null } = {}) => {
        set({ accessToken: null, refreshToken: null, email: null, logoutReason: reason });
        resetStores();
      },
      reset: () => get().clear(),

      login: async (email, password) => {
        const tokens = await authApi.login({ email, password });
        get().clear();
        get().setTokens({ ...tokens, email });
      },

      logout: async ({ callApi = true, reason } = {}) => {
        const session = get().refreshToken;
        try {
          if (callApi) await authApi.logout();
        } catch {
          // 서버 요청이 실패해도 로컬 인증 정보는 삭제한다.
        } finally {
          // 기다리는 동안 다른 계정으로 로그인했다면 새 세션은 지우지 않는다.
          if (get().refreshToken === session || get().refreshToken === null) {
            get().clear({ reason: reason ?? null });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: ({ accessToken, refreshToken, email }) => ({ accessToken, refreshToken, email }),
    },
  ),
);

/**
 * [개발용] Mock 테스트 계정으로 로그인해 토큰을 저장한다.
 * main.jsx가 Mock 모드에서만 window.devLogin으로 연결한다. (브라우저 콘솔에서 devLogin() 입력)
 */
export async function devLogin(email = 'hong@test.com', password = 'Test1234!') {
  await useAuthStore.getState().login(email, password);
  console.info(`[dev] ${email} 로 로그인했습니다. 새로고침 없이 Header 링크로 이동하세요. 코드 변경으로 새로고침되면 devLogin()을 다시 실행하세요.`);
}
