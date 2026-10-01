# 마이페이지 검증 기록

## 2026-09-30 — 1단계 API·memberStore

- 환경: Windows / Node v24.11.0 / `feature/fe-mypage`
- 기준 커밋: `afa5e8b` + 이번 작업 트리 변경 (미커밋)
- 기준 문서: `docs/2026-09-30_마이페이지_진행가이드.md`의 1단계
- 착수 시 작업 트리 깨끗함. 로컬 원격 추적 `origin/develop@364b432`의 추가 변경은 Footer·백엔드 임시 관리자 화면/문서이며 이번 API·store 변경과 겹치지 않음. 원격 fetch·병합은 수행하지 않음

### 구현 및 반환 계약

- `memberApi.getMe({ signal })`: 회원 객체 반환
- `memberApi.getMyResults({ signal })`: `page=0&size=100` 요청, `{ content, page }` 반환
- `memberApi.withdraw()`: 응답 본문을 읽지 않고 HTTP 204 여부를 boolean으로 반환
- `memberStore.fetchMe/fetchMyResults`: 유효한 응답만 저장하고 반환. 저장 직전 abort/reset이 확인되면 저장 없이 `undefined` 반환. axios 취소·실제 요청 오류는 호출자에게 그대로 전달
- `memberStore.withdraw`: 유효한 204에만 `logout({ callApi: false })`를 한 번 호출하고 `true` 반환. reset으로 무효화되거나 204가 아니면 `false`, axios 취소·실패는 그대로 전달. 화면은 `true`에만 완료 안내·이동을 실행해야 함
- 회원 데이터 persist 없음. reset 세대 하나로 늦은 응답을 차단하며, 같은 세션의 재조회 취소·화면 상태 관리는 다음 단계의 페이지가 담당
- `main.jsx`가 surveyStore/resultStore를 초기 로드해 reset 등록 보장

### 실행 결과

| 명령 | 기대 결과 | 실제 결과 |
|---|---|---|
| `npm run test:mypage` | API 계약·조회 경합·탈퇴·초기 등록 통과 | 22/22 통과 |
| `npm run test:auth` | 기존 인증 흐름 회귀 없음 | 16/16 통과 |
| `npm run test:validation` | 기존 가입 검증 회귀 없음 | 12/12 통과 |
| `npm run lint` | 새 오류·경고 없음 | 오류 0, 기존 경고 5건 |
| `npm run build` | 프로덕션 번들 생성 | 통과 |

기존 lint 경고: Button/Badge Fast Refresh 2건, Result/Survey effect 내 setState 3건. 빌드에는 기존 vite.config의 `__dirname` 관련 향후 native loader 경고가 있음

최초 테스트·빌드는 샌드박스의 `spawn EPERM` 및 연관된 native-module 로딩 오류로 실행되지 않아 승인된 권한 확장 실행으로 재검증함. 첫 마이페이지 테스트 실행에서 테스트 환경의 `window.localStorage` 누락을 발견해 fixture를 보완했고, 최종 22개 테스트는 경고 없이 통과함

### 시나리오별 확인

| 시나리오 | 기대 결과 | 실제 결과 |
|---|---|---|
| 내 정보·이력 API | 인증 헤더·signal 전달, 응답 데이터·page 메타데이터 보존 | 통과 |
| 기존 회원가입 | `skipAuth: true` 유지, body·반환값 유지 | 통과 |
| 병렬 조회 완료 순서 반전 | 두 조회가 서로 무효화하지 않음 | 두 순서 모두 통과 |
| 빈 이력 | 서버의 빈 content·page 보존 | 통과 |
| 각 조회의 500·네트워크 실패 | 원래 오류 전달, 임의 빈 이력 처리 없음 | 통과 |
| abort 후 재조회 | 이전 응답이 새 데이터를 덮지 않음 | 두 조회 모두 통과 |
| axios 응답 처리 직후 abort | 저장 직전 store 검사로 저장 차단 | 두 조회 모두 통과 |
| reset 후 늦은 성공·실패 | 데이터 복원·새 데이터 삭제 없음 | 두 조회 모두 통과 |
| clear 중 병렬 조회 | member 초기화 및 두 이전 응답 차단 | 통과 |
| 탈퇴 204 | DELETE 1회·logout(false) 1회·clear 1회·서버 logout 0회 | 통과 |
| 탈퇴 500·네트워크·204 외 응답 | 완료 안내용 true 반환·임의 로그아웃 없음 | 통과 |
| DELETE 진행 중 reset | 늦은 204가 logout하지 않고 false 반환 | 통과 |
| 이전 계정의 탈퇴 성공·실패 | 새 계정 보존, axios 취소 오류 전달 | 통과 |
| axios 세션 검사 직후 계정 변경 | reset 세대로 성공 처리 차단 | 통과 |
| 페이지 미방문 상태의 초기 등록 | member/survey/result 및 sessionStorage 임시 답변 정리 | 통과 |

`member.test.js`는 실제 API·store·인증 인터셉터에 제어 가능한 axios adapter 지연 응답을 연결한다. `mypage-startup.test.js`는 별도 프로세스에서 잔여 `result-storage`를 먼저 심고, 실제 main.jsx에 선언된 store 부수효과 import를 읽어 실행한다. 이후 실제 탈퇴 액션으로 초기화까지 검증한다

### 검증 경계와 다음 단계

1단계 통과 기준은 자동 테스트로 확인했다. 브라우저 렌더링·MSW 연속 흐름·실제 JWT/DB 서버 연결은 이번 단계에서 검증하지 않았다. 초기 등록 검증은 main의 store import 및 실제 store 실행 범위이며 브라우저에서 `/mypage` 직접 진입한 E2E 검증은 아니다

다음은 2단계: MyPage의 병렬 조회·로딩/오류·재시도·취소 제어, 읽기 전용 프로필·관리자 문의 안내·빈 상태 구현

## 2026-09-30 — 2단계 구현·검증 완료

1단계는 `2f3cbb1` (`feat: 마이페이지 API와 회원 상태 관리 구현`)로 커밋했다. 위 1단계 실행 결과는 해당 커밋에 대한 기록이며 아래 2단계 변경의 검증 결과가 아니다

2단계 구현 내용:

- MyPage에서 두 조회를 같은 AbortSignal과 `Promise.all`로 묶고 하나의 로딩·오류 상태로 표시
- 재시도·화면 이탈·StrictMode effect 정리 시 abort 및 조회 번호 무효화. 이전 success/catch/finally의 화면 상태 변경 차단
- 한 조회가 실패하면 다른 조회를 취소하고 원래 오류를 표시. axios 취소 오류는 안내에서 제외
- 서버 오류·네트워크 오류를 기존 `getErrorMessage`로 구분하고 다시 시도 버튼 연결
- ProfileCard에 이름·이메일·성별·출생년도와 현재연도 기준 나이를 조회 전용으로 표시
- ReadOnlyNotice의 관리자 문의 문구와 EmptyHistory의 검사 시작 링크(`/surveys/p`) 추가
- 페이지 title·제목 연결·마이페이지 배경 적용. 긴 값의 줄바꿈과 버튼 최소 높이 48px 지정
- 이력이 있으면 현재 단계에서는 건수만 표시. 표·모바일 카드와 차트는 3·4단계 범위

