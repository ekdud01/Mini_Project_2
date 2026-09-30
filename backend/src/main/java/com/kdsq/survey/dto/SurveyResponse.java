package com.kdsq.survey.dto;

import com.kdsq.survey.ExamType;
import com.kdsq.survey.Survey;

/**
 * 설문 목록 API에서 반환하는 설문 한 개의 DTO.
 * 화면은 examType과 id를 연결하여 각 검사에 사용할 surveyId를 확보한다.
 * 문항 목록은 별도의 문항 조회 API로 제공한다.
 * 근거: REST API 설계서 4.2.1.
 *
 * @param id 설문의 고유 ID
 * @param examType 검사 유형(KDSQ_P 또는 KDSQ_C)
 * @param title 설문 제목
 * @param description 검사 화면 상단에 표시할 응답 안내 문구
 */
public record SurveyResponse(Long id, ExamType examType, String title, String description) {
    /**
     * 조회된 Survey Entity를 설문 응답 DTO로 변환한다.
     *
     * @param survey 조회된 설문
     * @return 설문 ID·유형·제목·설명을 담은 응답
     */
    public static SurveyResponse from(Survey survey){
        return new SurveyResponse(survey.getId(), survey.getExamType(), survey.getTitle(), survey.getDescription());
    }
}
