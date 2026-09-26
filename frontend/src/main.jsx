import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * 개발 모드(npm run dev)에서는 기본으로 MSW가 /api 요청을 Mock 데이터로 응답한다.
 * 실제 백엔드(8080)에 연결하려면 frontend/.env.development.local 파일을 만들고
 *   VITE_USE_MOCK=false
 * 한 줄을 넣은 뒤 개발 서버를 다시 켠다. (*.local 파일은 GitHub에 올라가지 않음)
 */
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'false') return;
  const { worker } = await import('./mocks/msw/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });

  // [개발용] 로그인 화면이 완성되기 전 테스트 로그인: 브라우저 콘솔에서 devLogin() 입력
  const { devLogin } = await import('./store/authStore');
  window.devLogin = devLogin;
  console.info('[MSW] Mock 데이터 사용 중 — 테스트 로그인: 콘솔에 devLogin() 입력');
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
