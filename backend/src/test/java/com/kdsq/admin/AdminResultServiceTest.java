package com.kdsq.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.member.Member;
import com.kdsq.result.SurveyResult;
import com.kdsq.result.SurveyResultRepository;
import com.kdsq.survey.ExamType;
import com.kdsq.survey.Survey;

@ExtendWith(MockitoExtension.class)
class AdminResultServiceTest {

    @Mock
    private SurveyResultRepository surveyResultRepository;

    @InjectMocks
    private AdminResultService adminResultService;

    /** 테스트용 활성 결과: 생성자가 protected라 엔티티의 정적 팩토리로 만든다 */
    private SurveyResult activeResult() {
        Survey pSurvey = mock(Survey.class);
        given(pSurvey.getExamType()).willReturn(ExamType.KDSQ_P);   // createFirstOnly가 검사 종류를 확인함
        return SurveyResult.createFirstOnly(mock(Member.class), pSurvey, 2);
    }

    @Test
    @DisplayName("상세: 없거나 삭제된 결과면 RESULT_NOT_FOUND")
    void getDetail_notFound() {
        given(surveyResultRepository.findActiveDetailById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminResultService.getDetail(99L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RESULT_NOT_FOUND);
    }

    @Test
    @DisplayName("삭제: 활성 결과는 active=false가 된다")
    void deleteResult_success() {
        SurveyResult result = activeResult();
        given(surveyResultRepository.findById(1L)).willReturn(Optional.of(result));

        adminResultService.deleteResult(1L);

        assertThat(result.getActive()).isFalse();
    }

    @Test
    @DisplayName("삭제: 이미 삭제된 결과면 RESULT_NOT_FOUND")
    void deleteResult_alreadyDeleted() {
        SurveyResult result = activeResult();
        result.deactivate();
        given(surveyResultRepository.findById(1L)).willReturn(Optional.of(result));

        assertThatThrownBy(() -> adminResultService.deleteResult(1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RESULT_NOT_FOUND);
    }
}