처음에는 사용자 요청으로 검증을 보류했으며, 이후 “작업 이어서 진행 후 검증까지” 요청에 따라 아래 검증을 실행했다. 2단계 변경은 `2f3cbb1` 이후 작업 트리의 미커밋 변경이다

### 최종 검사

| 검사 | 결과 |
|---|---|
| `npm run test:mypage` | 22/22 통과 (API·store·초기 reset 등록 회귀) |
| `npm run test:auth` | 16/16 통과 |
| `npm run test:validation` | 12/12 통과 |
| `npm run lint` | 오류 0, 기존 경고 5건만 유지 |
| `npm run build` | 통과, 기존 `__dirname` 관련 경고 유지 |
| `git diff --check` | 통과 |

MyPage의 effect 정리에서 ref 값을 직접 증가시켜 발생한 새 lint 경고는 해당 effect가 캡처한 조회 번호로 무효화하도록 수정했다. 첫 50개 Node 테스트 실행 뒤 제품 코드 수정은 이 정리 코드뿐이며, 수정 후 lint·build와 아래 브라우저 경합 검증을 수행했다

### 브라우저 시나리오

환경: Vite 개발 서버 `http://127.0.0.1:5175`, Codex 내장 브라우저. 실제 `/login` → `/mypage` 정상 흐름은 기존 MSW를 사용했다. 실패·경합은 `tests/mypage-browser.html`에서 실제 MyPage·UserLayout·memberStore·axios 인터셉터를 로드하고 테스트용 adapter의 응답만 제어했다. 실제 서버 요청은 하지 않았다

| 시나리오 | 실제 확인 |
|---|---|
| MSW kim 빈 이력 | 김영희·여성·1955 (71세), 총 0건, 관리자 문의 문구·빈 상태 표시 |
| MSW hong 이력 6건 | 홍길동·남성·1960 (66세), 총 6건, 빈 상태 미표시 |
| fixture 이력 1건 | 총 1건, 빈 상태 미표시 |
| 읽기 전용·문서 제목 | 수정 입력 요소 0개, `마이페이지 - MEMORY ATTACK`, 제목 연결 확인 |
| 검사 시작 링크 | 키보드 Enter로 실제 `/surveys/p` 이동 |
| 프로필 단독 500·이력 단독 500 | “정보를 불러오지 못했습니다”, 부분 프로필·빈 이력 미표시 |
| 네트워크 실패 | “네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요” 표시 |
| 오류별 재시도 | 정상 응답으로 전환 후 Enter로 다시 시도, 프로필·빈 상태 복구 |
| 두 조회 지연·하나만 완료 | 프로필이 먼저 store에 저장돼도 페이지는 로딩 유지, 둘 다 완료 후 표시 |
| 실패 시 다른 요청 취소 | 진행 중인 다른 조회 signal도 abort됨, 최초 오류 보존 |
| 재시도 뒤 늦은 프로필 성공 | 새 회원정보가 이전 응답으로 덮이지 않음 |
| 재시도 뒤 늦은 이력 실패 | 새 성공 화면이 오류 화면으로 바뀌지 않음 |
| 화면 이탈 | 두 지연 요청 모두 abort, 늦은 응답 해제 후에도 store 회원 없음 유지 |
| 재진입 | 정상 조회·프로필 복구, 마이페이지 title 복구 |
| StrictMode | 루트 StrictMode에서 조회 액션 4회 중 초기 2회 취소, 정상 요청 2개 완료·정상 표시 |
| 긴 이메일 375/768/1280px | 100자 이메일 줄바꿈, 가로 넘침 요소 0개, 문서 scrollWidth = clientWidth |
| 터치·키보드 | 검사 시작 링크 높이 48px, 검사 시작 및 오류 재시도의 Enter 동작 확인 |
| 최종 새 fixture 세션 | 단건·재시도·늦은 실패 실행 후 브라우저 warning/error 로그 0개 |
| fixture 인증 격리 | fixture 로그인 상태에서 같은 origin의 실제 `/login`을 새 탭으로 열어 로그인 폼 유지 확인, fixture 콘솔 오류 0개 |

fixture 개발 중 HMR로 root를 중복 생성하는 콘솔 경고를 발견해 root·adapter·store 액션을 HMR dispose에서 정리하도록 보완했다. 같은 origin의 앱 탭에 fixture 인증 토큰이 저장되지 않도록 fixture의 인증 persist 저장소를 메모리 전용으로 격리했다. 격리 전 HMR로 다시 로드된 앱의 Survey에서 발생한 401·세션 취소 로그는 최종 fixture 탭의 콘솔 결과와 구분한다. 테스트 종료 시 fixture 인증 상태를 비우고 viewport override와 생성한 탭을 정리했다

### 재현 방법과 남은 범위

1. `frontend`에서 `npm run dev` 실행 후 해당 포트의 `/tests/mypage-browser.html` 열기
2. 상단에서 오류 또는 지연 시나리오 선택. “다음 응답 정상으로”는 다음 요청만 정상으로 바꾸므로 화면의 “다시 시도”를 별도로 눌러야 함
3. “지연 응답 해제”로 이전 응답을 완료시켜 화면·store 유지 확인. “프로필 응답만 해제”로 Promise.all의 로딩 유지 확인
4. 종료 시 “테스트 세션 정리” 클릭. fixture는 개발 서버에서만 사용하며 운영 앱의 라우트·빌드 진입점에 연결하지 않음

2단계 통과 기준을 프론트 자동 검사와 브라우저로 확인했다. 위 50개 Node 테스트는 페이지 렌더링 테스트가 아니며, 페이지 동작은 별도의 브라우저 검증 결과다. 실제 JWT/DB 서버 통합, 3단계 이력 목록·4단계 차트·5단계 탈퇴 UI는 이번 범위에 포함하지 않았다

## 2026-09-30 — 3·4단계 검사 이력과 추이 차트

기준: `feature/fe-mypage@973ed99` 위 작업 트리. `ExamHistoryTable`, `RiskBadge`, `ExamTrendChart`, 페이지 전용 `history.js`, `formatDateOnly`와 MyPage 연결을 구현했다. MyPage가 페이지 번호를 소유하며 조회 성공 시 첫 페이지로 초기화한다. 원본 이력은 보존하고 표는 최신순 10건, 차트는 전체 이력을 오래된 순서로 사용한다

### 자동 검사

