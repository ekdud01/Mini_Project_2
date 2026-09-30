package com.kdsq.result;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.BeanUtils;
import org.springframework.test.util.ReflectionTestUtils;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Gender;
import com.kdsq.member.Member;
import com.kdsq.member.MemberRepository;
import com.kdsq.result.dto.AnswerDto;
import com.kdsq.result.dto.ResultResponse;
import com.kdsq.result.dto.ResultSubmitRequest;
import com.kdsq.survey.ExamType;
import com.kdsq.survey.Survey;
import com.kdsq.survey.SurveyRepository;

/**
 * ResultService 단위 테스트 (REST 설계서 4.3, 7.4 TC-RES-01~05·09·10)
 *
 * 채점은 ScoringService를 Mock으로 바꿔 점수를 정해 두고, 서비스가 1차 종료·2차 완료를 나누는 규칙과
 * 판정·422·404 처리를 확인한다. 채점 자체는 ScoringServiceTest에서 확인한다.
 */
@ExtendWith(MockitoExtension.class)
class ResultServiceTest {

    @Mock MemberRepository memberRepository;
    @Mock SurveyRepository surveyRepository;
    @Mock SurveyResultRepository surveyResultRepository;
    @Mock SolutionRepository solutionRepository;
    @Mock ScoringService scoringService;

    @InjectMocks
    ResultService resultService;

    private final Survey pSurvey = survey(1L, ExamType.KDSQ_P);
    private final Survey cSurvey = survey(2L, ExamType.KDSQ_C);
    private final List<AnswerDto> five = List.of(new AnswerDto(1L, 0));      // 개수는 ScoringService(Mock)가 판단
    private final List<AnswerDto> fifteen = List.of(new AnswerDto(6L, 0));

    private static Survey survey(Long id, ExamType type) {
        Survey survey = Survey.create(type, type.name(), null);
        ReflectionTestUtils.setField(survey, "id", id);
        return survey;
    }

    private static Member member(Long id) {
        Member member = Member.create("hong@test.com", "encoded", "홍길동", Gender.MALE, 1960);
        ReflectionTestUtils.setField(member, "id", id);
        return member;
    }

    private static Solution solution(RiskLevel level, String title) {
        Solution solution = BeanUtils.instantiateClass(Solution.class);
        ReflectionTestUtils.setField(solution, "riskLevel", level);
        ReflectionTestUtils.setField(solution, "title", title);
        ReflectionTestUtils.setField(solution, "content", "안내 내용");
        return solution;
    }

    private void givenMemberAndSurvey(Survey survey) {
        given(memberRepository.findById(2L)).willReturn(Optional.of(member(2L)));
        given(surveyRepository.findById(survey.getId())).willReturn(Optional.of(survey));
    }

    /** save()는 받은 결과를 그대로 돌려준다 (DB 대신) */
    private void givenSaveReturnsArgument() {
        given(surveyResultRepository.save(any(SurveyResult.class))).willAnswer(inv -> inv.getArgument(0));
    }

    // ───────────────────── 제출: 1차에서 종료 ─────────────────────

    @Test
    @DisplayName("1차 0~3점: 정상(Normal)으로 저장, 영역 점수·총점은 null (TC-RES-01)")
    void submit_firstOnly_normal() {
        givenMemberAndSurvey(pSurvey);
        given(scoringService.scoreFirst(pSurvey, five)).willReturn(3);
        givenSaveReturnsArgument();

        ResultResponse response = resultService.submit(2L, new ResultSubmitRequest(1L, null, five));

        assertThat(response.examType()).isEqualTo(ExamType.KDSQ_P);
        assertThat(response.firstScore()).isEqualTo(3);
        assertThat(response.riskLevel()).isEqualTo(RiskLevel.Normal);
        assertThat(response.memoryScore()).isNull();
        assertThat(response.totalScore()).isNull();
        assertThat(response.solutions()).isNull();   // 제출 응답에는 solutions가 없다
    }

