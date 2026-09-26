/**
 * KDSQ 인지선별검사 플랫폼 — MSW(Mock Service Worker) 핸들러
 * - REST API 설계서(v1.10)의 요청·응답 형식을 그대로 따른다.
 * - data/*.json을 메모리에 올려 두고, 채점·판정·검증을 서버 규칙대로 흉내 낸다.
 *   (새로고침하면 가입·제출·탈퇴한 내용은 초기 상태로 돌아감)
 * - 실제 백엔드가 준비되면 main.jsx에서 MSW 시작 코드만 끄면 된다.
 */
import { http, HttpResponse } from 'msw';
import membersData from '../data/members.json';
import surveys from '../data/surveys.json';
import questions from '../data/questions.json';
import solutions from '../data/solutions.json';
import resultsData from '../data/results.json';

// ── 메모리 DB ────────────────────────────────────────────
const members = structuredClone(membersData);
const results = structuredClone(resultsData);
const refreshTokens = new Map(); // memberId → refreshToken (회원당 1개, Entity 4.5)
let nextMemberId = Math.max(...members.map((m) => m.id)) + 1;
let nextResultId = Math.max(...results.map((r) => r.id)) + 1;

// ── 공통 응답 (REST 2.5) ─────────────────────────────────
const now = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const ok = (data, message, status = 200, headers) =>
  HttpResponse.json({ success: true, data, ...(message && { message }), timestamp: now() }, { status, headers });
const fail = (status, code, message, fields) =>
  HttpResponse.json(
    { success: false, error: { code, message, ...(fields && { fields }) }, timestamp: now() },
    { status },
  );

// ── 인증 ─────────────────────────────────────────────────
// 액세스 토큰: "mock-access-token-{회원id}"
// 만료 테스트: localStorage의 accessToken 값을 "expired"로 바꾸면 401 ACCESS_TOKEN_EXPIRED
function authMember(request) {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.replace(/^Bearer\s+/, '');
  if (!token) return { error: fail(401, 'UNAUTHORIZED', '로그인이 필요합니다') };
  if (token === 'expired') return { error: fail(401, 'ACCESS_TOKEN_EXPIRED', '액세스 토큰이 만료되었습니다') };
  const m = token.match(/^mock-access-token-(\d+)/);
  const member = m && members.find((x) => x.id === Number(m[1]) && x.status === 'ACTIVE' && x.role === 'MEMBER');
  if (!member) return { error: fail(401, 'UNAUTHORIZED', '로그인이 필요합니다') };
  return { member };
}
const issueTokens = (member) => {
  const refreshToken = `mock-refresh-token-${member.id}-${Date.now()}`;
  refreshTokens.set(member.id, refreshToken); // 재로그인 시 교체
  return { accessToken: `mock-access-token-${member.id}`, refreshToken, tokenType: 'Bearer', expiresIn: 3600 };
};

// ── DTO 변환 ─────────────────────────────────────────────
const examTypeOf = (surveyId) => surveys.find((s) => s.id === surveyId).examType;
const toMemberDto = ({ id, email, name, gender, birthYear, status, createdAt }) =>
  ({ id, email, name, gender, birthYear, status, createdAt });
function toResultDto(r, detail = false) {
  const totalScore = r.memoryScore === null ? null : r.memoryScore + r.otherScore + r.adlScore;
  const dto = {
    id: r.id,
    ...(detail && { memberId: r.memberId }),
    examType: examTypeOf(r.surveyId),
    firstScore: r.firstScore,
    memoryScore: r.memoryScore,
    otherScore: r.otherScore,
    adlScore: r.adlScore,
    totalScore,
    riskLevel: r.riskLevel,
    createdAt: r.createdAt,
  };
  if (detail) {
    dto.solutions = solutions
      .filter((s) => s.riskLevel === r.riskLevel)
      .map(({ id, title, content }) => ({ id, title, content }));
  }
  return dto;
}

