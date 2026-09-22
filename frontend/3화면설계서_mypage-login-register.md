# 화면 설계서 (3) — 마이페이지 · 로그인 · 회원가입

## 문서 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | KDSQ 인지선별검사 플랫폼 |
| **문서 구분** | 화면 설계서 분할 (3/3) — 회원·마이페이지 영역 |
| **대상 화면** | SCR-01 로그인 / SCR-02 회원가입 / SCR-06 마이페이지 |
| **작성일** | 2026-09-22 |
| **기준 문서** | 도메인 설계서 v1.1 (필드 명칭·판정 기준의 단일 기준) |
| **버전** | v1.1 |

### 분할 구성

| 문서 | 담당 영역 | 화면 |
| :--- | :--- | :--- |
| 화면 설계서 (1) | Admin | ADM-01 ~ ADM-06 (Thymeleaf) |
| 화면 설계서 (2) | Survey + Result | SCR-03 ~ SCR-05 |
| **화면 설계서 (3)** | **Mypage + Login + Register** | **SCR-01, SCR-02, SCR-06** |

### 본 문서에서 다루지 않는 것

전체 화면에 공통 적용되는 사항은 본 문서 범위에서 제외한다.

```text
[제외] 디자인 시스템 — 색상 팔레트, 타이포그래피, 간격, Border Radius 등 디자인 토큰
[제외] 기술 스펙   — UI 라이브러리 선정 근거, 번들링, 빌드 설정
[제외] 반응형 기준 — Breakpoint 정의 등 전역 규칙
[제외] 공통 레이아웃 — Header / Footer 자체의 설계
```

> 위 항목은 프로젝트 전역 공통 문서에서 정의하며, 본 문서는 해당 정의를 **사용하는 쪽**으로만 기술한다.

### 설계 전제 (팀 확정 사항)

| # | 항목 | 확정 내용 |
| :-- | :--- | :--- |
| 1 | 회원정보 수정 | **마이페이지에서 제공하지 않음.** 수정은 관리자(Admin) 화면에서만 수행 (관리자 권한을 명시적으로 드러내기 위함) |
| 2 | 학력 필드 | **회원가입에서 제외.** Member 엔티티에 학력 필드를 두지 않기로 확정 |
| 3 | 인증 방식 | **JWT 기반** — 액세스 토큰 + 리프레시 토큰 |
| 4 | 회원 탈퇴 | **사용자 화면 미구현.** `UserStatus.WITHDRAWN`은 엔티티에만 존재하며 관리자 화면에서 처리 |
| 5 | 로그인 필수 | 비회원 검사 플로우 없음. 검사·결과·마이페이지 전부 인증 필요 |
| 6 | 사용자 통계 | 사용자 화면에서 제외 (Admin 대시보드로 이관). 마이페이지에는 **본인 검사 추이**만 표시 |

---

# 1. STEP 1 — 페이지 목록 만들기

## 1.1 "어떤 화면이 필요한가?" 질문하기

본 영역에서 사용자가 할 수 있어야 하는 것:

* [x] 이메일·비밀번호와 최소 인구학적 정보로 **회원가입**을 한다
* [x] 이메일·비밀번호로 **로그인**한다
* [x] 로그인 실패 사유를 화면에서 확인한다
* [x] 마이페이지에서 **내 회원정보를 조회**한다 (수정 불가)
* [x] 마이페이지에서 **과거 검사 이력**을 날짜순으로 확인한다
* [x] 마이페이지에서 **검사 결과 추이(시계열 그래프)** 를 확인한다
* [x] **로그아웃**한다
* [ ] ~~회원정보를 수정한다~~ → 관리자 화면에서 처리
* [ ] ~~회원 탈퇴한다~~ → 사용자 화면 미구현

## 1.2 URL 구조 (사이트맵)

본 영역이 담당하는 라우트:

```text
React 화면 (사용자 영역)
│
├── /login                 SCR-01  로그인            [인증 불필요]
├── /register              SCR-02  회원가입          [인증 불필요]
└── /mypage                SCR-06  마이페이지        [인증 필요]

(타 영역 — 진입/이탈 연결점만 참조)
├── /surveys               SCR-03  검사 메인
└── /results               SCR-05  검사 결과
```

## 1.3 페이지 설계서 표

| 화면 ID | 페이지명 | URL | 인증 | 주요 기능 | 필요한 API |
| :--- | :--- | :--- | :-- | :--- | :--- |
| **SCR-01** | 로그인 | `/login` | X | 이메일/비밀번호 입력, JWT 발급, 회원가입 이동 | `POST /api/auth/login` |
| **SCR-02** | 회원가입 | `/register` | X | 이름/이메일/비밀번호/성별/출생년도 입력 및 등록 | `POST /api/auth/register` |
| **SCR-06** | 마이페이지 | `/mypage` | O | 회원정보 조회(읽기 전용), 검사 이력 조회, 검사 추이 그래프 | `GET /api/members/me`<br>`GET /api/exams/history` |
| (공통) | 로그아웃 | — | O | 토큰 폐기 후 `/login` 이동 | `POST /api/auth/logout` |

### 이동 조건

| 출발 | 조건 | 도착 |
| :--- | :--- | :--- |
| `/login` | 로그인 성공 | `/surveys` |
| `/login` | "회원가입하기" 클릭 | `/register` |
| `/register` | 가입 성공 | `/login` (가입 완료 안내 표시) |
| `/mypage` | Header "검사하기" 클릭 | `/surveys` |
| 모든 보호 라우트 | 토큰 없음/만료 | `/login` |

---

# 2. STEP 2 — 와이어프레임 작성

## 2.1 SCR-01 로그인

