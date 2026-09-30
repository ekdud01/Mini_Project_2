package com.kdsq.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 컨트롤러 없이 화면만 연결하는 설정.
 *  - /admin/login : 관리자 로그인 화면 (로그인 처리는 Spring Security formLogin이 담당, SecurityConfig)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/admin/login").setViewName("admin/login");
    }
}
