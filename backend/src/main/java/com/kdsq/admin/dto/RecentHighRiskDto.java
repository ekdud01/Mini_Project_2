package com.kdsq.admin.dto;

import java.time.LocalDateTime;

import com.kdsq.result.RiskLevel;
import com.kdsq.result.SurveyResult;
import com.kdsq.survey.ExamType;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 대시보드 "최근 위험 검사 목록" 1건 (Entity 설계서 8.3 "DTO 변환").
 * 엔티티를 화면에 직접 넘기지 않고 필요한 값만 담는다 (open-in-view=false라 화면에서 지연 로딩을 할 수 없음).
 *
 * 템플릿 사용 예) th:each="e : ${stats.recentHighRisk}"
 *   ${e.memberName}, ${e.examType.label}, ${e.totalScore}, ${e.riskLevel.displayName},
 *   ${#temporals.format(e.createdAt, 'yyyy-MM-dd')}, @{/admin/results/{id}(id=${e.resultId})}
 */
@Getter
@RequiredArgsConstructor
public class RecentHighRiskDto {

    private final Long resultId;
    private final String memberName;
    private final ExamType examType;
    private final Integer totalScore;
    private final RiskLevel riskLevel;
    private final LocalDateTime createdAt;

    /** 조회한 엔티티(member·survey 함께 조회됨)에서 변환 */
    public static RecentHighRiskDto from(SurveyResult r) {
        return new RecentHighRiskDto(r.getId(), r.getMember().getName(), r.getExamType(),
                r.getTotalScore(), r.getRiskLevel(), r.getCreatedAt());
    }
}
