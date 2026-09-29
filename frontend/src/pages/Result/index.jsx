/**
 * SCR-05 검사 결과 — 담당: 서다영
 * 참고: UI 설계서 3.5, React 설계서 3장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 *
 * 화면 구성
 *   공통: 제목 · 검사일시 · 판정 배너 · 총점(판정 기준 막대)
 *   KDSQ-P로 종료: 짧은 안내 문구만
 *   KDSQ-C까지 진행: 영역별 점수 + 권장 안내(solutions)
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResultStore } from '@/store/resultStore';
import { getDisplayScore, MAX_SCORE } from '@/utils/kdsq';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ResultHeader from './components/ResultHeader';
import ExamDate from './components/ExamDate';
import ResultStatus from './components/ResultStatus';
import TotalScore from './components/TotalScore';
import ScoreSummary from './components/ScoreSummary';
import Recommendation from './components/Recommendation';
import HistoryButton from './components/HistoryButton';
import HomeButton from './components/HomeButton';

const MESSAGES = {
  notFound: '검사 결과를 찾을 수 없습니다.',
  loadFail: '검사 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  network: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  firstTestEnded:
    '1차 검사에서 종료되어 영역별 점수와 관리 안내는 제공되지 않습니다. 6개월~1년 후 다시 검사해 보시길 권장합니다.',
  disclaimer: '이 결과는 선별검사 결과이며 의학적 진단이 아닙니다.',
};

/** 조회 실패 오류 → 화면 문구 */
function getLoadErrorMessage(error) {
  const code = error.response?.data?.error?.code;
  if (code === 'RESULT_NOT_FOUND') return MESSAGES.notFound;
  if (!error.response) return MESSAGES.network; // 서버 응답 자체가 없음
  return MESSAGES.loadFail;
}

export default function ResultPage() {
  // ── 1. 라우터 ──
  const { resultId } = useParams();
  const navigate = useNavigate();

  // ── 2. 전역 상태 ──
  const result = useResultStore((s) => s.currentResult);
  const fetchResult = useResultStore((s) => s.fetchResult);

  // ── 3. 로컬 상태 ──
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // ── 4. 데이터 로드: GET /api/results/:resultId (solutions 포함) ──
  const loadResult = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await fetchResult(resultId);
    } catch (error) {
      setErrorMessage(getLoadErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [fetchResult, resultId]);

  useEffect(() => {
    document.title = '검사 결과';
    loadResult();
  }, [loadResult]);

  // ── 5. 이벤트 핸들러 ──
  const handleHistory = useCallback(() => navigate('/mypage'), [navigate]);
  const handleHome = useCallback(() => navigate('/surveys/p'), [navigate]);

  // ── 6. 렌더링 ──
  if (isLoading) return <LoadingSpinner />;

  /** 조회 실패: 오류 메시지 + 재시도 / 검사 이력 */
  if (errorMessage || !result) {
    return (
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <ResultHeader />
        <Alert variant="destructive">
          <AlertDescription>{errorMessage || MESSAGES.notFound}</AlertDescription>
        </Alert>
        <div className="flex flex-col gap-2 md:flex-row md:justify-center">
          <Button type="button" variant="outline" className="h-12" onClick={loadResult}>
            다시 시도
          </Button>
          <HistoryButton onClick={handleHistory} />
        </div>
      </section>
    );
  }

  const { examType, riskLevel } = result;
  const isSecondTest = examType === 'KDSQ_C';

  /** 결과 전체를 하나의 흰 카드로 */
  return (
    <section className="mx-auto max-w-2xl">
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="space-y-2">
          <ResultHeader examType={examType} />
          <ExamDate date={result.createdAt} />
        </div>

        <ResultStatus riskLevel={riskLevel} />

        <TotalScore
          score={getDisplayScore(result)}
          maxScore={MAX_SCORE[examType]}
          examType={examType}
          riskLevel={riskLevel}
        />

        {isSecondTest ? (
          <>
            <ScoreSummary
              memoryScore={result.memoryScore}
              otherScore={result.otherScore}
              adlScore={result.adlScore}
            />
            <Recommendation solutions={result.solutions ?? []} />
          </>
        ) : (
          <p className="rounded-xl bg-slate-100 px-5 py-4 leading-relaxed text-slate-700">
            {MESSAGES.firstTestEnded}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">{MESSAGES.disclaimer}</p>

        <div className="flex flex-col gap-3 md:flex-row">
          <HistoryButton onClick={handleHistory} />
          <HomeButton onClick={handleHome} />
        </div>
      </div>
    </section>
  );
}
