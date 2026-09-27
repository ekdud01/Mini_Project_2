# KDSQ 백엔드

Spring Boot 4.0.8 · Java 17 · MariaDB 10.11 · Spring Data JPA · Spring Security · Thymeleaf(관리자 화면)

사용자 화면(React)이 부르는 REST API(`/api/**`)와 관리자 화면(`/admin/**`, Thymeleaf)을 한 서버에서 제공한다.
설계서는 [`../필수제출문서/`](../필수제출문서)에 있다. 패키지 구조는 Entity 설계서 1.4, 설정은 14장, 응답·에러 형식은 REST API 설계서 2.5·5장을 따른다.

> **누가 이 문서대로 세팅하나요?** 백엔드(윤수연·이주혁·이원구)와 관리자 화면(황지영, 템플릿이 이 프로젝트 안에 있음)은 전부 따라 한다. 프론트엔드(강찬식·서다영)는 목요일 통합 전까지만 해 두면 된다.

---

## 1. 준비물

| 프로그램 | 버전 | 확인 방법 |
|---|---|---|
| JDK | **17** | 명령 프롬프트에서 `java -version` → `17.x.x` |
| MariaDB | 10.11 (실습 때 설치한 것) | 시작 메뉴에 "MariaDB 10.11" 폴더가 있으면 됨 |
| IntelliJ IDEA | Community(무료) 가능 | |
| VS Code + 확장 **REST Client** | 제작자 Huachao Mao | API 테스트용 (`backend/http/*.http` 실행) |
| Git | | `git --version` |

> IntelliJ 무료판은 `.http` 파일을 실행하지 못한다. API 테스트는 VS Code의 REST Client나 Postman을 쓴다.

---

## 2. 처음 한 번만 하는 세팅

### 2-1. 코드 받기 (Git Bash)

```bash
git clone https://github.com/ekdud01/Mini_Project_2.git   # 이미 받았다면 생략
cd Mini_Project_2
git checkout develop
git pull origin develop
```

### 2-2. DB 만들기 (MariaDB)

시작 메뉴 → MariaDB 10.11 → **Command Prompt (MariaDB 10.11 (x64))**를 열고 root로 접속한다.

```bat
mysql -u root -p
```

비밀번호를 입력해 `MariaDB [(none)]>`가 나오면 아래를 한 줄씩 실행한다.

```sql
CREATE DATABASE kdsq_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 실습 때 만든 boot 계정의 host 값 확인 (% 또는 localhost)
SELECT user, host FROM mysql.user WHERE user = 'boot';

-- 위에서 본 host로 바꿔 입력 (예: 'boot'@'localhost')
GRANT ALL PRIVILEGES ON kdsq_db.* TO 'boot'@'%';
FLUSH PRIVILEGES;
exit
```

- 테이블은 만들 필요 없다. 서버를 처음 실행할 때 자동으로 생긴다.
- `boot` 계정이 없으면(위 SELECT 결과가 비어 있으면) 다음 단계에서 root 계정을 쓰면 된다.

### 2-3. 내 DB 계정 설정 (계정이 `boot / boot`가 아닐 때만)

서버의 기본 DB 계정은 실습 환경과 같은 `boot / boot`이다. 다른 계정(예: root)을 쓰면 아래 파일을 **새로 만들고** 두 줄만 넣는다.

`backend/src/main/resources/application-local.properties`

```properties
spring.datasource.username=root
spring.datasource.password=내비밀번호
```

- 이 파일은 `.gitignore`에 등록되어 있어 GitHub에 올라가지 않는다. 비밀번호가 올라갈 걱정이 없다.
- 서버는 이 파일이 있으면 여기 적힌 값을 우선으로 쓴다.
- **`application.properties`에 직접 비밀번호를 적지 않는다.** 그 파일은 팀 공용이라 커밋되면 모두의 설정이 바뀐다.

### 2-4. IntelliJ로 열기

