package com.kdsq.member.dto;

import com.kdsq.global.validation.NotFutureYear;
import com.kdsq.member.Gender;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 회원가입 요청 (REST API 설계서 3.1.1). 오류 문구는 3.1.1 '회원가입 검증 오류 문구' 표와 같게 유지한다.
 * 비밀번호 확인(passwordConfirm)은 화면에서만 검증하므로 받지 않는다.
 */
public record SignupRequest(

        @NotBlank(message = "이메일을 입력해주세요")
        @Email(message = "이메일 형식이 올바르지 않습니다")
        @Size(max = 100, message = "이메일은 100자 이하여야 합니다")
        String email,

        // 8~20자, 영문·숫자·특수문자(ASCII) 각 1개 이상, 한글·공백 불가 (BR-011)
        @NotBlank(message = "비밀번호를 입력해주세요")
        @Pattern(regexp = PASSWORD_REGEX, message = "비밀번호는 8~20자의 영문, 숫자, 특수문자를 모두 포함해야 합니다")
        String password,

        @NotBlank(message = "이름을 입력해주세요")
        @Size(max = 50, message = "이름은 50자 이하여야 합니다")
        String name,

        @NotNull(message = "성별을 선택해주세요")
        Gender gender,

        @NotNull(message = "출생년도를 입력해주세요")
        @Min(value = 1900, message = "출생년도는 1900년 이후여야 합니다")
        @NotFutureYear(message = "출생년도는 올해까지만 입력할 수 있습니다")
        Integer birthYear
) {
    public static final String PASSWORD_REGEX =
            "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!-/:-@\\[-`{-~])[!-~]{8,20}$";
}
