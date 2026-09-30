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
