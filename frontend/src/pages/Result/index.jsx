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

export default function ResultPage() {
  const MOCK_RESULT = { id: 1, examType: 'KDSQ_C', firstScore: 4, memoryScore: 2, otherScore: 2, adlScore: 1, totalScore: 5, riskLevel: 'Borderline', createdAt: '2026-09-22T10:00:00' };

  // const result = useResultStore((s) => s.currentResult);
  const result = useResultStore((s) => s.currentResult) ?? MOCK_RESULT; 

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

  return (
    <section>
      <ResultHeader />

      <Card>
        <CardContent className="space-y-4">
          <ResultStatus result={result} />
          <TotalScore score={getDisplayScore(result)} maxScore={MAX_SCORE[result.examType]} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        이 결과는 선별검사 결과이며 의학적 진단이 아닙니다.
      </p>

    </section>
  );
}