```text
┌──────────────────────────────────────────────┐
│                                              │
│                    KDSQ                      │
│              인지선별검사 플랫폼               │
│                                              │
│   이메일                                      │
│   ┌──────────────────────────────────────┐   │
│   │ example@email.com                    │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   비밀번호                                    │
│   ┌──────────────────────────────────────┐   │
│   │ ●●●●●●●●                             │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │  ⚠ 이메일 또는 비밀번호를 확인해주세요.  │   │  ← error 시에만 노출
│   └──────────────────────────────────────┘   │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │                로그인                 │   │  ← loading 시 비활성 + 스피너
│   └──────────────────────────────────────┘   │
│                                              │
│              회원가입하기 →                   │
│                                              │
└──────────────────────────────────────────────┘
```

> Header 없음. 인증 전 화면이므로 단독 중앙 정렬 카드 레이아웃.

## 2.2 SCR-02 회원가입

```text
┌──────────────────────────────────────────────┐
│                  회원가입                     │
│                                              │
│   이름 *                                      │
│   ┌──────────────────────────────────────┐   │
│   │ 홍길동                                │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   이메일 *                                    │
│   ┌──────────────────────────────────────┐   │
│   │ example@email.com                    │   │
│   └──────────────────────────────────────┘   │
│   └ 이미 가입된 이메일입니다.                   │  ← 중복 시 helperText
│                                              │
│   비밀번호 *                                  │
│   ┌──────────────────────────────────────┐   │
│   │ ●●●●●●●●                             │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   비밀번호 확인 *                              │
│   ┌──────────────────────────────────────┐   │
│   │ ●●●●●●●●                             │   │
│   └──────────────────────────────────────┘   │
│   └ 비밀번호가 일치하지 않습니다.               │
│                                              │
│   성별 *                                      │
│    ○ 남성        ○ 여성                       │
│                                              │
│   출생년도 *                                  │
│   ┌────────────┐                             │
│   │ 1960       │ 년                          │
│   └────────────┘                             │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │               회원가입                │   │
│   └──────────────────────────────────────┘   │
│                                              │
│              ← 로그인으로                     │
└──────────────────────────────────────────────┘
```

## 2.3 SCR-06 마이페이지

```text
┌─────────────────────────────────────────────────────────┐
│  KDSQ              검사하기   마이페이지   [로그아웃]      │  ← 공통 Header
├─────────────────────────────────────────────────────────┤
│                                                         │
│                      마이페이지                          │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 회원정보                                             │ │
│ │ ─────────────────────────────────────────────────── │ │
│ │  이름        홍길동                                  │ │
│ │  이메일      hong@example.com                        │ │
│ │  성별        남성                                    │ │
│ │  출생년도    1960 (만 66세)                          │ │
│ │                                                     │ │
│ │  ℹ️ 회원정보 변경이 필요하시면 관리자에게 문의해주세요.  │ │  ← ReadOnlyNotice
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 검사 이력                                     총 3건     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 검사일        검사      총점    판정      상세        │ │
│ │ ─────────────────────────────────────────────────── │ │
│ │ 2026-09-22   KDSQ-C     5     [ 주의 ]   보기 >     │ │
│ │ 2026-06-20   KDSQ-C     7     [ 위험 ]   보기 >     │ │
│ │ 2026-03-10   KDSQ-P     3     [ 정상 ]   보기 >     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                         < 1 2 3 >       │
│                                                         │
│ 검사 결과 추이                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 점수                                                 │ │
│ │  10│                                                 │ │
│ │   8│              ●────                              │ │
│ │   6│         ────╱     ╲                             │ │
│ │   4│   ●────╱           ╲────●                       │ │
│ │   2│                                                 │ │
│ │   0└──────────────────────────────────── 검사일      │ │
│ │      03-10      06-20      09-22                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 빈 상태 (검사 이력 0건)

```text
│ 검사 이력                                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │            아직 검사 이력이 없습니다.                  │ │
│ │                                                     │ │
│ │          ┌──────────────────────┐                   │ │
│ │          │   검사 시작하기 →     │                   │ │
│ │          └──────────────────────┘                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ (검사 결과 추이 섹션은 렌더링하지 않음)                     │
```

---

# 3. STEP 3 — UI 플로우 설계

## 3.1 로그인 플로우

```text
앱 진입 (/)
   ↓
authStore.isAuthenticated 확인
   │
   ├── false ──→ /login
   │               ↓
   │          이메일·비밀번호 입력
   │               ↓
   │          [로그인] 클릭 → loading = true
   │               ↓
   │          POST /api/auth/login
   │               │
   │               ├── 200 → 토큰 저장(authStore) → /surveys
   │               │
   │               ├── 401 → error: "이메일 또는 비밀번호를 확인해주세요."
   │               │
   │               └── 5xx → error: "일시적인 오류입니다. 잠시 후 다시 시도해주세요."
   │
   └── true ───→ /surveys
```

## 3.2 회원가입 플로우

```text
/login → [회원가입하기] → /register
                             ↓
                   이름·이메일·비밀번호·비밀번호확인·성별·출생년도 입력
                             ↓
                   클라이언트 유효성 검사
                             │
                             ├── 실패 → 필드별 helperText 표시 (제출 차단)
                             │
                             └── 통과 → POST /api/auth/register
                                           │
                                           ├── 201 → "가입이 완료되었습니다" → /login
                                           │
                                           ├── 409 → 이메일 필드에 "이미 가입된 이메일입니다."
                                           │
                                           └── 400 → 서버 검증 메시지를 필드에 매핑
```

## 3.3 마이페이지 진입 플로우

```text
Header [마이페이지] 클릭
   ↓
ProtectedRoute 통과 확인 (토큰 유무)
   ↓
MyPage 마운트 → loading = true
   ↓
