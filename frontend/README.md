# KDSQ 프론트엔드 (사용자 화면)

React 19 · Vite 8 · Tailwind CSS 4 · shadcn/ui · Zustand · React Router 7 · axios · Chart.js 4 · MSW

사용자가 보는 화면(로그인·회원가입·1차/2차 검사·결과·마이페이지)이다. 관리자 화면은 Thymeleaf라서 백엔드 프로젝트의 `backend/src/main/resources/templates/`에 있다 ([`../backend/README.md`](../backend/README.md)).

설계서: [`../필수제출문서/`](../필수제출문서) — 화면은 UI 설계서 3장, 컴포넌트·상태·API 호출은 React 설계서를 따른다.

> **백엔드가 없어도 개발할 수 있다.** 개발 서버는 기본으로 Mock 모드라서, API 요청에 설계서와 같은 가짜 응답이 돌아온다. 수요일까지는 Mock으로 화면을 완성하고, 목요일에 실제 백엔드로 연결한다.

---

## 1. 준비물

| 프로그램 | 버전 | 확인 방법 |
|---|---|---|
| Node.js | **20.19 이상 또는 22.12 이상** (22 LTS 권장) | `node -v` |
| VS Code | | 추천 확장: Tailwind CSS IntelliSense, ES7+ React snippets |
| Git | | `git --version` |

Node가 낮으면 https://nodejs.org 에서 LTS를 설치하고 **터미널을 새로 연다.**

---

## 2. 처음 한 번만 하는 세팅

```bash
git clone https://github.com/ekdud01/Mini_Project_2.git   # 이미 받았다면 생략
cd Mini_Project_2
git checkout develop
git pull origin develop

cd frontend
npm install        # node_modules 설치 (1~2분)
```

## 3. 실행과 확인

```bash
cd frontend
npm run dev        # http://localhost:5173
```

1. 브라우저에서 http://localhost:5173 을 연다. 로그인 화면(뼈대)으로 이동하면 정상이다.
2. `F12` → **Console** 탭에 `[MSW] Mock 데이터 사용 중` 문구가 보이면 Mock 모드로 동작하는 것이다.
3. 콘솔에 `await devLogin()`을 입력한다.
4. 새로고침 없이 Header의 **검사하기** 링크를 눌러 보호된 화면이 열리면 세팅 끝이다.

### 로그인 화면이 완성되기 전 테스트 로그인: `devLogin()`

로그인이 필요한 화면(`/surveys/p`, `/surveys/c`, `/results/:id`, `/mypage`)은 토큰이 없으면 `/login`으로 보낸다.
로그인 화면이 완성되기 전에는 브라우저 콘솔에서 `devLogin()`으로 토큰을 받아 둔다.

```js
devLogin()                   // hong@test.com 으로 로그인 (검사 이력 6건)
devLogin('kim@test.com')     // 검사 이력 없는 계정 → 빈 상태 화면 확인용
devLogin('testuser26@test.com')  // 검사 이력 23건 → 이력 표 페이지 이동 확인용
```

로그아웃은 콘솔에서 `await devAuth.getState().logout()`을 실행한다. 서버 호출 없이 로컬 인증만 지우려면 `devAuth.getState().clear()`를 쓴다.

### Mock 테스트 계정 (비밀번호 모두 `Test1234!`)

| 이메일 | 상태 | 확인할 수 있는 것 |
|---|---|---|
| hong@test.com | 정상 | 검사 이력 6건(정상 2·주의 2·위험 2) — 마이페이지 그래프·이력 |
| kim@test.com | 정상 | 검사 이력 없음 — 빈 상태 화면 |
| lee@test.com | 탈퇴 | 로그인 시 403 `MEMBER_WITHDRAWN` 문구 |
| park@test.com | 정상 | 결과 201번 보유 — hong으로 `/results/201` 접근 시 404 |
| admin@kdsq.com (`admin1234!`) | 관리자 | 사용자 로그인 시 401 `INVALID_CREDENTIALS` |
| testuser26@test.com | 정상 | 검사 이력 23건 — 이력 표 3페이지(10·10·3), 총점 30점·같은 날 2건 |
| testuser27@test.com | 정상 | 검사 이력 11건 — 이력 표 2페이지 경계(10·1) |

