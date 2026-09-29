package com.kdsq.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 로그인 요청 (REST API 설계서 3.1.2) */
public record LoginRequest(

        @NotBlank(message = "이메일을 입력해주세요")
        String email,

        @NotBlank(message = "비밀번호를 입력해주세요")
        String password
) {
}
