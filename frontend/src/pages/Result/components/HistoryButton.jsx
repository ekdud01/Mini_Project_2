/** 
 * 검사 이력 보기 
 * 마이페이지 화면(/mypage) 이동
 */

import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';

function HistoryButton({ onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-14 w-full text-base font-bold md:flex-1"
      onClick={onClick}
    >
      검사 이력 보기
    </Button>
  );
}

HistoryButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default HistoryButton;