| 검사 | 결과 |
|---|---|
| `npm run test:mypage` | 31/31 통과: 기존 22개 + 정렬·페이지 경계·점수·날짜 9개 |
| `npm run lint` | 오류 0, 기존 경고 5건 유지 |
| `npm run build` | 통과, 기존 Vite `__dirname` 경고 유지 |
| `git diff --check` | 통과 |

초기 테스트·빌드는 Windows 샌드박스의 `spawn EPERM` 및 native module 로딩 오류로 실행되지 않아 권한 조정 후 위 결과를 확인했다. 인증·가입 구현은 수정하지 않아 해당 별도 테스트는 이번에 반복하지 않았다

### 브라우저 검증

환경: `http://127.0.0.1:5176`, Codex 내장 브라우저. 테스트 fixture는 실제 MyPage·Result·store·axios를 사용하며 HTTP adapter만 제어한다. 실제 앱 흐름은 기존 MSW 응답으로 별도 확인했다

| 시나리오 | 실제 결과 |
|---|---|
| 0건 | 프로필·빈 상태 유지, 차트 미렌더링 |
| 1건 | 이력 1행, P 0점 표시, 차트 점 1개 |
| 10·11건 | 10건은 1페이지, 11건은 10·1건으로 분리, 마지막 페이지 다음 버튼 비활성 |
| 동일 시각·동일 날짜 | 표는 id 보조 기준으로 고정 정렬, 차트는 같은 날짜도 서로 다른 x좌표로 유지 |
| P/C·0·null | P firstScore / C totalScore 사용, P `0 / 10점`·C `0 / 30점`·C null `-` 표시, 서버 판정 유지 |
| 페이지와 차트 독립 | 11건 중 null 3건을 제외한 점 8개가 1→2페이지 전환 후에도 유지 |
| 100건 | 10페이지, Enter로 마지막 페이지 이동, 다음 비활성, null 제외 점 67개 |
| 상세 이동·복귀 | 실제 Result `/results/1` 표시 후 검사 이력 보기로 재조회·첫 페이지 복귀 |
| 삭제된 결과 | 실제 Result에서 `RESULT_NOT_FOUND`의 “검사 결과를 찾을 수 없습니다” 표시 및 이력 복귀 |
| 툴팁 | 키보드 좌우 이동으로 날짜·검사 종류·점수/만점·판정 표시, null도 `-`로 확인 |
| 375px | 모바일 카드, 차트 시각 확인, 가로 넘침 없음, 표시된 MyPage 버튼 최소 48×48px |
| 768·1280px | 데스크톱 표 표시, 가로 넘침 없음 |
| 실제 앱 MSW | `testuser26@test.com` 로그인 후 총 23건, 같은 날 P/C·30점 표시, 3페이지 3행, 차트 점 23개 유지 |
| 브라우저 로그 | 최종 fixture 및 실제 앱 warning/error 0개 |

fixture에는 10·11·100건 및 삭제된 결과 시나리오를 추가했다. 재현은 개발 서버의 `/tests/mypage-browser.html`에서 해당 버튼을 선택하면 된다. fixture 토큰과 결과 persist는 메모리 저장소를 쓰며 실제 앱 인증과 격리했다. 종료 시 fixture 세션 정리·실제 앱 로그아웃·viewport 복원·생성 탭 정리를 수행했다

3·4단계의 프론트 통과 기준을 확인했다. 실제 JWT/DB 서버, 200% 확대, 100건 초과 서버 페이지 순회는 미검증/후속 범위이며, 5단계 본인 탈퇴 UI와 6단계 통합 검증은 아직 진행하지 않았다

## 2026-09-30 — 5단계 본인 회원 탈퇴

구현 당시 기준: `feature/fe-mypage@f897b62` 위 작업 트리. 이후 `e4fb0b2` (`feat: 마이페이지 본인 회원 탈퇴 구현`)로 커밋했다. `WithdrawButton`, `WithdrawDialog`를 추가하고 MyPage가 `isWithdrawOpen`·`isWithdrawing`·`withdrawError`를 소유하도록 연결했다. store의 `withdraw`(1단계)는 변경하지 않았다

구현 내용:

- 정상 조회된 마이페이지 하단에 “회원 탈퇴” 보조 버튼 표시. 이력 유무와 관계없이 노출
- 확인창: “탈퇴하시겠습니까?” / “탈퇴 후에는 같은 계정으로 로그인할 수 없습니다”를 Dialog 제목·설명으로 연결. 열릴 때 취소 버튼에 포커스. 탈퇴 버튼을 `DialogTrigger asChild`로 연결해 닫힌 뒤 Radix가 포커스를 복귀시키고 `aria-haspopup`·`aria-expanded`를 부여
- 처리 중: 확인·취소 버튼 비활성, “탈퇴 처리 중” 표시, `aria-busy`. ESC·바깥 클릭·onOpenChange 닫힘 차단. 상태 반영 전 연속 클릭은 ref로 차단
- 탈퇴 시작 시 진행 중 조회 번호 무효화·abort. 이미 보낸 DELETE는 취소하지 않음
- store가 `true`를 반환한 경우에만 `/login` replace + `state.message` “회원 탈퇴가 완료되었습니다”. `false`는 대화상자 오류, axios 취소 오류는 안내·이동 없음
- 실패는 `getErrorMessage(error, {}, '회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요')`로 대화상자 안에 표시하고 같은 대화상자에서 재시도

`logout({ callApi: false })`의 `clear()`가 먼저 실행되므로 ProtectedRoute가 `/login`(state `from`)으로 먼저 이동한다. 이후 MyPage의 replace가 같은 전환 배치에서 state를 완료 안내로 덮어써 LoginPage가 안내를 받는 것을 브라우저에서 확인했다 (history 기록: `from` → `message` → LoginPage 소비 후 `{}`)

### 자동 검사

| 검사 | 결과 |
|---|---|
| `npm run test:mypage` | 31/31 통과 |
| `npm run test:auth` | 16/16 통과 |
| `npm run test:validation` | 12/12 통과 |
| `npm run lint` | 오류 0, 기존 경고 5건 유지 (MyPage 경고 0) |
| `npm run build` | 통과 |
| `git diff --check` | 통과 |

탈퇴 store 액션의 204·실패·reset·계정 변경 경합은 1단계 `member.test.js`에서 검증된 범위를 재사용했다. 이번 변경은 화면 연결이므로 JSX 구조 복제 테스트는 추가하지 않고 아래 브라우저 검증으로 확인했다

### 브라우저 검증 (실제 앱 + MSW)

환경: Vite 개발 서버 `http://127.0.0.1:5180`, Claude 내장 브라우저. 요청 횟수는 `devWorker.events`의 `request:start`로 집계했고, 실패·지연 응답은 `devWorker.use(..., { once: true })`로 한 번만 덮어썼다

