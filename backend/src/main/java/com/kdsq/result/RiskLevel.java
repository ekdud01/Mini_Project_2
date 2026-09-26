package com.kdsq.result;

/** 판정 등급 (Entity 설계서 5.2) */
public enum RiskLevel {
    Normal("정상", "KDSQ-P 0~3점"),
    Borderline("주의", "KDSQ-P 4~10점 후 KDSQ-C 0~5점"),
    HighRisk("위험", "KDSQ-C 6~30점");   // 화면 문구: "전문적인 검진이 필요합니다"

    private final String displayName;
    private final String description;

    RiskLevel(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
