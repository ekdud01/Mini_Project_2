package com.kdsq.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 토큰 재발급 요청 (REST API 설계서 3.1.3) */
public record ReissueRequest(

        @NotBlank(message = "리프레시 토큰이 필요합니다")
        String refreshToken
) {
}
