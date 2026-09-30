import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as nodeModule from 'node:module';
import { test } from 'node:test';

const aliasLoader = await import('./alias-loader.js');
if (nodeModule.registerHooks) nodeModule.registerHooks(aliasLoader);
else nodeModule.register('./alias-loader.js', import.meta.url);

test('페이지 미방문 상태에서 main의 store imports만으로 reset 등록과 잔여 답변 정리가 가능하다', async () => {
  for (const name of ['localStorage', 'sessionStorage']) {
    const values = new Map();
    Object.defineProperty(globalThis, name, { configurable: true, value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    } });
  }
  globalThis.window = { localStorage: globalThis.localStorage };
  const answers = [{ questionId: 1, score: 2 }];
  sessionStorage.setItem('result-storage', JSON.stringify({ state: { pendingFirstAnswers: answers }, version: 0 }));

  // 실제 main의 부수효과 store import를 실행한다. 페이지·React 렌더링은 로드하지 않는다.
  const entry = new URL('../src/main.jsx', import.meta.url);
  const source = await readFile(entry, 'utf8');
  const stores = new Map();
  for (const [, path] of source.matchAll(/^import ['"](\.\/store\/[^'"]+)['"];$/gm)) {
    stores.set(path, await import(new URL(`${path}.js`, entry)));
  }
  const survey = stores.get('./store/surveyStore')?.useSurveyStore;
  const result = stores.get('./store/resultStore')?.useResultStore;
  assert.ok(survey, 'main에서 surveyStore 초기 로드 필요');
  assert.ok(result, 'main에서 resultStore 초기 로드 필요');
  assert.deepEqual(result.getState().pendingFirstAnswers, answers);
  survey.setState({ surveys: [{ id: 1 }], questions: [{ id: 1 }], questionsSurveyId: 1 });
  result.setState({ currentResult: { id: 1 } });

  const { useAuthStore: auth } = await import('../src/store/authStore.js');
  const { useMemberStore: member } = await import('../src/store/memberStore.js');
  const { default: api } = await import('../src/api/axiosInstance.js');
  auth.getState().setTokens({ accessToken: 'valid', refreshToken: 'session-a' });
  member.setState({ me: { id: 1 }, history: [{ id: 1 }], historyMeta: { totalElements: 1 } });
  api.defaults.adapter = async (config) => {
    assert.equal(config.method, 'delete');
    assert.equal(config.url, '/members/me');
    return { status: 204, data: undefined, headers: {}, config };
  };
  assert.equal(await member.getState().withdraw(), true);
  assert.deepEqual(survey.getState().surveys, []);
  assert.deepEqual(survey.getState().questions, []);
  assert.equal(survey.getState().questionsSurveyId, null);
  assert.equal(result.getState().currentResult, null);
  assert.equal(result.getState().pendingFirstAnswers, null);
  assert.equal(JSON.parse(sessionStorage.getItem('result-storage')).state.pendingFirstAnswers, null);
  assert.equal(member.getState().me, null);
  assert.deepEqual(member.getState().history, []);
  assert.equal(member.getState().historyMeta, null);
});
