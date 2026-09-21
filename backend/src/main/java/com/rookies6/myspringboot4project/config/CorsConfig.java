package com.rookies6.myspringboot4project.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * CORS(Cross-Origin Resource Sharing) 설정 클래스.
 * 허용할 Origin은 application.properties 의 app.cors.allowed-origins 에서 주입받는다.
 */
@Configuration
public class CorsConfig {

    /** preflight(OPTIONS) 응답을 브라우저가 캐시하는 시간(초) */
    private static final long PREFLIGHT_MAX_AGE_SECONDS = 3600L;

    /** 허용할 Origin 목록 ( application.properties 에서 쉼표로 구분하여 설정 ) */
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        CorsConfiguration configuration = new CorsConfiguration();
        //와일드카드(*) 대신 허용할 Origin을 명시한다
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        //Spring이 실제 요청된 헤더를 그대로 반영해 준다
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        //preflight 요청이 매번 발생하는 것을 줄인다
        configuration.setMaxAge(PREFLIGHT_MAX_AGE_SECONDS);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        FilterRegistrationBean<CorsFilter> bean =
                new FilterRegistrationBean<>(new CorsFilter(source));
        //Spring Security를 추가하더라도 CORS 필터가 먼저 동작하도록 한다
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}