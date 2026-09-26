package com.kdsq.survey;

/** 검사 유형 (Entity 설계서 5.3) */
public enum ExamType {
    KDSQ_P("1차 선별검사 (5문항)"),
    KDSQ_C("2차 상세검사 (15문항)");

    private final String description;

    ExamType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