| 시나리오 | 실제 결과 |
|---|---|
| kim 빈 이력 + 직접 진입 | 로그인 후 `sessionStorage.result-storage`에 임시 답변을 심고 `/mypage` 전체 새로고침 진입. 프로필·빈 상태·“회원 탈퇴” 표시 |
| 확인창 접근성 | 제목·설명 aria 연결, 열림 시 포커스 “취소”, 버튼 높이 48px |
| 취소 (ESC, 키보드 Enter) | 대화상자 닫힘, 포커스 “회원 탈퇴”로 복귀, DELETE 0회 |
| DELETE 500 | 대화상자 안 “회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요”, 로그인 유지 |
| 네트워크 실패 후 재시도 | 같은 대화상자에서 재시도, “네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요”, 로그인 유지 |
| 처리 중 ESC·바깥 클릭 | 10초 지연 동안 대화상자 유지, `aria-busy=true`, 두 버튼 비활성 |
| 10초 초과 | 기존 axios timeout(10초)에 따라 네트워크 오류 문구, 로그인 유지 |
| 연속 클릭 3회 | DELETE 1회 |
| kim 204 성공 | `/login` 이동, “회원 탈퇴가 완료되었습니다” 1회 표시, 서버 logout 요청 0회, 인증 정보·logoutReason 비움, `result-storage` 임시 답변이 초기 상태로 정리 |
| 안내 일회성 | 회원가입 이동 후 뒤로 가기 시 안내 미표시 |
| 탈퇴 후 재로그인 | kim 로그인 403 `MEMBER_WITHDRAWN` |
| park 이력 1건 + 375px | 하단 탈퇴 버튼 343×48px, 대화상자 뷰포트 안, 가로 넘침 없음. 탈퇴 성공 후 로그인 화면 안내 |
| DELETE 진행 중 계정 변경 | hong의 DELETE 지연 중 kim으로 로그인 → 늦은 204 후에도 kim 로그인 유지, `/login` 이동·완료 안내 없음 |
| 콘솔 | 의도한 500·네트워크·403 리소스 오류 외 error/warning 0개 |

내장 브라우저 창이 숨겨진 동안에는 프레임이 그려지지 않아 Dialog 닫힘 애니메이션이 끝나지 않았다(`data-state=closed` 유지). 창을 표시한 뒤 정상 닫힘·포커스 복귀를 확인했으며 제품 동작 문제가 아니다

최초 구현은 제어형 Dialog에 ref를 넘겨 `onCloseAutoFocus`에서 포커스를 직접 복귀시켰다. 이후 코드 단순화를 위해 `DialogTrigger asChild` 방식으로 바꾸고 ref 전달을 제거했다. 변경 후 재검증: 탈퇴 버튼 `aria-haspopup=dialog`·`aria-expanded` 전환, 48px, 키보드 Enter로 열림·취소 포커스, ESC·취소 닫힘 후 포커스 복귀·DELETE 0회, 500 오류 표시·로그인 유지, 재시도 연속 클릭 3회에 DELETE 1회, 204 후 `/login` 완료 안내·인증 비움·`result-storage` 정리. 창이 숨겨진 상태라 재검증 탭에만 Dialog 애니메이션을 끄는 테스트 스타일을 주입했다. 테스트 31/16/12, lint 기존 경고 5건, build 통과

### 남은 범위

5단계 통과 기준을 MSW 환경에서 확인했다. 실제 JWT/DB 서버의 `DELETE /api/members/me`(WITHDRAWN 변경·refresh token 삭제·재로그인 거부)와 6단계 통합 회귀는 미진행이다

## 2026-09-30 — 6단계 Mock 통합 검증 완료, 실제 서버 검증은 후속 진행

기준: `feature/fe-mypage@e4fb0b2`. 착수 시 작업 트리는 깨끗했다. 제품 코드 변경 없이 아래 통합 검증을 수행하고 개발 서버 전용 `mypage-integration.html`·`mypage-integration.jsx`를 추가했다

### 환경과 실행 결과

- Windows / Node v24.11.0 / Vite 8.3.1 / Codex 내장 브라우저
- 실제 앱 + MSW: `http://127.0.0.1:5181`, `VITE_USE_MOCK=true`
- 인증·탈퇴 계측: `/tests/mypage-integration.html`에서 실제 `main.jsx`·App·라우터·store·MSW를 실행하고, 테스트 제어판으로 실패·지연 응답과 토큰 만료를 설정
- 조회 경합·10/11건·긴 이메일: 기존 `/tests/mypage-browser.html`의 실제 페이지·store + 제어 가능한 axios adapter 사용
- 두 fixture의 결과를 실제 JWT/DB 서버 검증으로 간주하지 않는다. 지연 탈퇴 핸들러는 204만 반환하며 실제 Mock 회원을 탈퇴시키지 않으므로 기본 MSW 탈퇴도 별도로 실행했다

| 검사 | 실제 결과 |
|---|---|
| `npm run test:mypage` | 31/31 통과 — 이번 대화의 직전 커밋 검증 결과를 동일 제품 코드에서 재사용 |
| `npm run test:auth` | 이번 통합 검증에서 16/16 통과 |
| `npm run test:validation` | 이번 통합 검증에서 12/12 통과 |
| `npm run lint` | 최종 fixture 수정 후 오류 0·기존 경고 5건, 신규 경고 없음 |
| `npm run build` | 이번 대화의 동일 제품 코드 빌드 통과 결과 재사용. 테스트 HTML은 프로덕션 엔트리에 포함되지 않음 |
| `gradlew.bat test --no-daemon` | JDK 17.0.19로 79/79 통과, 실패·오류·skip 0. DB에 연결하는 E2E 검증은 아님 |

초기 프론트 테스트·빌드의 Windows `spawn EPERM`은 권한 확장 실행으로 해소했다. 백엔드는 Gradle 관리 경로의 JDK 17을 `JAVA_HOME`으로 지정했다. 시스템 기본 Java는 26이며 시스템 설정은 변경하지 않았다

### 브라우저 통합 결과

