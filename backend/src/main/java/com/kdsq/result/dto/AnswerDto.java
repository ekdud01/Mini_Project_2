package com.kdsq.result.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 문항 1개의 답변 (REST API 설계서 4.3.1·4.3.2)
 *  - score: 아니다 0 · 가끔(조금) 그렇다 1 · 자주(많이) 그렇다 2 (범위 밖이면 400 VALIDATION_ERROR)
 */
public record AnswerDto(
        @NotNull(message = "문항 ID가 필요합니다")
        Long questionId,

        @NotNull(message = "답변 점수가 필요합니다")
        @Min(value = 0, message = "답변 점수는 0~2여야 합니다")
        @Max(value = 2, message = "답변 점수는 0~2여야 합니다")
        Integer score
) {
}
