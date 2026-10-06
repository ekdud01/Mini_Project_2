package com.kdsq.member;

/** 회원 상태 (Entity 설계서 5.1). 탈퇴는 소프트 삭제 */
public enum UserStatus {
    ACTIVE("활성", "정상적으로 서비스 이용 가능"),
    WITHDRAWN("탈퇴", "서비스 탈퇴 완료 (소프트 삭제)");

    private final String displayName;
    private final String description;

    UserStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return this == ACTIVE;
    }
}