// ── 검증·채점 (REST 3.1.1, 4.3 / Entity 4.3.3) ────────────
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!-/:-@[-`{-~])[!-~]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(b) {
  const fields = [];
  const year = new Date().getFullYear();
  if (!b.email || !EMAIL_REGEX.test(b.email) || b.email.length > 100)
    fields.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다' });
  if (!b.password || !PASSWORD_REGEX.test(b.password))
    fields.push({ field: 'password', message: '비밀번호는 8~20자의 영문, 숫자, 특수문자를 모두 포함해야 합니다' });
  if (!b.name || !b.name.trim() || b.name.length > 50)
    fields.push({ field: 'name', message: '이름은 1~50자로 입력해주세요' });
  if (!['MALE', 'FEMALE'].includes(b.gender))
    fields.push({ field: 'gender', message: '성별을 선택해주세요' });
  if (!Number.isInteger(b.birthYear) || b.birthYear < 1900 || b.birthYear > year)
    fields.push({ field: 'birthYear', message: `출생년도는 1900년부터 ${year}년 사이여야 합니다` });
  return fields;
}

/** 답변을 문항 번호별 점수로 변환. 오류면 { error } 반환 */
function scoreByNumber(surveyId, answers, expected) {
  if (!Array.isArray(answers) || answers.length !== expected)
    return { error: fail(400, 'INVALID_ANSWER_COUNT', '모든 문항에 답해주세요') };
  if (answers.some((a) => ![0, 1, 2].includes(a?.score)))
    return { error: fail(400, 'VALIDATION_ERROR', '입력값이 올바르지 않습니다', [{ field: 'score', message: '답변 점수는 0~2여야 합니다' }]) };
  const byNumber = {};
  for (const a of answers) {
    const q = questions.find((x) => x.id === a.questionId && x.surveyId === surveyId);
    if (!q) return { error: fail(404, 'QUESTION_NOT_FOUND', '문항을 찾을 수 없습니다') };
    byNumber[q.questionNumber] = a.score;
  }
  return { byNumber };
}
const sumRange = (byNumber, from, to) => {
  let s = 0;
  for (let n = from; n <= to; n += 1) s += byNumber[n] ?? 0;
  return s;
};

// ── 핸들러 ───────────────────────────────────────────────
export const handlers = [
  // 회원가입 (REST 3.1.1)
  http.post('/api/members', async ({ request }) => {
    const body = await request.json();
    const fields = validateSignup(body);
    if (fields.length) return fail(400, 'VALIDATION_ERROR', '입력값이 올바르지 않습니다', fields);
    if (members.some((m) => m.email === body.email)) return fail(409, 'DUPLICATE_EMAIL', '이미 사용 중인 이메일입니다');
    const member = {
      id: nextMemberId++, email: body.email, password: body.password, name: body.name,
      gender: body.gender, birthYear: body.birthYear, status: 'ACTIVE', role: 'MEMBER', createdAt: now(),
    };
    members.push(member);
    const { createdAt, ...dto } = toMemberDto(member);
    return ok(dto, '회원가입이 완료되었습니다', 201);
  }),

  // 로그인 (REST 3.1.2)
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    const member = members.find((m) => m.email === email && m.password === password && m.role === 'MEMBER');
    if (!member) return fail(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');
    if (member.status === 'WITHDRAWN') return fail(403, 'MEMBER_WITHDRAWN', '이용할 수 없는 계정입니다');
    return ok(issueTokens(member), '로그인이 성공하였습니다');
  }),

  // 토큰 재발급 (REST 3.1.3)
  http.post('/api/auth/reissue', async ({ request }) => {
    const { refreshToken } = await request.json();
    const m = /^mock-refresh-token-(\d+)-/.exec(refreshToken ?? '');
    const memberId = m && Number(m[1]);
    if (!memberId || refreshTokens.get(memberId) !== refreshToken)
      return fail(401, 'INVALID_REFRESH_TOKEN', '다시 로그인해주세요');
    return ok({ accessToken: `mock-access-token-${memberId}`, tokenType: 'Bearer', expiresIn: 3600 });
  }),

  // 로그아웃 (REST 3.1.4)
  http.post('/api/auth/logout', ({ request }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    refreshTokens.delete(member.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // 내 정보 (REST 4.1.1)
  http.get('/api/members/me', ({ request }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    return ok(toMemberDto(member));
  }),

  // 회원 탈퇴 (REST 4.1.2)
  http.delete('/api/members/me', ({ request }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    member.status = 'WITHDRAWN';
    refreshTokens.delete(member.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // 설문 목록 (REST 4.2.1)
  http.get('/api/surveys', ({ request }) => {
    const { error } = authMember(request);
    if (error) return error;
    const examType = new URL(request.url).searchParams.get('examType');
    if (examType && !['KDSQ_P', 'KDSQ_C'].includes(examType))
      return fail(400, 'INVALID_EXAM_TYPE', '지원하지 않는 검사 유형입니다');
    return ok(examType ? surveys.filter((s) => s.examType === examType) : surveys);
  }),

  // 문항 조회 (REST 4.2.2)
  http.get('/api/surveys/:surveyId/questions', ({ request, params }) => {
    const { error } = authMember(request);
    if (error) return error;
    const surveyId = Number(params.surveyId);
    if (!surveys.some((s) => s.id === surveyId)) return fail(404, 'SURVEY_NOT_FOUND', '설문지를 찾을 수 없습니다');
    const list = questions
      .filter((q) => q.surveyId === surveyId)
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map(({ id, questionNumber, content }) => ({ id, questionNumber, content }));
    return ok(list);
  }),

  // 검사 결과 제출 (REST 4.3.1, 4.3.2)
  http.post('/api/results', async ({ request }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    const body = await request.json();
    const survey = surveys.find((s) => s.id === body.surveyId);
    if (!survey) return fail(404, 'SURVEY_NOT_FOUND', '설문지를 찾을 수 없습니다');
    const pSurvey = surveys.find((s) => s.examType === 'KDSQ_P');

    let result;
    if (survey.examType === 'KDSQ_P') {
      const first = scoreByNumber(pSurvey.id, body.answers, 5);
      if (first.error) return first.error;
      const firstScore = sumRange(first.byNumber, 1, 5);
      if (firstScore >= 4) return fail(422, 'KDSQ_C_REQUIRED', '1차 검사 점수가 4점 이상이면 2차 검사까지 완료해야 합니다');
      result = { firstScore, memoryScore: null, otherScore: null, adlScore: null, riskLevel: 'Normal' };
    } else {
      const first = scoreByNumber(pSurvey.id, body.firstAnswers, 5);
      if (first.error) return first.error;
      const second = scoreByNumber(survey.id, body.answers, 15);
      if (second.error) return second.error;
      const firstScore = sumRange(first.byNumber, 1, 5);
      if (firstScore < 4) return fail(422, 'KDSQ_C_NOT_ALLOWED', '1차 검사 점수가 4점 미만이면 2차 검사 결과를 저장할 수 없습니다');
      const memoryScore = sumRange(second.byNumber, 1, 5);
      const otherScore = sumRange(second.byNumber, 6, 10);
      const adlScore = sumRange(second.byNumber, 11, 15);
      const total = memoryScore + otherScore + adlScore;
      result = { firstScore, memoryScore, otherScore, adlScore, riskLevel: total <= 5 ? 'Borderline' : 'HighRisk' };
    }
    const saved = { id: nextResultId++, memberId: member.id, surveyId: survey.id, ...result, active: true, createdAt: now() };
    results.push(saved);
    return ok(toResultDto(saved), '검사가 완료되었습니다', 201, { Location: `/api/results/${saved.id}` });
  }),

  // 검사 결과 상세 (REST 4.3.3) — 다른 회원·삭제된 결과는 404
  http.get('/api/results/:resultId', ({ request, params }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    const r = results.find((x) => x.id === Number(params.resultId));
    if (!r || r.memberId !== member.id || !r.active) return fail(404, 'RESULT_NOT_FOUND', '검사 결과를 찾을 수 없습니다');
    return ok(toResultDto(r, true));
  }),

  // 내 검사 이력 (REST 4.3.4) — 최신순, 페이징
  http.get('/api/members/me/results', ({ request }) => {
    const { member, error } = authMember(request);
    if (error) return error;
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get('page') ?? 0));
    const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size') ?? 20)));
    const mine = results
      .filter((r) => r.memberId === member.id && r.active)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const totalPages = Math.ceil(mine.length / size);
    return ok({
      content: mine.slice(page * size, page * size + size).map((r) => toResultDto(r)),
      page: { number: page, size, totalElements: mine.length, totalPages, first: page === 0, last: page >= totalPages - 1 },
    });
  }),
];
