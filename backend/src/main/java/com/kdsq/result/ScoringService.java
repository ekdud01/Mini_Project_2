package com.kdsq.result;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import com.kdsq.global.exception.BusinessException;
import com.kdsq.global.exception.ErrorCode;
import com.kdsq.result.dto.AnswerDto;
import com.kdsq.survey.Question;
import com.kdsq.survey.QuestionRepository;
import com.kdsq.survey.Survey;

import lombok.RequiredArgsConstructor;

/**
 * 제출된 답변 채점 (Entity 설계서 4.3.3)
 *  - 화면의 1차 합계는 이동 판단용이고, 최종 채점·판정은 서버가 한다.
 *  - 영역은 문항 id가 아니라 문항 번호로 나눈다: 1~5 기억력, 6~10 기타 인지기능, 11~15 일상생활 수행능력
 *    (KDSQ-C 문항 id는 6~20이라 번호와 다르다)
 */
@Service
@RequiredArgsConstructor
public class ScoringService {

    private static final int FIRST_COUNT = 5;
    private static final int SECOND_COUNT = 15;

    private final QuestionRepository questionRepository;

    /** KDSQ-P 5문항 합계 (0~10) */
    public int scoreFirst(Survey pSurvey, List<AnswerDto> firstAnswers) {
        Map<Integer, Integer> byNumber = toScoreByQuestionNumber(pSurvey, firstAnswers, FIRST_COUNT);
        return sum(byNumber, 1, 5);
    }

    /** KDSQ-C 15문항 영역별 합계: [기억력(1~5), 기타 인지기능(6~10), 일상생활 수행능력(11~15)] 각 0~10 */
    public int[] scoreSecond(Survey cSurvey, List<AnswerDto> answers) {
        Map<Integer, Integer> byNumber = toScoreByQuestionNumber(cSurvey, answers, SECOND_COUNT);
        return new int[] { sum(byNumber, 1, 5), sum(byNumber, 6, 10), sum(byNumber, 11, 15) };
    }

    /**
     * 답변의 questionId를 그 설문의 문항 번호로 바꾼다.
     *  - 개수가 다르거나 같은 문항을 두 번 보내면 INVALID_ANSWER_COUNT
     *  - 다른 설문의 문항 id면 QUESTION_NOT_FOUND
     */
    private Map<Integer, Integer> toScoreByQuestionNumber(Survey survey, List<AnswerDto> answers, int expected) {
        if (answers == null || answers.size() != expected) {
            throw new BusinessException(ErrorCode.INVALID_ANSWER_COUNT);
        }
        Map<Long, Integer> numberById = questionRepository
                .findBySurveyIdOrderByQuestionNumberAsc(survey.getId()).stream()
                .collect(Collectors.toMap(Question::getId, Question::getQuestionNumber));

        Map<Integer, Integer> scoreByNumber = new HashMap<>();
        for (AnswerDto answer : answers) {
            Integer number = numberById.get(answer.questionId());
            if (number == null) {
                throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND);
            }
            scoreByNumber.put(number, answer.score());   // score 0~2는 AnswerDto의 @Min·@Max로 이미 검증됨
        }
        if (scoreByNumber.size() != expected) {            // 같은 questionId 중복 → 빠진 문항이 생김
            throw new BusinessException(ErrorCode.INVALID_ANSWER_COUNT);
        }
        return scoreByNumber;
    }

    private int sum(Map<Integer, Integer> scoreByNumber, int from, int to) {
        return IntStream.rangeClosed(from, to).map(n -> scoreByNumber.getOrDefault(n, 0)).sum();
    }
}
