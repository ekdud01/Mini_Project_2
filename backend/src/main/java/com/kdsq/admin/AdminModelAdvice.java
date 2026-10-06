package com.kdsq.admin;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 관리자 화면 공통 Model (UI 설계서 2.5). com.kdsq.admin 패키지의 모든 컨트롤러에 적용된다.
 *  - adminEmail  : 로그인한 관리자 이메일 (헤더에 "관리자 + 이메일"로 표시). 로그인 전이면 null → 템플릿에서 th:if="${adminEmail != null}"
 *  - currentPath : 현재 요청 주소 (상단 메뉴 현재 메뉴 강조·브레드크럼). Thymeleaf 3.1은 #request를 지원하지 않는다
 *
 * WebConfig의 뷰 컨트롤러(/admin/login 등)에는 적용되지 않는다. 컨트롤러 클래스가 있는 화면에서만 값이 들어간다.
 */
@ControllerAdvice(basePackages = "com.kdsq.admin")
public class AdminModelAdvice {

    @ModelAttribute("adminEmail")
    public String adminEmail(Authentication authentication) {
        return authentication == null ? null : authentication.getName();   // formLogin의 사용자 이름 = 이메일 (DB 조회 없음)
    }

    @ModelAttribute("currentPath")
    public String currentPath(HttpServletRequest request) {
        return request.getRequestURI();
    }
}
