/** 홈으로 - 검사 시작 화면(/surveys/p) 이동 (주 버튼) */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function HomeButton({ onClick }) {
  return (
    <Button type="button" size="lg" className="h-14 flex-1 text-base font-bold" onClick={onClick}>
      홈으로
    </Button>
  );
}

HomeButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default HomeButton;
