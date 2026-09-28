/**
 * SCR-05 검사 결과 — 담당: 서다영
 * 참고: UI 설계서 3.5, React 설계서 3장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import { getDisplayScore, MAX_SCORE } from '@/utils/kdsq';
import { useResultStore } from '@/store/resultStore';
import { Card, CardContent } from '@/components/ui/card';
import ResultHeader from './components/ResultHeader';
import ResultStatus from './components/ResultStatus';
import TotalScore from './components/TotalScore';
import ScoreSummary from './components/ScoreSummary';
import ExamDate from './components/ExamDate';
import Recommendation from './components/Recommendation';
import HistoryButton from './components/HistoryButton';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResultPage() {
  const navigate = useNavigate();
  const result = useResultStore((s) => s.currentResult);
  const handleHistory = useCallback(() => navigate('/mypage'), [navigate]);

  if (!result) {
    return (
      <section className="p-6 text-center">
        <ResultHeader />
        <Card>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">저장된 검사 결과가 없습니다.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const isSecondTest = result.examType === 'KDSQ-C';

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
          memoryScore={result.memoryScore ?? 0}
          otherScore={result.otherScore ?? 0}
          adlScore={result.adlScore ?? 0}
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
