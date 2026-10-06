package com.kdsq.result.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.kdsq.result.RiskLevel;
import com.kdsq.result.SurveyResult;
import com.kdsq.survey.ExamType;

/**
 * 검사 결과 응답 (REST API 설계서 4.3.1~4.3.4). 제출·상세·이력이 같은 형식을 쓴다.
 *  - memberId, solutions: 상세 조회에만 있음 (null이면 JSON에서 뺀다)
 *  - 영역 점수·totalScore: 1차에서 끝난 결과는 null로 그대로 보낸다 (화면에서 '-' 표시)
 */
public record ResultResponse(
        Long id,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long memberId,
        ExamType examType,
        Integer firstScore,
        Integer memoryScore,
        Integer otherScore,
        Integer adlScore,
        Integer totalScore,
        RiskLevel riskLevel,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime createdAt,
        @JsonInclude(JsonInclude.Include.NON_NULL) List<SolutionResponse> solutions
) {

    /** 제출·이력 응답 (survey를 함께 조회했거나 영속 상태일 때 호출) */
    public static ResultResponse from(SurveyResult r) {
        return of(r, null, null);
    }

    /** 상세 응답: 회원 id와 관리 안내 포함 (Normal이면 solutions는 빈 배열) */
    public static ResultResponse detail(SurveyResult r, List<SolutionResponse> solutions) {
        return of(r, r.getMember().getId(), solutions);
    }

    private static ResultResponse of(SurveyResult r, Long memberId, List<SolutionResponse> solutions) {
        return new ResultResponse(
                r.getId(), memberId, r.getExamType(),
                r.getFirstScore(), r.getMemoryScore(), r.getOtherScore(), r.getAdlScore(),
                r.getTotalScore(), r.getRiskLevel(), r.getCreatedAt(), solutions);
    }
}