그 밖의 `testuser6~25@test.com`은 이력 1~5건을 가진 일반 회원이다 (`testuser10`은 탈퇴).

Mock 데이터와 MSW 핸들러는 복사본 없이 루트의 [`../mock-data/`](../mock-data)를 직접 읽는다 (`vite.config.js`의 `@mock` 별칭). Mock이 흉내 내는 API와 규칙은 [`../mock-data/README.md`](../mock-data/README.md)에 있다.

- Mock 데이터는 새로고침하면 처음 상태로 돌아간다(가입·제출·탈퇴한 내용 초기화).
- **재발급 성공:** `await devLogin()` → `devExpireToken()` → API 호출. 새로고침하거나 주소창으로 이동하지 않고 Header 링크를 사용한다.
- **재발급 실패:** Local Storage의 `auth-storage` 값에서 `accessToken`을 `"expired"`로 바꾸고 새로고침한 뒤 API를 호출한다. MSW의 리프레시 토큰이 초기화되어 실패하는 것이 정상이다.
- 코드 수정 후 전체 새로고침이 발생했다면 성공 테스트 전에 반드시 `await devLogin()`을 다시 실행한다.
- 동시 요청·지연·실패 테스트는 [인증 검증 가이드](tests/AUTH_TESTING.md)를 따른다. `devApi`, `devAuth`, `devWorker`, `http`, `HttpResponse`, `delay`는 개발 + Mock 모드에만 노출된다.

### 실제 백엔드에 연결하기 (목요일 통합 때)

1. 백엔드를 실행한다 ([`../backend/README.md`](../backend/README.md)).
2. `frontend/.env.development.local` 파일을 만들고 한 줄을 넣는다.
   ```text
   VITE_USE_MOCK=false
   ```
3. `npm run dev`를 끄고(Ctrl+C) 다시 실행한다. 이제 `/api` 요청은 Vite 프록시를 거쳐 http://localhost:8080 으로 간다.
4. Mock으로 돌아가려면 이 파일을 지우거나 `true`로 바꾸고 다시 실행한다.

- `.local` 파일은 각자 PC에만 있고 GitHub에 올라가지 않는다.
- 실제 백엔드 모드에서는 `devLogin()`이 없다. 로그인 화면으로 로그인한다.
- 백엔드의 로그인 API(JWT)는 화요일 저녁\~수요일에 들어온다. 그 전에 실제 연결을 시험해 보려면 로그인이 필요 없는 회원가입 API부터 확인한다.

---

## 4. 개발할 때

### 4-1. 브랜치 만들고 시작하기

```bash
git checkout develop
git pull origin develop
git checkout -b feature/fe-담당기능       # 예: feature/fe-auth, feature/fe-screening-flow
```

작업 → 커밋 → `git push origin feature/fe-담당기능` → GitHub에서 PR (**base: `develop`**). 프론트 PR 검토·병합은 강찬식.
자세한 규칙은 [`../docs/개발_파트_분배.md`](../docs/개발_파트_분배.md) 5.4를 따른다.

### 4-2. 폴더 구조 (React 설계서 2.3)

```text
src/
├── pages/                     # 화면 1개 = 폴더 1개 (index.jsx + components/)
│   ├── Login/                   강찬식
│   ├── Register/                강찬식
│   ├── MyPage/                  강찬식
│   ├── Survey/                  서다영  (type="P" | "C" 하나의 페이지로 1차·2차 모두 처리)
│   └── Result/                  서다영
├── components/
│   ├── layout/                UserLayout, Header, Footer
│   ├── common/                ProtectedRoute, LoadingSpinner
│   └── ui/                    shadcn/ui 컴포넌트 (npx shadcn으로 추가)
├── store/                     authStore  (+ surveyStore·resultStore: 서다영, memberStore: 강찬식)
├── api/                       axiosInstance  (+ authApi·memberApi: 강찬식, surveyApi·resultApi: 서다영)
├── types/propTypes.js         도메인 PropTypes shape (React 설계서 3.2)
├── utils/date.js              날짜 표시  (+ kdsq.js: 서다영, validation.js: 강찬식)
├── lib/utils.js               shadcn 공통 유틸 (cn)
```

