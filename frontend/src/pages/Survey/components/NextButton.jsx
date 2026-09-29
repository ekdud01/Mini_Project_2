/** 다음 문항으로 이동 */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function NextButton({ onClick }) {
  return (
    <Button type="button" size="lg" 
        className="h-12 flex-1 text-base font-bold" onClick={onClick}>
      다음 문항
    </Button>
  );
}

NextButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default NextButton;