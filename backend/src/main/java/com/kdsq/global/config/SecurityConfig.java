package com.kdsq.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.kdsq.global.security.JwtAuthenticationFilter;
import com.kdsq.global.security.JwtTokenProvider;
import com.kdsq.global.security.RestAccessDeniedHandler;
import com.kdsq.global.security.RestAuthenticationEntryPoint;

import lombok.RequiredArgsConstructor;

/**
 * 보안 설정 (REST API 설계서 3.3 인증 방식 분리) — 주소별로 체인 3개
 *  1. /api/**   : JWT, 세션 없음, CSRF 없음. 회원가입·로그인·재발급·health만 인증 없이 허용, 나머지는 ROLE_MEMBER
 *  2. /admin/** : formLogin(세션), CSRF 적용. /admin/login만 허용, 나머지는 ROLE_ADMIN
 *  3. 그 외     : 정적 파일(/css, /js), 에러 페이지(/error) 등 — 모두 허용
 * 관리자 서비스는 @PreAuthorize("hasRole('ADMIN')")로 한 번 더 막는다 (@EnableMethodSecurity).
 * 관리자 로그인 계정 조회는 AdminUserDetailsService(ADMIN만, 탈퇴 계정 비활성) — UserDetailsService 빈이 하나뿐이라 formLogin이 자동으로 사용한다.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/**")
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable)   // 로그아웃은 AuthController(POST /api/auth/logout)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/members", "/api/auth/login", "/api/auth/reissue").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                .anyRequest().hasRole("MEMBER"))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new RestAuthenticationEntryPoint())   // 401 JSON
                .accessDeniedHandler(new RestAccessDeniedHandler()))            // 403 JSON
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/admin/**")
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/login").permitAll()
                .anyRequest().hasRole("ADMIN"))
            .formLogin(form -> form
                .loginPage("/admin/login")
                .loginProcessingUrl("/admin/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .defaultSuccessUrl("/admin/dashboard", true)
                .failureUrl("/admin/login?error")
                .permitAll())
            .logout(logout -> logout
                .logoutUrl("/admin/logout")                // POST + CSRF 토큰 (Thymeleaf th:action 폼)
                .logoutSuccessUrl("/admin/login?logout")
                .permitAll());
        // 권한 없음(403)은 기본 처리 → templates/error/403.html
        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