| 시나리오 | 기대 결과 및 실제 확인 |
|---|---|
| hong 정상 | 실제 로그인 → 마이페이지, 프로필·P/C 혼합 6건·차트 점 6개 표시. 회원정보 입력칸 0개, 관리자 수정 안내 표시 |
| 상세 왕복 | 106번 상세에 9/30점과 위험 판정 표시, 검사 이력 보기로 정상 복귀 |
| 타인 결과 | hong으로 park의 `/results/201`에 직접 접근하면 “검사 결과를 찾을 수 없습니다”, 이력 복귀 가능 |
| kim 빈 상태 | 프로필·관리자 안내·검사 시작·탈퇴 표시, 차트 없음 |
| park 1건 | 이력 1건, 차트 점 1개 표시 |
| 10→11건 | 10건은 1페이지, 11건은 10·1행. Enter로 2페이지 이동, 마지막 다음 버튼 비활성 |
| 차트 독립·점수 | 11건에서 null 3건을 제외한 점 8개가 페이지 이동 후 유지. P firstScore·C totalScore, 0점·null 표시 정상, 서버 판정 유지 |
| 툴팁 키보드 | 차트 ArrowRight로 날짜·검사 종류·점수·판정 확인. null 점수는 `-` 표시 |
| 삭제된 결과 | fixture의 삭제된 상세에서 “검사 결과를 찾을 수 없습니다”, 이력 복귀 가능 |
| 개별 조회 실패 | 프로필만 500·이력만 500 모두 “정보를 불러오지 못했습니다”와 재시도. 임의 빈 상태로 처리하지 않음 |
| 네트워크 실패 | “네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요”, 정상 응답 복원 후 재시도로 프로필·빈 상태 복구 |
| 오래된 success/catch | 늦은 프로필 성공·늦은 이력 실패를 새 조회 성공 뒤 해제해도 새 화면 유지, 오류·이전 회원정보로 덮어쓰지 않음 |
| StrictMode·이탈·reset | 최초 조회 액션 4회 중 이전 2회 취소. 지연 중 검사하기로 이탈하면 요청 2건 취소, 늦은 응답 저장 없음. reset 후 지연 응답도 store를 복원하지 않음 |
| 재발급 성공 | 마이페이지 GET 2건의 401 → reissue 1회 → GET 2건 200, 프로필·6건 이력 복구 |
| 재발급 500 | 로그인 상태·기존 store 유지, 오류 화면·재시도 표시, clear 0회. 핸들러 복원 후 재시도로 복구 |
| 재발급 401 | `/login` + “다시 로그인해주세요”, clear 1회, 인증·member/survey/result 초기화 |
| 탈퇴 취소·접근성 | 열림 시 취소 포커스, ESC·Enter 취소 뒤 회원 탈퇴 버튼으로 복귀, DELETE 0회 |
| 탈퇴 실패 | 500·네트워크 오류를 Dialog 안에 표시, 로그인 유지, 다시 제출 가능 |
| 처리 중 차단 | 지연 DELETE 동안 확인·취소 비활성, aria-busy=true, ESC·바깥 클릭 후 Dialog 유지. 연속 제출은 DELETE 1회 |
| 204 성공·초기화 | `/login` 완료 안내, logout 1회·clear 1회·DELETE 1회·서버 logout 0회. 주입한 member/survey/result 및 persisted 임시 답변 초기화 |
| 안내 일회성 | 완료 안내 후 회원가입 이동·뒤로 가기 시 재표시 없음 |
| 계정 변경 | hong DELETE 중 kim 로그인, 늦은 204 이후 kim 유지·logout 0회·완료 안내 없음 |
| 실제 Mock 탈퇴 | 기본 MSW로 kim 탈퇴 후 같은 SPA 세션에서 로그인 403·“이용할 수 없는 계정입니다”. 기존 탈퇴 계정 lee도 별도 로그인 거부 확인 |
| 직접 진입 | park 로그인 상태에서 `result-storage` 임시 답변을 심고 `/mypage`를 새로고침. 이 새 문서에서 Survey·Result 방문 없이 탈퇴 성공, 이후 fixture 재수화 시 pending/persisted 답변 null·인증 없음 |
| 화면·터치 영역 | 375px 모바일 카드, 768/1280px 표, 긴 이메일 포함 가로 넘침 없음. 표시된 마이페이지 버튼 48×48px 이상. 모바일 Dialog 화면 안 표시·취소 우선 포커스·키보드 복귀 확인 |

fixture 작성 중 HMR에서 createRoot 중복 경고가 발생해 제어판 root·이벤트·store 계측의 해제 처리를 추가하고 새 문서로 다시 열었다. 최종 제어판에서 204 완료와 외부 클릭 차단을 재확인했다. 브라우저 로그에는 이전 문서의 경고가 남으므로 세션 전체 로그가 0건이라고 기록하지 않는다

### 재현과 정리

1. `VITE_USE_MOCK=true`인 개발 서버에서 `/tests/mypage-integration.html`을 연다. 앱의 로그인 화면을 사용하거나 테스트 계정 전환 버튼을 사용한다
2. 인증 재발급은 검사 화면에서 기록 초기화 → 실패 설정(필요 시) → 토큰 만료 → 마이페이지 링크 순서로 검증한다. 401 뒤에는 정상 응답 복원과 새 로그인이 필요하다
3. 탈퇴는 정상 마이페이지에서 실패/지연 설정 → 기록 초기화 → 회원 탈퇴 확인 순서다. 기본 MSW의 실제 탈퇴와 204 전용 지연 핸들러를 구분한다. 지연 응답은 최대 6초 후 자동 완료된다
4. 제어판은 Mock 전용이며 토큰·비밀번호를 출력하지 않는다. 기본 MSW 가입·탈퇴 상태는 새로고침 시 초기화된다. 같은 계정의 탈퇴 후 로그인 거부는 새로고침 전에 확인한다
5. 테스트 세션 정리 버튼으로 핸들러와 세션을 초기화한다. 직접 `/mypage` 새로고침은 제어판 없이 실제 앱만 실행하므로 직접 진입 회귀에 사용한다

### 실제 서버 검증의 차단 조건

- `localhost:8080/api/health`: 연결 거부, 실행 중인 백엔드 없음
- 문서의 MariaDB 3306은 연결 거부. 실제 로컬 MariaDB 12.3.3은 3307에서 실행 중이며 문서 기본 boot 계정의 접속은 확인
- `kdsq_db`는 boot 계정에서 조회되지 않았다. 별도 DB `kdsq_mypage_verify_20260930` 생성 시 `ERROR 1044 (42000): Access denied for user 'boot'@'localhost'` 발생. DB 생성·기존 데이터 변경은 이루어지지 않음
- 검증용 DB와 해당 DB에 대한 boot 계정 권한, 또는 사용 가능한 기존 검증용 DB 정보가 필요하다. 권한 확보 후 실행 시 datasource URL만 환경 변수로 해당 DB에 맞추고 MSW를 끈 별도 프론트 서버로 확인한다
- 미검증: 실제 JWT 로그인·재발급, DB 기반 내 정보·이력·상세·본인/활성 결과 필터, 테스트 회원 탈퇴의 WITHDRAWN 변경·refresh token 삭제·검사 이력 보존·재로그인 거부

검증 종료 시점의 판정은 **Mock/프론트 통합 통과, 실제 JWT·DB E2E 미검증**이다. 위 결과는 `e4fb0b2`의 제품 코드에 대한 기록이며 이후 develop 변경의 검증 결과가 아니다

후속 결정: 실제 서버 검증은 추후 진행하고 현재 구현·Mock 검증 내역을 커밋해 `develop` 대상 PR로 제출한다. PR 준비 시 원격 fetch로 `origin/develop@9f6a1b3`를 확인했다. develop의 추가 변경은 이 브랜치에 병합하지 않았으며, 실제 서버 통합 시 최신 기준을 다시 확인한다

## 2026-10-01 — 화면 개선 1단계: 데이터 변환·표시 규칙·날짜 유틸

