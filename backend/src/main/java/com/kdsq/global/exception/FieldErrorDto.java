package com.kdsq.global.exception;

/**
 * 입력값 검증 실패 시 필드별 오류 (REST API 설계서 2.5 "입력값 검증 실패 응답")
 */
public record FieldErrorDto(String field, String message) {
}
