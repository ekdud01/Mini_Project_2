// Vite 개발 서버의 /tests/mypage-browser.html에서만 사용하는 수동 회귀 fixture.
// 실제 페이지·store·axios 인터셉터를 사용하고 HTTP adapter만 제어한다.
import { StrictMode, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from '@/api/axiosInstance';
import { useAuthStore } from '@/store/authStore';
import { useMemberStore } from '@/store/memberStore';
import MyPage from '@/pages/MyPage';
import UserLayout from '@/components/layout/UserLayout';
import '@/index.css';

const profile = { name: '검증회원', email: 'fixture@test.com', gender: 'FEMALE', birthYear: 1960 };
const empty = { content: [], page: { number: 0, size: 100, totalElements: 0, totalPages: 0, first: true, last: true } };
const scenarios = [
  ['empty', '빈 이력'], ['history', '이력 1건'], ['long', '긴 이메일'],
  ['profile-error', '프로필 500'], ['history-error', '이력 500'], ['network', '네트워크 오류'],
  ['delayed', '두 조회 지연'], ['late-success', '이력 실패와 늦은 프로필 성공'],
  ['late-failure', '프로필 실패와 늦은 이력 실패'],
];
let mode = 'empty';
let sequence = 0;
let revision = 0;
let requests = [];
let attempts = [];
const subscribers = new Set();
const publish = () => { revision++; subscribers.forEach((notify) => notify()); };
const subscribe = (notify) => { subscribers.add(notify); return () => subscribers.delete(notify); };
const snapshot = () => revision;
const originalAdapter = api.defaults.adapter;
const originalActions = {};

for (const action of ['fetchMe', 'fetchMyResults']) {
  const original = useMemberStore.getState()[action];
  originalActions[action] = original;
  useMemberStore.setState({ [action]: (options) => {
    attempts.push({ action, signal: options.signal });
    publish();
    return original(options);
  } });
}

api.defaults.adapter = async (config) => {
  const capturedMode = mode;
  const isHistory = config.url === '/members/me/results';
  if (!['/members/me', '/members/me/results'].includes(config.url)) throw new Error(`예상하지 않은 요청: ${config.url}`);
  const request = { id: ++sequence, url: config.url, mode: capturedMode, signal: config.signal, done: false };
  requests.push(request);
  config.signal?.addEventListener('abort', publish, { once: true });
  publish();
  const held = capturedMode === 'delayed'
    || (capturedMode === 'late-success' && !isHistory)
    || (capturedMode === 'late-failure' && isHistory);
  if (held) await new Promise((resolve) => { request.release = resolve; });
  request.done = true;
  publish();
  const failed = (capturedMode === 'profile-error' && !isHistory)
    || (capturedMode === 'history-error' && isHistory)
    || capturedMode === 'late-failure'
    || (capturedMode === 'late-success' && isHistory);
  if (capturedMode === 'network') throw new axios.AxiosError('Network Error', 'ERR_NETWORK', config, {});
  if (failed) throw new axios.AxiosError('서버 오류', 'ERR_BAD_RESPONSE', config, {}, {
    status: 500, data: { error: { code: 'INTERNAL_SERVER_ERROR' } }, config, headers: {},
  });
  const me = capturedMode === 'long'
    ? { ...profile, email: `${'a'.repeat(64)}@${'b'.repeat(24)}.example.kr` }
    : { ...profile, name: capturedMode === 'late-success' ? '이전 응답' : profile.name };
  const results = capturedMode === 'history'
    ? { content: [{ id: 1, examType: 'KDSQ_P', firstScore: 0, totalScore: null, riskLevel: 'Normal', createdAt: '2026-09-30T10:00:00' }], page: { ...empty.page, totalElements: 1, totalPages: 1 } }
    : empty;
  return { status: 200, data: { success: true, data: isHistory ? results : me }, config, headers: {} };
};
// 같은 origin의 실제 앱 탭에 fixture 토큰을 저장하지 않는다.
useAuthStore.persist.setOptions({
  storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
});
useAuthStore.getState().clear();
useAuthStore.getState().setTokens({ accessToken: 'fixture', refreshToken: 'fixture', email: profile.email });

function resetScenario(nextMode) {
  requests.forEach((request) => request.release?.());
  requests = [];
  attempts = [];
  mode = nextMode;
  useMemberStore.getState().reset();
}

function restoreResponses() { mode = 'empty'; }

export function LocationStatus() {
  return <p>현재 경로: {useLocation().pathname}</p>;
}

export function Fixture() {
  const [run, setRun] = useState(0);
  const [selected, setSelected] = useState(mode);
  useSyncExternalStore(subscribe, snapshot);
  const me = useMemberStore((state) => state.me);
  const history = useMemberStore((state) => state.history);

  function start(nextMode) {
    resetScenario(nextMode);
    setSelected(nextMode);
    setRun((value) => value + 1);
  }

  return (
    <>
      <aside aria-label="테스트 제어" className="space-y-3 border-b bg-white p-4 text-base">
        <h1 className="font-bold">마이페이지 테스트 전용</h1>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(([value, label]) => (
            <button key={value} className="min-h-12 rounded border px-3" onClick={() => start(value)}>{label}</button>
          ))}
          <button className="min-h-12 rounded border px-3" onClick={() => { restoreResponses(); setSelected('empty'); }}>다음 응답 정상으로</button>
          <button className="min-h-12 rounded border px-3" onClick={() => requests.forEach((request) => request.release?.())}>지연 응답 해제</button>
          <button className="min-h-12 rounded border px-3" onClick={() => requests.filter((request) => request.url === '/members/me').forEach((request) => request.release?.())}>프로필 응답만 해제</button>
          <button className="min-h-12 rounded border px-3" onClick={() => useAuthStore.getState().clear()}>테스트 세션 정리</button>
        </div>
        <p>설정: {selected} / store 회원: {me?.name ?? '없음'} / store 이력: {history.length}건</p>
        <p>요청 {requests.length}건 / 취소 {requests.filter((request) => request.signal?.aborted).length}건 / 완료 {requests.filter((request) => request.done).length}건</p>
        <p>조회 액션 {attempts.length}회 / 취소된 액션 {attempts.filter((attempt) => attempt.signal.aborted).length}회</p>
      </aside>
      <StrictMode>
        <MemoryRouter key={run} initialEntries={['/mypage']}>
          <LocationStatus />
          <Routes>
            <Route element={<UserLayout />}>
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/surveys/p" element={<section><h1>검사 시작 경로 도착</h1><Link to="/mypage">마이페이지로 돌아가기</Link></section>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </StrictMode>
    </>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode><Fixture /></StrictMode>);
if (import.meta.hot) import.meta.hot.dispose(() => {
  root.unmount();
  requests.forEach((request) => request.release?.());
  useMemberStore.setState(originalActions);
  api.defaults.adapter = originalAdapter;
});