기준: `feature/fe-mypage-redesign@270d9f2`, 작업 시작 시 작업 트리 깨끗함. 현재 개선 가이드의 1단계만 구현했으며 팀 조율 대상 정책은 변경하지 않았다

### 변경 파일과 동작 범위

- `src/pages/MyPage/history.js`: 기존 정렬·페이지 나누기를 유지하고 `toTrendData`에 `level`(0/1/2, 미확인 판정 null), `isLatest`, 다중 행 `label` 배열을 추가했다. 첫 점·연도 전환점만 `['4월 12일', '2026년']`, 나머지는 `['4월 12일']` 형태다. 점수 null이어도 판정 위치는 유지하며 최근 판정이 미확인이어도 이전 검사를 최근으로 바꾸지 않는다
- 같은 파일의 `getScoreDisplay`: 표의 숫자(`firstScore`, `secondScore`)·전체 표기(`firstLabel`, `secondLabel`), 알약(`scoreLabel`), 툴팁/접근성 설명(`tooltip`)을 반환한다. `examType`으로 P/C를 구분하고 P의 2차는 `—`, C의 누락 총점은 `-`, 0점은 그대로 표시한다
- `src/utils/date.js`: `formatMonthDay`, `formatKoreanDate` 추가. 누락·해석 불가능한 날짜는 기존 `formatDateOnly`와 같이 빈 문자열을 반환하고 화면의 대체 표기는 소비 컴포넌트가 담당한다
- `src/types/propTypes.js`: 가입일이 없는 경우도 허용하도록 `MemberShape.createdAt`을 선택적 문자열로 추가했다
- `tests/mypage-history.test.js`: 기존 9개 테스트를 유지하고 P/C 표시·0점·C 총점 null·판정 위치·원본 보존·최근 결과·연도 전환·한글 날짜를 검증하는 7개 테스트를 추가했다

### 검증 결과

| 검사 | 결과 |
|---|---|
| `npm run test:mypage` | 38/38 통과 (API/store/초기 등록 22개 + 이력·표시·날짜 16개) |
| `npm run lint` | 오류 0, 변경하지 않은 badge/button/Result/Survey의 기존 경고 5건 |
| `npm run build` | 통과, 기존 Vite 설정의 `__dirname` 경고 유지 |
| `git diff --check` | 통과 |

최초 테스트는 자식 프로세스 실행의 `spawn EPERM`, 최초 빌드는 같은 실행 제한과 Tailwind 네이티브 모듈 로드 오류로 실패했다. 권한 확장으로 동일 명령을 다시 실행해 모두 통과했다

### 남은 범위

이번 단계는 데이터·유틸만 변경했다. 기존 Recharts는 계속 `score`를 사용하므로 화면의 점수 차트 동작은 유지된다. 새 판정 위치·점수 알약·공통 표시 함수의 화면 연결과 실제 점 렌더링은 2~4단계에서 진행한다. 101건 범위 안내, 키보드·200% 확대·브라우저 및 실서버 검증은 이번 단계에서 실행하지 않았다. 인증·회원가입 전용 테스트는 변경 범위 밖이므로 재실행하지 않았으며 전체 회귀는 가이드 6단계에서 수행한다

## 2026-10-01 — 화면 개선 2단계: 회원 정보

1단계 변경을 `2302732` (`feat: 마이페이지 화면 개선 데이터와 표시 유틸 구현`)로 커밋한 뒤 진행했다

- `ProfileCard.jsx`: 카드 밖 “회원 정보” 제목, `aria-hidden`인 64px 이니셜 아바타, 24px 이름과 구분선, 이메일·성별·출생년도·가입일의 모바일 1열/md 2열 배치. 출생년도에 “년” 추가, 가입일은 `formatKoreanDate` 사용 및 누락 시 `-`. 항목명 16px, 정보 값 18px, 긴 값 줄바꿈
- `ReadOnlyNotice.jsx`: 기존 관리자 문의 문구·정보 아이콘·연파랑 배경을 유지하고 안내를 16px로 조정
- `mypage-browser.jsx`: 기본 fixture에 가입일 추가, “가입일 없음” 시나리오 추가. 기존 100자 이메일 시나리오 재사용

검증 환경: `http://127.0.0.1:5183/tests/mypage-browser.html`, Codex 내장 브라우저, 실제 MyPage/UserLayout/store + 테스트용 axios adapter. 실서버나 MSW 로그인 검증으로 간주하지 않는다

| 확인 | 결과 |
|---|---|
| 375px, 100자 이메일 | 1열, 이메일 여러 줄 표시, 문서 가로 넘침 0 |
| 768/1280px, 100자 이메일 | 각각 2열, 문서 가로 넘침 0 |
| 표시 내용 | 이름·성별·`1960년 (66세)`·`2024년 3월 15일`, 가입일 없음은 `-` |
| 읽기 전용 | 프로필 영역 input/textarea/select/button/contenteditable 0개 |
| 접근성·구조 | 제목은 카드 밖, section의 aria-labelledby 연결, 아바타 aria-hidden |
| 실제 크기 | 아바타 64×64px, 항목명·안내 16px, 정보 값 18px |
| 콘솔 | 검증 탭 warn/error 0개 |
| lint | 오류 0, 기존 경고 5건 |
| build / diff 검사 | 통과, 기존 Vite `__dirname` 경고 유지 |

캡처: `docs/images/mypage-step2/profile-1280.jpg` (검증용 회원 데이터). 1단계의 38개 테스트 결과는 해당 커밋에 대한 기록이며 이번 UI 변경에서 재실행하지 않았다. 200% 확대·차트 변경·전체 통합 회귀·실서버 검증은 후속 단계다. 2단계 코드·fixture·검증 기록·캡처를 함께 커밋한다

## 2026-10-01 — 화면 개선 3단계: Chart.js 검사 결과 추이

기준: `feature/fe-mypage-redesign@fd20750`, 작업 시작 시 작업 트리 깨끗함

- `ExamTrendChart.jsx`: Chart.js 4.5.1로 교체하고 필요한 6개 요소만 등록. 판정 세로축, 판정색 점(8px/hover 10px), 16px 점수 알약·날짜·최근 검사 강조, 화면 크기를 따르는 고정 HTML 판정 칩을 구현했다. 관리자 CSS는 가져오지 않고 색 값만 사용한다
- 차트 전용 컨테이너는 모바일 300px/md 이상 340px 높이, 점당 최소 96px 폭이다. 첫 표시·새 데이터에만 오른쪽으로 이동하며 페이지 변경·resize는 Chart 인스턴스와 스크롤 위치를 보존한다. 넘칠 때만 region/tabIndex/안내를 제공하고 기본 방향키·Tab을 사용한다
- 공통 `getScoreDisplay`로 알약·툴팁·canvas 요약을 표시한다. C 총점 null은 판정 위치의 점과 `-` 알약, 0은 `0점`, 알 수 없는 판정은 점·알약 없이 최근 열만 표시한다. 모바일 툴팁은 같은 문장을 여러 줄로 표시해 잘림을 막는다
- `MyPage/index.jsx`는 차트의 101건 범위 안내에 필요한 `historyMeta.totalElements` 전달만 추가했다. 표 개편과 섹션 순서 변경은 4·5단계에 남아 있다
- Recharts와 사용처가 사라진 `ui/chart.jsx`를 제거하고 package/lockfile 및 두 README의 기술 스택을 갱신했다
- `mypage-browser.jsx`에 전체 101건·응답 100건과 미확인 판정 시나리오, “차트 상태 확인”을 추가했다. `mypage-chart-inspection.js`는 Chart.getChart로 결과·점·누락 점수 알약·최근 대상·칩 위치를 관찰한다. `mypage-chart-browser.mjs`는 이를 사용하는 Chrome/CDP 검증 스크립트다

