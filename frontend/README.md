# KDSQ 프론트엔드 (사용자 화면)

React 19 · Vite · Tailwind CSS 4 · shadcn/ui · Zustand · React Router · axios · Recharts · MSW

설계서: [`../필수제출문서/`](../필수제출문서) — 화면은 UI 설계서 3장, 컴포넌트·상태는 React 설계서를 따른다. 관리자 화면(Thymeleaf)은 백엔드 프로젝트의 `templates/`에 있다.

## 실행 방법

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

- 개발 서버는 기본으로 **Mock 모드**라 백엔드 없이 동작한다.
- **로그인 화면이 완성되기 전 테스트 로그인:** 브라우저 개발자 도구 콘솔에 `devLogin()`을 입력하면 테스트 계정(hong@test.com)으로 로그인된다. 이후 새로고침하면 `/surveys/p`, `/mypage` 같은 보호된 화면에 들어갈 수 있다. 다른 계정은 `devLogin('kim@test.com')`.
- 테스트 계정과 Mock API 동작은 [`../mock-data/README.md`](../mock-data/README.md) 참고.
- 백엔드와 연결할 때는 `frontend/.env.development.local` 파일을 만들어 `VITE_USE_MOCK=false` 한 줄을 넣고, Spring 서버(8080)를 켠 뒤 개발 서버를 다시 실행한다. `/api` 요청은 Vite 프록시가 8080으로 넘긴다. (`.local` 파일은 각자 PC에만 있고 GitHub에 올라가지 않는다)

## 폴더 구조 (React 설계서 2.3)

```text
src/
├── pages/                    # 화면 1개 = 폴더 1개
│   ├── Login/                  index.jsx + components/   (강찬식)
│   ├── Register/               index.jsx + components/   (강찬식)
│   ├── Survey/                 index.jsx + components/   (서다영, type="P" | "C")
│   ├── Result/                 index.jsx + components/   (서다영)
│   └── MyPage/                 index.jsx + components/   (강찬식)
├── components/
│   ├── layout/               UserLayout, Header, Footer
│   ├── common/               ProtectedRoute, LoadingSpinner
│   └── ui/                   shadcn/ui 컴포넌트 (npx shadcn 으로 추가)
├── store/                    authStore (+ surveyStore, resultStore, memberStore는 각 담당자가 추가)
├── api/                      axiosInstance (+ authApi, surveyApi, resultApi, memberApi)
├── types/propTypes.js        도메인 PropTypes shape (React 설계서 3.2)
├── utils/date.js             날짜 표시 (+ kdsq.js, validation.js는 각 담당자가 추가)
├── lib/utils.js              shadcn/ui 공통 유틸 (cn)
└── mocks/                    MSW Mock 데이터·핸들러
```

## 규칙

- **API 호출**은 반드시 `@/api/axiosInstance`를 사용하고 경로는 `/api` 뒤부터 쓴다 (예: `api.get('/surveys')`). `http://localhost:8080`을 직접 쓰지 않는다.
- **import 경로**는 `@/`(= `src/`)를 사용한다.
- **shadcn/ui 컴포넌트 추가:** `npx shadcn@latest add button input card` — `src/components/ui/`에 생긴다. 이미 있는 컴포넌트는 다시 추가하지 않는다.
- **Props 검증:** Props를 받는 컴포넌트는 `propTypes`를 작성한다. 도메인 객체는 `@/types/propTypes`의 shape을 쓴다.
- **파일 주인:** `package.json`, `vite.config.js`, `App.jsx`(라우터), `axiosInstance`, `authStore`는 강찬식 담당이다. 패키지 설치나 라우트 추가가 필요하면 요청한다.

## 뼈대 상태 (월요일부터 채울 부분)

| 파일 | 지금 | 완성 (담당) |
|---|---|---|
| `pages/*/index.jsx` | 제목만 있는 빈 화면 | 각 화면 (담당자) |
| `api/axiosInstance.js` | 토큰 헤더만 붙임 | 응답 인터셉터: 재발급 후 1회 재시도, 401 처리 (강찬식) |
| `store/authStore.js` | 토큰 저장·삭제 + `devLogin` | `login()`, `logout()` (강찬식) |
| `components/layout/Header.jsx` | 고정 메뉴 | 로그인 상태별 메뉴, 로그아웃, 모바일 메뉴 (강찬식) |
