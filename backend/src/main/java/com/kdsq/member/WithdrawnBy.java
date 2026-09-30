package com.kdsq.member;

/**
 * 비활성(WITHDRAWN) 사유. 관리자 회원 상세에서 안내 문구를 나누는 데 쓴다.
 * 활성 회원이거나, 이 값이 생기기 전에 비활성이 된 회원은 null (화면에서는 관리자 비활성화 문구로 표시)
 */
public enum WithdrawnBy {
    SELF,    // 본인 탈퇴 (마이페이지, DELETE /api/members/me)
    ADMIN    // 관리자 비활성화 (관리자 회원 상세)
}
