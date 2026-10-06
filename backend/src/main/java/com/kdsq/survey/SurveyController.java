package com.kdsq.survey;

import com.kdsq.global.common.ApiResponse;
import com.kdsq.survey.dto.QuestionResponse;
import com.kdsq.survey.dto.SurveyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 설문 목록과 문항 조회 요청을 받는 REST 컨트롤러.
 * 서비스의 조회 결과를 ApiResponse로 감싸고 ResponseEntity로 HTTP 200 응답을 반환한다.
 * 설계상 MEMBER 인증이 필요한 API이며, 인증·권한 확인은 공통 보안 설정에서 담당한다.
 *
 * 근거: REST API 설계서 4.2.1~4.2.2, Entity 설계서 1.4.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/surveys")
public class SurveyController {
    // @RequiredArgsConstructor가 생성한 생성자를 통해 Spring이 서비스를 주입한다.
    private final SurveyService surveyService;

    /**
     * GET /api/surveys: 설문 ID, 유형, 제목, 안내 문구 목록을 제공한다.
     *
     * @param examType 선택 필터. 생략하면 전체, 지정하면 해당 검사 유형을 조회한다.
     * @return 설문 목록을 담은 HTTP 200 응답
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SurveyResponse>>> getSurvey(@RequestParam(required = false) ExamType examType) {
        return ResponseEntity.ok(ApiResponse.ok(surveyService.getSurvey(examType)));
    }

    /**
     * GET /api/surveys/{surveyId}/questions: 해당 설문의 문항을 번호순으로 제공한다.
     * 설문이 없으면 서비스에서 발생한 SURVEY_NOT_FOUND를 공통 예외 처리에서 응답으로 변환한다.
     *
     * @param surveyId URL 경로에서 받은 설문의 고유 번호
     * @return 문항 응답 목록을 담은 HTTP 200 응답
     */
    @GetMapping("/{surveyId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestion(@PathVariable("surveyId") Long surveyId) {
        return ResponseEntity.ok(ApiResponse.ok(surveyService.getQuestion(surveyId)));
    }
}
