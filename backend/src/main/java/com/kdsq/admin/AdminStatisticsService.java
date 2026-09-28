package com.kdsq.admin;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.admin.dto.DashboardStatsDto;
import com.kdsq.admin.dto.MonthlyPointDto;
import com.kdsq.admin.dto.RecentHighRiskDto;
import com.kdsq.result.RiskLevel;
import com.kdsq.survey.ExamType;

/**
 * 관리자 대시보드 통계 (Entity 설계서 8.5).
 *
 * [임시] 지금은 화면 작업용 샘플 값을 돌려준다.
 * 결과 Repository(이주혁)가 develop에 머지되면 내부를 설계서 8.5 코드(실제 집계)로 교체한다.
 * 반환 타입(DashboardStatsDto)과 필드는 그대로이므로 컨트롤러·템플릿은 고칠 필요 없다.
 */
@Service
@Transactional(readOnly = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatisticsService {

    public DashboardStatsDto getDashboard() {
        return sample();
    }

    /** [임시] 샘플 값: 회원 26명, 검사 119건 (정상 52 / 주의 38 / 위험 29) */
    private DashboardStatsDto sample() {
        Map<RiskLevel, Long> counts = new EnumMap<>(RiskLevel.class);
        counts.put(RiskLevel.Normal, 52L);
        counts.put(RiskLevel.Borderline, 38L);
        counts.put(RiskLevel.HighRisk, 29L);

        Map<RiskLevel, Double> ratios = new EnumMap<>(RiskLevel.class);
        ratios.put(RiskLevel.Normal, 43.7);
        ratios.put(RiskLevel.Borderline, 31.9);
        ratios.put(RiskLevel.HighRisk, 24.4);

        // 최근 12개월 (이번 달 포함). 첫 두 달은 데이터 없는 달(0) 예시
        long[] monthCounts = {0, 0, 4, 7, 9, 8, 11, 12, 10, 14, 17, 27};
        double[] monthAvgs = {0.0, 0.0, 6.5, 7.0, 7.4, 6.8, 8.1, 7.9, 7.2, 8.3, 7.6, 8.0};
        YearMonth start = YearMonth.now().minusMonths(11);
        List<MonthlyPointDto> monthly = IntStream.range(0, 12)
                .mapToObj(i -> new MonthlyPointDto(start.plusMonths(i).toString(), monthCounts[i], monthAvgs[i]))
                .toList();

        LocalDateTime now = LocalDateTime.now();
        List<RecentHighRiskDto> recent = List.of(
                new RecentHighRiskDto(411L, "홍길동", ExamType.KDSQ_C, 14, RiskLevel.HighRisk, now.minusHours(3)),
                new RecentHighRiskDto(405L, "김영희", ExamType.KDSQ_C, 9, RiskLevel.HighRisk, now.minusDays(1)),
                new RecentHighRiskDto(398L, "이철수", ExamType.KDSQ_C, 11, RiskLevel.HighRisk, now.minusDays(2)),
                new RecentHighRiskDto(390L, "박순자", ExamType.KDSQ_C, 7, RiskLevel.HighRisk, now.minusDays(4)),
                new RecentHighRiskDto(377L, "최민수", ExamType.KDSQ_C, 17, RiskLevel.HighRisk, now.minusDays(6)));

        return new DashboardStatsDto(26, 119, counts, ratios,
                7.8, 2.9, 2.6, 2.3, monthly, recent);
    }
}