1. `File → Open` → 프로젝트 루트가 아니라 **`backend` 폴더**를 선택한다.
2. 오른쪽 아래 Gradle 동기화(진행 막대)가 끝날 때까지 기다린다. 처음에는 몇 분 걸린다.
3. `File → Settings → Build, Execution, Deployment → Build Tools → Gradle` → **Gradle JVM**을 17로 맞춘다.
4. `File → Project Structure → Project → SDK`도 17로 맞춘다.
5. **꼭 할 것:** `File → Settings → Editor → File Encodings` → 맨 아래 **Default encoding for properties files**를 `UTF-8`로 바꾼다.
   - 안 바꾸면 `application.properties`의 한글 주석이 `ì¸ì§...`처럼 깨져 보이고, 그 상태로 저장하면 파일이 실제로 깨진다.
   - 이미 깨져 보인다면 오른쪽 아래 인코딩 표시(`ISO-8859-1`)를 클릭 → `UTF-8` → **Reload**를 누른다. (**Convert**를 누르면 파일이 망가진다)

---

## 3. 실행과 확인

### 3-1. 실행

IntelliJ에서 `src/main/java/com/kdsq/KdsqApplication.java`를 열고 `main` 옆 ▶ 버튼을 누른다.
(터미널에서는 `cd backend` 후 `gradlew.bat bootRun`)

실행 로그에 아래 두 줄이 보이면 성공이다.

```text
관리자 계정을 등록했습니다: admin@kdsq.com     ← 처음 실행할 때만 나온다
Started KdsqApplication in ... seconds
```

> `Using generated security password: ...` 경고는 보안 설정이 아직 임시본이라 나오는 것이다. 무시해도 된다.

### 3-2. 브라우저로 확인

| 주소 | 기대 결과 |
|---|---|
| http://localhost:8080/api/health | `{"success":true,"data":{"status":"UP"},"message":"서버가 정상 동작 중입니다",...}` |
| http://localhost:8080/admin/preview | 관리자 레이아웃(헤더·사이드바·푸터) 확인용 페이지 |
| http://localhost:8080/admin/login | 관리자 로그인 폼 (로그인 처리는 보안 설정 정식본이 들어오면 동작) |

DB 도구(HeidiSQL 등)나 `mysql` 명령창에서 `USE kdsq_db; SHOW TABLES;`를 실행하면 테이블 6개가 보여야 한다.
`members`, `surveys`, `questions`, `survey_results`, `solutions`, `refresh_tokens`

### 3-3. 테스트 회원 만들기 (한 번만)

1. VS Code에서 `backend/http/member.http`를 연다.
2. 첫 번째 요청(회원가입) 위의 **Send Request**를 누른다.
3. 오른쪽에 `HTTP/1.1 201`과 `"id": 2`가 나오면 준비 끝이다.

왜 2번인지는 아래 "4-3. 로그인 회원 id"를 본다.

**테스트 계정**

| 이메일 | 비밀번호 | id | 용도 |
|---|---|---|---|
| admin@kdsq.com | admin1234! | 1 | 관리자. 서버 시작 시 자동 등록 |
| hong@test.com | Test1234! | 2 | 사용자 API 테스트용. `member.http` 첫 요청으로 가입 |

---

## 4. 개발할 때

### 4-1. 브랜치 만들고 시작하기

```bash
git checkout develop
git pull origin develop
git checkout -b feature/be-담당기능       # 예: feature/be-survey-result, feature/be-admin-member
```

작업 → 커밋 → `git push origin feature/be-담당기능` → GitHub에서 PR (**base: `develop`**).
자세한 규칙은 [`../docs/개발_파트_분배.md`](../docs/개발_파트_분배.md) 5.4를 따른다.

### 4-2. 패키지 구조와 코드 위치

```text
com.kdsq
├── member/    회원 — Member·enum, MemberRepository, MemberService, MemberController, dto/   (완성, 참고용 예시)
├── auth/      인증 — RefreshToken, RefreshTokenRepository                                    (+ 로그인·JWT: 윤수연)
├── survey/    설문 — Survey, Question, ExamType                                              (+ 설문 API: 이주혁)
├── result/    결과 — SurveyResult, Solution, RiskLevel                                       (+ 결과 API·채점: 이주혁)
├── admin/     관리자 화면 컨트롤러·서비스                                                    (회원·결과: 이원구 / 대시보드: 윤수연)
└── global/
    ├── common/      BaseEntity, ApiResponse, PageResponse, HealthController
    ├── config/      SecurityConfig(임시), JpaAuditingConfig, WebConfig, ThymeleafConfig
    ├── security/    SecurityUtil(임시)
    ├── exception/   ErrorCode, BusinessException, ErrorResponse, FieldErrorDto, GlobalExceptionHandler
    ├── init/        AdminInitializer (관리자 계정 자동 등록)
    └── validation/  NotFutureYear (올해 이후 연도 금지 검증)

src/main/resources
├── application.properties        공통 설정 (파일 주인: 윤수연)
├── application-local.properties  내 PC 전용 DB 계정 (직접 만듦, GitHub에 안 올라감)
├── data.sql                      설문·문항·솔루션 초기 데이터 (이주혁)
├── templates/                    Thymeleaf 템플릿 (황지영)
└── static/                       admin.css, admin.js (황지영)
```

