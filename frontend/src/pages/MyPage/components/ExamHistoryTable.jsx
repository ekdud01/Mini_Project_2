import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SurveyResultShape } from '@/types/propTypes';
import { formatDateOnly } from '@/utils/date';
import { EXAM_TYPE_LABEL } from '@/utils/kdsq';
import { getHistoryPage, getScoreDisplay, HISTORY_PAGE_SIZE } from '../history';
import RiskBadge from './RiskBadge';
import ExamHistoryCard from './ExamHistoryCard';

function scoreContent(score, label) {
  if (score === '—') {
    return <><span aria-hidden="true">—</span><span className="sr-only">2차 검사 없음</span></>;
  }
  if (score === '-') return <strong className="text-lg font-semibold">-</strong>;
  return (
    <span className="inline-flex items-baseline justify-center gap-x-1 whitespace-nowrap tabular-nums">
      <strong className="inline-block w-[2ch] text-right text-lg font-semibold">{score}</strong>
      <span className="inline-block w-[4ch] text-left text-muted-foreground">{label.slice(score.length)}</span>
    </span>
  );
}

export default function ExamHistoryTable({ results = [], page = 1, pageSize = HISTORY_PAGE_SIZE, onPageChange, onDetail }) {
  const { rows, currentPage, totalPages } = useMemo(() => getHistoryPage(results, page, pageSize), [results, page, pageSize]);

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
        <Table className="table-fixed text-base tabular-nums [&_td]:text-center" aria-label="검사 이력">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[23%]" />
            <col className="w-[23%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
          </colgroup>
          <TableHeader><TableRow className="bg-muted/50">
            {['검사일', '1차 (KDSQ-P)', '2차 (KDSQ-C)', '위험도', '상세'].map((label) => <TableHead key={label} scope="col" className="h-12 text-center font-semibold">{label}</TableHead>)}
          </TableRow></TableHeader>
          <TableBody>{rows.map((result) => {
            const display = getScoreDisplay(result);
            return (
              <TableRow key={result.id}>
                <TableCell>{formatDateOnly(result.createdAt)}</TableCell>
                <TableCell>{scoreContent(display.firstScore, display.firstLabel)}</TableCell>
                <TableCell>{scoreContent(display.secondScore, display.secondLabel)}</TableCell>
                <TableCell><RiskBadge riskLevel={result.riskLevel} /></TableCell>
                <TableCell>{detailButton(result)}</TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table>
      </div>
      <ul aria-label="검사 이력" className="space-y-4 md:hidden">
        {rows.map((result) => <ExamHistoryCard key={result.id} result={result} onDetail={onDetail} />)}
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
      <p role="status" className="text-center text-base text-muted-foreground">{currentPage} / {totalPages}페이지</p>
    </div>
  );
}

ExamHistoryTable.propTypes = {
  results: PropTypes.arrayOf(SurveyResultShape),
  page: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onDetail: PropTypes.func.isRequired,
};
