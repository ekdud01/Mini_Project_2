package com.kdsq.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.kdsq.auth.dto.LoginRequest;
import com.kdsq.auth.dto.ReissueRequest;
import com.kdsq.auth.dto.TokenResponse;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.global.security.JwtTokenProvider;
import com.kdsq.member.Gender;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

/**
 * AuthService 단위 테스트 (REST API 설계서 3.1.2 로그인, 3.1.3 재발급, 3.1.4 로그아웃 / 7.4 TC-AUTH)
 *
 * JwtTokenProvider도 Mock으로 바꿔 "토큰 문자열이 무엇이냐"가 아니라 "서비스가 어떤 규칙으로 판단하느냐"만 확인한다.
 * 토큰 자체의 발급·검증은 JwtTokenProviderTest에서 확인한다.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String REFRESH = "refresh-token";

    @Mock
    MemberRepository memberRepository;

    @Mock
    RefreshTokenRepository refreshTokenRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    AuthService authService;

    private Member member(Long id) {
        Member member = Member.create("hong@test.com", "encoded", "홍길동", Gender.MALE, 1960);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private Member withdrawnMember(Long id) {
        Member member = member(id);
        member.withdraw();
        return member;
    }

    /** 로그인 성공 시 토큰 발급까지 필요한 Mock 응답 */
    private void givenTokensIssued() {
        given(jwtTokenProvider.createAccessToken(2L, Role.MEMBER)).willReturn("access-token");
        given(jwtTokenProvider.createRefreshToken(2L)).willReturn(REFRESH);
        given(jwtTokenProvider.getRefreshTokenValiditySeconds()).willReturn(604800L);
        given(jwtTokenProvider.getAccessTokenValiditySeconds()).willReturn(3600L);
    }

    /** 리프레시 토큰을 해석하면 회원 id가 나오도록 */
    private void givenRefreshTokenOf(Long memberId) {
        Claims claims = mock(Claims.class);
        given(jwtTokenProvider.parseClaims(REFRESH)).willReturn(claims);
        given(jwtTokenProvider.getMemberId(claims)).willReturn(memberId);
    }

    // ───────────────────── 로그인 ─────────────────────

    @Test
    @DisplayName("로그인 성공: 액세스·리프레시 토큰을 주고, 처음 로그인이면 리프레시 토큰을 저장한다 (TC-AUTH-03)")
    void login_success_firstLogin() {
        given(memberRepository.findByEmail("hong@test.com")).willReturn(Optional.of(member(2L)));
        given(passwordEncoder.matches("Test1234!", "encoded")).willReturn(true);
        givenTokensIssued();
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.empty());

        TokenResponse response = authService.login(new LoginRequest("hong@test.com", "Test1234!"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo(REFRESH);
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(3600L);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("다시 로그인하면 기존 리프레시 토큰 행을 새 토큰으로 교체한다 (회원당 1개)")
    void login_success_replacesSavedToken() {
        RefreshToken saved = RefreshToken.issue(member(2L), "old-token", LocalDateTime.now().plusDays(1));
        given(memberRepository.findByEmail("hong@test.com")).willReturn(Optional.of(member(2L)));
        given(passwordEncoder.matches("Test1234!", "encoded")).willReturn(true);
        givenTokensIssued();
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.of(saved));

        authService.login(new LoginRequest("hong@test.com", "Test1234!"));

        assertThat(saved.getToken()).isEqualTo(REFRESH);
        verify(refreshTokenRepository, never()).save(any());   // 새 행을 만들지 않는다
    }

    @Test
    @DisplayName("비밀번호가 틀리면 INVALID_CREDENTIALS (TC-AUTH-04)")
    void login_wrongPassword() {
        given(memberRepository.findByEmail("hong@test.com")).willReturn(Optional.of(member(2L)));
        given(passwordEncoder.matches("Wrong1234!", "encoded")).willReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("hong@test.com", "Wrong1234!")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("없는 이메일도 비밀번호 오류와 같은 INVALID_CREDENTIALS (가입 여부를 알려 주지 않음)")
    void login_unknownEmail() {
        given(memberRepository.findByEmail("none@test.com")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("none@test.com", "Test1234!")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("관리자 계정으로 사용자 로그인을 하면 INVALID_CREDENTIALS (관리자는 /admin/login만 사용)")
    void login_admin_rejected() {
        Member admin = Member.createAdmin("admin@kdsq.com", "encoded", "관리자");
        given(memberRepository.findByEmail("admin@kdsq.com")).willReturn(Optional.of(admin));

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin@kdsq.com", "admin1234!")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
        verify(passwordEncoder, never()).matches(anyString(), anyString());   // 비밀번호 비교 전에 걸러진다
    }

    @Test
    @DisplayName("탈퇴 회원이 맞는 비밀번호로 로그인하면 MEMBER_WITHDRAWN, 토큰을 발급하지 않는다")
    void login_withdrawn() {
        given(memberRepository.findByEmail("hong@test.com")).willReturn(Optional.of(withdrawnMember(2L)));
        given(passwordEncoder.matches("Test1234!", "encoded")).willReturn(true);

        assertThatThrownBy(() -> authService.login(new LoginRequest("hong@test.com", "Test1234!")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_WITHDRAWN);
        verify(jwtTokenProvider, never()).createAccessToken(any(), any());
    }

    @Test
    @DisplayName("탈퇴 회원이라도 비밀번호가 틀리면 INVALID_CREDENTIALS (탈퇴 사실을 알려 주지 않음)")
    void login_withdrawn_wrongPassword() {
        given(memberRepository.findByEmail("hong@test.com")).willReturn(Optional.of(withdrawnMember(2L)));
        given(passwordEncoder.matches("Wrong1234!", "encoded")).willReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("hong@test.com", "Wrong1234!")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_CREDENTIALS);
    }

    // ───────────────────── 토큰 재발급 ─────────────────────

    @Test
    @DisplayName("재발급 성공: 새 액세스 토큰만 주고 리프레시 토큰은 응답에 없다")
    void reissue_success() {
        givenRefreshTokenOf(2L);
        RefreshToken saved = RefreshToken.issue(member(2L), REFRESH, LocalDateTime.now().plusDays(1));
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.of(saved));
        given(jwtTokenProvider.createAccessToken(2L, Role.MEMBER)).willReturn("new-access-token");
        given(jwtTokenProvider.getAccessTokenValiditySeconds()).willReturn(3600L);

        TokenResponse response = authService.reissue(new ReissueRequest(REFRESH));

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isNull();   // JSON에서 빠진다 (@JsonInclude NON_NULL)
    }

    @Test
    @DisplayName("재발급: 위조·형식 오류 토큰이면 INVALID_REFRESH_TOKEN")
    void reissue_invalidSignature() {
        given(jwtTokenProvider.parseClaims(REFRESH)).willThrow(new JwtException("invalid signature"));

        assertThatThrownBy(() -> authService.reissue(new ReissueRequest(REFRESH)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    @Test
    @DisplayName("재발급: 만료된 리프레시 토큰(JWT 만료)이면 INVALID_REFRESH_TOKEN")
    void reissue_expiredJwt() {
        given(jwtTokenProvider.parseClaims(REFRESH))
                .willThrow(new ExpiredJwtException(null, null, "expired"));

        assertThatThrownBy(() -> authService.reissue(new ReissueRequest(REFRESH)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    @Test
    @DisplayName("재발급: 로그아웃·재로그인으로 저장된 토큰과 다르면 INVALID_REFRESH_TOKEN")
    void reissue_tokenMismatch() {
        givenRefreshTokenOf(2L);
        RefreshToken saved = RefreshToken.issue(member(2L), "newer-token", LocalDateTime.now().plusDays(1));
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.of(saved));

        assertThatThrownBy(() -> authService.reissue(new ReissueRequest(REFRESH)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    @Test
    @DisplayName("재발급: 저장된 토큰의 만료 시각이 지났으면 INVALID_REFRESH_TOKEN")
    void reissue_savedTokenExpired() {
        givenRefreshTokenOf(2L);
        RefreshToken saved = RefreshToken.issue(member(2L), REFRESH, LocalDateTime.now().minusMinutes(1));
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.of(saved));

        assertThatThrownBy(() -> authService.reissue(new ReissueRequest(REFRESH)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    @Test
    @DisplayName("재발급: 탈퇴한 회원의 토큰이면 INVALID_REFRESH_TOKEN")
    void reissue_withdrawnMember() {
        givenRefreshTokenOf(2L);
        RefreshToken saved = RefreshToken.issue(withdrawnMember(2L), REFRESH, LocalDateTime.now().plusDays(1));
        given(refreshTokenRepository.findByMemberId(2L)).willReturn(Optional.of(saved));

        assertThatThrownBy(() -> authService.reissue(new ReissueRequest(REFRESH)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_REFRESH_TOKEN);
        verify(jwtTokenProvider, never()).createAccessToken(any(), any());
    }

    // ───────────────────── 로그아웃 ─────────────────────

    @Test
    @DisplayName("로그아웃: 저장된 리프레시 토큰을 지운다")
    void logout_deletesRefreshToken() {
        authService.logout(2L);

        verify(refreshTokenRepository).deleteByMemberId(2L);
    }
}
