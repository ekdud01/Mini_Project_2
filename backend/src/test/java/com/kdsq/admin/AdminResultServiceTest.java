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

/**
 * AdminResultService 단위 테스트 (UI 설계서 4.6 ADM-05, 4.7 ADM-06 / Entity 설계서 8.4)
 *
 * 왜 Mockito로 하나요?
 *  - Repository를 "가짜(Mock)"로 바꿔서 DB·서버·템플릿 없이 서비스 규칙만 빠르게 확인한다.
 *  - given(...).willReturn(...) : 가짜 Repository가 이렇게 대답하도록 미리 정해 둔다
 *
 * 확인하는 규칙
 *  - 상세: 활성 결과만 조회, 없거나 삭제된 결과는 RESULT_NOT_FOUND (404)
 *  - 삭제: 소프트 삭제(active = false), 이미 삭제된 결과는 RESULT_NOT_FOUND (사용자 API TC-RES-12와 같은 기준)
 *
 * 실행: 클래스 이름 옆 ▶ 또는 터미널에서 gradlew.bat test
 */
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
    @DisplayName("상세 조회 성공: 활성 결과를 그대로 반환한다 (UI 4.7)")
    void getDetail_success() {
        SurveyResult result = activeResult();
        given(surveyResultRepository.findActiveDetailById(1L)).willReturn(Optional.of(result));

        SurveyResult found = adminResultService.getDetail(1L);

        assertThat(found).isSameAs(result);
    }

    @Test
    @DisplayName("상세: 없거나 삭제된 결과면 RESULT_NOT_FOUND (UI 4.7)")
    void getDetail_notFound() {
        given(surveyResultRepository.findActiveDetailById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminResultService.getDetail(99L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RESULT_NOT_FOUND);
    }

    @Test
    @DisplayName("삭제 성공: active가 false가 된다 (소프트 삭제, UI 4.6.4)")
    void deleteResult_success() {
        SurveyResult result = activeResult();
        given(surveyResultRepository.findById(1L)).willReturn(Optional.of(result));

        adminResultService.deleteResult(1L);

        assertThat(result.getActive()).isFalse();
    }

    @Test
    @DisplayName("이미 삭제된 결과를 다시 삭제하면 RESULT_NOT_FOUND (UI 4.6.4)")
    void deleteResult_alreadyDeleted() {
        SurveyResult result = activeResult();
        result.deactivate();
        given(surveyResultRepository.findById(1L)).willReturn(Optional.of(result));

        assertThatThrownBy(() -> adminResultService.deleteResult(1L))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.RESULT_NOT_FOUND);
    }
}
