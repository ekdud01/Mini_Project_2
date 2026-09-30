package com.kdsq.result.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * 검사 결과 제출 (REST API 설계서 4.3.1·4.3.2)
 *  - 1차에서 끝남: { surveyId: KDSQ-P 설문 id, answers: 5개 }
 *  - 2차까지 완료: { surveyId: KDSQ-C 설문 id, firstAnswers: 1차 5개, answers: 2차 15개 }
 * 답변 개수·중복 검사는 개수가 틀리면 INVALID_ANSWER_COUNT를 주기 위해 @Size가 아니라 ScoringService에서 한다.
 */
public record ResultSubmitRequest(
        @NotNull(message = "설문 ID가 필요합니다")
        Long surveyId,

        List<@NotNull @Valid AnswerDto> firstAnswers,   // 2차 제출 때만

        List<@NotNull @Valid AnswerDto> answers
) {
}
