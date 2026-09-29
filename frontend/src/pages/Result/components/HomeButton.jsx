/** 
 * 홈으로 
 * 검사 시작 화면(/surveys/p)으로 이동 (주 버튼) 
 */

import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';

function HomeButton({ onClick }) {
  return (
    <Button
      type="button"
      size="lg"
      className="h-14 w-full text-base font-bold md:flex-1"
      onClick={onClick}
    >
      홈으로
    </Button>
  );
}

HomeButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default HomeButton;
