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
const { useAuthStore: auth } = await import('../src/store/authStore.js');
const { registerStoreReset } = await import('../src/store/resetStores.js');
const { getErrorCode, getFieldErrors, getErrorMessage } = await import('../src/utils/apiError.js');

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const ok = (config, data = {}) => ({ status: 200, data: { success: true, data }, headers: {}, config });
const fail = (config, status = 401, code = 'ACCESS_TOKEN_EXPIRED') =>
  new axios.AxiosError(code, 'ERR_BAD_RESPONSE', config, {}, {
    status, data: { success: false, error: { code } }, headers: {}, config,
  });
const setSession = (refreshToken = 'session-a', accessToken = 'expired') =>
  auth.getState().setTokens({ refreshToken, accessToken, email: `${refreshToken}@test.com` });
const protectedResponse = (config) => {
  if (config.headers.get('Authorization') === 'Bearer expired') throw fail(config);
  return ok(config);
};

beforeEach(() => {
  auth.getState().clear();
  setSession();
  api.defaults.adapter = async (config) => protectedResponse(config);
  axios.defaults.adapter = async (config) => ok(config, { accessToken: 'fresh' });
});

test('정상 요청에는 저장된 토큰이 붙고 재발급하지 않는다', async () => {
  setSession('session-a', 'valid');
  axios.defaults.adapter = () => assert.fail('재발급하면 안 됨');
  const response = await api.get('/members/me');
  assert.equal(response.config.headers.get('Authorization'), 'Bearer valid');
});

test('동시 만료 요청은 한 번 재발급하고 각각 한 번 재시도한다', async () => {
  const gate = deferred();
  const started = deferred();
  let reissues = 0;
  let requests = 0;
  api.defaults.adapter = async (config) => { requests++; return protectedResponse(config); };
  axios.defaults.adapter = async (config) => {
    reissues++;
    started.resolve();
    await gate.promise;
    return ok(config, { accessToken: 'fresh' });
  };
  const pending = Promise.all([api.get('/members/me'), api.get('/members/me/results')]);
  await started.promise;
  gate.resolve();
  await pending;
  assert.equal(reissues, 1);
  assert.equal(requests, 4);
});

test('재발급 완료 후 늦게 도착한 401도 추가 재발급 없이 복구한다', async () => {
  const gate = deferred();
  let reissues = 0;
  axios.defaults.adapter = async (config) => { reissues++; return ok(config, { accessToken: 'fresh' }); };
  api.defaults.adapter = async (config) => {
    if (config.url === '/slow' && !config._retry) await gate.promise;
    return protectedResponse(config);
  };
  const slow = api.get('/slow');
  await api.get('/fast');
  gate.resolve();
  await slow;
  assert.equal(reissues, 1);
});

test('재시도도 만료되면 무한 재발급 없이 인증을 종료한다', async () => {
  let reissues = 0;
  let requests = 0;
  axios.defaults.adapter = async (config) => { reissues++; return ok(config, { accessToken: 'expired' }); };
  api.defaults.adapter = async (config) => { requests++; throw fail(config); };
  await assert.rejects(api.get('/members/me'));
  assert.equal(reissues, 1);
  assert.equal(requests, 2);
  assert.equal(auth.getState().accessToken, null);
  assert.equal(auth.getState().logoutReason, '다시 로그인해주세요.');
});

test('재발급 401은 인증 정보를 삭제한다', async () => {
  axios.defaults.adapter = async (config) => { throw fail(config, 401, 'INVALID_REFRESH_TOKEN'); };
  await assert.rejects(api.get('/members/me'), (e) => getErrorCode(e) === 'INVALID_REFRESH_TOKEN');
  assert.equal(auth.getState().refreshToken, null);
});

test('재발급 500과 네트워크 오류는 원래 오류를 전달하고 세션을 유지한다', async () => {
  for (const network of [false, true]) {
    let expected;
    axios.defaults.adapter = async (config) => {
      expected = network
        ? new axios.AxiosError('Network Error', 'ERR_NETWORK', config, {})
        : fail(config, 500, 'INTERNAL_SERVER_ERROR');
      throw expected;
    };
    await assert.rejects(api.get('/members/me'), (e) => e === expected);
    assert.equal(auth.getState().refreshToken, 'session-a');
    assert.equal(auth.getState().logoutReason, null);
  }
});

test('재발급 중 로컬 로그아웃하면 늦은 응답은 토큰을 복구하지 않는다', async () => {
  const started = deferred();
  const gate = deferred();
  axios.defaults.adapter = async (config) => {
    started.resolve(); await gate.promise;
    return ok(config, { accessToken: 'fresh' });
  };
  const outcome = assert.rejects(api.get('/members/me'), axios.isCancel);
  await started.promise;
  await auth.getState().logout({ callApi: false });
  gate.resolve();
  await outcome;
  assert.equal(auth.getState().accessToken, null);
  assert.equal(auth.getState().logoutReason, null);
});

test('이전 계정 재발급 실패는 새 계정을 로그아웃시키지 않는다', async () => {
  const started = deferred();
  const gate = deferred();
  axios.defaults.adapter = async (config) => {
    started.resolve(); await gate.promise;
    throw fail(config, 401, 'INVALID_REFRESH_TOKEN');
  };
  const outcome = assert.rejects(api.get('/members/me'), axios.isCancel);
  await started.promise;
  setSession('session-b', 'valid-b');
  gate.resolve();
  await outcome;
  assert.equal(auth.getState().accessToken, 'valid-b');
  assert.equal(auth.getState().logoutReason, null);
});