    @Test
    @DisplayName("1차 4점 이상을 1차만 제출하면 KDSQ_C_REQUIRED, 저장하지 않는다 (TC-RES-02)")
    void submit_firstOnly_fourPoints_required() {
        givenMemberAndSurvey(pSurvey);
        given(scoringService.scoreFirst(pSurvey, five)).willReturn(4);

        assertThatThrownBy(() -> resultService.submit(2L, new ResultSubmitRequest(1L, null, five)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.KDSQ_C_REQUIRED);
        verify(surveyResultRepository, never()).save(any());
    }

    // ───────────────────── 제출: 2차까지 완료 ─────────────────────

    @Test
    @DisplayName("2차 총점 5점: 주의(Borderline), 총점 5 (TC-RES-03)")
    void submit_second_borderline() {
        givenMemberAndSurvey(cSurvey);
        given(surveyRepository.findByExamType(ExamType.KDSQ_P)).willReturn(Optional.of(pSurvey));
        given(scoringService.scoreFirst(pSurvey, five)).willReturn(5);
        given(scoringService.scoreSecond(cSurvey, fifteen)).willReturn(new int[] { 2, 2, 1 });
        givenSaveReturnsArgument();

        ResultResponse response = resultService.submit(2L, new ResultSubmitRequest(2L, five, fifteen));

        assertThat(response.examType()).isEqualTo(ExamType.KDSQ_C);
        assertThat(response.totalScore()).isEqualTo(5);
        assertThat(response.riskLevel()).isEqualTo(RiskLevel.Borderline);
    }

    @Test
    @DisplayName("2차 총점 6점: 위험(HighRisk), 총점 6 (TC-RES-04)")
    void submit_second_highRisk() {
        givenMemberAndSurvey(cSurvey);
        given(surveyRepository.findByExamType(ExamType.KDSQ_P)).willReturn(Optional.of(pSurvey));
        given(scoringService.scoreFirst(pSurvey, five)).willReturn(5);
        given(scoringService.scoreSecond(cSurvey, fifteen)).willReturn(new int[] { 2, 2, 2 });
        givenSaveReturnsArgument();

        ResultResponse response = resultService.submit(2L, new ResultSubmitRequest(2L, five, fifteen));

        assertThat(response.firstScore()).isEqualTo(5);
        assertThat(response.memoryScore()).isEqualTo(2);
        assertThat(response.totalScore()).isEqualTo(6);
        assertThat(response.riskLevel()).isEqualTo(RiskLevel.HighRisk);
    }

    @Test
    @DisplayName("2차 제출인데 1차 답변이 3점이면 KDSQ_C_NOT_ALLOWED, 저장하지 않는다 (TC-RES-05)")
    void submit_second_firstUnderFour_notAllowed() {
        givenMemberAndSurvey(cSurvey);
        given(surveyRepository.findByExamType(ExamType.KDSQ_P)).willReturn(Optional.of(pSurvey));
        given(scoringService.scoreFirst(pSurvey, five)).willReturn(3);
        given(scoringService.scoreSecond(cSurvey, fifteen)).willReturn(new int[] { 0, 0, 0 });

        assertThatThrownBy(() -> resultService.submit(2L, new ResultSubmitRequest(2L, five, fifteen)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.KDSQ_C_NOT_ALLOWED);
        verify(surveyResultRepository, never()).save(any());
    }

    @Test
    @DisplayName("없는 설문 id로 제출하면 SURVEY_NOT_FOUND")
    void submit_unknownSurvey() {
        given(memberRepository.findById(2L)).willReturn(Optional.of(member(2L)));
        given(surveyRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> resultService.submit(2L, new ResultSubmitRequest(99L, null, five)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SURVEY_NOT_FOUND);
    }

    @Test
    @DisplayName("탈퇴(비활성) 회원의 토큰으로 제출하면 MEMBER_NOT_FOUND")
    void submit_withdrawnMember() {
        Member withdrawn = member(2L);
        withdrawn.withdraw();
        given(memberRepository.findById(2L)).willReturn(Optional.of(withdrawn));

        assertThatThrownBy(() -> resultService.submit(2L, new ResultSubmitRequest(1L, null, five)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
    }

    // ───────────────────── 결과 상세 ─────────────────────

    /** DB에 저장된 것처럼 id를 붙인다 */
    private SurveyResult saved(SurveyResult result, Long id) {
        ReflectionTestUtils.setField(result, "id", id);
        return result;
    }

    @Test
    @DisplayName("상세: 본인의 위험 결과면 memberId와 관리 안내(solutions)를 함께 준다 (TC-RES-09)")
    void getMyResult_highRisk_withSolutions() {
        Member owner = member(2L);
        SurveyResult result = saved(SurveyResult.createWithSecond(owner, cSurvey, 5, 4, 2, 3), 102L);
        given(surveyResultRepository.findActiveDetailById(102L)).willReturn(Optional.of(result));
        given(solutionRepository.findByRiskLevel(RiskLevel.HighRisk))
                .willReturn(List.of(solution(RiskLevel.HighRisk, "전문 검진 안내")));

        ResultResponse response = resultService.getMyResult(2L, 102L);

        assertThat(response.memberId()).isEqualTo(2L);
        assertThat(response.totalScore()).isEqualTo(9);
        assertThat(response.solutions()).extracting("title").containsExactly("전문 검진 안내");
    }

    @Test
    @DisplayName("상세: 정상 결과면 solutions는 빈 배열이고 안내를 조회하지 않는다 (TC-RES-10)")
    void getMyResult_normal_emptySolutions() {
        Member owner = member(2L);
        SurveyResult result = saved(SurveyResult.createFirstOnly(owner, pSurvey, 2), 101L);
        given(surveyResultRepository.findActiveDetailById(101L)).willReturn(Optional.of(result));

        ResultResponse response = resultService.getMyResult(2L, 101L);

        assertThat(response.solutions()).isEmpty();
        verify(solutionRepository, never()).findByRiskLevel(any());
    }

    @Test
    @DisplayName("상세: 다른 회원의 결과면 403이 아니라 RESULT_NOT_FOUND (결과 존재 여부를 알려 주지 않음)")
    void getMyResult_otherMember_notFound() {
        Member other = member(3L);
        SurveyResult result = saved(SurveyResult.createFirstOnly(other, pSurvey, 2), 201L);
        given(surveyResultRepository.findActiveDetailById(201L)).willReturn(Optional.of(result));

        assertThatThrownBy(() -> resultService.getMyResult(2L, 201L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESULT_NOT_FOUND);
    }

    @Test
    @DisplayName("상세: 삭제됐거나 없는 결과면 RESULT_NOT_FOUND")
    void getMyResult_deletedOrMissing_notFound() {
        given(surveyResultRepository.findActiveDetailById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> resultService.getMyResult(2L, 999L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESULT_NOT_FOUND);
        verify(solutionRepository, never()).findByRiskLevel(any());
    }
}
