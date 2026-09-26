# KDSQ 백엔드

Spring Boot 4.0.8 · Java 17 · MariaDB · Spring Data JPA · Spring Security · Thymeleaf(관리자 화면)

설계서: [`../필수제출문서/`](../필수제출문서) — 패키지 구조는 Entity 설계서 1.4, 설정은 14장, 응답·에러 형식은 REST API 설계서 2.5·5장을 따른다.

## 실행 방법

**1. DB 만들기** (MariaDB, 최초 1회)

```sql
CREATE DATABASE kdsq_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. 내 DB 계정 설정** — `root / 1234`가 아니면 `src/main/resources/application-local.properties`를 만든다 (GitHub에 올라가지 않음)

```properties
spring.datasource.username=내계정
spring.datasource.password=내비밀번호
```

**3. 실행**

```bash
cd backend
./gradlew bootRun          # Windows: gradlew.bat bootRun
```

**4. 확인**

| 주소 | 기대 결과 |
|---|---|
| http://localhost:8080/api/health | `{"success":true,"data":{"status":"UP"},...}` |
| http://localhost:8080/admin/preview | 헤더·푸터 사이에 "레이아웃 확인용 페이지" |
| http://localhost:8080/admin/login | 관리자 로그인 폼 (로그인 처리는 아직 동작하지 않음) |

처음 실행하면 테이블 6개(`members`, `surveys`, `questions`, `survey_results`, `solutions`, `refresh_tokens`)가 자동으로 생긴다.

## 패키지 구조

```text
com.kdsq
├── member/    Member, Gender, UserStatus, Role            (+ 회원 API: 윤수연)
├── auth/      RefreshToken                                 (+ JWT·로그인 API: 윤수연)
├── survey/    Survey, Question, ExamType                   (+ 설문 API: 이주혁)
├── result/    SurveyResult, Solution, RiskLevel            (+ 결과 API·채점: 이주혁)
├── admin/     (관리자 컨트롤러·서비스: 이원구 / 템플릿: 황지영)
└── global/
    ├── common/     BaseEntity, ApiResponse, PageResponse, HealthController
    ├── config/     SecurityConfig(임시), JpaAuditingConfig, WebConfig, ThymeleafConfig
    ├── security/   SecurityUtil(임시)
    └── exception/  ErrorCode, BusinessException, ErrorResponse, FieldErrorDto, GlobalExceptionHandler
```

각 기능의 Repository·Service·Controller·DTO는 해당 패키지에 만든다. DTO는 `패키지/dto/`에 두고, Entity를 API 응답으로 직접 반환하지 않는다.

## 공통 코드 사용법

**성공 응답** — 모든 REST API는 `ApiResponse`로 감싼다.

```java
@GetMapping("/api/surveys")
public ApiResponse<List<SurveyResponse>> getSurveys() {
    return ApiResponse.ok(surveyService.getSurveys());
}

@PostMapping("/api/results")
public ResponseEntity<ApiResponse<ResultResponse>> submit(@Valid @RequestBody ResultSubmitRequest request) {
    ResultResponse result = resultService.submit(SecurityUtil.currentMemberId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result, "검사가 완료되었습니다"));
}
```

**목록(페이징) 응답** — `PageResponse.of(page, 변환함수)`

```java
return ApiResponse.ok(PageResponse.of(resultPage, ResultResponse::from));
```

**에러** — `BusinessException`을 던지면 `GlobalExceptionHandler`가 REST 설계서 형식의 에러 응답으로 바꾼다. `@Valid` 실패는 자동으로 400 + `fields`가 된다.

```java
Survey survey = surveyRepository.findById(id)
        .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));
```

**로그인 회원 id** — JWT 완성 전까지 `SecurityUtil.currentMemberId()`는 항상 `1`을 반환한다. 테스트 전에 회원가입 API로 회원 1명을 먼저 만들어 둔다. JWT가 들어오면 내부만 바뀌므로 호출 코드는 그대로 둔다.

## 임시 코드 (정식본으로 교체 예정)

| 파일 | 지금 | 교체 후 (담당) |
|---|---|---|
| `SecurityConfig` | 모든 요청 허용 | `/api/**` JWT, `/admin/**` formLogin (윤수연) |
| `SecurityUtil` | 항상 1 반환 | 토큰의 회원 id (윤수연) |
| `templates/layout`, `admin/login`, `admin.css` | 최소 뼈대 | UI 설계서 2.5·4장 (황지영) |
| `admin/preview.html`, `WebConfig`의 `/admin/preview` | 레이아웃 확인용 | 관리자 화면 완성 후 삭제 |

## 파일 주인

아래 파일은 충돌을 막기 위해 한 명만 수정한다. 다른 사람은 필요한 내용을 주인에게 요청한다.

- 윤수연: `build.gradle`, `application.properties`, `ErrorCode`, `ApiResponse`, `SecurityConfig`
- 이주혁: `src/main/resources/data.sql` (초기 데이터, Entity 설계서 13.4)

## 참고

- 관리자 헤더에 로그인한 관리자 이름을 표시할 때(`sec:authentication`)는 Spring Security 7과 호환되는 `thymeleaf-extras-springsecurity` 버전을 확인한 뒤 추가하거나, 컨트롤러에서 Model로 이름을 넘긴다.
- Gradle이 `spring-boot-starter-web`을 찾지 못한다는 오류를 내면 `spring-boot-starter-webmvc`로 바꾼다 (Spring Boot 4에서 이름이 바뀌는 중인 스타터).