### 4-3. 라우트 (이미 연결됨, `App.jsx`)

| 주소 | 화면 | 로그인 필요 |
|---|---|---|
| `/login` | LoginPage | |
| `/register` | RegisterPage | |
| `/surveys/p` | SurveyPage `type="P"` (1차, 5문항) | O |
| `/surveys/c` | SurveyPage `type="C"` (2차, 15문항) | O |
| `/results/:resultId` | ResultPage | O |
| `/mypage` | MyPage | O |
| 그 외 | `/login`으로 이동 | |

각 페이지는 코드 스플리팅(`lazy`)으로 연결되어 있어서 `pages/화면/index.jsx`만 채우면 된다. 새 라우트가 필요하면 강찬식에게 요청한다.

### 4-4. API 호출

반드시 `@/api/axiosInstance`를 쓰고, 경로는 `/api` **뒤부터** 쓴다. `http://localhost:8080`을 직접 쓰지 않는다.
토큰 헤더(`Authorization: Bearer ...`)는 자동으로 붙는다.

```js
// src/api/surveyApi.js
import api from '@/api/axiosInstance';

export const getQuestions = (surveyId) =>
  api.get(`/surveys/${surveyId}/questions`).then((res) => res.data.data);
```

에러는 HTTP 상태가 아니라 **`error.code`**로 구분한다 (REST API 설계서 5장).

```js
try {
  await api.post('/results', body);
} catch (e) {
  const code = e.response?.data?.error?.code;
  if (code === 'KDSQ_C_REQUIRED') { /* 2차 검사로 이동 */ }
  const fields = e.response?.data?.error?.fields;   // 400 입력 검증 실패 시 [{ field, message }]
}
```

### 4-5. 공통 규칙

- **import 경로**는 `@/`(= `src/`)를 쓴다. 예: `import { formatDateTime } from '@/utils/date';`
- **Props 계약 명세:** Props를 받는 컴포넌트는 `propTypes`를 선언해 타입·필수 여부를 명세한다. React 19에서는 `propTypes` 선언만으로 자동 검사·콘솔 경고가 일어나지 않는다. 도메인 객체는 `@/types/propTypes`의 shape(`QuestionShape`, `SolutionShape`, `SurveyResultShape`, `MemberShape`, `RiskLevelType`)을 쓴다.
- **날짜 표시:** 서버는 `2026-09-24T10:30:00`으로 보낸다. 화면에는 `formatDateTime()`(→ `2026-09-24 10:30`), 그래프 축에는 `formatDate()`(→ `09.24`)를 쓴다.
- **스타일:** Tailwind 클래스로 작성한다. 색상 토큰은 `src/index.css`에 있다.
- **shadcn/ui 컴포넌트:** 설계서에 나온 컴포넌트는 이미 `src/components/ui/`에 있다. 바로 import해서 쓴다.
  - `button`, `input`, `label`, `alert`, `card`, `badge`, `table`, `progress`, `radio-group`, `dialog`, `chart`
  - 예: `import { Button } from '@/components/ui/button';`
  - 이 파일들은 되도록 고치지 않는다. 모양을 바꿀 때는 사용하는 쪽에서 `className`을 넘긴다.
  - 더 필요한 컴포넌트는 강찬식에게 요청한다. 추가 명령(`npx shadcn@latest add ...`)이 `package.json`을 바꾸기 때문이다.
  - (추가하는 사람 참고) CLI가 `import { cn } from "cn"`과 `cn` 패키지를 넣으면, `@/lib/utils`로 바꾸고 `npm uninstall cn` 한다. 마이페이지 차트는 Chart.js 4를 직접 사용하므로 shadcn chart와 Recharts 의존성을 추가하지 않는다.

### 4-6. 파일 주인

