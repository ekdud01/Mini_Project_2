package com.kdsq.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.kdsq.admin.dto.DashboardStatsDto;
import com.kdsq.admin.dto.MonthlyPointDto;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;
import com.kdsq.member.UserStatus;
import com.kdsq.result.MonthlyTrend;
import com.kdsq.result.RiskLevel;
import com.kdsq.result.RiskLevelCount;
import com.kdsq.result.ScoreAverages;
import com.kdsq.result.SurveyResultRepository;

/**
 * AdminStatisticsService 단위 테스트 (Entity 설계서 8.3·8.5, UI 설계서 4.2 ADM-02)
 *
 * Repository 집계 결과를 가짜로 정해 두고, 서비스가 맡은 가공(없는 등급 0 채우기, 비율(%)·반올림,
 * 빈 달 채우기, 평균 없는 달 null)이 설계서대로 되는지 확인한다.
 * 예시 숫자는 sample-data.sql로 실제 화면에서 확인한 값(위험 34/109건 = 31.2%)과 같다.
 */
@ExtendWith(MockitoExtension.class)
class AdminStatisticsServiceTest {

    @Mock
    MemberRepository memberRepository;

    @Mock
    SurveyResultRepository surveyResultRepository;

    @InjectMocks
    AdminStatisticsService adminStatisticsService;

    // ───────────── Repository projection(인터페이스) 가짜 값 만들기 ─────────────

    private static RiskLevelCount count(RiskLevel level, long count) {
        return new RiskLevelCount() {
            public RiskLevel getRiskLevel() { return level; }
            public Long getCount() { return count; }
        };
    }

    private static ScoreAverages averages(Double total, Double memory, Double other, Double adl) {
        return new ScoreAverages() {
            public Double getAvgTotal() { return total; }
            public Double getAvgMemory() { return memory; }
            public Double getAvgOther() { return other; }
            public Double getAvgAdl() { return adl; }
        };
    }

    private static MonthlyTrend trend(YearMonth ym, long resultCount, Double avgTotal) {
        return new MonthlyTrend() {
            public Integer getYear() { return ym.getYear(); }
            public Integer getMonth() { return ym.getMonthValue(); }
            public Long getResultCount() { return resultCount; }
            public Double getAvgTotal() { return avgTotal; }
        };
    }

    /** getDashboard()가 호출하는 Repository 메서드 전부에 가짜 응답을 정한다 */
    private void givenStats(long active, long withdrawn, long totalResults, List<RiskLevelCount> counts,
                            ScoreAverages avg, List<MonthlyTrend> monthly) {
        given(memberRepository.countByRoleAndStatus(Role.MEMBER, UserStatus.ACTIVE)).willReturn(active);
        given(memberRepository.countByRoleAndStatus(Role.MEMBER, UserStatus.WITHDRAWN)).willReturn(withdrawn);
        given(surveyResultRepository.countByActiveTrue()).willReturn(totalResults);
        given(surveyResultRepository.countGroupByRiskLevel()).willReturn(counts);
        given(surveyResultRepository.findScoreAverages()).willReturn(avg);
        given(surveyResultRepository.findMonthlyTrend(any(LocalDateTime.class))).willReturn(monthly);
        given(surveyResultRepository.findRecentByRiskLevel(eq(RiskLevel.HighRisk), any(Pageable.class)))
                .willReturn(List.of());
    }

    // ───────────────────── 회원 수 · 위험도 분포 ─────────────────────

    @Test
    @DisplayName("회원 수: 활성 회원과 탈퇴 회원을 따로 센다 (\"탈퇴 N명 별도\")")
    void memberCounts() {
        givenStats(24, 2, 0, List.of(), averages(null, null, null, null), List.of());

        DashboardStatsDto stats = adminStatisticsService.getDashboard();

        assertThat(stats.getTotalMembers()).isEqualTo(24);
        assertThat(stats.getWithdrawnMembers()).isEqualTo(2);
    }

    @Test
    @DisplayName("위험도 비율은 ×100 한 % 값이고 소수점 첫째 자리로 반올림한다 (34/109 → 31.2)")
    void riskRatios_percentRounded() {
        givenStats(24, 2, 109,
                List.of(count(RiskLevel.Normal, 54), count(RiskLevel.Borderline, 21), count(RiskLevel.HighRisk, 34)),
                averages(9.9, 3.2, 3.0, 3.7), List.of());

        DashboardStatsDto stats = adminStatisticsService.getDashboard();

        assertThat(stats.getRiskLevelRatios().get(RiskLevel.Normal)).isEqualTo(49.5);
        assertThat(stats.getRiskLevelRatios().get(RiskLevel.Borderline)).isEqualTo(19.3);
        assertThat(stats.getRiskLevelRatios().get(RiskLevel.HighRisk)).isEqualTo(31.2);
        // 위험 판정 카드용 getter
        assertThat(stats.getHighRiskCount()).isEqualTo(34);
        assertThat(stats.getHighRiskRatio()).isEqualTo(31.2);
    }