test('새 계정은 이전 계정의 진행 중 재발급을 공유하지 않는다', async () => {
  const started = deferred();
  const gate = deferred();
  const sessions = [];
  axios.defaults.adapter = async (config) => {
    const { refreshToken } = JSON.parse(config.data);
    sessions.push(refreshToken);
    if (refreshToken === 'session-a') { started.resolve(); await gate.promise; }
    return ok(config, { accessToken: `fresh-${refreshToken}` });
  };
  const previous = assert.rejects(api.get('/members/me'), axios.isCancel);
  await started.promise;
  setSession('session-b');
  await api.get('/members/me');
  gate.resolve();
  await previous;
  assert.deepEqual(sessions, ['session-a', 'session-b']);
  assert.equal(auth.getState().accessToken, 'fresh-session-b');
});

test('이전 계정의 늦은 성공/401 응답은 새 계정으로 재시도하거나 반영하지 않는다', async () => {
  for (const status of [200, 401]) {
    setSession('session-a', 'valid-a');
    const started = deferred();
    const gate = deferred();
    api.defaults.adapter = async (config) => {
      started.resolve(); await gate.promise;
      if (status === 401) throw fail(config);
      return ok(config, { name: '이전 계정' });
    };
    const outcome = assert.rejects(api.get('/members/me'), axios.isCancel);
    await started.promise;
    setSession('session-b', 'valid-b');
    gate.resolve();
    await outcome;
    assert.equal(auth.getState().accessToken, 'valid-b');
  }
});

test('로그아웃은 API에 토큰을 보내고 500/401이어도 사유 없이 로컬 삭제한다', async () => {
  for (const status of [204, 500, 401]) {
    setSession('session-a', 'valid');
    api.defaults.adapter = async (config) => {
      assert.equal(config.headers.get('Authorization'), 'Bearer valid');
      if (status !== 204) throw fail(config, status, 'UNAUTHORIZED');
      return { ...ok(config), status: 204, data: '' };
    };
    await auth.getState().logout();
    assert.equal(auth.getState().accessToken, null);
    assert.equal(auth.getState().logoutReason, null);
  }
});

test('이전 로그아웃이 늦게 완료돼도 새 계정의 인증을 삭제하지 않는다', async () => {
  setSession('session-a', 'valid-a');
  const started = deferred();
  const gate = deferred();
  api.defaults.adapter = async (config) => { started.resolve(); await gate.promise; return ok(config); };
  const pending = auth.getState().logout();
  await started.promise;
  setSession('session-b', 'valid-b');
  gate.resolve();
  await pending;
  assert.equal(auth.getState().accessToken, 'valid-b');
});

test('로그인은 인증 헤더 없이 호출하며 401/403은 화면으로 전달한다', async () => {
  for (const [status, code] of [[401, 'INVALID_CREDENTIALS'], [403, 'MEMBER_WITHDRAWN']]) {
    api.defaults.adapter = async (config) => {
      assert.equal(config.headers.has('Authorization'), false);
      throw fail(config, status, code);
    };
    await assert.rejects(auth.getState().login('wrong@test.com', 'bad'), (e) => getErrorCode(e) === code);
    assert.equal(auth.getState().logoutReason, null);
  }
});

test('로그인 성공·clear는 등록된 스토어를 초기화하고 종료 사유는 저장하지 않는다', async () => {
  let resets = 0;
  const unregister = registerStoreReset('test-store', () => { resets++; });
  try {
    api.defaults.adapter = async (config) => ok(config, { accessToken: 'new-access', refreshToken: 'new-refresh' });
    await auth.getState().login('new@test.com', 'password');
    assert.equal(resets, 1);
    assert.equal(auth.getState().email, 'new@test.com');
    auth.getState().clear({ reason: '다시 로그인해주세요.' });
    assert.equal(resets, 2);
    assert.deepEqual(JSON.parse(localStorage.getItem('auth-storage')).state,
      { accessToken: null, refreshToken: null, email: null });
    auth.getState().clearLogoutReason();
    assert.equal(auth.getState().logoutReason, null);
  } finally { unregister(); }
});

test('토큰이 없으면 요청에 남아 있는 Authorization 헤더도 삭제한다', async () => {
  auth.getState().clear();
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.has('Authorization'), false);
    return ok(config);
  };
  await api.get('/members/me', { headers: { Authorization: 'Bearer stale' } });
});

test('오류 유틸은 필드 오류·화면별 기본 문구·네트워크 오류를 구분한다', () => {
  const error = { response: { data: { error: { code: 'DUPLICATE_EMAIL', fields: [{ field: 'email', message: '중복' }] } } } };
  assert.deepEqual(getFieldErrors(error), { email: '중복' });
  assert.deepEqual(getFieldErrors({}), {});
  assert.equal(getErrorMessage(error, { DUPLICATE_EMAIL: '이미 가입된 이메일입니다.' }), '이미 가입된 이메일입니다.');
  assert.equal(getErrorMessage(error, {}, '회원가입에 실패했습니다.'), '회원가입에 실패했습니다.');
  assert.match(getErrorMessage({ request: {} }), /네트워크 오류/);
});