- Repository·Service·Controller는 기능 패키지 바로 아래에, DTO는 `기능패키지/dto/`에 둔다.
- Entity를 API 응답으로 그대로 반환하지 않고 DTO로 바꿔서 반환한다.
- **`member` 패키지가 완성된 예시다.** 새 API를 만들 때 `MemberController` → `MemberService` → `MemberRepository`, `dto/SignupRequest`(검증), `dto/MemberResponse`(응답 변환)를 열어 보고 같은 모양으로 만들면 된다.

### 4-3. 로그인 회원 id (임시)

JWT가 완성되기 전까지 "지금 로그인한 회원"은 항상 이 함수로 얻는다.

```java
Long memberId = SecurityUtil.currentMemberId();   // 지금은 항상 2
```

- 서버를 처음 켜면 관리자 계정이 1번으로 먼저 등록되므로, 첫 회원가입이 2번이 된다. 그래서 임시로 2를 반환한다.
- JWT가 들어오면(화요일 저녁\~수요일, 공지 예정) 이 함수의 내부만 토큰 기반으로 바뀐다. **부르는 코드는 고칠 필요가 없다.**
- 회원을 DB에서 지웠다가 다시 만들면 번호가 3, 4로 밀린다. 그럴 때는 `TRUNCATE TABLE refresh_tokens; TRUNCATE TABLE members;` 후 서버를 다시 켜고 회원가입을 다시 한다. (검사 결과가 있으면 `survey_results`를 먼저 비운다)

### 4-4. 성공 응답

모든 REST API는 `ApiResponse`로 감싼다.

```java
@GetMapping("/api/surveys")
public ResponseEntity<ApiResponse<List<SurveyResponse>>> getSurveys() {
    return ResponseEntity.ok(ApiResponse.ok(surveyService.getSurveys()));
}

@PostMapping("/api/results")
public ResponseEntity<ApiResponse<ResultResponse>> submit(@Valid @RequestBody ResultSubmitRequest request) {
    ResultResponse result = resultService.submit(SecurityUtil.currentMemberId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result, "검사가 완료되었습니다"));
}

@DeleteMapping("/api/members/me")          // 204는 본문 없이
public ResponseEntity<Void> withdraw() { ...; return ResponseEntity.noContent().build(); }
```

목록(페이징)은 `PageResponse.of(Page, 변환함수)`로 `content` + `page` 형식을 만든다.

```java
Page<SurveyResult> page = surveyResultRepository.findMyResults(memberId, pageable);
return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page, ResultResponse::from)));
```

### 4-5. 에러 응답

규칙 위반은 `BusinessException`을 던지기만 하면 된다. `GlobalExceptionHandler`가 설계서 형식의 에러 JSON과 HTTP 상태 코드로 바꿔 준다.

```java
Survey survey = surveyRepository.findById(surveyId)
        .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));   // → 404
```

- `ErrorCode`에 설계서 5장의 코드 19개가 모두 들어 있다. 새 코드가 필요하면 파일 주인(윤수연)에게 요청한다.
- 요청 DTO에 `@NotBlank`, `@Min` 같은 검증을 달고 컨트롤러에서 `@Valid`를 붙이면, 실패 시 자동으로 400 `VALIDATION_ERROR` + `fields`(필드별 메시지)가 나간다. 예시는 `member/dto/SignupRequest.java`.
- 관리자 화면(`@Controller`, Thymeleaf)의 오류는 이 JSON 처리 대상이 아니다. `templates/error/` 에러 페이지로 처리한다.

### 4-6. 날짜

모든 날짜는 한국 시간 `yyyy-MM-ddTHH:mm:ss` 형식이다. 응답 DTO의 `LocalDateTime` 필드에 아래를 붙인다.

