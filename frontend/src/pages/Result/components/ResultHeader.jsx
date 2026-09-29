/** Result 페이지 제목: 회색 "검사 결과" + "KDSQ-C 검사 결과" (examType 없으면 제목만) */
import { EXAM_TYPE_LABEL } from "@/utils/kdsq";
import PropTypes from "prop-types";

function ResultHeader({ examType }) {
    return (
        <header className="space-y-1 text-center">
            <p className="text-sm font-semibold text-slate-500">검사 결과</p>
            <h1 className="text-3xl font-bold">
                {examType ? `${EXAM_TYPE_LABEL[examType]} 검사 결과` : '검사 결과'}
            </h1>
        </header>
    );
}

ResultHeader.propTypes = {
    examType: PropTypes.oneOf(['KDSQ_P', 'KDSQ_C']),
};

export default ResultHeader;
