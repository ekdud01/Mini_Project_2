// 개발 서버 전용: 실제 main/App/라우터/MSW를 그대로 쓰는 통합 회귀 제어판.
// /tests/mypage-integration.html에서 시작한다. 토큰·비밀번호는 기록하지 않는다.
import { createRoot } from 'react-dom/client';
import { useState, useSyncExternalStore } from 'react';
import { delay, http, HttpResponse } from 'msw';
import { useAuthStore } from '@/store/authStore';
import { useMemberStore } from '@/store/memberStore';
import { useSurveyStore } from '@/store/surveyStore';
import { useResultStore } from '@/store/resultStore';
import '../src/main';

const listeners = new Set();
let revision = 0;
let requests = [];
let responses = [];
let releaseDelete;
let logoutCount = 0;
let clearCount = 0;
let controlsRoot;
const notify = () => { revision++; listeners.forEach((listener) => listener()); };
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => revision;
const originalLogout = useAuthStore.getState().logout;
const originalClear = useAuthStore.getState().clear;
useAuthStore.setState({
  logout: async (options) => { logoutCount++; notify(); return originalLogout(options); },
  clear: (options) => { clearCount++; notify(); return originalClear(options); },
});
const unsubscribers = [useAuthStore, useMemberStore, useSurveyStore, useResultStore]
  .map((store) => store.subscribe(notify));

function safeState() {
  const auth = useAuthStore.getState();
  const member = useMemberStore.getState();
  const survey = useSurveyStore.getState();
  const result = useResultStore.getState();
  return {
    authenticated: Boolean(auth.accessToken), email: auth.email,
    member: member.me?.email ?? null, history: member.history.length,
    surveys: survey.surveys.length, questions: survey.questions.length,
    currentResult: result.currentResult?.id ?? null,
    pendingAnswers: result.pendingFirstAnswers,
    persistedAnswers: JSON.parse(sessionStorage.getItem('result-storage') ?? 'null')?.state?.pendingFirstAnswers ?? null,
    logoutCount, clearCount, requests, responses,
  };
}

function fail(status, code = 'INTERNAL_SERVER_ERROR') {
  return HttpResponse.json({ success: false, error: { code, message: '통합 검증 응답' } }, { status });
}

export function IntegrationControls() {
  const [message, setMessage] = useState('준비 완료');
  useSyncExternalStore(subscribe, snapshot);
  async function run(action, label) {
    try { await action(); setMessage(label); } catch (error) { setMessage(error.message); }
  }
  const actions = [
    ['기록 초기화', () => { requests = []; responses = []; logoutCount = 0; clearCount = 0; notify(); }],
    ['토큰 만료', () => useAuthStore.getState().setAccessToken('expired')],
    ['재발급 500 설정', () => window.devWorker.use(http.post('/api/auth/reissue', () => fail(500)))],
    ['재발급 401 설정', () => window.devWorker.use(http.post('/api/auth/reissue', () => fail(401, 'INVALID_REFRESH_TOKEN')))],
    ['프로필 500 설정', () => window.devWorker.use(http.get('/api/members/me', () => fail(500)))],
    ['이력 500 설정', () => window.devWorker.use(http.get('/api/members/me/results', () => fail(500)))],
    ['조회 네트워크 설정', () => window.devWorker.use(http.get('/api/members/me', () => HttpResponse.error()))],
    ['탈퇴 500 설정', () => window.devWorker.use(http.delete('/api/members/me', () => fail(500)))],
    ['탈퇴 네트워크 설정', () => window.devWorker.use(http.delete('/api/members/me', () => HttpResponse.error()))],
    ['탈퇴 지연 설정', () => window.devWorker.use(http.delete('/api/members/me', async () => {
      await Promise.race([delay(6000), new Promise((resolve) => { releaseDelete = resolve; })]);
      return new HttpResponse(null, { status: 204 });
    }))],
    ['탈퇴 중 kim 전환 설정', () => window.devWorker.use(http.delete('/api/members/me', async () => {
      await delay(500);
      await useAuthStore.getState().login('kim@test.com', 'Test1234!');
      await delay(500);
      return new HttpResponse(null, { status: 204 });
    }))],
    ['탈퇴 지연 해제', () => { releaseDelete?.(); releaseDelete = undefined; }],
    ['정상 응답 복원', () => window.devWorker.resetHandlers()],
    ['잔여 데이터 주입', () => {
      useSurveyStore.setState({ surveys: [{ id: 999 }], questions: [{ id: 999 }] });
      useResultStore.setState({ currentResult: { id: 999 }, pendingFirstAnswers: [{ questionId: 1, score: 2 }] });
    }],
    ['kim 계정 전환', () => useAuthStore.getState().login('kim@test.com', 'Test1234!')],
    ['hong 계정 전환', () => useAuthStore.getState().login('hong@test.com', 'Test1234!')],
    ['테스트 세션 정리', () => { window.devWorker.resetHandlers(); useAuthStore.getState().clear(); }],
  ];
  return (
    <details className="border-b bg-white p-3" open>
      <summary className="min-h-12 cursor-pointer font-bold">통합 검증 제어판</summary>
      <div className="flex flex-wrap gap-2">
        {actions.map(([label, action]) => <button key={label} className="min-h-12 rounded border px-3"
          onClick={() => void run(action, label)}>{label}</button>)}
      </div>
      <p role="status">{message}</p>
      <pre aria-label="통합 검증 상태" className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(safeState(), null, 2)}</pre>
    </details>
  );
}

const onRequest = ({ request }) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return;
  requests.push(`${request.method} ${url.pathname}${url.search}`);
  notify();
};
const onResponse = ({ request, response }) => {
  responses.push(`${request.method} ${new URL(request.url).pathname} ${response.status}`);
  notify();
};

// main.jsx가 MSW와 개발 도구 등록을 마친 뒤에만 계측한다.
const ready = setInterval(() => {
  if (!window.devWorker) return;
  clearInterval(ready);
  window.devWorker.events.on('request:start', onRequest);
  window.devWorker.events.on('response:mocked', onResponse);
  controlsRoot = createRoot(document.getElementById('test-controls'));
  controlsRoot.render(<IntegrationControls />);
}, 25);

if (import.meta.hot) import.meta.hot.dispose(() => {
  clearInterval(ready);
  controlsRoot?.unmount();
  window.devWorker?.events.removeListener('request:start', onRequest);
  window.devWorker?.events.removeListener('response:mocked', onResponse);
  releaseDelete?.();
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  useAuthStore.setState({ logout: originalLogout, clear: originalClear });
});
