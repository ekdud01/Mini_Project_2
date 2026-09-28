/** 마지막 문항 제출 */

import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

function SubmitButton({ isSubmitting = false, onClick }) {
    return (
        <Button
            type="button"
            size="lg"
            className="h-12 flex-1 md:flex-none md:min-w-28"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            onClick={onClick}
        >
            {isSubmitting && (
                <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isSubmitting ? '제출 중' : '제출'}
        </Button>
    );
}

SubmitButton.propTypes = {
    isSubmitting: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
};

export default SubmitButton;