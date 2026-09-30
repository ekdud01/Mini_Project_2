package com.kdsq.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.admin.dto.ResultSearchCondition;
import com.kdsq.result.SurveyResult;
import com.kdsq.result.SurveyResultRepository;
import com.kdsq.result.SurveyResultSpecs;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 검사 결과 관리 (UI 설계서 4.6~4.7, Entity 설계서 8.4.1)
 *
 * Entity(SurveyResult)를 그대로 돌려줘도 되는 이유 (open-in-view=false):
 *  - 목록 findAll(spec, pageable): Repository에 @EntityGraph(member, survey) → 함께 조회됨
 *  → 템플릿에서 r.member.name, r.examType을 읽어도 LazyInitializationException이 나지 않는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@PreAuthorize("hasRole('ADMIN')")
public class AdminResultService {

    private final SurveyResultRepository surveyResultRepository;   // 주혁 님 파일 (수정하지 않고 사용만)

    /** ADM-05 목록: 활성 결과 중 선택한 조건만 적용 (페이지 크기·정렬은 컨트롤러의 @PageableDefault) */
    public Page<SurveyResult> search(ResultSearchCondition cond, Pageable pageable) {
        Specification<SurveyResult> spec = SurveyResultSpecs.isActive()
                .and(SurveyResultSpecs.examTypeEq(cond.getExamType()))
                .and(SurveyResultSpecs.riskLevelIn(cond.getRiskLevels()))
                .and(SurveyResultSpecs.memberNameContains(cond.getName()))
                .and(SurveyResultSpecs.createdBetween(cond.getFrom(), cond.getTo()));

        return surveyResultRepository.findAll(spec, pageable);
    }
}
