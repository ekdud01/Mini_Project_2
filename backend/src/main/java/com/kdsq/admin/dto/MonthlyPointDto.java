package com.kdsq.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 대시보드 월별 추이 1개월 값 (Entity 설계서 8.5).
 * month = "2026-09" 형식. 화면 차트(Chart.js)에 th:inline="javascript"로 그대로 전달한다.
 *   → [{ month: '2026-09', resultCount: 12, avgTotal: 7.2 }, ...]
 *
 * 설계서는 record이지만, Thymeleaf의 JavaScript 직렬화와 템플릿 접근이 어떤 환경에서도 동작하도록 getter가 있는 클래스로 만든다.
 */
@Getter
@RequiredArgsConstructor
public class MonthlyPointDto {

    private final String month;        // "2026-09"
    private final long resultCount;    // 그 달 검사 건수 (1차 종료 포함)
    private final double avgTotal;     // 그 달 KDSQ-C 총점 평균 (없으면 0)
}
