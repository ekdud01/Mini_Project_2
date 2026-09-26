package com.kdsq.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 에러 코드 (REST API 설계서 5장). 응답의 error.code에는 상수 이름이 그대로 나간다.
 * 새 코드가 필요하면 파일 주인(윤수연)에게 요청한다.
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 5.1 표준 에러 코드
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다"),
    ACCESS_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "액세스 토큰이 만료되었습니다"),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "다시 로그인해주세요"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "접근 권한이 없습니다"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다"),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다"),
    BUSINESS_RULE_VIOLATION(HttpStatus.UNPROCESSABLE_ENTITY, "처리할 수 없는 요청입니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요"),

    // 5.2 도메인별 에러 코드
    MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다"),
    MEMBER_WITHDRAWN(HttpStatus.FORBIDDEN, "이용할 수 없는 계정입니다"),
    SURVEY_NOT_FOUND(HttpStatus.NOT_FOUND, "설문지를 찾을 수 없습니다"),
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "문항을 찾을 수 없습니다"),
    RESULT_NOT_FOUND(HttpStatus.NOT_FOUND, "검사 결과를 찾을 수 없습니다"),
    INVALID_EXAM_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 검사 유형입니다"),
    INVALID_ANSWER_COUNT(HttpStatus.BAD_REQUEST, "모든 문항에 답해주세요"),
    KDSQ_C_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY, "1차 검사 점수가 4점 이상이면 2차 검사까지 완료해야 합니다"),
    KDSQ_C_NOT_ALLOWED(HttpStatus.UNPROCESSABLE_ENTITY, "1차 검사 점수가 4점 미만이면 2차 검사 결과를 저장할 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
