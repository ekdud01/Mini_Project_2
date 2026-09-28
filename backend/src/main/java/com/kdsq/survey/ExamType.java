package com.kdsq.survey;

/** 검사 유형 (Entity 설계서 5.3) */
public enum ExamType {
    KDSQ_P("KDSQ-P", "1차 선별검사 (5문항)"),
    KDSQ_C("KDSQ-C", "2차 상세검사 (15문항)");

    private final String label;         // 화면 표기 (관리자 화면 ${r.examType.label}, React utils/kdsq.js와 같은 값)
    private final String description;

    ExamType(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }
}