GET /api/members/me        ─┐
GET /api/exams/history     ─┴─ 병렬 호출 (Promise.all)
   ↓
   ├── 두 요청 모두 성공
   │      ↓
   │   calcTotalScore()로 이력별 총점 합산 (서버는 영역 점수만 반환)
   │      ↓
   │   examHistory.length === 0 ?
   │      ├── Yes → ProfileCard + 빈 상태 안내 (그래프 미렌더)
   │      └── No  → ProfileCard + ExamHistoryTable + ExamTrendChart
   │
   ├── 401 → 토큰 만료 → 3.4 재발급 플로우
   │
   └── 그 외 오류 → Alert + [다시 시도] 버튼
```

## 3.4 토큰 만료 / 재발급 플로우

```text
API 응답 401 수신 (axios 응답 인터셉터)
   ↓
리프레시 토큰 보유?
   │
   ├── Yes → POST /api/auth/reissue
   │            ├── 성공 → 새 액세스 토큰 저장 → 실패했던 요청 1회 재시도
   │            └── 실패 → authStore.logout() → /login ("다시 로그인해주세요.")
   │
   └── No  → authStore.logout() → /login
```

## 3.5 로그아웃 플로우

```text
Header [로그아웃] 클릭
   ↓
POST /api/auth/logout   (서버 리프레시 토큰 폐기)
   ↓
authStore.logout()      (액세스·리프레시 토큰 및 memberStore 초기화)
   ↓
/login 으로 replace 이동 (뒤로가기로 복귀 불가)
```

> 액세스 토큰은 stateless이므로 클라이언트 삭제가 실질적인 로그아웃이며,
> 서버 호출은 리프레시 토큰 재사용을 막기 위한 것이다. API 실패 시에도 클라이언트 상태는 반드시 초기화한다.

---

# 4. 컴포넌트 아키텍처 설계

## 4.1 컴포넌트 분류 체계

본 영역이 소유하는 파일만 표기한다. (`common/`은 전역 공통 자산으로, 사용만 함)

```text
src/
├── api/
│   ├── authApi.js              login / register / logout / reissue
│   └── memberApi.js            getMe / getExamHistory
│
├── store/
│   ├── authStore.js            [소유] 인증 전역 상태
│   └── memberStore.js          [소유] 회원정보·검사이력 전역 상태
│
├── components/
│   ├── common/                 [참조] 전역 공통 — 본 문서 범위 외
│   │   ├── Header.jsx
│   │   ├── Input.jsx
│   │   ├── Button.jsx
│   │   ├── Alert.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── auth/                   [소유]
│   │   ├── LoginPage.jsx           SCR-01 페이지 컨테이너
│   │   ├── LoginForm.jsx           로그인 입력 폼
│   │   ├── RegisterPage.jsx        SCR-02 페이지 컨테이너
│   │   └── RegisterForm.jsx        회원가입 입력 폼
│   │
│   └── mypage/                 [소유]
│       ├── MyPage.jsx              SCR-06 페이지 컨테이너
│       ├── ProfileCard.jsx         회원정보 조회 카드
│       ├── ReadOnlyNotice.jsx      수정 불가 안내
│       ├── ExamHistoryTable.jsx    검사 이력 테이블
│       ├── ExamTrendChart.jsx      검사 추이 그래프
│       └── EmptyHistory.jsx        이력 0건 빈 상태
│
└── utils/
    ├── validators.js           이메일 형식·비밀번호 규칙 검사 함수
    └── examScore.js            검사 총점 산출 (프론트 합산)
```

## 4.2 컴포넌트 트리

```text
LoginPage                          RegisterPage
├── LoginForm                      ├── RegisterForm
│   ├── Input (email)              │   ├── Input (name)
│   ├── Input (password)           │   ├── Input (email)
│   ├── Alert (error)              │   ├── Input (password)
│   └── Button (submit)            │   ├── Input (passwordConfirm)
└── Link → /register               │   ├── RadioGroup (gender)
                                   │   ├── Input (birthYear)
                                   │   ├── Alert (error)
                                   │   └── Button (submit)
                                   └── Link → /login

MyPage
├── Header                         (common)
├── ProfileCard
│   └── ReadOnlyNotice
├── ExamHistoryTable               ─┐ examHistory.length > 0
│   └── RiskBadge (행별)            │
├── ExamTrendChart                 ─┘
└── EmptyHistory                    examHistory.length === 0
```

## 4.3 컴포넌트 책임 정의

단일 책임 원칙에 따라 **데이터를 가져오는 컴포넌트**와 **그리는 컴포넌트**를 분리한다.

| 컴포넌트 | 책임 | 데이터 취득 | 재사용 |
| :--- | :--- | :-- | :-- |
| `LoginPage` | 라우트 진입점, 인증 성공 후 리다이렉트 제어 | O | X |
| `LoginForm` | 입력값 관리, 클라이언트 검증, 제출 이벤트 발행 | X | X |
| `RegisterPage` | 라우트 진입점, 가입 성공 후 이동 제어 | O | X |
| `RegisterForm` | 6개 필드 입력·검증, 제출 이벤트 발행 | X | X |
| `MyPage` | 회원정보·검사이력 조회, **총점 합산**, 로딩/에러/빈 상태 분기 | O | X |
| `ProfileCard` | 회원정보 표시 (props로만 받음) | X | O |
| `ReadOnlyNotice` | 수정 불가 안내 문구 | X | O |
| `ExamHistoryTable` | 이력 목록 렌더링, 페이지네이션, 행 클릭 이벤트 발행 | X | O |
| `ExamTrendChart` | 시계열 점수 그래프 렌더링 | X | O |
| `EmptyHistory` | 이력 0건 안내 + 검사 시작 유도 | X | O |

> **안티패턴 회피**: `MyPage` 하나에서 fetch·필터링·테이블·그래프를 모두 처리하지 않는다.
> 조회는 `MyPage`가 전담하고, 하위 컴포넌트는 props만 받아 그리는 프레젠테이션 컴포넌트로 유지한다.

---

# 5. Props 설계

## 5.1 ProfileCard

```javascript
import PropTypes from 'prop-types';

