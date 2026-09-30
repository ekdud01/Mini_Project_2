import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { beforeEach, test } from 'node:test';
import axios from 'axios';

const aliasLoader = await import('./alias-loader.js');
if (nodeModule.registerHooks) nodeModule.registerHooks(aliasLoader);
else nodeModule.register('./alias-loader.js', import.meta.url);

const storage = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
} });

globalThis.window = { localStorage: globalThis.localStorage };

const { default: api } = await import('../src/api/axiosInstance.js');
const memberApi = await import('../src/api/memberApi.js');
const { useMemberStore: member } = await import('../src/store/memberStore.js');
const { useAuthStore: auth } = await import('../src/store/authStore.js');

const profile = { id: 1, name: '홍길동', email: 'hong@test.com', gender: 'MALE', birthYear: 1960 };
const history = {
  content: [{ id: 7, examType: 'C', firstScore: 4, totalScore: 0, riskLevel: 'NORMAL' }],
  page: { number: 0, size: 100, totalElements: 1, totalPages: 1, first: true, last: true },
};
const ok = (config, data) => ({ status: 200, data: { success: true, data }, headers: {}, config });
const noContent = (config) => ({ status: 204, data: undefined, headers: {}, config });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const setSession = (session = 'a') => auth.getState().setTokens({
  refreshToken: `session-${session}`, accessToken: `access-${session}`, email: `${session}@test.com`,
});
const assertEmpty = () => {
  assert.equal(member.getState().me, null);
  assert.deepEqual(member.getState().history, []);
  assert.equal(member.getState().historyMeta, null);
};
const queries = [
  { action: 'fetchMe', url: '/members/me', data: profile, field: 'me', stored: profile },
  { action: 'fetchMyResults', url: '/members/me/results', data: history, field: 'history', stored: history.content },
];

beforeEach(() => {
  auth.getState().clear();
  setSession();
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.get('Authorization'), 'Bearer access-a');
    if (config.method === 'delete') return noContent(config);
    return ok(config, config.url.endsWith('/results') ? history : profile);
  };
  axios.defaults.adapter = () => assert.fail('예상하지 않은 별도 axios 호출');
});

test('내 정보·이력 API는 인증·signal·page=0/size=100과 응답 메타데이터를 보존한다', async () => {
  const { signal } = new AbortController();
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    assert.equal(config.baseURL, '/api');
    assert.equal(config.method, 'get');
    assert.equal(config.signal, signal);
    assert.equal(config.headers.get('Authorization'), 'Bearer access-a');
    assert.notEqual(config.skipAuth, true);
    return ok(config, config.url.endsWith('/results') ? history : profile);
  };
  const [me, results] = await Promise.all([memberApi.getMe({ signal }), memberApi.getMyResults({ signal })]);
  assert.deepEqual(me, profile);
  assert.deepEqual(results, history);
  assert.deepEqual(requests.map(({ url }) => url), ['/members/me', '/members/me/results']);
  assert.deepEqual(requests[1].params, { page: 0, size: 100 });
});

test('기존 회원가입 API는 인증 없이 body를 보내고 회원 객체를 반환한다', async () => {
  const body = { email: 'new@test.com', password: 'Test1234!', name: '새회원' };
  api.defaults.adapter = async (config) => {
    assert.equal(config.url, '/members');
    assert.equal(config.method, 'post');
    assert.equal(config.skipAuth, true);
    assert.equal(config.headers.has('Authorization'), false);
    assert.deepEqual(JSON.parse(config.data), body);
    return ok(config, profile);
  };
  assert.deepEqual(await memberApi.register(body), profile);
});

test('두 조회는 어느 순서로 완료돼도 서로 무효화하지 않고 저장되며 persist하지 않는다', async () => {
  for (const order of [queries, [...queries].reverse()]) {
    member.getState().reset();
    const gates = new Map(queries.map(({ url }) => [url, deferred()]));
    api.defaults.adapter = async (config) => {
      await gates.get(config.url).promise;
      return ok(config, queries.find(({ url }) => url === config.url).data);
    };
    const pending = new Map(queries.map(({ action, url }) => [url, member.getState()[action]()]));
    for (const { url, data } of order) {
      gates.get(url).resolve();
      assert.deepEqual(await pending.get(url), data);
    }
    assert.deepEqual(member.getState().me, profile);
    assert.deepEqual(member.getState().history, history.content);
    assert.deepEqual(member.getState().historyMeta, history.page);
  }
  assert.deepEqual([...storage.keys()], ['auth-storage']);
});

