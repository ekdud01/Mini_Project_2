package com.kdsq.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 토큰 응답 (REST API 설계서 3.1.2, 3.1.3).
 * 재발급 응답에는 refreshToken이 없으므로 null이면 JSON에서 뺀다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
) {
    public static TokenResponse of(String accessToken, String refreshToken, long expiresIn) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", expiresIn);
    }
}