ProfileCard.propTypes = {
  member: PropTypes.shape({
    name:      PropTypes.string.isRequired,
    email:     PropTypes.string.isRequired,
    gender:    PropTypes.oneOf(['MALE', 'FEMALE']).isRequired,
    birthYear: PropTypes.number.isRequired,
  }).isRequired,
  readOnly: PropTypes.bool,   // 기본값 true — 본 프로젝트에서는 항상 true
};

ProfileCard.defaultProps = {
  readOnly: true,
};
```

## 5.2 ExamHistoryTable

```javascript
ExamHistoryTable.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id:          PropTypes.number.isRequired,
      examType:    PropTypes.oneOf(['KDSQ_P', 'KDSQ_C']).isRequired,
      totalScore:  PropTypes.number.isRequired,   // MyPage에서 합산해 주입 (서버 응답 필드 아님)
      riskLevel:   PropTypes.oneOf(['Normal', 'Borderline', 'HighRisk']).isRequired,
      createdAt:   PropTypes.string.isRequired,   // ISO-8601
    })
  ).isRequired,
  page:        PropTypes.number,
  totalPages:  PropTypes.number,
  onPageChange:PropTypes.func,
  onRowClick:  PropTypes.func,   // (examResultId) => void → /results 이동
};
```

> `totalScore`는 서버가 내려주는 값이 아니라 **프론트에서 영역 점수를 합산한 파생 값**이다.
> 합산은 `MyPage`가 `calcTotalScore()`로 수행하고, 테이블은 이미 계산된 값만 받아 그린다.

## 5.3 ExamTrendChart

```javascript
ExamTrendChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date:      PropTypes.string.isRequired,   // 'YYYY-MM-DD'
      score:     PropTypes.number.isRequired,
      examType:  PropTypes.oneOf(['KDSQ_P', 'KDSQ_C']).isRequired,
    })
  ).isRequired,
  height: PropTypes.number,
};
```

## 5.4 LoginForm / RegisterForm

```javascript
LoginForm.propTypes = {
  onSubmit:  PropTypes.func.isRequired,   // ({ email, password }) => Promise
  loading:   PropTypes.bool,
  errorMessage: PropTypes.string,
};

RegisterForm.propTypes = {
  onSubmit:  PropTypes.func.isRequired,   // (formValues) => Promise
  loading:   PropTypes.bool,
  fieldErrors: PropTypes.objectOf(PropTypes.string),  // { email: '이미 가입된 이메일입니다.' }
};
```

---

# 6. 상태 관리 전략

## 6.1 로컬 상태 vs 전역 상태 구분

| 상태 | 범위 | 위치 | 사유 |
| :--- | :--- | :--- | :--- |
| `email`, `password` (로그인 입력값) | 로컬 | `LoginForm` | 해당 폼 밖에서 쓰이지 않음 |
| 회원가입 6개 입력값 | 로컬 | `RegisterForm` | 제출 후 폐기 |
| 폼 유효성 에러 | 로컬 | 각 Form | 폼 생명주기와 동일 |
| `loading`, `submitting` | 로컬 | 각 Page | 화면 단위 |
| **토큰 / 인증 여부** | **전역** | `authStore` | Header·ProtectedRoute·axios 인터셉터가 공유 |
| **회원정보 / 검사이력** | **전역** | `memberStore` | 마이페이지 재진입 시 재사용, 결과 화면과 공유 가능 |

## 6.2 authStore (Zustand)

```text
authStore
├── accessToken          string | null
├── refreshToken         string | null
├── isAuthenticated      boolean
├── setTokens(access, refresh)
├── setAccessToken(access)      // 재발급 시
└── logout()                    // 토큰 제거 + memberStore.reset()
```

```javascript
// store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemberStore } from './memberStore';

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => {
        useMemberStore.getState().reset();
        set({ accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: 'kdsq-auth' }
  )
);
```

## 6.3 memberStore (Zustand)

```text
memberStore
├── member          { name, email, gender, birthYear } | null
├── examHistory     ExamResult[]   ← 서버 응답 원본 (영역 점수만, 총점 없음)
├── loading         boolean
├── error           string | null
├── fetchMyPage()   member·examHistory 병렬 조회
└── reset()         로그아웃 시 초기화
```

```javascript
// store/memberStore.js
import { create } from 'zustand';
import { memberApi } from '../api/memberApi';

export const useMemberStore = create((set) => ({
  member: null,
  examHistory: [],
  loading: false,
  error: null,

  fetchMyPage: async () => {
    set({ loading: true, error: null });
    try {
      const [member, examHistory] = await Promise.all([
        memberApi.getMe(),
        memberApi.getExamHistory(),
      ]);
      set({ member, examHistory, loading: false });
    } catch (e) {
      set({ error: '정보를 불러오지 못했습니다.', loading: false });
    }
  },

  reset: () => set({ member: null, examHistory: [], loading: false, error: null }),
}));
```

---

# 7. 화면별 상세 명세

## 7.1 SCR-01 로그인

### 7.1.1 구성 요소

| 컴포넌트 | 역할 |
| :--- | :--- |
| `LoginPage` | 화면 컨테이너, 로그인 성공 시 `/surveys`로 이동 |
| `LoginForm` | 이메일·비밀번호 입력 |
| `Input` | 이메일(`type=email`), 비밀번호(`type=password`) |
| `Button` | 로그인 제출 (loading 시 비활성 + 스피너) |
| `Alert` | 로그인 실패 메시지 |
| `Link` | 회원가입 화면 이동 |

### 7.1.2 상태

```text
email        string
password     string
loading      boolean
error        string | null
```

### 7.1.3 API

```text
POST /api/auth/login

