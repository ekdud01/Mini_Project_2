/** 검사 이력 보기 - /mypage 이동 */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function HistoryButton({ onClick }) {
  return (
    <Button type="button" size="lg" className="h-12 w-full md:w-auto md:min-w-40" onClick={onClick}>
      검사 이력 보기
    </Button>
  );
}

HistoryButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default HistoryButton;