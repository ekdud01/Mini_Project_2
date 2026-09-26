package com.kdsq.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * [임시] 개발 초기용 보안 설정 — 모든 요청을 허용한다.
 *
 * JWT·관리자 formLogin이 완성되면 윤수연이 정식본으로 교체한다 (REST API 설계서 3.3).
 *  - /api/**   : JWT, STATELESS
 *  - /admin/** : formLogin(세션), CSRF 적용
 * 그 전까지 로그인 회원 id는 SecurityUtil.currentMemberId()로 얻는다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))   // 관리자 폼은 CSRF 유지, REST API는 제외
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable());
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
