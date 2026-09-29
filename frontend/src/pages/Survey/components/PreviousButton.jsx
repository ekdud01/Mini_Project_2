/** 이전 문항으로 이동 */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function PreviousButton({ isDisabled = false, onClick }) {
    return (
        <Button type="button" variant="outline" size="lg"
            className="h-12 flex-1 text-base font-bold" disabled={isDisabled} onClick={onClick}>
            이전 문항
        </Button>
    );
}

PreviousButton.propTypes = {
    isDisabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
};

export default PreviousButton;