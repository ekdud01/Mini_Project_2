package com.kdsq.survey;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

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
import com.kdsq.survey.dto.QuestionResponse;
import com.kdsq.survey.dto.SurveyResponse;

/**
 * SurveyService 단위 테스트 (REST API 설계서 4.2.1~4.2.2, Entity 설계서 8.2.1).
 *
 * Repository를 Mock으로 바꿔 조회 결과를 정해 두고, 유형별 조회 분기,
 * 설문 존재 확인, DTO 변환과 문항 순서 유지를 확인한다.
 * 실제 DB의 필터링·정렬과 Controller의 HTTP 응답·인증은 이 테스트의 검증 범위가 아니다.
 */
@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock SurveyRepository surveyRepository;
    @Mock QuestionRepository questionRepository;

    @InjectMocks
    SurveyService surveyService;

    private final Survey pSurvey = survey(1L, ExamType.KDSQ_P,
            "KDSQ-P 1차 선별검사", "1차 검사 안내");
    private final Survey cSurvey = survey(2L, ExamType.KDSQ_C,
            "KDSQ-C 2차 상세검사", "2차 검사 안내");

    /** DB 없이 만든 설문에 저장된 데이터처럼 ID를 붙인다. */
    private static Survey survey(Long id, ExamType type, String title, String description) {
        Survey survey = Survey.create(type, title, description);
        ReflectionTestUtils.setField(survey, "id", id);
        return survey;
    }

    /** 공개 생성 메서드가 없는 Question을 테스트용으로 만들고 필요한 필드를 채운다. */
    private static Question question(Long id, Survey survey, int number, String content) {
        Question question = BeanUtils.instantiateClass(Question.class);
        ReflectionTestUtils.setField(question, "id", id);
        ReflectionTestUtils.setField(question, "survey", survey);
        ReflectionTestUtils.setField(question, "questionNumber", number);
        ReflectionTestUtils.setField(question, "content", content);
        return question;
    }

    // ───────────────────── 설문 목록 조회 ─────────────────────

    @Test
    @DisplayName("유형을 생략하면 전체 설문을 조회하고 ID·유형·제목·설명을 반환한다")
    void getSurvey_withoutType_allSurveys() {
        given(surveyRepository.findAll()).willReturn(List.of(pSurvey, cSurvey));

        List<SurveyResponse> response = surveyService.getSurvey(null);

        assertThat(response).containsExactly(
                new SurveyResponse(1L, ExamType.KDSQ_P, "KDSQ-P 1차 선별검사", "1차 검사 안내"),
                new SurveyResponse(2L, ExamType.KDSQ_C, "KDSQ-C 2차 상세검사", "2차 검사 안내"));
        verify(surveyRepository).findAll();
        verify(surveyRepository, never()).findByExamType(any());
    }

    @Test
    @DisplayName("KDSQ_P를 지정하면 1차 설문만 목록으로 반환한다")
    void getSurvey_pType_onlyPSurvey() {
        given(surveyRepository.findByExamType(ExamType.KDSQ_P)).willReturn(Optional.of(pSurvey));

        List<SurveyResponse> response = surveyService.getSurvey(ExamType.KDSQ_P);

        assertThat(response).containsExactly(
                new SurveyResponse(1L, ExamType.KDSQ_P, "KDSQ-P 1차 선별검사", "1차 검사 안내"));
        verify(surveyRepository).findByExamType(ExamType.KDSQ_P);
        verify(surveyRepository, never()).findAll();
    }

    @Test
    @DisplayName("KDSQ_C를 지정하면 2차 설문만 목록으로 반환한다")
    void getSurvey_cType_onlyCSurvey() {
        given(surveyRepository.findByExamType(ExamType.KDSQ_C)).willReturn(Optional.of(cSurvey));

        List<SurveyResponse> response = surveyService.getSurvey(ExamType.KDSQ_C);

        assertThat(response).containsExactly(
                new SurveyResponse(2L, ExamType.KDSQ_C, "KDSQ-C 2차 상세검사", "2차 검사 안내"));
        verify(surveyRepository).findByExamType(ExamType.KDSQ_C);
        verify(surveyRepository, never()).findAll();
    }

    @Test
    @DisplayName("전체 설문이 없으면 빈 목록을 반환한다 (현재 구현 기준)")
    void getSurvey_noSurveys_emptyList() {
        given(surveyRepository.findAll()).willReturn(List.of());

        List<SurveyResponse> response = surveyService.getSurvey(null);

        assertThat(response).isEmpty();
    }

    @Test
    @DisplayName("지정한 유형의 설문이 없으면 빈 목록을 반환한다 (현재 구현 기준)")
    void getSurvey_typeNotFound_emptyList() {
        given(surveyRepository.findByExamType(ExamType.KDSQ_C)).willReturn(Optional.empty());

        List<SurveyResponse> response = surveyService.getSurvey(ExamType.KDSQ_C);

        assertThat(response).isEmpty();
        verify(surveyRepository, never()).findAll();
    }

    // ───────────────────── 설문 문항 조회 ─────────────────────

    @Test
    @DisplayName("설문이 있으면 해당 설문의 번호순 조회 결과를 문항 DTO 목록으로 반환한다")
    void getQuestion_existingSurvey_questionResponses() {
        // 서비스 동작 확인용 문항 두 개. ID와 문항 번호를 다르게 하여 DTO 매핑을 확인한다.
        Question first = question(20L, cSurvey, 1, "첫 번째 문항");
        Question second = question(6L, cSurvey, 2, "두 번째 문항");
        given(surveyRepository.existsById(2L)).willReturn(true);
        // 정렬 자체는 Repository 책임이다. 여기서는 받은 순서를 서비스가 유지하는지 확인한다.
        given(questionRepository.findBySurveyIdOrderByQuestionNumberAsc(2L))
                .willReturn(List.of(first, second));

        List<QuestionResponse> response = surveyService.getQuestion(2L);

        assertThat(response).containsExactly(
                new QuestionResponse(20L, 1, "첫 번째 문항"),
                new QuestionResponse(6L, 2, "두 번째 문항"));
        verify(surveyRepository).existsById(2L);
        verify(questionRepository).findBySurveyIdOrderByQuestionNumberAsc(2L);
        verify(questionRepository, never()).findAll();
    }

    @Test
    @DisplayName("없는 설문 ID이면 SURVEY_NOT_FOUND, 문항 조회는 실행하지 않는다")
    void getQuestion_unknownSurvey_notFound() {
        given(surveyRepository.existsById(99L)).willReturn(false);

        assertThatThrownBy(() -> surveyService.getQuestion(99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SURVEY_NOT_FOUND);
        verifyNoInteractions(questionRepository);
    }

    @Test
    @DisplayName("설문은 있고 문항이 없으면 설문 없음 오류 대신 빈 목록을 반환한다 (현재 구현 기준)")
    void getQuestion_existingSurveyWithoutQuestions_emptyList() {
        given(surveyRepository.existsById(1L)).willReturn(true);
        given(questionRepository.findBySurveyIdOrderByQuestionNumberAsc(1L))
                .willReturn(List.of());

        List<QuestionResponse> response = surveyService.getQuestion(1L);

        assertThat(response).isEmpty();
        verify(questionRepository).findBySurveyIdOrderByQuestionNumberAsc(1L);
    }
}
