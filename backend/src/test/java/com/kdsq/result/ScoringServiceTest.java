package com.kdsq.result;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.LongStream;

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
import com.kdsq.result.dto.AnswerDto;
import com.kdsq.survey.ExamType;
import com.kdsq.survey.Question;
import com.kdsq.survey.QuestionRepository;
import com.kdsq.survey.Survey;

/**
 * ScoringService 단위 테스트 (Entity 설계서 4.3.3, REST 설계서 7.4 TC-RES-06·08)
 *
 * 문항은 data.sql과 같게 만든다: KDSQ-P id 1~5(번호 1~5), KDSQ-C id 6~20(번호 1~15).
 * 영역은 문항 id가 아니라 번호로 나뉘는지 확인하는 것이 핵심이다.
 */
@ExtendWith(MockitoExtension.class)
class ScoringServiceTest {

    @Mock
    QuestionRepository questionRepository;

    @InjectMocks
    ScoringService scoringService;

    private final Survey pSurvey = survey(1L, ExamType.KDSQ_P);
    private final Survey cSurvey = survey(2L, ExamType.KDSQ_C);

    private static Survey survey(Long id, ExamType type) {
        Survey survey = Survey.create(type, type.name(), null);
        ReflectionTestUtils.setField(survey, "id", id);
        return survey;
    }

    /** id가 firstId부터 차례로, 번호가 1부터 차례로인 문항 count개 */
    private static List<Question> questions(long firstId, int count) {
        List<Question> list = new ArrayList<>();
        for (int n = 1; n <= count; n++) {
            Question q = BeanUtils.instantiateClass(Question.class);   // 생성자가 protected라 테스트에서만 이렇게 만든다
            ReflectionTestUtils.setField(q, "id", firstId + n - 1);
            ReflectionTestUtils.setField(q, "questionNumber", n);
            list.add(q);
        }
        return list;
    }

    /** questionId를 firstId부터 차례로, 점수는 scores 순서대로 */
    private static List<AnswerDto> answers(long firstId, int... scores) {
        List<AnswerDto> list = new ArrayList<>();
        for (int i = 0; i < scores.length; i++) {
            list.add(new AnswerDto(firstId + i, scores[i]));
        }
        return list;
    }

    private void givenPQuestions() {
        given(questionRepository.findBySurveyIdOrderByQuestionNumberAsc(1L)).willReturn(questions(1, 5));
    }

    private void givenCQuestions() {
        given(questionRepository.findBySurveyIdOrderByQuestionNumberAsc(2L)).willReturn(questions(6, 15));
    }

    // ───────────────────── 1차 (KDSQ-P) ─────────────────────

    @Test
    @DisplayName("1차: 5문항 점수를 모두 더한다 (0+1+0+1+0 = 2)")
    void scoreFirst_sum() {
        givenPQuestions();

        assertThat(scoringService.scoreFirst(pSurvey, answers(1, 0, 1, 0, 1, 0))).isEqualTo(2);
    }

    @Test
    @DisplayName("1차: 답변이 4개면 INVALID_ANSWER_COUNT (TC-RES-06)")
    void scoreFirst_fourAnswers() {
        assertThatThrownBy(() -> scoringService.scoreFirst(pSurvey, answers(1, 0, 1, 0, 1)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_ANSWER_COUNT);
    }

    @Test
    @DisplayName("1차: 답변 목록이 없으면(null) INVALID_ANSWER_COUNT (2차 제출에 firstAnswers를 빠뜨린 경우)")
    void scoreFirst_nullAnswers() {
        assertThatThrownBy(() -> scoringService.scoreFirst(pSurvey, null))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_ANSWER_COUNT);
    }

    @Test
    @DisplayName("1차: 같은 문항을 두 번 보내면(개수는 5개) INVALID_ANSWER_COUNT")
    void scoreFirst_duplicateQuestion() {
        givenPQuestions();
        List<AnswerDto> duplicated = List.of(
                new AnswerDto(1L, 2), new AnswerDto(1L, 2), new AnswerDto(2L, 0), new AnswerDto(3L, 0), new AnswerDto(4L, 0));

        assertThatThrownBy(() -> scoringService.scoreFirst(pSurvey, duplicated))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_ANSWER_COUNT);
    }

    @Test
    @DisplayName("1차: 2차 문항 id(6번)가 섞이면 QUESTION_NOT_FOUND (TC-RES-08)")
    void scoreFirst_otherSurveyQuestion() {
        givenPQuestions();

        assertThatThrownBy(() -> scoringService.scoreFirst(pSurvey, answers(2, 0, 0, 0, 0, 0)))   // id 2~6
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.QUESTION_NOT_FOUND);
    }

    // ───────────────────── 2차 (KDSQ-C) ─────────────────────

    @Test
    @DisplayName("2차: 문항 번호 1~5·6~10·11~15로 기억력·기타 인지·일상생활을 나눠 더한다 (id 6~20)")
    void scoreSecond_byArea() {
        givenCQuestions();
        // 번호 1~5: 0,0,1,0,1(=2) / 6~10: 2,0,0,0,0(=2) / 11~15: 1,1,1,0,0(=3)
        List<AnswerDto> answers = answers(6, 0, 0, 1, 0, 1, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0);

        assertThat(scoringService.scoreSecond(cSurvey, answers)).containsExactly(2, 2, 3);
    }

    @Test
    @DisplayName("2차: 답변 순서가 섞여 있어도 문항 번호 기준으로 영역을 나눈다")
    void scoreSecond_shuffledOrder() {
        givenCQuestions();
        List<AnswerDto> answers = new ArrayList<>(answers(6, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1));
        java.util.Collections.reverse(answers);

        assertThat(scoringService.scoreSecond(cSurvey, answers)).containsExactly(10, 0, 5);
    }

    @Test
    @DisplayName("2차: 답변이 15개가 아니면 INVALID_ANSWER_COUNT")
    void scoreSecond_wrongCount() {
        int[] fourteen = LongStream.range(0, 14).mapToInt(i -> 0).toArray();

        assertThatThrownBy(() -> scoringService.scoreSecond(cSurvey, answers(6, fourteen)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_ANSWER_COUNT);
    }
}