Request   { "email": "hong@example.com", "password": "********" }
Response  { "accessToken": "...", "refreshToken": "..." }
```

### 7.1.4 예외 상태

```text
[빈 값]          → "이메일과 비밀번호를 입력해주세요."      (제출 차단)
[이메일 형식 오류] → "올바른 이메일 형식이 아닙니다."        (제출 차단)
[401 인증 실패]   → "이메일 또는 비밀번호를 확인해주세요."
[403 탈퇴 회원]   → "이용할 수 없는 계정입니다."
[네트워크/5xx]    → "일시적인 오류입니다. 잠시 후 다시 시도해주세요."
[요청 중]        → 버튼 비활성화 + CircularProgress
```

> 보안상 "존재하지 않는 이메일"과 "비밀번호 불일치"를 구분해서 노출하지 않는다.

## 7.2 SCR-02 회원가입

### 7.2.1 입력 항목

| 항목 | 필드명 | 타입 | 필수 | 비고 |
| :--- | :--- | :--- | :-- | :--- |
| 이름 | `name` | Text | O | Member.name (환자명) |
| 이메일 | `email` | Email | O | 로그인 ID 겸용, UNIQUE |
| 비밀번호 | `password` | Password | O | 서버에서 BCrypt 암호화 |
| 비밀번호 확인 | `passwordConfirm` | Password | O | 서버 전송하지 않음 |
| 성별 | `gender` | Radio | O | `MALE` / `FEMALE` |
| 출생년도 | `birthYear` | Number | O | 4자리 |

> 학력 필드는 Member 엔티티에 존재하지 않으므로 화면에서도 제외한다.

### 7.2.2 상태

```text
form         { name, email, password, passwordConfirm, gender, birthYear }
fieldErrors  { [필드명]: 메시지 }
loading      boolean
```

### 7.2.3 API

```text
POST /api/auth/register

Request   { "name": "홍길동", "email": "hong@example.com",
            "password": "********", "gender": "MALE", "birthYear": 1960 }
Response  201 Created
```

### 7.2.4 유효성 검사

```text
□ 이름          — 공백 아님, 1~50자
□ 이메일        — 형식 일치, 최대 100자
□ 이메일 중복    — 서버 409 응답을 이메일 필드 에러로 매핑
□ 비밀번호       — 공백 아님 (규칙은 백엔드 정책 확정 후 동기화)
□ 비밀번호 확인   — password와 일치
□ 성별          — 선택됨
□ 출생년도       — 4자리 숫자, 1900 ~ 현재연도
```

### 7.2.5 예외 상태

```text
[필드 검증 실패] → 해당 TextField helperText + error 상태, 제출 차단
[409 이메일 중복] → 이메일 필드에 "이미 가입된 이메일입니다."
[400 서버 검증]   → 응답의 필드별 메시지를 fieldErrors에 매핑
[요청 중]        → 버튼 비활성화
[가입 성공]      → "가입이 완료되었습니다. 로그인해주세요." → /login
```

## 7.3 SCR-06 마이페이지

### 7.3.1 구성 요소

| 컴포넌트 | 역할 |
| :--- | :--- |
| `MyPage` | 화면 컨테이너, 데이터 조회 및 상태 분기 |
| `ProfileCard` | 이름·이메일·성별·출생년도 표시 (읽기 전용) |
| `ReadOnlyNotice` | "회원정보 변경이 필요하시면 관리자에게 문의해주세요." |
| `ExamHistoryTable` | 검사일·검사유형·총점·판정 목록 + 페이지네이션 |
| `RiskBadge` | 판정 등급 Chip (정상/주의/위험) |
| `ExamTrendChart` | 검사일 기준 총점 시계열 그래프 |
| `EmptyHistory` | 이력 0건 안내 + 검사 시작 버튼 |

### 7.3.2 상태

```text
member        Member | null
examHistory   ExamResult[]
loading       boolean
error         string | null
page          number        (로컬)
```

### 7.3.3 API

```text
GET /api/members/me
Response { "name": "홍길동", "email": "hong@example.com",
           "gender": "MALE", "birthYear": 1960 }

GET /api/exams/history
Response [
  { "id": 12, "examType": "KDSQ_C", "firstScore": 6,
    "memoryScore": 2, "otherScore": 2, "adlScore": 1,
    "riskLevel": "Borderline", "createdAt": "2026-09-22T10:00:00" },
  { "id": 8,  "examType": "KDSQ_P", "firstScore": 3,
    "memoryScore": 0, "otherScore": 0, "adlScore": 0,
    "riskLevel": "Normal", "createdAt": "2026-03-10T09:12:00" }
]
```

> 서버는 **영역별 원점수만 반환**하고 총점 필드는 내려주지 않는다.
> 총점은 프론트에서 `calcTotalScore()`로 합산한다 (7.3.5 참조).

### 7.3.4 표시 규칙

| 원본 값 | 화면 표기 |
| :--- | :--- |
| `gender: MALE / FEMALE` | 남성 / 여성 |
| `birthYear: 1960` | 1960 (만 66세) — 현재연도 − 출생년도 |
| `examType: KDSQ_P / KDSQ_C` | KDSQ-P / KDSQ-C |
| `riskLevel: Normal` | `정상` Chip |
| `riskLevel: Borderline` | `주의` Chip |
| `riskLevel: HighRisk` | `위험` Chip |
| `createdAt` | `YYYY-MM-DD` (시각 생략) |

### 7.3.5 총점 산출 규칙 (프론트 합산)

총점은 서버가 계산하지 않으므로 **프론트에서 검사 유형에 따라 합산**한다.

| 검사 유형 | 총점 | 범위 |
| :--- | :--- | :--- |
| `KDSQ_P` | `firstScore` | 0 ~ 10 |
| `KDSQ_C` | `memoryScore + otherScore + adlScore` | 0 ~ 30 |

```javascript
// utils/examScore.js
export const calcTotalScore = (exam) =>
  exam.examType === 'KDSQ_C'
    ? exam.memoryScore + exam.otherScore + exam.adlScore
    : exam.firstScore;

