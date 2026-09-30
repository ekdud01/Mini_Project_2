package com.kdsq.admin.dto;

import java.util.List;
import java.util.Map;

import com.kdsq.result.RiskLevel;
import com.kdsq.result.SurveyResult;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 관리자 대시보드(ADM-02) 화면 값 (Entity 설계서 8.5, UI 설계서 4.2).
 * 컨트롤러가 Model 이름 "stats"로 admin/dashboard 화면에 전달한다.
 *
 * | 필드                                     | 화면 표시                                   |
 * | totalMembers                            | 전체 회원 수(활성)                           |
 * | withdrawnMembers                        | 탈퇴 회원 수 ("탈퇴 N명 별도")                 |
 * | totalResults                            | 전체 검사 건수(활성). 0이면 "검사 결과가 없습니다." |
 * | riskLevelCounts / riskLevelRatios       | 위험도 분포 건수 / 비율(%). 세 등급 모두 항상 들어 있음 |
 * | avgTotal, avgMemory, avgOther, avgAdl   | 종합점수 평균, 영역별 평균 (소수점 첫째 자리)      |
 * | monthly                                 | 최근 12개월 추이 (건수 없으면 0, 평균 없으면 null) |
 * | highRiskCount / highRiskRatio (getter)  | 위험 판정 카드 (위험 건수 / 전체 대비 %)          |
 * | recentHighRisk                          | 최근 위험 검사 5건 (SurveyResult, member·survey 함께 조회됨) |
 */
@Getter
@RequiredArgsConstructor
public class DashboardStatsDto {

    private final long totalMembers;
    private final long withdrawnMembers;
    private final long totalResults;
    private final Map<RiskLevel, Long> riskLevelCounts;
    private final Map<RiskLevel, Double> riskLevelRatios;
    private final double avgTotal;
    private final double avgMemory;
    private final double avgOther;
    private final double avgAdl;
    private final List<MonthlyPointDto> monthly;
    private final List<SurveyResult> recentHighRisk;   // 템플릿: r.id, r.member.name, r.totalScore, r.riskLevel, r.createdAt

    /** AdminStatisticsService에서 조립 (Entity 설계서 8.5 코드와 같은 순서) */
    public static DashboardStatsDto of(long totalMembers, long withdrawnMembers, long totalResults,
                                       Map<RiskLevel, Long> riskLevelCounts, Map<RiskLevel, Double> riskLevelRatios,
                                       double avgTotal, double avgMemory, double avgOther, double avgAdl,
                                       List<MonthlyPointDto> monthly, List<SurveyResult> recentHighRisk) {
        return new DashboardStatsDto(totalMembers, withdrawnMembers, totalResults, riskLevelCounts, riskLevelRatios,
                avgTotal, avgMemory, avgOther, avgAdl, monthly, recentHighRisk);
    }

    /** 위험 판정 카드: 위험(HighRisk) 건수. 템플릿에서 ${stats.highRiskCount} */
    public long getHighRiskCount() {
        return riskLevelCounts.getOrDefault(RiskLevel.HighRisk, 0L);
    }

    /** 위험 판정 카드: 전체 검사 대비 위험 비율(%). 템플릿에서 ${stats.highRiskRatio} */
    public double getHighRiskRatio() {
        return riskLevelRatios.getOrDefault(RiskLevel.HighRisk, 0.0);
    }
}
