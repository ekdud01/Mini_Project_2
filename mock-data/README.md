# KDSQ Mock 데이터

REST API 설계서(v1.10)의 요청·응답 형식을 그대로 따른 Mock 데이터입니다. 백엔드가 완성되기 전에 프론트엔드가 실제와 같은 데이터로 화면을 만들고, 백엔드는 같은 JSON을 테스트 기대값으로 쓰는 것이 목적입니다.

- 작성일: 2026-09-26
- 기준 문서: `필수제출문서/3.RESTAPI설계서_2조.md` (v1.10), `2.Entity설계서_2조.md` 13.4 초기 데이터

## 폴더 구성

```text
mock-data/
├── data/          # 메모리 DB 역할의 원본 데이터 (설문·문항·솔루션은 data.sql과 동일)
│   ├── surveys.json      설문 2개 (KDSQ-P id 1, KDSQ-C id 2)
│   ├── questions.json    문항 20개 (KDSQ-P id 1~5, KDSQ-C id 6~20, 원문)
│   ├── solutions.json    관리 안내 2개 (Borderline id 1, HighRisk id 2)
│   ├── members.json      테스트 회원 5명 (아래 표)
│   └── results.json      검사 결과 8건 (삭제된 결과·다른 회원 결과 포함)
├── requests/      # 요청 본문 예시 (Postman·테스트에 그대로 사용)
├── responses/     # API별 정상·오류 응답 예시 (파일명 = 상황.상태코드)
└── msw/           # React용 MSW 핸들러 (data/를 읽어 서버 규칙대로 동작)
    ├── handlers.js
    └── browser.js
```

## 테스트 계정

| 이메일 | 비밀번호 | 상태 | 용도 |
|---|---|---|---|
| hong@test.com | Test1234! | 정상 | 검사 이력 6건 (정상 2, 주의 2, 위험 2) — 마이페이지 그래프·이력 확인 |
| kim@test.com | Test1234! | 정상 | 검사 이력 없음 — 빈 상태 화면 확인 |
| lee@test.com | Test1234! | 탈퇴 | 로그인 시 403 `MEMBER_WITHDRAWN` |
| park@test.com | Test1234! | 정상 | 결과 id 201 보유 — 홍길동으로 `/results/201` 접근 시 404 확인 |
| admin@kdsq.com | admin1234! | 관리자 | 사용자 로그인 시 401 `INVALID_CREDENTIALS` |

> `members.json`의 `password`와 `_note`는 Mock 전용 필드입니다. 실제 API 응답에는 비밀번호가 포함되지 않습니다.

## 데이터 규칙 (서버 규칙과 동일)

- 1차(KDSQ-P) 0~3점 → Normal, 1차에서 종료 (영역별 점수·총점 `null`)
- 1차 4점 이상 → 2차(KDSQ-C)까지 완료해야 저장, 총점 0\~5 Borderline / 6\~30 HighRisk
- 영역: 기억력 1\~5번, 기타 인지기능 6\~10번, 일상생활 수행능력 11~15번
- 날짜는 한국 시간 `yyyy-MM-ddTHH:mm:ss` (Z 없음)
- 결과 id 107은 관리자가 삭제한 결과(`active: false`)라 이력·상세에서 제외

## React에서 사용하기 (MSW)

MSW는 브라우저에서 API 요청을 가로채 Mock 응답을 돌려줍니다. 화면 코드는 실제 API를 호출하는 것과 똑같이 작성하면 됩니다.

**1. 설치 및 복사**

```bash
cd frontend
npm install -D msw
npx msw init public --save          # public/mockServiceWorker.js 생성
```

이 폴더의 `data/`와 `msw/`를 `frontend/src/mocks/`로 복사합니다.

```text
frontend/src/mocks/
├── data/*.json
└── msw/handlers.js, browser.js
```

**2. 개발 모드에서만 켜기 (`src/main.jsx`)**

```jsx
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return;
  const { worker } = await import('./mocks/msw/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
});
```

**3. 켜고 끄기** — `frontend/.env.development`

```properties
VITE_USE_MOCK=true    # 백엔드 연결 시 false로 변경
```

## MSW 핸들러가 흉내 내는 동작

| API | 동작 |
|---|---|
| `POST /api/members` | 입력 검증(비밀번호 규칙 포함) → 400 `fields`, 이메일 중복 → 409 |
| `POST /api/auth/login` | 탈퇴 403, 불일치·관리자 401, 성공 시 토큰 `mock-access-token-{회원id}` |
| `POST /api/auth/reissue` | 저장된 리프레시 토큰과 같을 때만 재발급, 로그아웃 후에는 401 |
| `POST /api/auth/logout`, `DELETE /api/members/me` | 리프레시 토큰 폐기, 탈퇴 시 이후 로그인 403 |
| `GET /api/surveys`, `GET /api/surveys/{id}/questions` | `examType` 필터, 없는 설문 404 |
| `POST /api/results` | 서버와 같은 채점·판정, 1차 4점 이상 단독 제출 422 `KDSQ_C_REQUIRED`, 1차 4점 미만 + 2차 422 `KDSQ_C_NOT_ALLOWED`, 문항 수 400, 다른 설문 문항 404 |
| `GET /api/results/{id}` | 본인·활성 결과만, `solutions` 포함, 그 외 404 |
| `GET /api/members/me/results` | 본인·활성 결과 최신순, `page`·`size` 페이징 |

**토큰 만료 테스트:** 개발자 도구에서 localStorage에 저장된 `authStore`의 `accessToken` 값을 `expired`로 바꾸면 다음 요청이 401 `ACCESS_TOKEN_EXPIRED`로 응답합니다. axios 인터셉터가 재발급 후 재시도하는지 확인할 수 있습니다.

> 새로고침하면 가입·제출·탈퇴한 내용은 초기 데이터로 돌아갑니다.

## 백엔드에서 사용하기

- `responses/`의 JSON을 컨트롤러 테스트(MockMvc)의 기대 응답으로 사용합니다. `timestamp`, `id`, `createdAt`처럼 실행마다 달라지는 값은 비교에서 제외합니다.
- `requests/`의 JSON을 Postman 요청 본문으로 그대로 사용할 수 있습니다.

## 수정 규칙

API 형식이 바뀌면 **REST API 설계서를 먼저 고치고** 이 폴더를 맞춥니다. 설문·문항·솔루션을 바꾸면 Entity 설계서 13.4(data.sql)도 함께 고칩니다.