```java
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
LocalDateTime createdAt
```

### 4-7. API 테스트

- `backend/http/` 폴더에 `.http` 파일을 만들어 두면 VS Code REST Client로 실행할 수 있고, 팀원도 같은 요청을 그대로 쓸 수 있다. `member.http`가 예시다.
- 요청 본문과 기대 응답은 [`../mock-data/requests/`](../mock-data/requests), [`../mock-data/responses/`](../mock-data/responses)에 API별로 있다. Postman에 그대로 붙여 넣어도 된다.
- 설계서 7.4의 테스트 케이스(TC-...)를 기준으로 확인한다.

---

## 5. 임시 코드 (정식본으로 교체 예정)

| 파일 | 지금 | 교체 후 (담당) |
|---|---|---|
| `SecurityConfig` | 모든 요청 허용 | `/api/**`는 JWT, `/admin/**`는 관리자 로그인(formLogin) (윤수연, 화\~수) |
| `SecurityUtil` | 항상 2 반환 | 토큰의 회원 id (윤수연, 화\~수) |
| `templates/layout`, `admin/login`, `admin.css` | 최소 뼈대 | UI 설계서 2.5·4장 (황지영) |
| `admin/preview.html`, `WebConfig`의 `/admin/preview` | 레이아웃 확인용 | 관리자 화면 완성 후 삭제 (황지영) |

## 6. 파일 주인

아래 파일은 여러 사람이 동시에 고치면 충돌하므로 한 명만 수정한다. 다른 사람은 필요한 내용을 주인에게 요청한다.

| 담당 | 파일 |
|---|---|
| 윤수연 | `build.gradle`, `application.properties`, `ErrorCode`, `ApiResponse`, `SecurityConfig`, `SecurityUtil` |
| 이주혁 | `src/main/resources/data.sql` |

---

## 7. 문제가 생겼을 때

| 증상 | 원인 | 해결 |
|---|---|---|
| 실행 시 `Access denied for user 'boot'@'localhost'` (또는 root) | DB 계정·비밀번호가 내 PC와 다름 | 2-3의 `application-local.properties`에 내 계정 작성 |
| `Access denied for user ... to database 'kdsq_db'` | 계정에 `kdsq_db` 권한이 없음 | root로 접속해 2-2의 `GRANT` 실행 |
| `Unknown database 'kdsq_db'` | DB를 안 만듦 | 2-2의 `CREATE DATABASE` 실행 |
| root 비밀번호를 모름 | 실습 때 설정한 값을 잊음 | 팀장에게 요청 (MariaDB를 권한 검사 없이 켜서 재설정하는 방법이 있음) |
| `application.properties` 한글이 깨져 보임 | IntelliJ 인코딩이 ISO-8859-1 | 2-4의 5번. **깨진 상태로 저장하지 않는다** |
| Gradle 동기화 실패, `Unsupported class file major version` | IntelliJ가 17이 아닌 JDK 사용 | 2-4의 3·4번 |
| `Port 8080 was already in use` | 다른 서버(이전 실습 등)가 켜져 있음 | 그 서버를 끄거나 IntelliJ 실행 창의 빨간 정지 버튼 |
| `.http` 파일에 실행 버튼이 없음 | IntelliJ 무료판 미지원 | VS Code REST Client 사용 |
| `/api/members/me`가 404 `MEMBER_NOT_FOUND` | 2번 회원이 없거나 탈퇴 상태 | 3-3 회원가입, 또는 `UPDATE members SET status = 'ACTIVE' WHERE id = 2;` |
| 두 번째 실행부터 "관리자 계정을 등록했습니다"가 안 나옴 | 이미 등록됨 | 정상 (없을 때만 만든다) |
| `git checkout` 시 `Your local changes ... would be overwritten` | 커밋 안 한 수정이 있음 | 필요한 수정이면 커밋, 실수면 `git restore <파일>` |

## 참고

- 관리자 헤더에 로그인한 관리자 이름을 표시할 때(`sec:authentication`)는 Spring Security 7과 호환되는 `thymeleaf-extras-springsecurity` 버전을 확인한 뒤 추가하거나, 컨트롤러에서 Model로 이름을 넘긴다.
- 강사님 백엔드 가이드 2.4절(Spring Security + JWT), Thymeleaf 문서 7장에 설정·템플릿 예시가 있다.