### 검증 결과

검증 서버: MSW를 켠 `http://127.0.0.1:5184`. fixture는 실제 MyPage/UserLayout/store와 테스트 adapter, 계정 검증은 실제 앱과 MSW를 사용했다. 실제 JWT·DB E2E 결과가 아니다

| 검사 | 결과 |
|---|---|
| `npm run test:mypage` | 38/38 통과 |
| `npm run lint` | 오류 0, 기존 경고 5건 |
| `npm run build` | 통과, 기존 Vite `__dirname` 경고 유지 |
| Recharts 제거 | package/lockfile/src/dist에서 `recharts` 검색 결과 0건 |
| hong/park/testuser26/kim | 각각 6/1/23/0건. 점 수 일치, 최근 대상 1개, 0건 차트 없음 |
| fixture 1/11/100건, 전체 101건·응답 100건 | 점 수 일치, 100건 C 누락 점수 알약 33개, 범위 안내·aria 요약 확인 |
| 같은 날짜·0·null·미확인 판정 | 같은 날짜 별도 점, 점 간격 96px 이상, 0 보존, null은 점 유지, 미확인 판정 점 없음 |
| 375/768/1280px | 문서 가로 넘침 0, 스크롤 밖 칩의 축 위치 오차 1px 미만 |
| 페이지·resize | 동일 Chart 인스턴스·scrollLeft 240 유지 |
| 키보드 | 넘치는 영역 focus, 기본 ArrowLeft 이동, Tab으로 이탈, 단건은 tabIndex 없음 |
| StrictMode·빈 상태 전환·상세 왕복 | 이탈 시 Chart 0개, 재진입 시 1개 |
| 모바일 툴팁 | hong/park/testuser26 날짜·문장 표시, 스크롤 뷰포트 내 좌우 경계 확인 |
| 콘솔 | 최종 자동 검증 문서들의 warning/error 0건 |

최초 설치는 npm 캐시 제한, 최초 테스트·빌드는 Windows `spawn EPERM`/네이티브 모듈 실행 제한으로 실패했다. 권한 확장 후 설치와 검증은 통과했다. 기존 5183 서버는 그대로 두고 별도 5184 서버로 검증했다

재현: MSW 개발 서버를 켠 뒤 `frontend/`에서 `node tests/mypage-chart-browser.mjs http://127.0.0.1:5184` 실행. Windows 기본 Chrome 경로를 사용하며 `CHROME_PATH`로 바꿀 수 있다. `tests/artifacts/mypage-chart/`에 JSON 결과와 375/1280px 차트·모바일 툴팁 캡처를 저장한다. 캡처에서 최근 열·날짜·알약·판정 칩과 안내 줄바꿈을 확인했다

### 남은 범위

- 4단계 이력 표·카드의 1차/2차 열과 대체 정보 완성, 5단계 차트→이력 배치가 남아 있어 현재 이력은 여전히 차트 위에 있다. canvas의 최종 안내 문구 “아래 검사 이력 참고”와 실제 배치는 5단계에서 일치하게 된다
- 실제 브라우저 200% 확대, 인증/입력 검증 전체 회귀, 탈퇴 UI 전체 회귀, 실제 JWT·DB E2E는 이번 단계에서 미검증
- 공용 UI/React 설계서의 전체 개선 반영과 통합테스트 U-33·35·36·38 재검증은 후속 단계에 남긴다. 기존 검증 기록은 이전 구현 결과로 보존한다

## 2026-10-01 화면 개선 4단계 — 검사 이력 (관리자 형식)

### 변경 파일·동작 범위

- `ExamHistoryTable.jsx`: 공통 `getScoreDisplay`를 연결해 검사일 / 1차 (KDSQ-P) / 2차 (KDSQ-C) / 위험도 / 상세 열과 동일한 모바일 카드 항목을 표시한다. 점수 숫자는 18px 굵게, 본문·페이지 상태는 16px, 보기·페이지 버튼은 48px 이상이다. P의 2차 `—`는 접근성 트리에 “2차 검사 없음”으로 제공하고 C 총점 null의 `-`, P·C 0점을 구분한다
- `RiskBadge.jsx`: 관리자 배지 색 값만 참고해 점 + 판정 글자, 둥근 연한 배경을 적용했다. 전역 관리자 CSS는 불러오지 않는다
- `MyPage/index.jsx`: 기존 제목 옆에 `historyMeta.totalElements ?? history.length` 건수를 표시하고 전체 건수가 조회 건수보다 클 때 최근 100건 안내를 표시한다. 제목이 MyPage에 있어 이 부분의 메타데이터 연결만 5단계보다 먼저 반영했다
- 페이지 번호는 계속 MyPage가 소유하고 조회된 결과를 10건씩 나눈다. 조회·탈퇴·경합 처리, 섹션 순서는 변경하지 않았다

### 검증 결과

- `npm run test:mypage`: 38/38 통과. Windows 샌드박스의 `spawn EPERM`으로 첫 실행이 막혀 권한 확장으로 재실행했다
- `npm run lint`: 오류 0, 기존 경고 5개. `npm run build` 통과 (샌드박스 네이티브 모듈·spawn 실패 후 권한 확장 재실행, 기존 Vite 설정 안내 있음)
- `node tests/mypage-history-browser.mjs`: 로컬 Vite + HTTP adapter fixture에서 실제 MyPage·store·ResultPage를 사용한 Chrome headless 검증 통과
  - 빈 이력과 총 0건, 10→11건 페이지 경계, 100건 10페이지 확인
  - 전체 101건·응답 100건: 총 101건·범위 안내, 서버 totalPages=2와 독립적인 10페이지, 100건 중복·누락 없음 확인
  - 375/768/1280px: 표·카드 항목, P 종료/C 완료, 0점/null 구분, 16px 본문·18px 점수·48px 버튼 확인. 페이지 가로 넘침 0, 데스크톱 표 내부 넘침 0
  - “2차 검사 없음”의 접근성 트리 노출, 각 폭에서 상세 `/results/:id` 왕복 확인
  - 페이지 변경 시 차트 인스턴스·가로 위치 유지, 메타데이터 누락 시 조회 건수 대체 확인
  - 브라우저 warning/error 0건. 캡처를 직접 열어 모바일 카드와 데스크톱 표 배치 확인
