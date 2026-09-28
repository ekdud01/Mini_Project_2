package com.kdsq.result;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SurveyResultRepository extends JpaRepository<SurveyResult,Long>,
        JpaSpecificationExecutor<SurveyResult> {
    @Query("SELECT r FROM SurveyResult r "+
    "JOIN FETCH r.member m JOIN FETCH r.survey s "+
    "WHERE r.id=:id AND r.active=true")
    Optional<SurveyResult> findActiveDetailById(@Param("id") Long id);

    @Query(value = "SELECT r FROM SurveyResult r JOIN FETCH r.survey "+
    "WHERE r.member.id=:memberId AND r.active=true "+
    "ORDER BY r.createdAt DESC",
            countQuery = "SELECT COUNT(r) FROM SurveyResult r "+ "WHERE r.member.id=:memberId AND r.active=true")
    Page<SurveyResult> findByMemberIdOrderByCreatedAtDesc(@Param("memberId") Long memberId, Pageable pageable);

    @EntityGraph(attributePaths = "survey")
    @Query("SELECT r FROM SurveyResult r "+
    "WHERE r.member.id=:memberId AND r.active=true "+
    "ORDER BY r.createdAt DESC")
    List<SurveyResult> findActiveByMemberId(@Param("memberId") Long memberId);

    @EntityGraph(attributePaths = {"member", "survey"})
    Page<SurveyResult> findAll(Specification<SurveyResult> specification, Pageable pageable);
    /** 전체 검사 건수(활성) */
    long countByActiveTrue();

    /** 위험도 분포: 등급별 건수 */
    @Query("SELECT r.riskLevel AS riskLevel, COUNT(r) AS count " +
            "FROM SurveyResult r WHERE r.active = true GROUP BY r.riskLevel")
    List<RiskLevelCount> countGroupByRiskLevel();

    /** 종합점수 평균 + 영역별 평균 (KDSQ-P로 끝난 결과는 점수가 null이라 AVG에서 자동 제외) */
    @Query("SELECT AVG(r.memoryScore + r.otherScore + r.adlScore) AS avgTotal, " +
            "AVG(r.memoryScore) AS avgMemory, AVG(r.otherScore) AS avgOther, AVG(r.adlScore) AS avgAdl " +
            "FROM SurveyResult r WHERE r.active = true")
    ScoreAverages findScoreAverages();

    /** 월별 추이: from 이후 월별 검사 건수와 KDSQ-C 총점 평균 */
    @Query("SELECT YEAR(r.createdAt) AS year, MONTH(r.createdAt) AS month, " +
            "COUNT(r) AS resultCount, AVG(r.memoryScore + r.otherScore + r.adlScore) AS avgTotal " +
            "FROM SurveyResult r WHERE r.active = true AND r.createdAt >= :from " +
            "GROUP BY YEAR(r.createdAt), MONTH(r.createdAt) " +
            "ORDER BY YEAR(r.createdAt), MONTH(r.createdAt)")
    List<MonthlyTrend> findMonthlyTrend(@Param("from") LocalDateTime from);

    /** 최근 위험 검사 목록 (대시보드는 PageRequest.of(0, 5)) */
    @EntityGraph(attributePaths = {"member", "survey"})
    @Query("SELECT r FROM SurveyResult r " +
            "WHERE r.riskLevel = :riskLevel AND r.active = true " +
            "ORDER BY r.createdAt DESC")
    List<SurveyResult> findRecentByRiskLevel(@Param("riskLevel") RiskLevel riskLevel, Pageable pageable);

}
