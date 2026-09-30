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
