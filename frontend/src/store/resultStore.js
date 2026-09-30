/**
 * 결과 상태 
 * - currentResult: 방금 제출했거나 조회한 검사 결과
 * - pendingFirstAnswers: 1차 합계 4점 이상일 때 2차 제출 전까지 보관하는 1차 답변
 *   (새로고침해도 유지되도록 이 값만 sessionStorage에 저장)
 * - 로그아웃·인증 오류 시 authStore.clear()가 reset()을 호출한다 (resetStores 등록)
 */

import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as resultApi from '@/api/resultApi';
import { registerStoreReset } from '@/store/resetStores';

const initialState = {
  currentResult: null,
  pendingFirstAnswers: null,
  loading: false,
  error: null,
};

/**
 * 요청 실패 시 상태 정리
 * 세션이 바뀌어 취소된 요청(axios 취소 오류)은 error에 담지 않는다
 */
const failState = (error) => (axios.isCancel(error) ? { loading: false } : { loading: false, error });

export const useResultStore = create(
  persist(
    (set) => ({
      ...initialState,

      /** POST /api/results — firstAnswers가 있으면 KDSQ-C 제출 */
      submitResult: async ({ surveyId, firstAnswers, answers }) => {
        set({ loading: true, error: null });
        try {
          const body = firstAnswers ? { surveyId, firstAnswers, answers } : { surveyId, answers };
          const result = await resultApi.submitResult(body);
          set({ currentResult: result, loading: false });
          return result;
        } catch (error) {
          set(failState(error));
          throw error;
        }
      },

      /** GET /api/results/{resultId} — solutions 포함 */
      fetchResult: async (resultId) => {
        set({ loading: true, error: null, currentResult: null });
        try {
          const result = await resultApi.getResult(resultId);
          set({ currentResult: result, loading: false });
          return result;
        } catch (error) {
          set(failState(error));
          throw error;
        }
      },

      setPendingFirstAnswers: (answers) => set({ pendingFirstAnswers: answers }),
      clearPendingFirstAnswers: () => set({ pendingFirstAnswers: null }),

      /** 처음 상태로 (pendingFirstAnswers도 비워 sessionStorage에서도 사라진다) */
      reset: () => set(initialState),
    }),
    {
      name: 'result-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ pendingFirstAnswers: state.pendingFirstAnswers }),
    },
  ),
);

// 로그아웃 시 초기화 연결 
const unregisterReset = registerStoreReset('result', () => useResultStore.getState().reset());
if (import.meta.hot) import.meta.hot.dispose(unregisterReset);