test('빈 이력도 서버 page 메타데이터를 그대로 보존한다', async () => {
  const empty = { content: [], page: { ...history.page, totalElements: 0, totalPages: 0 } };
  api.defaults.adapter = async (config) => ok(config, empty);
  assert.deepEqual(await member.getState().fetchMyResults(), empty);
  assert.deepEqual(member.getState().historyMeta, empty.page);
});

for (const query of queries) {
  test(`${query.action}: 500·네트워크 실패는 원래 오류로 전달하고 기존 데이터를 유지한다`, async () => {
    await member.getState()[query.action]();
    for (const network of [false, true]) {
      let expected;
      api.defaults.adapter = async (config) => {
        expected = new axios.AxiosError('조회 실패', network ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE', config, {},
          network ? undefined : { status: 500, config, data: {} });
        throw expected;
      };
      await assert.rejects(member.getState()[query.action](), (error) => error === expected);
      assert.deepEqual(member.getState()[query.field], query.stored);
      assert.equal(auth.getState().refreshToken, 'session-a');
    }
  });

  test(`${query.action}: 이전 signal abort 후 새 조회 성공을 늦은 응답이 덮지 않는다`, async () => {
    const started = deferred();
    const gate = deferred();
    const previous = new AbortController();
    api.defaults.adapter = async (config) => {
      if (config.signal === previous.signal) {
        started.resolve();
        await gate.promise;
        return ok(config, query.action === 'fetchMe' ? { ...profile, id: 99 } : { ...history, content: [{ id: 99 }] });
      }
      return ok(config, query.data);
    };
    const outcome = assert.rejects(member.getState()[query.action]({ signal: previous.signal }), axios.isCancel);
    await started.promise;
    previous.abort();
    await member.getState()[query.action]({ signal: new AbortController().signal });
    gate.resolve();
    await outcome;
    assert.deepEqual(member.getState()[query.field], query.stored);
  });

  test(`${query.action}: axios 처리 후 저장 직전 abort도 store에서 차단한다`, async () => {
    const controller = new AbortController();
    const interceptor = api.interceptors.response.use((response) => {
      controller.abort();
      return response;
    });
    try {
      assert.equal(await member.getState()[query.action]({ signal: controller.signal }), undefined);
      assertEmpty();
    } finally { api.interceptors.response.eject(interceptor); }
  });

  test(`${query.action}: reset 뒤 늦은 성공은 데이터를 복원하지 않는다`, async () => {
    const started = deferred();
    const gate = deferred();
    api.defaults.adapter = async (config) => {
      started.resolve();
      await gate.promise;
      return ok(config, query.data);
    };
    const pending = member.getState()[query.action]();
    await started.promise;
    member.getState().reset();
    gate.resolve();
    assert.equal(await pending, undefined);
    assertEmpty();
  });

  test(`${query.action}: 이전 요청의 늦은 실패는 새 성공 데이터를 지우지 않는다`, async () => {
    const started = deferred();
    const gate = deferred();
    let requests = 0;
    api.defaults.adapter = async (config) => {
      if (++requests === 1) {
        started.resolve();
        await gate.promise;
        throw new axios.AxiosError('이전 요청 실패', 'ERR_NETWORK', config, {});
      }
      return ok(config, query.data);
    };
    const outcome = assert.rejects(member.getState()[query.action](), { message: '이전 요청 실패' });
    await started.promise;
    member.getState().reset();
    await member.getState()[query.action]();
    gate.resolve();
    await outcome;
    assert.deepEqual(member.getState()[query.field], query.stored);
  });
}

test('clear는 member를 초기화하고 진행 중인 두 조회의 늦은 응답을 차단한다', async () => {
  await Promise.all(queries.map(({ action }) => member.getState()[action]()));
  const started = deferred();
  const gate = deferred();
  let requests = 0;
  api.defaults.adapter = async (config) => {
    if (++requests === 2) started.resolve();
    await gate.promise;
    return ok(config, config.url.endsWith('/results') ? history : profile);
  };
  const outcomes = queries.map(({ action }) => assert.rejects(member.getState()[action](), axios.isCancel));
  await started.promise;
  auth.getState().clear();
  assertEmpty();
  gate.resolve();
  await Promise.all(outcomes);
  assertEmpty();
});

