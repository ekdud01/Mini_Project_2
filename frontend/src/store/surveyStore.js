/** 설문·문항 상태 */

import axios from 'axios';
import { create } from 'zustand';
import * as surveyApi from '@/api/surveyApi';
import { registerStoreReset } from '@/store/resetStores';

const initialState = {
  surveys: [],
  questions: [],
  questionsSurveyId: null,
  loading: false,
  error: null,
};

/**
 * 요청 실패 시 상태 정리
 * 세션이 바뀌어 취소된 요청(axios 취소 오류)은 error에 담지 않는다
 */
const failState = (error) => (axios.isCancel(error) ? { loading: false } : { loading: false, error });

export const useSurveyStore = create((set, get) => ({
  ...initialState,

  /** GET /api/surveys — 한 번 받으면 캐시된 목록을 돌려준다 */
  fetchSurveys: async () => {
    if (get().surveys.length > 0) return get().surveys;
    set({ loading: true, error: null });
    try {
      const surveys = await surveyApi.getSurveys();
      set({ surveys, loading: false });
      return surveys;
    } catch (error) {
      set(failState(error));
      throw error;
    }
  },

  /** GET /api/surveys/{surveyId}/questions */
  fetchQuestions: async (surveyId) => {
    set({ loading: true, error: null, questions: [], questionsSurveyId: surveyId });
    try {
      const questions = await surveyApi.getQuestions(surveyId);
      set({ questions, loading: false });
      return questions;
    } catch (error) {
      set(failState(error));
      throw error;
    }
  },

  surveyOf: (examType) => get().surveys.find((s) => s.examType === examType) ?? null,
  surveyIdOf: (examType) => get().surveys.find((s) => s.examType === examType)?.id ?? null,

  reset: () => set(initialState),
}));

// 로그아웃 시 초기화 연결
const unregisterReset = registerStoreReset('survey', () => useSurveyStore.getState().reset());
if (import.meta.hot) import.meta.hot.dispose(unregisterReset);
