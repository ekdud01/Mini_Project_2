package com.kdsq.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 컨트롤러 없이 화면만 연결하는 설정.
 *  - /admin/login   : 관리자 로그인 화면 (로그인 처리는 formLogin 정식본에서 Spring Security가 담당)
 *  - /admin/preview : [임시] 관리자 레이아웃 확인용. 관리자 화면이 완성되면 삭제한다.
 *  - /admin/dashboard : [임시] 대시보드 컨트롤러 전까지 preview 화면으로 연결 (로그인 성공 후 이동 주소)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/admin/login").setViewName("admin/login");
        registry.addViewController("/admin/preview").setViewName("admin/preview");
        // [임시] 관리자 로그인 성공 후 이동하는 대시보드. AdminDashboardController(윤수연)가 생기면 이 줄을 삭제한다
        registry.addViewController("/admin/dashboard").setViewName("admin/preview");
    }
}