export const MAX_SCORE = { KDSQ_P: 10, KDSQ_C: 30 };
```

> 합산 책임은 `MyPage` 한 곳에 둔다. `ExamHistoryTable`·`ExamTrendChart`는
> 이미 계산된 `totalScore`만 받아 그리는 프레젠테이션 컴포넌트로 유지한다 (4.3 참조).

> 그래프는 두 검사의 만점 범위가 다르므로(10점 / 30점), 시리즈를 검사 유형별로 구분하거나
> Y축을 0~30으로 통일하고 마커 모양으로 유형을 구분한다.

### 7.3.6 예외 상태

```text
[로딩 중]        → Skeleton (ProfileCard / Table 자리)
[이력 0건]       → EmptyHistory ("아직 검사 이력이 없습니다." + 검사 시작하기)
[조회 실패]      → Alert(error) + [다시 시도] 버튼
[401 토큰 만료]  → 재발급 시도 후 실패 시 /login 이동
```

---

# 8. 구현 예시 (MUI)

## 8.1 LoginForm.jsx

```javascript
import React, { useState } from 'react';
import {
  Box, TextField, Button, Alert, CircularProgress, Typography, Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { isValidEmail } from '../../utils/validators';

const LoginForm = ({ onSubmit, loading, errorMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setLocalError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setLocalError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLocalError('');
    onSubmit({ email, password });
  };

  const message = localError || errorMessage;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h1" align="center" gutterBottom>
        KDSQ
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
        인지선별검사 플랫폼
      </Typography>

      <TextField
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com"
        fullWidth
        margin="normal"
        autoComplete="email"
      />

      <TextField
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
        autoComplete="current-password"
      />

      {message && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mt: 3, py: 1.5 }}
      >
        {loading ? <CircularProgress size={22} /> : '로그인'}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link component={RouterLink} to="/register" underline="hover">
          회원가입하기
        </Link>
      </Box>
    </Box>
  );
};

export default LoginForm;
```

## 8.2 LoginPage.jsx

```javascript
import React, { useState } from 'react';
import { Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError('');
    try {
      const { accessToken, refreshToken } = await authApi.login({ email, password });
      setTokens(accessToken, refreshToken);
      navigate('/surveys', { replace: true });
    } catch (e) {
      const status = e.response?.status;
      if (status === 401) setError('이메일 또는 비밀번호를 확인해주세요.');
      else if (status === 403) setError('이용할 수 없는 계정입니다.');
      else setError('일시적인 오류입니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%' }}>
        <LoginForm onSubmit={handleLogin} loading={loading} errorMessage={error} />
      </Paper>
    </Container>
  );
};

