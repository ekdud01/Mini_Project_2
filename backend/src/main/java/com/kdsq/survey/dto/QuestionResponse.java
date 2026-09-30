package com.kdsq.survey.dto;

import com.kdsq.survey.Question;

/**
 * 문항 조회 API에서 반환하는 문항 한 개의 DTO.
 * Entity의 설문 연관관계를 그대로 노출하지 않고 화면에 필요한 세 항목만 전달한다.
 * 근거: REST API 설계서 4.2.2.
 *
 * @param id 문항의 고유 ID. 답변 제출 시 questionId로 사용하는 값
 * @param questionNumber 설문 안의 문항 순서. P형은 1~5, C형은 1~15이며 id와 다를 수 있다.
 * @param content 화면에 표시할 문항 내용
 */
public record QuestionResponse(Long id, Integer questionNumber, String content) {
    /**
     * 조회된 Question Entity를 문항 응답 DTO로 변환한다.
     *
     * @param question 조회된 문항
     * @return 문항 ID·번호·내용을 담은 응답
     */
    public static QuestionResponse from(Question question){
        return new QuestionResponse(question.getId(), question.getQuestionNumber(), question.getContent());
    }
}
