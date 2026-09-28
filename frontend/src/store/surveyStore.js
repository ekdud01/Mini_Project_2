/** 설문 문항 */

import { create } from "zustand";

export const useSurveyStore = create((set, get) => ({
    surveys: [],
    questions: [],
    questionsSurveyId: null,
    loading: false,
    error: null,

    /** GET /api/surveys */
    fetchSurveys: async () => {

    },

    /** GET /api/surveys/{surveyId}/questions */
    fetchQuestions: async (surveyId) => {

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
