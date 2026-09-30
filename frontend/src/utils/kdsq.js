/**
 * KDSQ 검사 상수·계산
 *
 * 최종 채점·판정은 서버(results) 책임이고, 프론트는 응답 값을 표시만 한다.
 * 프론트에서 하는 계산은 "1차 합계" 하나뿐이다 (2차 진행 여부 판단용).
 *   firstSum = Q1~Q5 합계 (10점 만점)
 *   0~3점  → POST /api/results { surveyId: P, answers } → 결과 화면
 *   4~10점 → 제출하지 않고 pendingFirstAnswers에 보관 → /surveys/c
 *
 * 목차
 *   1. 검사 종류·만점
 *   2. 문항·답변
 *   3. 점수 계산
 *   4. 판정(riskLevel) 표시
 *   5. 결과 화면
 */

// ─────────────────────────────────────────────
// 1. 검사 종류·만점
// ─────────────────────────────────────────────

/** 검사 종류 라벨 (서버 ExamType.label과 같음) */
export const EXAM_TYPE_LABEL = {
    KDSQ_P: 'KDSQ-P',
    KDSQ_C: 'KDSQ-C',
};

/** 라우트 type(P/C) → examType */
export const EXAM_TYPE_BY_ROUTE = {
    P: 'KDSQ_P',
    C: 'KDSQ_C',
};

/** 총점 만점 */
export const MAX_SCORE = {
    KDSQ_P: 10,
    KDSQ_C: 30,
};

/** KDSQ-C 영역별 만점 */
export const DOMAIN_MAX_SCORE = 10;

// ─────────────────────────────────────────────
// 2. 문항·답변
// ─────────────────────────────────────────────

/** 설문 안내 문구 — API의 description이 오기 전·없을 때 사용 */
export const DEFAULT_SURVEY_DESCRIPTION =
    '아래의 각 항목에 대하여, 1년 전과 비교하여, 현재 상태에 해당하는 곳에 표시해 주십시오 \n(동행한 가족이 있으면 가족이 작성하시고, 없으면 본인이 작성하십시오)';

/** 답변 선택지 */
export const ANSWER_OPTIONS = [
    { label: '아니다', value: 0 },
    { label: '가끔(조금) 그렇다', value: 1 },
    { label: '자주(많이) 그렇다', value: 2 },
];

// ─────────────────────────────────────────────
// 3. 점수 계산
// ─────────────────────────────────────────────

/** 답변 목록의 점수 합계 */
export const sumScores = (answerList) => answerList.reduce((sum, a) => sum + a.score, 0);

/** 1차 합계가 이 값 이상이면 2차(KDSQ-C) 진행 */
export const SECOND_TEST_THRESHOLD = 4;

export const needsSecondTest = (firstSum) => firstSum >= SECOND_TEST_THRESHOLD;

/**
 * 결과 화면에 보여줄 최종 점수
 * - KDSQ-P로 끝났으면 firstScore (10점 만점)
 * - KDSQ-C까지 진행했으면 totalScore (30점 만점)
 */
export const getDisplayScore = (result) =>
    result.examType === 'KDSQ_C' ? result.totalScore : result.firstScore;

// ─────────────────────────────────────────────
// 4. 판정(riskLevel) 표시
// ─────────────────────────────────────────────

/** 판정 라벨 */
export const RISK_LEVEL = {
    Normal: '정상',
    Borderline: '주의',
    HighRisk: '위험',
};

/**
 * 판정 색상
 * - RISK_COLOR: hex 값이 필요한 곳(Recharts 등)
 * - RISK_BADGE_CLASS / RISK_TEXT_CLASS: 화면 배지·문구용 Tailwind 클래스
 *   토큰 색(#22c55e 등)을 흰 배경 글자색으로 쓰면 명도 대비가 4.5:1에 못 미쳐,
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

// ─────────────────────────────────────────────
// 5. 결과 화면
// ─────────────────────────────────────────────

/** 상단 배너 제목 */
export const RISK_MESSAGE = {
    Normal: '정상 범위입니다',
    Borderline: '주의가 필요합니다',
    HighRisk: '전문적인 검진이 필요합니다',
};

/** 상단 배너 설명·색 */
export const RISK_BANNER = {
    Normal: {
        description: '1차 검사 점수가 기준(4점) 미만이어서 검사가 종료되었습니다',
        className: 'border-green-300 bg-green-50',
    },
    Borderline: {
        description: '판정 기준(6점) 미만이지만, 생활 관리와 정기적인 검사를 권장합니다',
        className: 'border-amber-300 bg-amber-50',
    },
    HighRisk: {
        description: '선별검사 점수가 판정 기준(6점) 이상입니다 \n가까운 보건소나 전문의 상담을 권장합니다',
        className: 'border-red-300 bg-red-50',
    },
};

/** 판정 기준 막대(cut-line) 구간 — from~to점, 막대 색 */
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

/** KDSQ-C 영역별 점수 — 결과 필드명, 라벨, 문항 범위 */
export const DOMAINS = [
    { key: 'memoryScore', label: '기억력', range: '1~5번' },
    { key: 'otherScore', label: '기타 인지기능', range: '6~10번' },
    { key: 'adlScore', label: '일상생활수행능력', range: '11~15번' },
];
