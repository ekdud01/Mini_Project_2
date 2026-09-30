package com.kdsq.global.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import com.kdsq.global.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 로그인이 필요한 /api/** 요청에 인증 정보가 없을 때 401 (REST API 설계서 3.3 토큰 오류 처리 규칙)
 *  - 토큰 만료        → ACCESS_TOKEN_EXPIRED (프론트는 재발급 후 1회 재시도)
 *  - 토큰 없음·위조·리프레시 토큰 → UNAUTHORIZED (프론트는 로그아웃)
 */
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        Object error = request.getAttribute(JwtAuthenticationFilter.ERROR_ATTRIBUTE);
        ErrorCode code = (error instanceof ErrorCode errorCode) ? errorCode : ErrorCode.UNAUTHORIZED;
        ErrorResponseWriter.write(response, code);
    }
}
