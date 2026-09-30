package com.kdsq.survey;

import com.kdsq.global.common.ApiResponse;
import com.kdsq.survey.dto.QuestionResponse;
import com.kdsq.survey.dto.SurveyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/surveys")
public class SurveyController {
    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SurveyResponse>>> surveycheck(@RequestParam(required = false) ExamType examType) {
        return ResponseEntity.ok(ApiResponse.ok(surveyService.surveycheck(examType)));
    }

    @GetMapping("/{surveyId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> questioncheck(@PathVariable("surveyId") Long surveyId) {
        return ResponseEntity.ok(ApiResponse.ok(surveyService.questioncheck(surveyId)));
    }
}
