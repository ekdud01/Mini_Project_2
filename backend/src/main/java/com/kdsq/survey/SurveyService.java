package com.kdsq.survey;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.survey.dto.QuestionResponse;
import com.kdsq.survey.dto.SurveyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SurveyService {
    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    public List<SurveyResponse> surveycheck(ExamType examType){
        List<Survey> s=surveyRepository.findAll();
        return s.stream().filter(survey->survey.getExamType()==examType||examType==null)
                .map(survey -> new SurveyResponse(survey.getId(),survey.getExamType(), survey.getTitle(), survey.getDescription()))
                .toList();
    }

    public List<QuestionResponse> questioncheck(Long surveyId){
        if (!(surveyRepository.existsById(surveyId))){
            throw new BusinessException(ErrorCode.SURVEY_NOT_FOUND);
        }
        List<Question> q=questionRepository.findBySurveyIdOrderByQuestionNumberAsc(surveyId);
        return q.stream().map(question -> new QuestionResponse(question.getId(),question.getQuestionNumber(), question.getContent()))
                .toList();

    }

}
