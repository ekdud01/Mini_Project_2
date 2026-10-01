package com.kdsq.survey;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.survey.dto.QuestionResponse;
import com.kdsq.survey.dto.SurveyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 설문과 문항 조회를 처리하고 Entity를 화면 전달용 DTO로 변환하는 서비스.
 * 설문 존재 확인은 SurveyRepository, 문항 조회는 QuestionRepository를 사용한다.
 * 클래스의 readOnly 설정은 조회용 트랜잭션임을 나타내며, 데이터 수정 방지 권한을 뜻하지는 않는다.
 * 답변 채점과 결과 저장은 result 패키지에서 담당한다.
 *
 * 근거: Entity 설계서 1.4·8.2.1, REST API 설계서 4.2.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SurveyService {
    private final SurveyRepository surveyRepository;
    private final QuestionRepository questionRepository;
    /**
     * 검사 유형 조건에 맞는 설문 목록을 조회한다.
     * 특정 유형 조회도 API의 목록 응답 형식을 유지하기 위해 List로 반환한다.
     * 현재 구현은 해당 유형의 설문이 없으면 빈 목록을 반환한다.
     *
     * @param examType 조회할 검사 유형. null이면 전체 설문을 조회한다.
     * @return 설문 ID·유형·제목·설명을 담은 DTO 목록
     */
    public List<SurveyResponse> getSurvey(ExamType examType){
        // examType이 있으면 해당 설문 1건만, 없으면 전체 (Entity 설계서 8.2.1)
        List<Survey> s = (examType == null)
                ? surveyRepository.findAll()
                : surveyRepository.findByExamType(examType).stream().toList();
        // Optional.stream()은 조회 결과를 0개 또는 1개의 요소로 바꾼다.
        // 각 Survey를 SurveyResponse.from으로 변환하여 Entity 자체를 응답에 노출하지 않는다.
        return s.stream()
                .map(SurveyResponse::from)
                .toList();
    }

    /**
     * 설문 존재 여부를 확인한 뒤 해당 설문의 문항을 번호 오름차순으로 조회한다.
     *
     * @param surveyId 조회할 설문의 고유 번호
     * @return 문항 ID·문항 번호·내용을 담은 DTO 목록
     * @throws BusinessException 설문이 없을 때 SURVEY_NOT_FOUND 발생
     */
    public List<QuestionResponse> getQuestion(Long surveyId){
        // 문항이 없다는 사실만으로 설문이 없다고 판단할 수 없으므로 설문 테이블부터 확인한다.
        // existsById는 존재하면 true이므로, !로 반전하여 존재하지 않을 때 예외를 발생시킨다.
        if (!(surveyRepository.existsById(surveyId))){
            throw new BusinessException(ErrorCode.SURVEY_NOT_FOUND);
        }
        // 모든 문항을 가져오는 findAll 대신 해당 surveyId의 문항만 문항 번호순으로 조회한다.
        List<Question> q=questionRepository.findBySurveyIdOrderByQuestionNumberAsc(surveyId);
        // Question 목록의 각 요소를 QuestionResponse로 변환한다.
        return q.stream().map(QuestionResponse::from)
                .toList();

    }

}
