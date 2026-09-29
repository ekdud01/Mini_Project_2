/**
 * SCR-05 검사 결과 — 담당: 서다영
 * 참고: UI 설계서 3.5, React 설계서 3장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDisplayScore, MAX_SCORE } from '@/utils/kdsq';
import { useResultStore } from '@/store/resultStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ResultHeader from './components/ResultHeader';
import ResultStatus from './components/ResultStatus';
import TotalScore from './components/TotalScore';
import ScoreSummary from './components/ScoreSummary';
import ExamDate from './components/ExamDate';
import Recommendation from './components/Recommendation';
import HistoryButton from './components/HistoryButton';
import HomeButton from './components/HomeButton';

const NOT_FOUND_MESSAGE = '검사 결과를 찾을 수 없습니다.';
const LOAD_FAIL_MESSAGE = '검사 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
const NETWORK_ERROR_MESSAGE = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
const FIRST_END_NOTICE =
  '1차 검사에서 종료되어 영역별 점수와 관리 안내는 제공되지 않습니다. 6개월~1년 후 다시 검사해 보시길 권장합니다.';

export default function ResultPage() {
  // ── 1. 로컬 상태 (React 설계서 4.2) ──
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // ── 2. 전역 상태 ──
  const { resultId } = useParams();
  const navigate = useNavigate();
  const result = useResultStore((s) => s.currentResult);
  const fetchResult = useResultStore((s) => s.fetchResult);

  // ── 3. 데이터 로드: GET /api/results/:resultId (solutions 포함) ──
  const loadResult = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await fetchResult(resultId);
    } catch (error) {
      const code = error.response?.data?.error?.code;
      if (code === 'RESULT_NOT_FOUND') setErrorMessage(NOT_FOUND_MESSAGE);
      else if (!error.response) setErrorMessage(NETWORK_ERROR_MESSAGE);
      else setErrorMessage(LOAD_FAIL_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [fetchResult, resultId]);

  useEffect(() => {
    document.title = '검사 결과';
    loadResult();
  }, [loadResult]);

  // ── 4. 이벤트 핸들러 ──
  const handleHistory = useCallback(() => navigate('/mypage'), [navigate]);
  const handleHome = useCallback(() => navigate('/surveys/p'), [navigate]);

  // ── 5. 조건부 렌더링 (로딩 / 오류) ──
  if (isLoading) return <LoadingSpinner />;

  if (errorMessage || !result) {
    return (
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <ResultHeader />
        <Alert variant="destructive">
          <AlertDescription>{errorMessage || NOT_FOUND_MESSAGE}</AlertDescription>
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

  const isSecondTest = result.examType === 'KDSQ_C';

  // ── 6. 렌더링 (시안 image 9·10·11: 결과 전체를 하나의 흰 카드로) ──
  return (
    <section className="mx-auto max-w-2xl">
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm md:p-10">
        <div className="space-y-2">
          <ResultHeader examType={result.examType} />
          <ExamDate date={result.createdAt} />
        </div>

        <ResultStatus riskLevel={result.riskLevel} />

        <TotalScore
          score={getDisplayScore(result)}
          maxScore={MAX_SCORE[result.examType]}
          examType={result.examType}
          riskLevel={result.riskLevel}
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
          <p className="rounded-xl bg-slate-100 px-5 py-4 leading-relaxed text-slate-700">{FIRST_END_NOTICE}</p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          이 결과는 선별검사 결과이며 의학적 진단이 아닙니다.
        </p>

        <div className="flex flex-col gap-3 md:flex-row">
          <HistoryButton onClick={handleHistory} />
          <HomeButton onClick={handleHome} />
        </div>
      </div>
    </section>
  );
}