- 재현: `frontend/`에서 `npm run dev -- --host 127.0.0.1 --port 5184 --strictPort` 실행 후 별도 터미널에서 `node tests/mypage-history-browser.mjs`. 다른 주소는 첫 인수로 지정한다
- 결과·캡처: `tests/artifacts/mypage-history/results.json`, `history-375.png`, `history-768.png`, `history-1280.png`

### 남은 범위

- 5단계 섹션 순서·파일철 목차, 6단계 전체 회귀 및 공용 설계서·통합테스트 기대값 갱신은 미진행
- 실제 브라우저 200% 확대, 스크린리더 음성 출력, 실서버 JWT·DB E2E는 이번 단계에서 미검증. 접근성 검증은 DOM/Chrome 접근성 트리 기준이다

## 2026-10-01 5단계 전 사용자 요청 보완

### 변경 사항

- `MyPage/index.jsx`: 회원 정보 → 검사 결과 추이 → 검사 이력 → 회원 탈퇴 순서로 변경했다. 목차 구현은 후속 5단계로 남긴다
- `ExamTrendChart.jsx`: 첫 진입·새 데이터에서 최근 검사(오른쪽 끝)를 표시한다. ResizeObserver로 스크롤 영역과 차트 컨테이너의 크기가 확정될 때 위치를 맞춘다. 최근 끝을 보고 있을 때만 폭 변경 후에도 최근 끝을 유지하며, 사용자가 과거로 이동했다면 페이지 변경·화면 크기 변경 시 그 위치를 유지한다. observer·scroll listener는 effect 정리에서 해제한다
- 수정 전 재현: 11건 차트 첫 진입은 375/768/1280px 모두 최근 끝이었다. 1280→375px 전환 시 최대 스크롤은 370→890px로 늘지만 scrollLeft는 370px에 남아 최근 검사가 화면 밖으로 밀렸다. 최초 모바일 진입 자체의 오류는 이 환경에서 재현되지 않았다
- `history.js`, `ExamHistoryTable.jsx`, `MyPage/index.jsx`: md 미만은 5건, md 이상은 10건씩 표시한다. 상태 소유는 MyPage에 유지한다. md 경계 전환 때 첫 페이지로 초기화해 범위를 벗어난 모바일 페이지가 데스크톱에서 남거나 다시 되살아나는 일을 막는다. 100건은 모바일 20페이지/데스크톱 10페이지이며 전체 건수·최근 100건 안내 규칙은 유지한다
- `ProfileCard.jsx`: 모바일 항목명과 값을 같은 줄에 두고 행 간격을 줄였다. 긴 값은 값 영역에서만 줄바꿈하며 데스크톱 2열 배치는 유지한다

### 검증

- `test:mypage` 45/45 통과 (모바일 0/1/5/6/10/11/100건 페이지·원본 보존 테스트 7개 추가)
- lint 오류 0·기존 경고 5건, build 통과 (기존 Vite 설정 안내 있음)
- `node tests/mypage-adjustments-browser.mjs`: 375/768/1280px 섹션 순서·차트 첫 표시, 최근 끝에서 폭 전환, 단건→다건·새 데이터, 과거 위치에서 표 페이지·폭 전환, 모바일 5→6건 경계와 100건 20페이지 중복·누락 없음, md 전환 후 첫 페이지 확인
- `node tests/mypage-history-browser.mjs`: 모바일 5건 기준으로 보완 후 기존 표·카드 표시·0/null·접근성 트리·상세 왕복 검증 통과
- `node tests/mypage-chart-browser.mjs`: MSW hong/park/testuser26/kim, StrictMode·상세 왕복·키보드·툴팁·칩 정렬·차트 인스턴스 유지 회귀 통과
- 모바일 `hong@test.com` 한 줄, 100자 이메일 줄바꿈, 375/768/1280px 페이지 가로 넘침 0. 캡처 직접 확인. 세 브라우저 검증 모두 warning/error 0건
- 새 결과·캡처는 `tests/artifacts/mypage-adjustments/`; 기존 chart/history 캡처도 현재 화면으로 갱신했다. 로컬 Vite 5184 서버에서 세 스크립트 재현 가능

### 남은 범위

- 파일철 목차·고정·현재 영역 표시·제목 포커스 이동은 아직 구현하지 않았다
- 위 기록은 fixture/MSW 프론트엔드 검증이다. 실제 기기 브라우저·200% 확대·실서버 JWT/DB 및 공용 제출 설계서 반영은 후속 범위다

## 2026-10-01 모바일 검사 이력 카드 시안 반영 (요청 1)

- `ExamHistoryCard.jsx`를 분리하고 모바일 카드만 새 디자인으로 변경했다. 상단 검사일(한글 날짜·20px 굵게)과 위험도 배지, 같은 너비·높이의 연회색 1차/2차 점수 박스, 전체 너비의 파란색 “결과 자세히 보기” 버튼과 화살표를 배치했다
- 기존 rounded-2xl·흰 카드·연한 테두리/그림자·primary 색상을 사용했다. 좁은 화면에서 검사명은 16px 두 줄, 점수 숫자는 30px로 표시하며 넘치는 점수 단위는 줄바꿈한다. 640px 이상에서는 검사명과 약어가 한 줄로 표시된다
- 공통 `getScoreDisplay`의 P 2차 `—` 및 “2차 검사 없음” 접근성 설명, C null `-`, 0점 표시를 유지한다. 모바일 5건 페이지 나누기와 상세 경로도 유지한다
- 데스크톱 표 JSX·정렬·스타일은 변경하지 않았다. 사용자 요청 2(데스크톱 열 정렬)는 후속 작업이다
- 검증: lint 오류 0·기존 경고 5건, build 통과(기존 Vite 설정 안내 있음). `node tests/mypage-history-browser.mjs`로 320/375/640/767/768/1280px 가로 넘침 0, 모바일 점수 박스의 동일 너비·높이, 상세 버튼 전체 너비·48px, P/C/0/null 및 접근성 트리 설명, 5건 표시와 상세 왕복 확인. 브라우저 warning/error 0건
- 320·375px 캡처 직접 확인. 320px에서는 긴 점수 단위가 다음 줄로 흐르며 같은 행의 점수 박스 높이는 동일하다. 캡처·결과: `tests/artifacts/mypage-history/`
- `mypage-chart-browser.mjs`의 상세 버튼 선택자는 새 모바일 버튼 문구에 의존하지 않도록 수정했다. 이미 확인한 차트·회원 정보 전체 검증은 이번 디자인 변경에서 반복하지 않았다. 실서버·실제 스크린리더 검증은 수행하지 않았다
