package com.kdsq.survey.dto;

/** 문항 응답 (REST 설계서 4.2.2). JSON 필드명: id, questionNumber, content */
public record QuestionResponse(Long id, Integer questionNumber, String content) {
}
