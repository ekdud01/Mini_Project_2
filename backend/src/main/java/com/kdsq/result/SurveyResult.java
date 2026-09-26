package com.kdsq.result;

import com.kdsq.global.common.BaseEntity;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Member;
import com.kdsq.survey.ExamType;
import com.kdsq.survey.Survey;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 검사 결과 (Entity 설계서 4.3). 검사 1회당 1건만 저장한다.
 *  - 1차(KDSQ-P) 0~3점: createFirstOnly()  → Normal
 *  - 1차 4점 이상 + 2차(KDSQ-C): createWithSecond() → Borderline / HighRisk
 * 관리자 삭제는 active = false (소프트 삭제)
 */
@Entity
@Table(name = "survey_results",
        indexes = {
                @Index(name = "idx_survey_result_member_created", columnList = "member_id, created_at"),
                @Index(name = "idx_survey_result_created_at", columnList = "created_at"),
                @Index(name = "idx_survey_result_risk_level", columnList = "risk_level"),
                @Index(name = "idx_survey_result_active_created", columnList = "active, created_at")
        })
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class SurveyResult extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey; // 마지막으로 완료한 설문 (KDSQ-P 또는 KDSQ-C)

    @Column(name = "first_score", nullable = false)
    private Integer firstScore;

    @Column(name = "memory_score")
    private Integer memoryScore; // KDSQ-P로 끝난 결과는 null

    @Column(name = "other_score")
    private Integer otherScore;

    @Column(name = "adl_score")
    private Integer adlScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;

    @Column(nullable = false)
    private Boolean active = true;

    /** 검사 유형은 저장하지 않고 연결된 설문에서 조회 */
    public ExamType getExamType() {
        return this.survey.getExamType();
    }

    /** KDSQ-C 총점. KDSQ-P로 끝난 결과는 null (저장하지 않고 계산) */
    public Integer getTotalScore() {
        if (getExamType() == ExamType.KDSQ_P) {
            return null;
        }
        return this.memoryScore + this.otherScore + this.adlScore;
    }

    /** 1차(KDSQ-P) 0~3점으로 검사가 끝난 경우 */
    public static SurveyResult createFirstOnly(Member member, Survey pSurvey, int firstScore) {
        if (firstScore >= 4) {
            throw new BusinessException(ErrorCode.KDSQ_C_REQUIRED);
        }
        SurveyResult result = new SurveyResult();
        result.member = member;
        result.survey = pSurvey;
        result.firstScore = firstScore;
        result.riskLevel = RiskLevel.Normal;
        return result;
    }

    /** 1차 4점 이상 후 2차(KDSQ-C)까지 완료한 경우 */
    public static SurveyResult createWithSecond(Member member, Survey cSurvey, int firstScore,
                                                int memoryScore, int otherScore, int adlScore) {
        if (firstScore < 4) {
            throw new BusinessException(ErrorCode.KDSQ_C_NOT_ALLOWED);
        }
        SurveyResult result = new SurveyResult();
        result.member = member;
        result.survey = cSurvey;
        result.firstScore = firstScore;
        result.memoryScore = memoryScore;
        result.otherScore = otherScore;
        result.adlScore = adlScore;
        result.riskLevel = result.evaluateRisk();
        return result;
    }

    private RiskLevel evaluateRisk() {
        if (getExamType() == ExamType.KDSQ_P) {
            return RiskLevel.Normal; // 1차에서 끝난 결과는 0~3점만 저장되므로 항상 정상
        }
        return (getTotalScore() <= 5) ? RiskLevel.Borderline : RiskLevel.HighRisk;
    }

    /** 관리자 삭제 (소프트 삭제) */
    public void deactivate() {
        this.active = false;
    }

    /** 점수 범위 검증 (Entity 설계서 9.2) */
    @PrePersist
    @PreUpdate
    private void validateScores() {
        if (firstScore == null || firstScore < 0 || firstScore > 10) {
            throw new IllegalArgumentException("1차 점수는 0~10점이어야 합니다.");
        }
        for (Integer score : new Integer[] {memoryScore, otherScore, adlScore}) {
            if (score != null && (score < 0 || score > 10)) {
                throw new IllegalArgumentException("영역별 점수는 0~10점이어야 합니다.");
            }
        }
    }
}
