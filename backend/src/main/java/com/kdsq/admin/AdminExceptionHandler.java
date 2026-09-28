package com.kdsq.admin;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import com.kdsq.global.exception.BusinessException;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * 관리자 화면(Thymeleaf @Controller)의 예외를 에러 페이지로 보낸다 (UI 설계서 2.5).
 * REST API 예외는 GlobalExceptionHandler가 JSON으로 처리하므로 여기서는 com.kdsq.admin 패키지만 대상으로 한다.
 *
 *  - BusinessException : ErrorCode의 상태 코드로 응답하고, 403·404면 error/403·error/404, 그 외는 error/500 화면
 *                        (MEMBER_NOT_FOUND·RESULT_NOT_FOUND → 404, MEMBER_WITHDRAWN → 403)
 *  - AccessDeniedException은 잡지 않는다 → Spring Security가 403으로 처리
 *  - 그 외 예외도 잡지 않는다 → Spring Boot 기본 오류 처리가 error/500 페이지를 보여 준다
 *
 * 에러 페이지(templates/error/403·404·500.html)는 황지영 님 담당. 관리자 레이아웃 없이 단독 페이지로 만든다.
 */
@Slf4j
@ControllerAdvice(basePackages = "com.kdsq.admin")
public class AdminExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public String handleBusiness(BusinessException e, HttpServletResponse response) {
        int status = e.getErrorCode().getStatus().value();
        response.setStatus(status);
        if (status == 403 || status == 404) {
            return "error/" + status;
        }
        log.warn("Admin business error: {} - {}", e.getErrorCode(), e.getMessage());
        return "error/500";
    }
}
