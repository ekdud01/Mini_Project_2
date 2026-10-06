package com.kdsq.member.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Year;
import java.time.ZoneId;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.kdsq.member.Gender;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * 회원가입 입력 검증 테스트 (REST API 설계서 3.1.1 '회원가입 검증 오류 문구' 표)
 *
 * 컨트롤러의 @Valid가 쓰는 것과 같은 Bean Validation을 직접 실행해서,
 * 규칙과 화면에 보일 오류 문구(끝 마침표 없음, UI 설계서 2.4)가 설계서와 같은지 확인한다.
 */
class SignupRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static SignupRequest request(String email, String password, String name, Gender gender, Integer birthYear) {
        return new SignupRequest(email, password, name, gender, birthYear);
    }

    private static SignupRequest validRequest() {
        return request("hong@test.com", "Test1234!", "홍길동", Gender.MALE, 1960);
    }

    /** 검증 결과를 "필드: 문구" 형태로 모은다 */
    private Set<String> violations(SignupRequest request) {
        Set<ConstraintViolation<SignupRequest>> result = validator.validate(request);
        return result.stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    @DisplayName("올바른 입력은 검증 오류가 없다")
    void valid() {
        assertThat(violations(validRequest())).isEmpty();
    }

    @Test
    @DisplayName("필수값이 비어 있으면 필드별 '입력해주세요/선택해주세요' 문구")
    void blankFields() {
        assertThat(violations(request("", "", " ", null, null))).contains(
                "email: 이메일을 입력해주세요",
                "password: 비밀번호를 입력해주세요",
                "name: 이름을 입력해주세요",
                "gender: 성별을 선택해주세요",
                "birthYear: 출생년도를 입력해주세요");
    }

    @Test
    @DisplayName("이메일 형식이 아니면 '이메일 형식이 올바르지 않습니다'")
    void invalidEmail() {
        assertThat(violations(request("hong-test.com", "Test1234!", "홍길동", Gender.MALE, 1960)))
                .containsExactly("email: 이메일 형식이 올바르지 않습니다");
    }

    @Test
    @DisplayName("이름이 50자를 넘으면 '이름은 50자 이하여야 합니다'")
    void nameTooLong() {
        assertThat(violations(request("hong@test.com", "Test1234!", "가".repeat(51), Gender.MALE, 1960)))
                .containsExactly("name: 이름은 50자 이하여야 합니다");
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @ValueSource(strings = {
            "Test123",               // 8자 미만
            "Test1234567890123456!", // 20자 초과
            "testtest!",             // 숫자 없음
            "12345678!",             // 영문 없음
            "Test12345",             // 특수문자 없음
            "Test 1234!",            // 공백
            "테스트Test1234!"          // 한글
    })
    @DisplayName("비밀번호 규칙(8~20자, 영문·숫자·특수문자 모두, 공백·한글 불가)을 어기면 오류")
    void invalidPassword(String password) {
        assertThat(violations(request("hong@test.com", password, "홍길동", Gender.MALE, 1960)))
                .containsExactly("password: 비밀번호는 8~20자의 영문, 숫자, 특수문자를 모두 포함해야 합니다");
    }

    @Test
    @DisplayName("출생년도가 1900년 미만이면 '출생년도는 1900년 이후여야 합니다'")
    void birthYearTooOld() {
        assertThat(violations(request("hong@test.com", "Test1234!", "홍길동", Gender.MALE, 1899)))
                .containsExactly("birthYear: 출생년도는 1900년 이후여야 합니다");
    }

    @Test
    @DisplayName("출생년도가 올해보다 크면 '출생년도는 올해까지만 입력할 수 있습니다' (@NotFutureYear)")
    void birthYearInFuture() {
        int nextYear = Year.now(ZoneId.of("Asia/Seoul")).getValue() + 1;

        assertThat(violations(request("hong@test.com", "Test1234!", "홍길동", Gender.MALE, nextYear)))
                .containsExactly("birthYear: 출생년도는 올해까지만 입력할 수 있습니다");
    }

    @Test
    @DisplayName("출생년도가 올해면 통과한다 (경곗값)")
    void birthYearThisYear() {
        int thisYear = Year.now(ZoneId.of("Asia/Seoul")).getValue();

        assertThat(violations(request("hong@test.com", "Test1234!", "홍길동", Gender.MALE, thisYear))).isEmpty();
    }
}
