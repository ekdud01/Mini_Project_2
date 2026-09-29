package com.kdsq.global.security;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.kdsq.global.exception.ErrorCode;

import jakarta.servlet.http.HttpServletResponse;

/**
 * 보안 필터 단계(컨트롤러 전)에서 나는 401·403을 REST 설계서 공통 에러 형식으로 쓴다.
 * 필터 단계에는 GlobalExceptionHandler가 닿지 않으므로 직접 JSON을 만든다.
 * { "success": false, "error": { "code", "message" }, "timestamp": "yyyy-MM-ddTHH:mm:ss" }
 */
final class ErrorResponseWriter {

    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private ErrorResponseWriter() {
    }

    static void write(HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        // ErrorCode 메시지는 고정 문구(따옴표·역슬래시 없음)라 그대로 넣어도 JSON이 깨지지 않는다
        response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"" + code.name()
                + "\",\"message\":\"" + code.getMessage()
                + "\"},\"timestamp\":\"" + LocalDateTime.now().format(TIMESTAMP) + "\"}");
    }
}
