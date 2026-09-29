package com.kdsq.admin;

import java.time.YearMonth;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.admin.dto.DashboardStatsDto;
import com.kdsq.admin.dto.MonthlyPointDto;
import com.kdsq.member.MemberRepository;
import com.kdsq.member.Role;
import com.kdsq.member.UserStatus;
import com.kdsq.result.MonthlyTrend;
import com.kdsq.result.RiskLevel;
import com.kdsq.result.ScoreAverages;
import com.kdsq.result.SurveyResult;
import com.kdsq.result.SurveyResultRepository;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 대시보드 통계 (Entity 설계서 8.3·8.5).
 * Repository는 DB에서 개수·평균·월별 묶음을 집계만 하고, 비율(%) 계산·반올림·빈 달 채우기·DTO 조립은 여기서 한다.
 * 모든 집계는 관리자가 삭제하지 않은 결과(active = true)만 대상으로 한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatisticsService {

    private static final int MONTHS = 12;            // 월별 추이 기간 (이번 달 포함)
    private static final int RECENT_HIGH_RISK = 5;   // 최근 위험 검사 표시 건수

    private final MemberRepository memberRepository;
    private final SurveyResultRepository surveyResultRepository;

    public DashboardStatsDto getDashboard() {
        long totalMembers = memberRepository.countByRoleAndStatus(Role.MEMBER, UserStatus.ACTIVE);
        long withdrawnMembers = memberRepository.countByRoleAndStatus(Role.MEMBER, UserStatus.WITHDRAWN);   // "탈퇴 N명 별도"
        long totalResults = surveyResultRepository.countByActiveTrue();

        // 위험도 분포: 등급별 건수(결과가 없는 등급은 0) → 비율(%). 화면은 건수와 비율을 함께 표시
        Map<RiskLevel, Long> counts = new EnumMap<>(RiskLevel.class);
        for (RiskLevel level : RiskLevel.values()) {
            counts.put(level, 0L);
        }
        surveyResultRepository.countGroupByRiskLevel()
                .forEach(c -> counts.put(c.getRiskLevel(), c.getCount()));
        Map<RiskLevel, Double> ratios = new EnumMap<>(RiskLevel.class);
        counts.forEach((level, cnt) ->
                ratios.put(level, totalResults == 0 ? 0.0 : round1(cnt * 100.0 / totalResults)));

        // 종합·영역별 평균 (KDSQ-C 결과만): 소수점 첫째 자리 반올림, 결과가 없으면 0
        ScoreAverages avg = surveyResultRepository.findScoreAverages();

        List<MonthlyPointDto> monthly = monthlyTrend();

        List<SurveyResult> recentHighRisk = surveyResultRepository
                .findRecentByRiskLevel(RiskLevel.HighRisk, PageRequest.of(0, RECENT_HIGH_RISK));

        return DashboardStatsDto.of(totalMembers, withdrawnMembers, totalResults, counts, ratios,
                round1(nvl(avg.getAvgTotal())), round1(nvl(avg.getAvgMemory())),
                round1(nvl(avg.getAvgOther())), round1(nvl(avg.getAvgAdl())),
                monthly, recentHighRisk);
    }

    /**
     * 최근 12개월 월별 추이. 데이터가 없는 달도 빠짐없이 12개를 만든다.
     *  - 검사 건수: 없으면 0
     *  - KDSQ-C 평균: 없으면 null (검사가 없는 달, 1차에서만 끝난 검사만 있는 달) → 화면에서 "-"·점선
     */
    private List<MonthlyPointDto> monthlyTrend() {
        YearMonth start = YearMonth.now().minusMonths(MONTHS - 1);
        Map<YearMonth, MonthlyTrend> byMonth = surveyResultRepository
                .findMonthlyTrend(start.atDay(1).atStartOfDay()).stream()
                .collect(Collectors.toMap(t -> YearMonth.of(t.getYear(), t.getMonth()), Function.identity()));

        return IntStream.range(0, MONTHS)
                .mapToObj(start::plusMonths)
                .map(ym -> {
                    MonthlyTrend t = byMonth.get(ym);
                    long count = (t == null) ? 0 : t.getResultCount();
                    Double avgTotal = (t == null || t.getAvgTotal() == null) ? null : round1(t.getAvgTotal());
                    return new MonthlyPointDto(ym.toString(), count, avgTotal);
                })
                .toList();
    }

    private static double nvl(Double v) {
        return v == null ? 0.0 : v;
    }

    private static double round1(double v) {
        return Math.round(v * 10) / 10.0;
    }
}
