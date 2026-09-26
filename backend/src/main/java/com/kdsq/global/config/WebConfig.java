package com.kdsq.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 컨트롤러 없이 화면만 연결하는 설정.
 *  - /admin/login   : 관리자 로그인 화면 (로그인 처리는 formLogin 정식본에서 Spring Security가 담당)
 *  - /admin/preview : [임시] 관리자 레이아웃 확인용. 관리자 화면이 완성되면 삭제한다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/admin/login").setViewName("admin/login");
        registry.addViewController("/admin/preview").setViewName("admin/preview");
    }
}