    @Test
    @DisplayName("결과가 없는 등급도 0건·0.0%로 채워서 세 등급이 항상 들어 있다")
    void riskCounts_missingLevelFilledWithZero() {
        givenStats(3, 0, 4, List.of(count(RiskLevel.Normal, 4)), averages(null, null, null, null), List.of());

        DashboardStatsDto stats = adminStatisticsService.getDashboard();

        assertThat(stats.getRiskLevelCounts()).containsOnlyKeys(RiskLevel.values());
        assertThat(stats.getRiskLevelCounts().get(RiskLevel.HighRisk)).isZero();
        assertThat(stats.getRiskLevelRatios().get(RiskLevel.Normal)).isEqualTo(100.0);
        assertThat(stats.getRiskLevelRatios().get(RiskLevel.Borderline)).isEqualTo(0.0);
        assertThat(stats.getHighRiskCount()).isZero();
    }

    @Test
    @DisplayName("검사 결과가 0건이면 비율은 0.0 (0으로 나누지 않음), 평균도 0.0")
    void noResults_zeroRatiosAndAverages() {
        givenStats(0, 0, 0, List.of(), averages(null, null, null, null), List.of());

        DashboardStatsDto stats = adminStatisticsService.getDashboard();

        assertThat(stats.getRiskLevelRatios().values()).containsOnly(0.0);
        assertThat(stats.getAvgTotal()).isEqualTo(0.0);
        assertThat(stats.getAvgMemory()).isEqualTo(0.0);
        assertThat(stats.getAvgOther()).isEqualTo(0.0);
        assertThat(stats.getAvgAdl()).isEqualTo(0.0);
    }

    // ───────────────────── 평균 점수 ─────────────────────

    @Test
    @DisplayName("종합·영역별 평균은 소수점 첫째 자리로 반올림한다")
    void averages_rounded() {
        givenStats(24, 2, 109, List.of(), averages(9.8765, 3.25, 2.96, 3.649), List.of());

        DashboardStatsDto stats = adminStatisticsService.getDashboard();

        assertThat(stats.getAvgTotal()).isEqualTo(9.9);
        assertThat(stats.getAvgMemory()).isEqualTo(3.3);
        assertThat(stats.getAvgOther()).isEqualTo(3.0);
        assertThat(stats.getAvgAdl()).isEqualTo(3.6);
    }

    // ───────────────────── 월별 추이 ─────────────────────

    @Test
    @DisplayName("월별 추이는 이번 달까지 최근 12개월을 오래된 달부터 채운다")
    void monthly_twelveMonthsEndingThisMonth() {
        givenStats(24, 2, 0, List.of(), averages(null, null, null, null), List.of());
        YearMonth now = YearMonth.now();

        List<MonthlyPointDto> monthly = adminStatisticsService.getDashboard().getMonthly();

        assertThat(monthly).hasSize(12);
        assertThat(monthly.get(0).getMonth()).isEqualTo(now.minusMonths(11).toString());   // "2025-10" 형식
        assertThat(monthly.get(11).getMonth()).isEqualTo(now.toString());
    }

    @Test
    @DisplayName("검사가 없는 달은 건수 0, 평균 null (0점으로 오해하지 않도록 화면에서 '-')")
    void monthly_emptyMonth_countZeroAvgNull() {
        YearMonth now = YearMonth.now();
        givenStats(24, 2, 27, List.of(), averages(null, null, null, null),
                List.of(trend(now, 27, 11.14)));

        List<MonthlyPointDto> monthly = adminStatisticsService.getDashboard().getMonthly();

        MonthlyPointDto lastMonth = monthly.get(10);
        assertThat(lastMonth.getResultCount()).isZero();
        assertThat(lastMonth.getAvgTotal()).isNull();

        MonthlyPointDto thisMonth = monthly.get(11);
        assertThat(thisMonth.getResultCount()).isEqualTo(27);
        assertThat(thisMonth.getAvgTotal()).isEqualTo(11.1);   // 반올림
    }

    @Test
    @DisplayName("1차(KDSQ-P)에서만 끝난 검사만 있는 달은 건수는 있고 평균은 null")
    void monthly_onlyFirstExam_avgNull() {
        YearMonth now = YearMonth.now();
        givenStats(24, 2, 3, List.of(), averages(null, null, null, null),
                List.of(trend(now, 3, null)));

        MonthlyPointDto thisMonth = adminStatisticsService.getDashboard().getMonthly().get(11);

        assertThat(thisMonth.getResultCount()).isEqualTo(3);
        assertThat(thisMonth.getAvgTotal()).isNull();
    }
}