test('탈퇴 204는 본문 없이 DELETE 1회·logout(false) 1회·clear 1회로 완료한다', async (t) => {
  await Promise.all(queries.map(({ action }) => member.getState()[action]()));
  const logout = t.mock.method(auth.getState(), 'logout');
  const clear = t.mock.method(auth.getState(), 'clear');
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push([config.method, config.url]);
    assert.equal(config.headers.get('Authorization'), 'Bearer access-a');
    assert.notEqual(config.skipAuth, true);
    return noContent(config);
  };
  assert.equal(await member.getState().withdraw(), true);
  assert.deepEqual(requests, [['delete', '/members/me']]);
  assert.equal(logout.mock.callCount(), 1);
  assert.deepEqual(logout.mock.calls[0].arguments, [{ callApi: false }]);
  assert.equal(clear.mock.callCount(), 1);
  assert.equal(auth.getState().refreshToken, null);
  assertEmpty();
});

test('탈퇴 500·네트워크 실패는 전달하고 세션과 회원정보를 유지한다', async (t) => {
  await member.getState().fetchMe();
  const logout = t.mock.method(auth.getState(), 'logout');
  for (const network of [false, true]) {
    let expected;
    api.defaults.adapter = async (config) => {
      expected = new axios.AxiosError('탈퇴 실패', network ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE', config, {},
        network ? undefined : { status: 500, config, data: {} });
      throw expected;
    };
    await assert.rejects(member.getState().withdraw(), (error) => error === expected);
    assert.equal(auth.getState().refreshToken, 'session-a');
    assert.deepEqual(member.getState().me, profile);
  }
  assert.equal(logout.mock.callCount(), 0);
});

test('204가 아닌 응답은 탈퇴 완료로 반환하거나 로그아웃하지 않는다', async (t) => {
  const logout = t.mock.method(auth.getState(), 'logout');
  api.defaults.adapter = async (config) => ok(config, {});
  assert.equal(await member.getState().withdraw(), false);
  assert.equal(logout.mock.callCount(), 0);
  assert.equal(auth.getState().refreshToken, 'session-a');
});

test('DELETE 진행 중 reset하면 늦은 204는 로그아웃하지 않고 false를 반환한다', async (t) => {
  const logout = t.mock.method(auth.getState(), 'logout');
  const started = deferred();
  const gate = deferred();
  api.defaults.adapter = async (config) => {
    started.resolve(); await gate.promise;
    return noContent(config);
  };
  const pending = member.getState().withdraw();
  await started.promise;
  member.getState().reset();
  gate.resolve();
  assert.equal(await pending, false);
  assert.equal(logout.mock.callCount(), 0);
  assert.equal(auth.getState().refreshToken, 'session-a');
});

test('이전 계정의 늦은 탈퇴 성공·실패는 새 계정을 로그아웃시키지 않는다', async (t) => {
  const logout = t.mock.method(auth.getState(), 'logout');
  for (const status of [204, 500]) {
    setSession('a');
    const started = deferred();
    const gate = deferred();
    api.defaults.adapter = async (config) => {
      started.resolve(); await gate.promise;
      if (status === 500) throw new axios.AxiosError('이전 탈퇴 실패', 'ERR_BAD_RESPONSE', config, {}, { status, config });
      return noContent(config);
    };
    const outcome = assert.rejects(member.getState().withdraw(), axios.isCancel);
    await started.promise;
    // reset 없이 토큰만 바꿔 기존 axios의 세션 보호도 독립적으로 확인한다.
    setSession('b');
    gate.resolve();
    await outcome;
    assert.equal(auth.getState().refreshToken, 'session-b');
  }
  assert.equal(logout.mock.callCount(), 0);
});

test('axios 세션 검사 직후 계정이 변경돼도 reset 세대가 탈퇴 완료를 차단한다', async (t) => {
  const logout = t.mock.method(auth.getState(), 'logout');
  const interceptor = api.interceptors.response.use((response) => {
    auth.getState().clear();
    setSession('b');
    return response;
  });
  try {
    assert.equal(await member.getState().withdraw(), false);
    assert.equal(logout.mock.callCount(), 0);
    assert.equal(auth.getState().refreshToken, 'session-b');
  } finally { api.interceptors.response.eject(interceptor); }
});
