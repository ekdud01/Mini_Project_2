package com.kdsq.admin;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 화면 공통 Model (UI 설계서 2.5). com.kdsq.admin 패키지의 모든 컨트롤러에 적용된다.
 *  - adminName   : 로그인한 관리자 이름 (헤더 표시). 로그인 전이면 null → 템플릿에서 th:if="${adminName != null}"
 *  - currentPath : 현재 요청 주소 (사이드바 현재 메뉴 강조·브레드크럼). Thymeleaf 3.1은 #request를 지원하지 않는다
 *
 * WebConfig의 뷰 컨트롤러(/admin/login 등)에는 적용되지 않는다. 컨트롤러 클래스가 있는 화면에서만 값이 들어간다.
 */
@ControllerAdvice(basePackages = "com.kdsq.admin")
@RequiredArgsConstructor
public class AdminModelAdvice {

    private final MemberRepository memberRepository;

    @ModelAttribute("adminName")
    public String adminName(Authentication authentication) {
        if (authentication == null) {
            return null;   // 로그인 전
        }
        return memberRepository.findByEmail(authentication.getName())   // formLogin의 사용자 이름 = 이메일
                .map(Member::getName)
                .orElse(null);
    }

    @ModelAttribute("currentPath")
    public String currentPath(HttpServletRequest request) {
        return request.getRequestURI();
    }
}
