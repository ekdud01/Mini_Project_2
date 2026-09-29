package com.kdsq.global.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.kdsq.global.exception.ErrorCode;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * /api/** 요청의 Authorization: Bearer 액세스 토큰을 검증해 로그인 정보를 넣는다 (REST API 설계서 3.3).
 *
 * - 토큰이 없으면 그냥 통과 → 인증이 필요한 API라면 RestAuthenticationEntryPoint가 401 UNAUTHORIZED
 * - 토큰이 있지만 만료/위조/리프레시 토큰이면 어떤 오류인지 요청 속성에 적어 두고 통과
 *   → 인증이 필요한 API라면 EntryPoint가 그 코드(ACCESS_TOKEN_EXPIRED / UNAUTHORIZED)로 401 응답
 *   → 로그인·회원가입·재발급처럼 인증이 필요 없는 API는 오래된 토큰이 붙어 있어도 정상 처리
 * - 정상 토큰이면 principal = 회원 id(Long), 권한 = ROLE_{role}
 *
 * 스프링 빈으로 등록하지 않는다 (@Component로 만들면 모든 요청에 한 번 더 걸림). SecurityConfig에서 생성한다.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** EntryPoint가 읽는 요청 속성 이름 */
    public static final String ERROR_ATTRIBUTE = "kdsq.jwt.error";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            authenticate(request, header.substring(BEARER_PREFIX.length()).trim());
        }
        chain.doFilter(request, response);
    }

    private void authenticate(HttpServletRequest request, String token) {
        try {
            Claims claims = jwtTokenProvider.parseClaims(token);
            String role = jwtTokenProvider.getRole(claims);
            if (role == null) {
                // role 클레임이 없는 토큰 = 리프레시 토큰. 재발급 요청에만 쓸 수 있다 (REST 3.3)
                request.setAttribute(ERROR_ATTRIBUTE, ErrorCode.UNAUTHORIZED);
                return;
            }
            Long memberId = jwtTokenProvider.getMemberId(claims);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    memberId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
        } catch (ExpiredJwtException e) {
            request.setAttribute(ERROR_ATTRIBUTE, ErrorCode.ACCESS_TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            request.setAttribute(ERROR_ATTRIBUTE, ErrorCode.UNAUTHORIZED);
        }
    }
}
