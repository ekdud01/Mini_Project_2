package com.kdsq.result;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kdsq.global.common.PageResponse;
import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.result.dto.ResultResponse;
import com.kdsq.result.dto.ResultSubmitRequest;
import com.kdsq.result.dto.SolutionResponse;
import com.kdsq.survey.ExamType;
import com.kdsq.survey.Survey;
import com.kdsq.survey.SurveyRepository;

import lombok.RequiredArgsConstructor;

/**
 * 검사 결과 제출·상세·내 이력 (REST API 설계서 4.3, Entity 설계서 4.3·8.2)
 * 판정(Normal / Borderline / HighRisk)과 1차 점수 규칙(422)은 SurveyResult의 정적 팩토리가 맡는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResultService {

    private final MemberRepository memberRepository;
    private final SurveyRepository surveyRepository;
    private final SurveyResultRepository surveyResultRepository;
    private final SolutionRepository solutionRepository;
    private final ScoringService scoringService;

    /**
     * 검사 결과 제출: surveyId가 가리키는 설문의 검사 유형으로 1차 종료 / 2차 완료를 나눈다.
     *  - KDSQ-P: answers(5개) 채점 → 0~3점이면 Normal 저장, 4점 이상이면 422 KDSQ_C_REQUIRED
     *  - KDSQ-C: firstAnswers(5개)를 다시 채점해 4점 이상인지 확인(아니면 422 KDSQ_C_NOT_ALLOWED)
     *            + answers(15개) 영역별 채점 → 총점 0~5 Borderline, 6~30 HighRisk
     */
    @Transactional
    public ResultResponse submit(Long memberId, ResultSubmitRequest request) {
        Member member = memberRepository.findById(memberId)
                .filter(m -> m.getStatus().isActive())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Survey survey = surveyRepository.findById(request.surveyId())
                .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));

        SurveyResult result;
        if (survey.getExamType() == ExamType.KDSQ_P) {
            int first = scoringService.scoreFirst(survey, request.answers());
            result = SurveyResult.createFirstOnly(member, survey, first);
        } else {
            Survey pSurvey = surveyRepository.findByExamType(ExamType.KDSQ_P)
                    .orElseThrow(() -> new BusinessException(ErrorCode.SURVEY_NOT_FOUND));
            int first = scoringService.scoreFirst(pSurvey, request.firstAnswers());
            int[] second = scoringService.scoreSecond(survey, request.answers());
            result = SurveyResult.createWithSecond(member, survey, first, second[0], second[1], second[2]);
        }
        return ResultResponse.from(surveyResultRepository.save(result));
    }

    /**
     * 결과 상세: 본인의 삭제되지 않은 결과만. 다른 회원의 결과·삭제된 결과·없는 id는 모두 404
     * (403으로 응답하면 다른 회원 결과가 있다는 사실이 드러나므로 404로 통일, REST 설계서 4.3.3)
     */
    public ResultResponse getMyResult(Long memberId, Long resultId) {
        SurveyResult result = surveyResultRepository.findActiveDetailById(resultId)
                .filter(r -> r.getMember().getId().equals(memberId))
                .orElseThrow(() -> new BusinessException(ErrorCode.RESULT_NOT_FOUND));

        // 관리 안내는 결과와 FK 없이 판정 등급으로 조회한다. 정상(Normal)은 안내가 없으므로 조회하지 않는다
        List<SolutionResponse> solutions = result.getRiskLevel() == RiskLevel.Normal
                ? List.of()
                : solutionRepository.findByRiskLevel(result.getRiskLevel()).stream()
                        .map(SolutionResponse::from)
                        .toList();
        return ResultResponse.detail(result, solutions);
    }

    /** 내 검사 이력: 본인의 삭제되지 않은 결과, 검사일시 최신순 (size 최대 100은 application.properties) */
    public PageResponse<ResultResponse> getMyResults(Long memberId, Pageable pageable) {
        return PageResponse.of(
                surveyResultRepository.findByMemberIdOrderByCreatedAtDesc(memberId, pageable),
                ResultResponse::from);
    }
}
