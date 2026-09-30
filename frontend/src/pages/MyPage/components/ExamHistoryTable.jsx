import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SurveyResultShape } from '@/types/propTypes';
import { formatDateOnly } from '@/utils/date';
import { EXAM_TYPE_LABEL, getDisplayScore, MAX_SCORE } from '@/utils/kdsq';
import { getHistoryPage } from '../history';
import RiskBadge from './RiskBadge';

function scoreLabel(result) {
  const score = getDisplayScore(result);
  return score == null ? '-' : `${score} / ${MAX_SCORE[result.examType]}점`;
}

export default function ExamHistoryTable({ results = [], page = 1, onPageChange, onDetail }) {
  const { rows, currentPage, totalPages } = useMemo(() => getHistoryPage(results, page), [results, page]);

  function detailButton(result) {
    return (
      <Button type="button" variant="outline" className="min-h-12 min-w-12 text-base"
        aria-label={`${formatDateOnly(result.createdAt)} ${EXAM_TYPE_LABEL[result.examType]} 결과 ${result.id} 상세 보기`}
        onClick={() => onDetail(result.id)}>
        보기
      </Button>
    );
  }

  if (!results.length) return null;

  return (
    <div className="space-y-4">
      <div className="hidden rounded-2xl border bg-white p-4 shadow-sm md:block">
        <Table className="text-base" aria-label="검사 이력">
          <TableHeader><TableRow>
            {['검사일', '검사', '총점 / 만점', '판정', '상세'].map((label) => <TableHead key={label} scope="col">{label}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>{rows.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{formatDateOnly(result.createdAt)}</TableCell>
              <TableCell>{EXAM_TYPE_LABEL[result.examType]}</TableCell>
              <TableCell>{scoreLabel(result)}</TableCell>
              <TableCell><RiskBadge riskLevel={result.riskLevel} /></TableCell>
              <TableCell>{detailButton(result)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
      <ul aria-label="검사 이력" className="space-y-4 md:hidden">
        {rows.map((result) => (
          <li key={result.id} className="space-y-4 rounded-2xl border bg-white p-4 text-base shadow-sm">
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
              <dt className="font-semibold">검사일</dt><dd>{formatDateOnly(result.createdAt)}</dd>
              <dt className="font-semibold">검사</dt><dd>{EXAM_TYPE_LABEL[result.examType]}</dd>
              <dt className="font-semibold">총점 / 만점</dt><dd>{scoreLabel(result)}</dd>
              <dt className="font-semibold">판정</dt><dd><RiskBadge riskLevel={result.riskLevel} /></dd>
            </dl>
            <div className="flex justify-end">{detailButton(result)}</div>
          </li>
        ))}
      </ul>
      <nav aria-label="검사 이력 페이지" className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" className="min-h-12 min-w-12 text-base"
          disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>이전</Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
          <Button key={number} type="button" variant={number === currentPage ? 'default' : 'outline'}
            className="min-h-12 min-w-12 text-base" aria-label={`${number}페이지`}
            aria-current={number === currentPage ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</Button>
        ))}
        <Button type="button" variant="outline" className="min-h-12 min-w-12 text-base"
          disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>다음</Button>
      </nav>
      <p role="status" className="text-center text-sm text-muted-foreground">{currentPage} / {totalPages}페이지</p>
    </div>
  );
}

ExamHistoryTable.propTypes = {
  results: PropTypes.arrayOf(SurveyResultShape),
  page: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired,
};
