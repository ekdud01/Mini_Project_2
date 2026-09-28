/** 설문 문항 */

import { create } from "zustand";
import * as surveyApi from '@/api/surveyApi';

export const useSurveyStore = create((set, get) => ({
    surveys: [],
    questions: [],
    questionsSurveyId: null,
    loading: false,
    error: null,

    /** GET /api/surveys */
    fetchSurveys: async () => {
        if (get().surveys.length > 0) return get().surveys;
        set({ loading: true, error: null });
        try {
            const surveys = await surveyApi.getSurveys();
            set({ surveys, loading: false });
            return surveys;
        } catch (error) {
            set({ loading: false, error });
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
            set({ loading: false, error });
            throw error;
        }
    },

    surveyOf: (examType) => get().surveys.find((s) => s.examType === examType) ?? null,
    surveyIdOf: (examType) => get().surveys.find((s) => s.examType === examType)?.id ?? null,

    reset: () => set({
        surveys: [],
        questions: [],
        questionsSurveyId: null,
        loading: false,
        error: null
    }),
}));
