package com.kdsq.global.security;

/**
 * 로그인한 회원 id를 얻는 유일한 창구.
 *
 * [임시] JWT가 완성되기 전까지는 항상 1을 반환한다.
 *  - 테스트 전에 회원가입 API로 회원 1명을 먼저 만들어 두어야 한다 (id = 1).
 *  - JWT 완성 후 윤수연이 SecurityContext에서 회원 id를 꺼내도록 내부만 교체한다.
 *    호출하는 쪽 코드는 바꿀 필요가 없다.
 */
public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static Long currentMemberId() {
        return 1L;
    }
}
