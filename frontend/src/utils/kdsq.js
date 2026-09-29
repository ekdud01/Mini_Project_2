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
export const EXAM_TYPE_LABEL = { 'KDSQ_P' : 'KDSQ-P', 'KDSQ_C' : 'KDSQ-C' };
export const EXAM_TYPE_BY_ROUTE = { P: 'KDSQ_P', C: 'KDSQ_C' };

/** 판정 라벨 */
export const RISK_LEVEL = {
    Normal: '정상',
    Borderline: '주의',
    HighRisk: '위험',
};

/**
 * 판정 색상 (UI 설계서 6.1 디자인 토큰)
 * - RISK_COLOR: hex 값이 필요한 곳(Recharts 등)에서 사용
 * - RISK_BADGE_CLASS / RISK_TEXT_CLASS: 화면 배지·문구용 Tailwind 클래스
 *   토큰 색(#22c55e 등)을 흰 배경 글자색으로 쓰면 명도 대비가 4.5:1에 못 미쳐(UI 8장),
 *   글자는 같은 계열의 진한 색을 쓰고 테두리·배경에만 토큰 색을 쓴다.
 */
export const RISK_COLOR = {
    Normal: '#22c55e',
    Borderline: '#f59e0b',
    HighRisk: '#ef4444',
};

export const RISK_BADGE_CLASS = {
    Normal: 'border-success bg-success/15 text-green-800',
    Borderline: 'border-warning bg-warning/15 text-amber-800',
    HighRisk: 'border-destructive bg-destructive/10 text-red-700',
};

export const RISK_TEXT_CLASS = {
    Normal: 'text-green-700',
    Borderline: 'text-amber-700',
    HighRisk: 'text-red-600',
};

/** 결과 화면 판정 문구 */
export const RISK_MESSAGE = {
    Normal: '정상 범위입니다.',
    Borderline: '주의가 필요합니다.',
    HighRisk: '전문적인 검진이 필요합니다.'
};

/** 결과 화면 상단 배너 설명·색 (제목은 RISK_MESSAGE) — 진단 표현은 쓰지 않는다 */
export const RISK_BANNER = {
    Normal: {
        description: '1차 검사 점수가 기준(4점) 미만이어서 검사가 종료되었습니다.',
        className: 'border-green-300 bg-green-50',
    },
    Borderline: {
        description: '판정 기준(6점) 미만이지만, 생활 관리와 정기적인 검사를 권장합니다.',
        className: 'border-amber-300 bg-amber-50',
    },
    HighRisk: {
        description: '선별검사 점수가 판정 기준(6점) 이상입니다. 가까운 보건소나 전문의 상담을 권장합니다.',
        className: 'border-red-300 bg-red-50',
    },
};

/** 판정 기준 막대(cut-line) 구간 — from~to 점, 막대 색 */
export const SCORE_RANGES = {
    KDSQ_P: [
        { from: 0, to: 3, label: '0~3점 정상 (검사 종료)', barClass: 'bg-green-300' },
        { from: 4, to: 10, label: '4~10점 → 2차 검사 진행', barClass: 'bg-slate-200' },
    ],
    KDSQ_C: [
        { from: 0, to: 5, label: '0~5 주의', barClass: 'bg-yellow-300' },
        { from: 6, to: 30, label: '6~30 위험', barClass: 'bg-red-300' },
    ],
};

/** 영역별 점수 문항 범위 (KDSQ-C) */
export const DOMAINS = [
    { key: 'memoryScore', label: '기억력', range: '1~5번' },
    { key: 'otherScore', label: '기타 인지기능', range: '6~10번' },
    { key: 'adlScore', label: '일상생활수행능력', range: '11~15번' },
];

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
 * KDSQ-C까지 진행했으면 totalScore(30점 만점)
 */
export const getDisplayScore = (result) =>
    result.examType === 'KDSQ_C' ? result.totalScore : result.firstScore;