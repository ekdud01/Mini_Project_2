package com.kdsq.member;

/** 권한 (Entity 설계서 5.4) */
public enum Role {
    MEMBER("일반 사용자"),   // 회원가입 시 부여, 사용자 API(JWT) 접근
    ADMIN("관리자");         // 초기 데이터로 등록, 관리자 화면(formLogin) 접근

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /** Spring Security 권한명 */
    public String getAuthority() {
        return "ROLE_" + name();
    }
}
