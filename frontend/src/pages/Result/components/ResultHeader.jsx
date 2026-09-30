/** 
 * 결과 페이지 제목: 
 * 회색 "검사 결과" 하단에 "KDSQ-P/KDSQ-C 검사 결과" 
 */

import { EXAM_TYPE_LABEL } from '@/utils/kdsq';
import { ExamTypeType } from '@/types/propTypes';

function ResultHeader({ examType }) {
  const title = examType ? `${EXAM_TYPE_LABEL[examType]} 검사 결과` : '검사 결과';

  return (
    <header className="space-y-1 text-center">
      <p className="text-sm font-semibold text-slate-500">검사 결과</p>
      <h1 className="text-3xl font-bold">{title}</h1>
    </header>
  );
}

ResultHeader.propTypes = {
  examType: ExamTypeType,
};

export default ResultHeader;
