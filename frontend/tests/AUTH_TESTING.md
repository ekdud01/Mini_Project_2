# 인증 기반 검증

## 자동 테스트

`frontend`에서 `npm run test:auth`를 실행한다. 추가 패키지 없이 Node 테스트 러너로 실제 authStore·axios 인터셉터를 로드한다. axios 어댑터에서 응답 순서와 실패를 제어하므로 MSW/실제 서버 연결 검증은 아래 브라우저 테스트로 보완한다.

정상 요청, 동시/늦은 401, 재시도 상한, 재발급 401/500/네트워크 오류, 재발급 도중 로그아웃/계정 변경, 늦은 이전 계정 응답, 로그아웃 실패, 로그인 오류, 스토어 초기화·저장 범위, 헤더 삭제, 오류 문구를 확인한다.

## 브라우저 준비

`npm run dev`로 실행한 Mock 모드에서 콘솔을 연다. 매 시나리오를 시작하기 전에 이전 요청이 끝났는지 확인하고 다음을 실행한다.

```js
devWorker.resetHandlers();
await devLogin();
```

로그인 후 새로고침하지 않는다. 마이페이지는 아직 뼈대이므로 링크 이동만으로 API가 호출되지 않는다. 아래처럼 `devApi`를 사용한다. 개발 도구는 프로덕션 빌드나 `VITE_USE_MOCK=false`에서는 제공하지 않는다.

## 동시 요청 재발급 성공

리스너는 한 번만 등록하고 끝나면 해제한다. 재발급 횟수는 1, 응답 상태는 둘 다 200이어야 한다.

```js
var reissueCount = 0;
var countReissue = ({ request }) => {
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/auth/reissue') reissueCount++;
};
devWorker.events.on('request:start', countReissue);
devExpireToken();
await Promise.all([devApi.get('/members/me'), devApi.get('/members/me/results')]);
console.log(reissueCount);
devWorker.events.removeListener('request:start', countReissue);
```

## 재시도도 인증 실패

재발급은 1번, 원래 요청은 재시도 후 실패해야 한다. 토큰이 삭제되고 종료 사유에 재로그인 안내가 남는다.

```js
devWorker.use(http.post('/api/auth/reissue', () =>
  HttpResponse.json({ success: true, data: { accessToken: 'expired' } })));
devExpireToken();
await devApi.get('/members/me').catch((e) => console.log(e.response?.status));
console.log(devAuth.getState().accessToken, devAuth.getState().logoutReason);
```

## 재발급 도중 로컬 로그아웃

재발급 핸들러에 도달했음을 확인한 뒤 로그아웃한다. 단순히 호출 직후 로그아웃하면 재발급 전 종료되어 의도한 상황을 검증하지 못한다. 토큰이 복구되지 않고 요청은 `ERR_CANCELED`로 끝나야 한다.

```js
var markStarted;
var started = new Promise((resolve) => { markStarted = resolve; });
devWorker.use(http.post('/api/auth/reissue', async () => {
  markStarted();
  await delay(1000);
  // 응답을 반환하지 않으면 뒤에 있는 원래 핸들러가 처리한다.
}));
devExpireToken();
var pending = devApi.get('/members/me').catch((e) => e.code);
await started;
await devAuth.getState().logout({ callApi: false });
console.log(await pending, devAuth.getState().accessToken);
```

## 로그아웃 API 실패

500 또는 401이어도 로컬 토큰은 삭제되고 `logoutReason`은 null이어야 한다. 401을 확인할 때는 status를 401, code를 `UNAUTHORIZED`로 바꾼다.

```js
devWorker.use(http.post('/api/auth/logout', () => HttpResponse.json(
  { success: false, error: { code: 'INTERNAL_SERVER_ERROR' } }, { status: 500 })));
await devAuth.getState().logout();
console.log(devAuth.getState().accessToken, devAuth.getState().logoutReason);
```

## 잘못된 리프레시 토큰 / 재발급 서버 장애

401에서는 토큰을 삭제한다.

```js
devAuth.setState({ refreshToken: 'bad' });
devExpireToken();
await devApi.get('/members/me').catch((e) => console.log(e.response?.status));
```

다시 준비한 뒤 500에서는 세션을 유지하고 500 오류를 전달하는지 확인한다. 네트워크 오류는 핸들러 응답을 `HttpResponse.error()`로 바꿔 확인할 수 있다.

```js
devWorker.use(http.post('/api/auth/reissue', () => HttpResponse.json(
  { success: false, error: { code: 'INTERNAL_SERVER_ERROR' } }, { status: 500 })));
devExpireToken();
await devApi.get('/members/me').catch((e) => console.log(e.response?.status));
console.log(devAuth.getState().refreshToken !== null);
```

실험을 마치면 진행 중인 요청이 모두 끝난 뒤 `devWorker.resetHandlers()`로 복원하고, 등록한 리스너를 해제한다. 보호 경로에서 `devAuth.getState().clear()`를 실행했을 때 `/login`으로 이동하는 것도 확인한다. 로그인 화면의 종료 사유 표시는 LoginPage 구현 후 검증한다.
