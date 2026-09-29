/** 검사 이력 보기 - /mypage 이동 (보조 버튼: 흰 배경 테두리) */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function HistoryButton({ onClick }) {
  return (
    <Button type="button" variant="outline" size="lg" className="h-14 flex-1 text-base font-bold" onClick={onClick}>
      검사 이력 보기
    </Button>
  );
}

HistoryButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default HistoryButton;
