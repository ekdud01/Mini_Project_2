/** 
 * 최종 채점·판정은 서버(results) 책임. 프론트는 응답 값을 표시만 한다.
 * 
 * 프론트에서 쓰는 계산은 1차 합계 하나뿐 (2차 진행 여부 판단용):
 * firstSum = Q1–Q5 합계 (10점 만점)
 *  0–3  → POST /api/results {surveyId: P, answers} → 결과 화면
 *  4–10 → 제출하지 않고 pendingFirstAnswers에 보관 → /surveys/c
 * 
 * 표시용 상수 (결과 화면·마이페이지가 함께 사용):
 * 검사 종류 라벨: KDSQ_P="KDSQ-P", KDSQ_C="KDSQ-C" (서버 ExamType.label과 같음)
 * 판정 라벨: Normal=정상, Borderline=주의, HighRisk=위험
 * 판정 색상: Normal=Success #22c55e, Borderline=Warning #f59e0b, HighRisk=Danger #ef4444
 * 만점: KDSQ-P 10, KDSQ-C 30
 */

/** 검사 종류 라벨  */
export const EXAM_TYPE_LABEL = { KDSQ_P: 'KDSQ-P', KDSQ_C: 'KDSQ-C' };
export const EXAM_TYPE_BY_ROUTE = { P: 'KDSQ_P', C: 'KDSQ_C' };

/** 판정 라벨 */
export const RISK_LEVEL = {
    Normal: '정상',
    Borderline: '주의',
    HighRisk: '위험',
};

/** 결과 화면 판정 문구 */
export const RISK_MESSAGE = {
    Normal: '정상 범위입니다.',
    Borderline: '주의가 필요합니다.',
    HighRisk: '전문적인 검진이 필요합니다.'
};

 /** 답변 선택지 */
export const ANSWER_OPTIONS = [
    { label: '아니다', value: 0 },
    { label: '가끔(조금) 그렇다', value: 1 },
    { label: '자주(많이) 그렇다', value: 2 },
];
 /** 답변의 점수 합계 */
export const sumScores = (answerList) => answerList.reduce((sum, a) => sum + a.score, 0);

/** 만점 */
export const MAX_SCORE = { KDSQ_P: 10, KDSQ_C: 30 };
export const DOMAIN_MAX_SCORE = 10;

/** 2차 검사 대상인지 판단 */
export const SECOND_TEST_THRESHOLD = 4;
export const needsSecondTest = (firstSum) => firstSum >= SECOND_TEST_THRESHOLD;

/** 
 * 결과의 최종 점수
 * KDSQ-P로 끝났으면 firstScore(10점 만점)
 * KDSQ-C까지 진행했으면 totalScroe(30점 만점)
 */
export const getDisplayScore = (result) =>
    result.examType === 'KDSQ-C' ? result.totalScore : result.firstScore;