export default LoginPage;
```

## 8.3 RegisterForm.jsx

```javascript
import React, { useState } from 'react';
import {
  Box, TextField, Button, Radio, RadioGroup, FormControl, FormLabel,
  FormControlLabel, FormHelperText, CircularProgress, Typography, Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { isValidEmail } from '../../utils/validators';

const INITIAL = {
  name: '', email: '', password: '', passwordConfirm: '', gender: '', birthYear: '',
};

const RegisterForm = ({ onSubmit, loading, fieldErrors = {} }) => {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = {};
    const currentYear = new Date().getFullYear();

    if (!form.name.trim()) next.name = '이름을 입력해주세요.';
    if (!form.email) next.email = '이메일을 입력해주세요.';
    else if (!isValidEmail(form.email)) next.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.password) next.password = '비밀번호를 입력해주세요.';
    if (form.password !== form.passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.gender) next.gender = '성별을 선택해주세요.';

    const year = Number(form.birthYear);
    if (!form.birthYear) next.birthYear = '출생년도를 입력해주세요.';
    else if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      next.birthYear = `1900 ~ ${currentYear} 사이로 입력해주세요.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { passwordConfirm, ...payload } = form;
    onSubmit({ ...payload, birthYear: Number(payload.birthYear) });
  };

  // 클라이언트 검증 결과와 서버 필드 에러를 병합 (서버 우선)
  const errorOf = (field) => fieldErrors[field] || errors[field] || '';

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h2" align="center" sx={{ mb: 4 }}>
        회원가입
      </Typography>

      <TextField
        label="이름" value={form.name} onChange={handleChange('name')}
        error={!!errorOf('name')} helperText={errorOf('name')}
        fullWidth margin="normal" required
      />

      <TextField
        label="이메일" type="email" value={form.email} onChange={handleChange('email')}
        error={!!errorOf('email')} helperText={errorOf('email')}
        fullWidth margin="normal" required
      />

      <TextField
        label="비밀번호" type="password" value={form.password} onChange={handleChange('password')}
        error={!!errorOf('password')} helperText={errorOf('password')}
        fullWidth margin="normal" required autoComplete="new-password"
      />

      <TextField
        label="비밀번호 확인" type="password"
        value={form.passwordConfirm} onChange={handleChange('passwordConfirm')}
        error={!!errorOf('passwordConfirm')} helperText={errorOf('passwordConfirm')}
        fullWidth margin="normal" required autoComplete="new-password"
      />

      <FormControl margin="normal" error={!!errorOf('gender')} required>
        <FormLabel>성별</FormLabel>
        <RadioGroup row value={form.gender} onChange={handleChange('gender')}>
          <FormControlLabel value="MALE" control={<Radio />} label="남성" />
          <FormControlLabel value="FEMALE" control={<Radio />} label="여성" />
        </RadioGroup>
        {errorOf('gender') && <FormHelperText>{errorOf('gender')}</FormHelperText>}
      </FormControl>

      <TextField
        label="출생년도" type="number" value={form.birthYear} onChange={handleChange('birthYear')}
        error={!!errorOf('birthYear')} helperText={errorOf('birthYear') || '예: 1960'}
        fullWidth margin="normal" required
      />

      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 3, py: 1.5 }}>
        {loading ? <CircularProgress size={22} /> : '회원가입'}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" underline="hover">
          로그인으로
        </Link>
      </Box>
    </Box>
  );
};

export default RegisterForm;
```

## 8.4 MyPage.jsx

```javascript
import React, { useEffect, useMemo } from 'react';
import { Container, Typography, Alert, Button, Skeleton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import ProfileCard from './ProfileCard';
import ExamHistoryTable from './ExamHistoryTable';
import ExamTrendChart from './ExamTrendChart';
import EmptyHistory from './EmptyHistory';
import { useMemberStore } from '../../store/memberStore';
import { calcTotalScore } from '../../utils/examScore';

const MyPage = () => {
  const navigate = useNavigate();
  const { member, examHistory, loading, error, fetchMyPage } = useMemberStore();

  useEffect(() => {
    fetchMyPage();
  }, [fetchMyPage]);

  // 서버는 영역 점수만 내려주므로 총점은 여기서 한 번만 합산한다
  const scoredHistory = useMemo(
    () => examHistory.map((exam) => ({ ...exam, totalScore: calcTotalScore(exam) })),
    [examHistory]
  );

  const trendData = scoredHistory.map((exam) => ({
    date: exam.createdAt.slice(0, 10),
    score: exam.totalScore,
    examType: exam.examType,
  }));

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h2" align="center" sx={{ mb: 4 }}>
          마이페이지
        </Typography>

        {error && (
          <Alert
            severity="error"
            action={<Button onClick={fetchMyPage}>다시 시도</Button>}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" height={240} />
          </>
        ) : (
          <>
            {member && <ProfileCard member={member} />}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>
                검사 이력
              </Typography>

              {scoredHistory.length === 0 ? (
                <EmptyHistory onStart={() => navigate('/surveys')} />
              ) : (
                <>
                  <ExamHistoryTable
                    history={scoredHistory}
                    onRowClick={(id) => navigate(`/results?examResultId=${id}`)}
                  />
                  <Typography variant="h3" sx={{ mt: 4, mb: 2 }}>
                    검사 결과 추이
                  </Typography>
                  <ExamTrendChart data={trendData} />
                </>
              )}
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default MyPage;
```

## 8.5 ProfileCard.jsx

```javascript
import React from 'react';
import { Card, CardContent, Typography, Grid, Divider } from '@mui/material';
import ReadOnlyNotice from './ReadOnlyNotice';

const GENDER_LABEL = { MALE: '남성', FEMALE: '여성' };

const Row = ({ label, value }) => (
  <>
    <Grid item xs={4}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Grid>
    <Grid item xs={8}>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  </>
);

const ProfileCard = ({ member }) => {
  const age = new Date().getFullYear() - member.birthYear;

  return (
    <Card>
      <CardContent>
        <Typography variant="h3" gutterBottom>회원정보</Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1.5}>
          <Row label="이름"     value={member.name} />
          <Row label="이메일"   value={member.email} />
          <Row label="성별"     value={GENDER_LABEL[member.gender]} />
          <Row label="출생년도" value={`${member.birthYear} (만 ${age}세)`} />
        </Grid>

        <ReadOnlyNotice />
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
```

## 8.6 ExamHistoryTable.jsx

```javascript
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button,
} from '@mui/material';

const EXAM_LABEL = { KDSQ_P: 'KDSQ-P', KDSQ_C: 'KDSQ-C' };

const RISK = {
  Normal:     { label: '정상', color: 'success' },
  Borderline: { label: '주의', color: 'warning' },
  HighRisk:   { label: '위험', color: 'error' },
};

// history의 totalScore는 MyPage에서 합산해 주입된 값이다 (7.3.5 참조)
const ExamHistoryTable = ({ history, onRowClick }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>검사일</TableCell>
          <TableCell>검사</TableCell>
          <TableCell align="right">총점</TableCell>
          <TableCell align="center">판정</TableCell>
          <TableCell align="right">상세</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {history.map((exam) => {
          const risk = RISK[exam.riskLevel];
          return (
            <TableRow key={exam.id} hover>
              <TableCell>{exam.createdAt.slice(0, 10)}</TableCell>
              <TableCell>{EXAM_LABEL[exam.examType]}</TableCell>
              <TableCell align="right">{exam.totalScore}</TableCell>
              <TableCell align="center">
                <Chip label={risk.label} color={risk.color} size="small" />
              </TableCell>
              <TableCell align="right">
                <Button size="small" onClick={() => onRowClick(exam.id)}>보기</Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default ExamHistoryTable;
```

---

# 9. 라우팅 및 접근 제어

## 9.1 라우팅 정의

```jsx
<Routes>
  {/* 인증 불필요 */}
  <Route path="/login"    element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* 인증 필요 */}
  <Route
    path="/mypage"
    element={
      <ProtectedRoute>
        <MyPage />
      </ProtectedRoute>
    }
  />

  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
```

## 9.2 ProtectedRoute 동작

```text
authStore.isAuthenticated === true  → children 렌더링
authStore.isAuthenticated === false → <Navigate to="/login" replace />
```

> `replace`를 사용해 뒤로가기로 보호 화면에 되돌아가지 못하게 한다.

## 9.3 Axios 인터셉터 (토큰 처리)

```javascript
// api/client.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const client = axios.create({ baseURL: '/api' });

// 요청: 액세스 토큰 자동 첨부
client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// 응답: 401 → 리프레시 토큰으로 1회 재발급 후 원요청 재시도
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/auth/reissue', { refreshToken });
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(original);
      } catch {
        logout();
        window.location.replace('/login');
      }
    }

    if (error.response?.status === 401) {
      logout();
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);
```

---

# 10. API - 화면 매핑

| 화면 | Method | Endpoint | 용도 | 인증 |
| :--- | :--- | :--- | :--- | :-- |
| SCR-01 로그인 | POST | `/api/auth/login` | 로그인, 토큰 발급 | X |
| SCR-02 회원가입 | POST | `/api/auth/register` | 회원 등록 | X |
| 공통 (Header) | POST | `/api/auth/logout` | 리프레시 토큰 폐기 | O |
| 공통 (인터셉터) | POST | `/api/auth/reissue` | 액세스 토큰 재발급 | X (리프레시 토큰) |
| SCR-06 마이페이지 | GET | `/api/members/me` | 회원정보 조회 | O |
| SCR-06 마이페이지 | GET | `/api/exams/history` | 검사 이력 조회 | O |

---

# 11. 구현 우선순위

## 1단계 — 정적 화면

```text
□ LoginPage / LoginForm 레이아웃
□ RegisterPage / RegisterForm 레이아웃
□ MyPage 레이아웃 (ProfileCard / ExamHistoryTable / ExamTrendChart 뼈대)
□ 더미 데이터로 렌더링 확인
```

## 2단계 — 상태 연결

```text
□ 폼 로컬 상태 및 클라이언트 유효성 검사
□ authStore / memberStore 구성
□ 필드별 에러 메시지 표시
```

## 3단계 — API 연결

```text
□ axios client + 요청 인터셉터 (토큰 첨부)
□ authApi.login / register / logout
□ memberApi.getMe / getExamHistory
□ calcTotalScore() 총점 합산 적용 (utils/examScore.js)
□ 로그인 성공 → /surveys 이동
□ 가입 성공 → /login 이동
```

## 4단계 — 접근 제어

```text
□ ProtectedRoute 적용
□ 응답 인터셉터 (401 → 재발급 → 재시도 → 실패 시 로그아웃)
□ 로그아웃 동작
```

## 5단계 — 예외 및 상태 표현

```text
□ 로딩 상태 (버튼 비활성 / Skeleton)
□ 에러 Alert 및 다시 시도
□ 검사 이력 0건 빈 상태
□ 서버 에러(409/400) 필드 매핑
```

---

# 12. 체크리스트

## 로그인 (SCR-01)

```text
□ 이메일·비밀번호 입력 및 제출
□ 빈 값 / 형식 오류 시 제출 차단
□ 401 응답 시 실패 메시지 노출
□ 요청 중 버튼 비활성화 + 스피너
□ 성공 시 토큰 저장 후 /surveys 이동
□ 회원가입 링크 동작
```

## 회원가입 (SCR-02)

```text
□ 6개 필드 입력 (학력 필드 없음)
□ 필드별 유효성 검사 및 helperText
□ 비밀번호 확인 일치 검사
□ 이메일 중복(409) 필드 에러 매핑
□ passwordConfirm은 서버로 전송하지 않음
□ 성공 시 안내 후 /login 이동
```

## 마이페이지 (SCR-06)

```text
□ 회원정보 조회 표시 (이름/이메일/성별/출생년도)
□ 수정 폼 없음 + ReadOnlyNotice 노출
□ 총점 프론트 합산 (KDSQ-P: firstScore / KDSQ-C: memory+other+adl)
□ 검사 이력 테이블 (검사일/검사/총점/판정)
□ 판정 Chip 색상 구분 (정상/주의/위험)
□ 검사 추이 그래프
□ 이력 0건 빈 상태 + 검사 시작 유도
□ 로딩 Skeleton / 에러 Alert
□ 비로그인 접근 시 /login 리다이렉트
```

---

# 13. 확인이 필요한 사항 (Open Items)

| # | 항목 | 현재 설계 | 확인 필요 내용 |
| :-- | :--- | :--- | :--- |
| 1 | **검사 상세 이동 경로** | `/results?examResultId={id}` (잠정) | **미정.** 결과 화면(SCR-05)을 쿼리 파라미터로 재사용할지, `/results/{id}` 형태의 별도 라우트를 둘지 결정 필요. 이력에서 진입한 경우 "방금 검사한 결과"와 "과거 결과"의 화면 구성이 같아도 되는지도 함께 논의 |
| 2 | 검사 이력 페이징 | 화면에 페이지네이션 배치 | `GET /api/exams/history`가 Page 객체를 반환하는지, 전체 배열인지 확정 필요 |
| 3 | 비밀번호 정책 | 공백 여부만 검사 | 백엔드 정책(길이·문자 조합) 확정 후 클라이언트 검증 동기화 |
| 4 | 리프레시 토큰 저장 위치 | `localStorage` (Zustand persist) | 보안 강화 시 httpOnly 쿠키 검토 — 백엔드 구현 방식과 함께 결정 |
| 5 | 로그아웃 API | `POST /api/auth/logout` 포함 | 서버가 리프레시 토큰 블랙리스트를 두지 않는다면 클라이언트 삭제만으로 대체 가능 |

## 13.1 해소된 항목 (팀 확정)

| 항목 | 확정 내용 |
| :--- | :--- |
| 1차 검사 점수 필드명 | **`firstScore`로 통일.** 도메인 설계서를 기준 문서로 삼는다 (Entity 설계서의 `pScore`는 도메인 설계서에 맞춰 수정 필요) |
| 총점 산출 위치 | **프론트 합산.** 서버는 영역별 원점수(`firstScore`, `memoryScore`, `otherScore`, `adlScore`)만 반환하고, 프론트가 `calcTotalScore()`로 계산한다 |
```
