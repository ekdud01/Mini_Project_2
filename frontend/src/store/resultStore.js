/**
 * 결과 상태
 * - pendingFirstAnswers: 1차 합계 4점 이상일 때 2차 제출 전까지 보관하는 1차 답변
 *   (새로고침해도 유지되도록 이 값만 sessionStorage에 저장)
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as resultApi from '@/api/resultApi';

const initialState = {
  currentResult: null,
  history: [],
  pendingFirstAnswers: null,
  loading: false,
  error: null,
};

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
          set({ loading: false, error });
          throw error;
        }
      },

      /** GET /api/results/{resultId} */
      fetchResult: async (resultId) => {
        set({ loading: true, error: null, currentResult: null });
        try {
          const result = await resultApi.getResult(resultId);
          set({ currentResult: result, loading: false });
          return result;
        } catch (error) {
          set({ loading: false, error });
          throw error;
        }
      },

      /** GET /api/members/me/results?size=100 */
      fetchMyResults: async () => {
        set({ loading: true, error: null });
        try {
          const { content } = await resultApi.getMyResults({ page: 0, size: 100 });
          set({ history: content, loading: false });
          return content;
        } catch (error) {
          set({ loading: false, error });
          throw error;
        }
      },

      setPendingFirstAnswers: (answers) => set({ pendingFirstAnswers: answers }),
      clearPendingFirstAnswers: () => set({ pendingFirstAnswers: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'result-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ pendingFirstAnswers: state.pendingFirstAnswers }),
    },
  ),
);
