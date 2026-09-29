package com.kdsq.global.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;

/**
 * 로그인한 회원 id를 얻는 유일한 창구 (사용자 API /api/** 전용).
 * JwtAuthenticationFilter가 액세스 토큰의 회원 id(sub)를 principal로 넣어 둔다.
 * 로그인이 필요한 API는 SecurityConfig에서 이미 막히므로, 여기서 예외가 나는 경우는 설정 실수뿐이다.
 */
public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static Long currentMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long memberId) {
            return memberId;
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }
}
