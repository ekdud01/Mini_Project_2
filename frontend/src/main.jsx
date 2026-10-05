import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
// 직접 진입한 페이지와 관계없이 로그아웃 시 설문·임시 답변을 초기화한다.
import './store/surveyStore';
import './store/resultStore';

/**
 * 개발 모드(npm run dev)에서는 기본으로 MSW가 /api 요청을 Mock 데이터로 응답한다.
 * 실제 백엔드(8080)에 연결하려면 frontend/.env.development.local 파일을 만들고
 *   VITE_USE_MOCK=false
 * 한 줄을 넣은 뒤 개발 서버를 다시 켠다. (*.local 파일은 GitHub에 올라가지 않음)
 *
 * 체험판 빌드(npm run build:demo, .env.demo의 VITE_DEMO=true)는 백엔드 없이 배포하므로
 * 빌드 결과에서도 MSW를 켠다. 개발용 콘솔 함수는 체험판에 노출하지 않는다.
 */
const isDemo = import.meta.env.VITE_DEMO === 'true';

async function enableMocking() {
  const useDevMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false';
  if (!useDevMock && !isDemo) return;
  const { worker } = await import('@mock/msw/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: isDemo });
  if (!import.meta.env.DEV) return;

  // [개발용] 로그인 화면이 완성되기 전 테스트 로그인: 브라우저 콘솔에서 devLogin() 입력
  const { devLogin, useAuthStore } = await import('./store/authStore');
  const { http, HttpResponse, delay } = await import('msw');
  const { default: devApi } = await import('./api/axiosInstance');
  Object.assign(window, {
    devLogin,
    devExpireToken: () => useAuthStore.getState().setAccessToken('expired'),
    devWorker: worker,
    devAuth: useAuthStore,
    devApi,
    http,
    HttpResponse,
    delay,
  });
  console.info('[MSW] Mock 데이터 사용 중 — 테스트 로그인: 콘솔에 devLogin() 입력');
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
