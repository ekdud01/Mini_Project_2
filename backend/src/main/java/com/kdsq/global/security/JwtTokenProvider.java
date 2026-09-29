package com.kdsq.global.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.kdsq.member.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * JWT 발급·검증 (REST API 설계서 3.3 JWT 토큰 명세)
 *  - 액세스 토큰: sub = 회원 id, role = MEMBER, 1시간
 *  - 리프레시 토큰: sub = 회원 id, 7일 (서버 refresh_tokens 테이블에도 저장)
 *  - 서명: HS256, 비밀키 app.jwt.secret (32바이트 이상)
 */
@Component
public class JwtTokenProvider {

    private static final String ROLE_CLAIM = "role";

    private final SecretKey key;
    private final long accessTokenValiditySeconds;
    private final long refreshTokenValiditySeconds;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-validity-seconds}") long accessTokenValiditySeconds,
            @Value("${app.jwt.refresh-token-validity-seconds}") long refreshTokenValiditySeconds) {
        // 32바이트보다 짧으면 WeakKeyException으로 서버가 뜨지 않는다 (설정 실수를 바로 알 수 있게)
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenValiditySeconds = accessTokenValiditySeconds;
        this.refreshTokenValiditySeconds = refreshTokenValiditySeconds;
    }

    public String createAccessToken(Long memberId, Role role) {
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(new Date())
                .expiration(expiresAfter(accessTokenValiditySeconds))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public String createRefreshToken(Long memberId) {
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .issuedAt(new Date())
                .expiration(expiresAfter(refreshTokenValiditySeconds))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * 서명·만료를 검증하고 클레임을 꺼낸다.
     * @throws ExpiredJwtException 만료된 토큰 (액세스 토큰이면 ACCESS_TOKEN_EXPIRED로 응답)
     * @throws JwtException        위조·형식 오류 토큰
     * @throws IllegalArgumentException 빈 토큰
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** 클레임의 sub(회원 id). 숫자가 아니면 위조 토큰으로 본다 */
    public Long getMemberId(Claims claims) {
        try {
            return Long.valueOf(claims.getSubject());
        } catch (NumberFormatException e) {
            throw new JwtException("잘못된 subject", e);
        }
    }

    /** 액세스 토큰의 role 클레임. 리프레시 토큰에는 없으므로 null */
    public String getRole(Claims claims) {
        return claims.get(ROLE_CLAIM, String.class);
    }

    public long getAccessTokenValiditySeconds() {
        return accessTokenValiditySeconds;
    }

    public long getRefreshTokenValiditySeconds() {
        return refreshTokenValiditySeconds;
    }

    private Date expiresAfter(long seconds) {
        return new Date(System.currentTimeMillis() + seconds * 1000);
    }
}
