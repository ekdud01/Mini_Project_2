package com.kdsq.admin.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 대시보드 월별 추이 1개월 값 (Entity 설계서 8.5).
 * month = "2026-09" 형식. 화면 차트(Chart.js)에 th:inline="javascript"로 그대로 전달한다.
 *   → [{ month: '2026-09', resultCount: 12, avgTotal: 7.2 }, { month: '2026-08', resultCount: 0, avgTotal: null }, ...]
 *
 * avgTotal은 KDSQ-C 평균이 없는 달(검사가 없거나 1차에서만 끝난 검사만 있는 달)이면 null이다.
 * 0으로 채우면 "평균 0점"으로 오해할 수 있어, 화면에서 "-"·점선(데이터 없음)으로 표시한다.
 *
 * 설계서는 record이지만, Thymeleaf의 JavaScript 직렬화와 템플릿 접근이 어떤 환경에서도 동작하도록 getter가 있는 클래스로 만든다.
 */
@Getter
@RequiredArgsConstructor
public class MonthlyPointDto {

    private final String month;        // "2026-09"
    private final long resultCount;    // 그 달 검사 건수 (1차 종료 포함, 없으면 0)
    private final Double avgTotal;     // 그 달 KDSQ-C 총점 평균 (소수점 첫째 자리, 없으면 null)
}