아래 파일은 여러 사람이 동시에 고치면 충돌하므로 **강찬식만 수정**한다. 패키지 설치, 라우트 추가, 인터셉터 변경이 필요하면 요청한다.

`package.json`, `package-lock.json`, `vite.config.js`, `App.jsx`, `api/axiosInstance.js`, `store/authStore.js`

### 4-7. 뼈대 상태 (채워야 할 부분)

| 파일 | 지금 | 완성 (담당) |
|---|---|---|
| `pages/*/index.jsx` | 제목만 있는 빈 화면 | 각 화면 (담당자) |
| `api/axiosInstance.js` | 토큰 부착·동시 재발급 공유·1회 재시도·이전 세션 응답 취소 구현 | 실제 JWT 통합 검증 (강찬식) |
| `store/authStore.js` | `login`, `logout`, `clear`, `reset`, 토큰 갱신·종료 사유 구현 | 각 스토어 생성 시 `reset` 연결 (아래 참고) |
| `components/layout/Header.jsx` | 고정 메뉴 | 로그인 상태별 메뉴, 로그아웃, 모바일 메뉴 (강찬식) |

### 4-8. 다른 스토어의 초기화 연결

최신 React 설계서 4.3에 따라 `authStore.clear()`는 토큰과 다른 스토어를 함께 초기화한다. 아직 없는 스토어를 import하지 않도록 `store/resetStores.js`에 생성된 스토어의 `reset`을 등록한다. `memberStore`, `surveyStore`, `resultStore` 각각 **스토어 생성 직후, 컴포넌트 밖에서** 아래 방식으로 연결한다.

```js
import { registerStoreReset } from '@/store/resetStores';

// 예: useResultStore를 생성한 다음 등록
const unregisterReset = registerStoreReset('result', () => useResultStore.getState().reset());
if (import.meta.hot) import.meta.hot.dispose(unregisterReset);
```

`reset()`은 동기적으로 상태를 초기화해야 하며, `resultStore`는 persist 대상인 `pendingFirstAnswers`도 비운다. 인증 오류/탈퇴는 `clear()`, 사용자 로그아웃은 `logout()`을 쓴다. 마이페이지 이력은 `memberStore.fetchMyResults()` 담당이다.

이전 세션의 요청은 axios 취소 오류로 종료된다. 비동기 스토어/화면의 `catch`에서는 `axios.isCancel(error)`이면 현재 화면의 오류 상태를 덮어쓰지 않는다. 재발급 5xx·네트워크 오류는 로그인 상태를 유지하며 화면에서 재시도를 제공한다.

---

## 5. 문제가 생겼을 때

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm run dev`에서 Node 버전 오류 | Node가 20.19 미만 | Node 22 LTS 설치 → 터미널 새로 열기 → `npm install` 다시 |
| `npm install` 중 `ERESOLVE` 오류 | 패키지 버전 충돌 | `package.json`을 고치지 말고 강찬식에게 공유 |
| `devLogin is not defined` | Mock이 꺼져 있음 | `.env.development.local`에 `VITE_USE_MOCK=false`가 있는지 확인, `npm run dev`로 연 5173 주소인지 확인 |
| 콘솔에 `[MSW]` 문구가 없고 API가 404 | Mock 서비스 워커가 안 뜸 | `public/mockServiceWorker.js`가 있는지 확인, 강력 새로고침(Ctrl+Shift+R) |
| `/surveys/p`가 계속 `/login`으로 감 | 토큰이 없음 | 콘솔에서 `devLogin()` → 새로고침 |
| `Port 5173 is in use` | 다른 개발 서버가 켜져 있음 | 다른 터미널의 `npm run dev`를 Ctrl+C로 끄기 (Vite가 5174로 뜨면 그 주소로 접속해도 됨) |
| import `@/...`에 빨간 줄 | VS Code가 경로 별칭을 아직 못 읽음 | VS Code 재시작 (`jsconfig.json`에 설정되어 있음) |
| 실제 백엔드 연결 시 `ECONNREFUSED` | 백엔드가 꺼져 있음 | IntelliJ에서 백엔드 실행 후 다시 시도 |
