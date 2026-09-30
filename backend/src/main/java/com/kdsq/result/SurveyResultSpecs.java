package com.kdsq.result;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.kdsq.survey.ExamType;

/**
 * ADM-05 검사 결과 복합 검색 조건 (Entity 설계서 8.4.1)
 *
 * Specification = "WHERE 조건 한 조각". 선택한 조건만 .and()로 이어 붙여 동적 쿼리를 만든다.
 * 조건 조립은 AdminResultService.search()에서 한다
 * (result 패키지가 admin의 DTO를 알면 의존 방향이 거꾸로 된다 — Entity 설계서 1.4).
 *
 * 설계서 코드와 다른 점 (Spring Data JPA 4 / 컴파일 대비):
 *  1) 조건이 없을 때 null 대신 cb.conjunction()(항상 참)
 *  2) root.<Boolean>get, root.<String>get, root.<LocalDateTime>get 처럼 타입을 적는다
 */
public final class SurveyResultSpecs {

    private SurveyResultSpecs() {
        // 조건 조각만 모아 둔 도구 클래스 → 객체를 만들 필요가 없어서 생성자를 막는다
    }

    /** 삭제(비활성)되지 않은 결과만 — 항상 적용 */
    public static Specification<SurveyResult> isActive() {
        return (root, query, cb) -> cb.isTrue(root.<Boolean>get("active"));
    }

    /** 검사 종류: SurveyResult에는 종류가 없고 연결된 Survey에 있으므로 survey를 join 해서 비교 */
    public static Specification<SurveyResult> examTypeEq(ExamType examType) {
        return (root, query, cb) -> examType == null
                ? cb.conjunction()
                : cb.equal(root.join("survey").get("examType"), examType);
    }

    /** 위험도: 체크박스 여러 개 → WHERE risk_level IN (...) */
    public static Specification<SurveyResult> riskLevelIn(List<RiskLevel> riskLevels) {
        return (root, query, cb) -> (riskLevels == null || riskLevels.isEmpty())
                ? cb.conjunction()
                : root.get("riskLevel").in(riskLevels);
    }

    /** 회원 이름 부분 검색: WHERE member.name LIKE '%길동%' (앞뒤 공백 제거) */
    public static Specification<SurveyResult> memberNameContains(String name) {
        return (root, query, cb) -> !StringUtils.hasText(name)
                ? cb.conjunction()
                : cb.like(root.join("member").<String>get("name"), "%" + name.trim() + "%");
    }

    /**
     * 기간: from 00:00 이상 ~ to 다음날 00:00 미만
     * (to 당일 23시 59분 검사도 포함하려면 "다음날 0시 미만"으로 비교하는 게 안전)
     */
    public static Specification<SurveyResult> createdBetween(LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            if (from == null && to == null) {
                return cb.conjunction();
            }
            if (from == null) {
                return cb.lessThan(root.<LocalDateTime>get("createdAt"), to.plusDays(1).atStartOfDay());
            }
            if (to == null) {
                return cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), from.atStartOfDay());
            }
            return cb.and(
                    cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), from.atStartOfDay()),
                    cb.lessThan(root.<LocalDateTime>get("createdAt"), to.plusDays(1).atStartOfDay()));
        };
    }
}
