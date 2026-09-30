package com.kdsq.auth;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.auth.dto.LoginRequest;
import com.kdsq.auth.dto.ReissueRequest;
import com.kdsq.auth.dto.TokenResponse;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.global.security.JwtTokenProvider;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;

/**
 * 로그인, 토큰 재발급, 로그아웃 (REST API 설계서 3.1.2~3.1.4, Entity 설계서 4.5.3)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 사용자 로그인. 액세스·리프레시 토큰을 발급하고 리프레시 토큰을 저장(회원당 1개, 있으면 교체)한다.
     *  - 이메일 없음·비밀번호 불일치·ADMIN 계정 → 401 INVALID_CREDENTIALS
     *  - 탈퇴 회원 → 403 MEMBER_WITHDRAWN (비밀번호가 맞을 때만 알려 준다)
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.email())
                .filter(m -> m.getRole() == Role.MEMBER)
                .filter(m -> passwordEncoder.matches(request.password(), m.getPassword()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!member.getStatus().isActive()) {
            throw new BusinessException(ErrorCode.MEMBER_WITHDRAWN);
        }

        String accessToken = jwtTokenProvider.createAccessToken(member.getId(), member.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getId());
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtTokenProvider.getRefreshTokenValiditySeconds());

        refreshTokenRepository.findByMemberId(member.getId())
                .ifPresentOrElse(
                        saved -> saved.replace(refreshToken, expiresAt),
                        () -> refreshTokenRepository.save(RefreshToken.issue(member, refreshToken, expiresAt)));

        return TokenResponse.of(accessToken, refreshToken, jwtTokenProvider.getAccessTokenValiditySeconds());
    }

    /**
     * 액세스 토큰 재발급. 리프레시 토큰은 바꾸지 않는다.
     * ① 서명·만료 검증 → ② 토큰의 회원 id로 저장된 토큰 조회 → ③ 문자열 일치·만료 전 확인.
     * 하나라도 실패하면 401 INVALID_REFRESH_TOKEN.
     */
    public TokenResponse reissue(ReissueRequest request) {
        Long memberId = parseRefreshToken(request.refreshToken());

        RefreshToken saved = refreshTokenRepository.findByMemberId(memberId)
                .filter(t -> t.getToken().equals(request.refreshToken()))
                .filter(t -> !t.isExpired(LocalDateTime.now()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));

        Member member = saved.getMember();
        if (!member.getStatus().isActive()) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String accessToken = jwtTokenProvider.createAccessToken(member.getId(), member.getRole());
        return TokenResponse.of(accessToken, null, jwtTokenProvider.getAccessTokenValiditySeconds());
    }

    /** 로그아웃: 저장된 리프레시 토큰 삭제. 이미 없어도 204로 끝낸다 */
    @Transactional
    public void logout(Long memberId) {
        refreshTokenRepository.deleteByMemberId(memberId);
    }

    private Long parseRefreshToken(String refreshToken) {
        try {
            Claims claims = jwtTokenProvider.parseClaims(refreshToken);
            return jwtTokenProvider.getMemberId(claims);
        } catch (JwtException | IllegalArgumentException e) {
            // 만료(ExpiredJwtException)도 JwtException의 하위 타입이라 여기서 함께 처리된다
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }
}
