import { create } from 'zustand';
import * as memberApi from '@/api/memberApi';
import { useAuthStore } from '@/store/authStore';
import { registerStoreReset } from '@/store/resetStores';

const initialState = { me: null, history: [], historyMeta: null };
let resetGeneration = 0;

export const useMemberStore = create((set) => ({
  ...initialState,

  // 같은 세션의 재조회 취소는 페이지가 담당하고, reset 이후 응답은 여기서 막는다.
  fetchMe: async ({ signal } = {}) => {
    const generation = resetGeneration;
    const me = await memberApi.getMe({ signal });
    if (signal?.aborted || generation !== resetGeneration) return;
    set({ me });
    return me;
  },

  fetchMyResults: async ({ signal } = {}) => {
    const generation = resetGeneration;
    const results = await memberApi.getMyResults({ signal });
    if (signal?.aborted || generation !== resetGeneration) return;
    set({ history: results.content, historyMeta: results.page });
    return results;
  },

  // false 또는 취소 오류일 때 화면은 완료 안내·이동을 실행하지 않는다.
  withdraw: async () => {
    const generation = resetGeneration;
    const completed = await memberApi.withdraw();
    if (!completed || generation !== resetGeneration) return false;
    await useAuthStore.getState().logout({ callApi: false });
    return true;
  },

  reset: () => {
    resetGeneration++;
    set(initialState);
  },
}));

const unregisterReset = registerStoreReset('member', () => useMemberStore.getState().reset());
if (import.meta.hot) import.meta.hot.dispose(unregisterReset);
