package com.kdsq.global.exception;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;

/**
 * 실패 응답 공통 형식 (REST API 설계서 2.5)
 * { "success": false, "error": { "code", "message", "fields"? }, "timestamp" }
 */
@Getter
public class ErrorResponse {

    private final boolean success = false;
    private final ErrorDetail error;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp = LocalDateTime.now();

    private ErrorResponse(ErrorDetail error) {
        this.error = error;
    }

    public static ErrorResponse of(ErrorCode code) {
        return new ErrorResponse(new ErrorDetail(code.name(), code.getMessage(), null));
    }

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(new ErrorDetail(code.name(), message, null));
    }

    public static ErrorResponse of(ErrorCode code, List<FieldErrorDto> fields) {
        return new ErrorResponse(new ErrorDetail(code.name(), code.getMessage(), fields));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorDetail(String code, String message, List<FieldErrorDto> fields) {
    }
}
