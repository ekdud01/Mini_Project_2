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
import { Card, CardContent } from '@/components/ui/card';
import ResultHeader from './components/ResultHeader';
import ResultStatus from './components/ResultStatus';
import TotalScore from './components/TotalScore';
import ScoreSummary from './components/ScoreSummary';
import ExamDate from './components/ExamDate';
import Recommendation from './components/Recommendation';
import HistoryButton from './components/HistoryButton';

const NOT_FOUND_MESSAGE = '검사 결과를 찾을 수 없습니다.';
const LOAD_FAIL_MESSAGE = '검사 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
const NETWORK_ERROR_MESSAGE = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

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

  // ── 6. 렌더링 ──
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <ResultHeader />

      <Card>
        <CardContent className="space-y-4">
          <ResultStatus result={result} />
          <TotalScore score={getDisplayScore(result)} maxScore={MAX_SCORE[result.examType]} />
          <ExamDate date={result.createdAt} />
        </CardContent>
      </Card>

      {isSecondTest && (
        <ScoreSummary
          memoryScore={result.memoryScore}
          otherScore={result.otherScore}
          adlScore={result.adlScore}
        />
      )}

      <Recommendation solutions={result.solutions ?? []} />

      <p className="text-center text-xs text-muted-foreground">
        이 결과는 선별검사 결과이며 의학적 진단이 아닙니다.
      </p>

      <div className="flex justify-center">
        <HistoryButton onClick={handleHistory} />
      </div>
    </section>
  );
}