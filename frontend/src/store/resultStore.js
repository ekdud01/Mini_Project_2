/** 결과 상태 */

import { createJSONStorage, persist } from "zustand/middleware";
import * as resultApi from '@/api/resultApi';
import { create } from "zustand";

export const useResultStore = create(
    persist(
        (set) => ({
            currentResult: null,
            history: [],
            pendingFirstAnswers: null,
            loading: false,
            error: null,

            /** POST /api/results */
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

            setPendingFirstAnswers: (answers) => { },
            clearPendingFirstAnswers: () => { },

            reset: () =>
                set({
                    currentResult: null,
                    history: [],
                    pendingFirstAnswers: null,
                    loading: false,
                    error: null
                }),
        }),
        {
            name: 'result-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({ pendingFirstAnswers: state.pendingFirstAnswers }),
        },
    ),
);