package com.kdsq.global.common;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;

/**
 * 성공 응답 공통 형식 (REST API 설계서 2.5)
 * { "success": true, "data": ..., "message": "...", "timestamp": "2026-09-24T10:30:00" }
 *
 * 사용 예)
 *   return ResponseEntity.ok(ApiResponse.ok(dto));
 *   return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto, "회원가입이 완료되었습니다"));
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success = true;
    private final T data;
    private final String message;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp = LocalDateTime.now();

    private ApiResponse(T data, String message) {
        this.data = data;
        this.message = message;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(data, message);
    }
}
