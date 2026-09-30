package com.kdsq.global.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.kdsq.member.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.WeakKeyException;

/**
 * JwtTokenProvider 단위 테스트 (REST API 설계서 3.3 JWT 토큰 명세)
 *
 * 스프링 없이 new로 만들어 실제 토큰을 발급·검증한다.
 * 테스트용 비밀키는 실제 설정값과 무관한 임의 문자열이다 (HS256은 32바이트 이상 필요).
 */
class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-for-unit-test-only-0123456789";
    private static final String OTHER_SECRET = "another-secret-key-for-unit-test-9876543210";

    private final JwtTokenProvider provider = new JwtTokenProvider(SECRET, 3600, 604800);

    @Test
    @DisplayName("액세스 토큰: sub에 회원 id, role 클레임에 MEMBER가 들어간다")
    void accessToken_containsMemberIdAndRole() {
        String token = provider.createAccessToken(2L, Role.MEMBER);

        Claims claims = provider.parseClaims(token);

        assertThat(provider.getMemberId(claims)).isEqualTo(2L);
        assertThat(provider.getRole(claims)).isEqualTo("MEMBER");
    }

    @Test
    @DisplayName("리프레시 토큰: 회원 id만 있고 role 클레임은 없다")
    void refreshToken_hasNoRole() {
        String token = provider.createRefreshToken(2L);

        Claims claims = provider.parseClaims(token);

        assertThat(provider.getMemberId(claims)).isEqualTo(2L);
        assertThat(provider.getRole(claims)).isNull();
    }

    @Test
    @DisplayName("만료 시각은 설정한 유효 시간만큼 뒤로 잡힌다 (액세스 1시간)")
    void accessToken_expiration() {
        Claims claims = provider.parseClaims(provider.createAccessToken(2L, Role.MEMBER));

        long seconds = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / 1000;

        // JWT 시각은 초 단위로 잘리고 발급·만료 시각을 따로 구하므로 1초 오차는 허용
        assertThat(seconds).isBetween(3599L, 3601L);
    }

    @Test
    @DisplayName("만료된 토큰은 ExpiredJwtException (필터가 ACCESS_TOKEN_EXPIRED로 응답하는 근거)")
    void expiredToken_throwsExpiredJwtException() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(SECRET, -60, -60);   // 이미 1분 전에 만료
        String token = expiredProvider.createAccessToken(2L, Role.MEMBER);

        assertThatThrownBy(() -> provider.parseClaims(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("다른 비밀키로 서명한 토큰은 JwtException (위조 토큰)")
    void otherKeyToken_throwsJwtException() {
        String forged = new JwtTokenProvider(OTHER_SECRET, 3600, 604800).createAccessToken(2L, Role.MEMBER);

        assertThatThrownBy(() -> provider.parseClaims(forged))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("내용을 고친 토큰은 서명이 맞지 않아 JwtException")
    void tamperedToken_throwsJwtException() {
        String token = provider.createAccessToken(2L, Role.MEMBER);
        String[] parts = token.split("\\.");
        String tampered = parts[0] + "." + parts[1] + "x" + "." + parts[2];

        assertThatThrownBy(() -> provider.parseClaims(tampered))
                .isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("빈 토큰은 IllegalArgumentException")
    void emptyToken_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> provider.parseClaims(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("비밀키가 32바이트보다 짧으면 서버가 뜨지 않도록 WeakKeyException")
    void shortSecret_throwsWeakKeyException() {
        assertThatThrownBy(() -> new JwtTokenProvider("too-short-secret", 3600, 604800))
                .isInstanceOf(WeakKeyException.class);
    }
}
