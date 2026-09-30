/** 검사 일시 */

import PropTypes from 'prop-types';
import { formatDateTime } from '@/utils/date';

function ExamDate({ date }) {
  return (
    <p className="text-center text-sm text-slate-500">
      검사일시 : <time dateTime={date}>{formatDateTime(date)}</time>
    </p>
  );
}

ExamDate.propTypes = {
  date: PropTypes.string.isRequired,
};

export default ExamDate;
