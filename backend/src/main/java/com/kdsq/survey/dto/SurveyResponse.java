package com.kdsq.survey.dto;

import com.kdsq.survey.ExamType;

public record SurveyResponse(Long id, ExamType examType, String title, String description) {


}
