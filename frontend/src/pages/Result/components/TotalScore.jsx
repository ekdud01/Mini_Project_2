/** 
 * 총점
 * KDSQ-P: firstScore / 10점
 * KDSQ-C: totalScore / 30점
 * null인 경우 "-"
 */

import PropTypes from "prop-types";

function TotalScore({ score, maxScore }) {
    const hasScore = score !== null && score !== undefined;

    return (
        <p className="text-center text-lg">
            총점{' '}
            <strong className="text-3xl font-bold">{hasScore ? score : '-'}</strong>
            {hasScore && '점'}
            {maxScore !== undefined && <span className="text-muted-foreground"> / {maxScore}점</span>}
        </p>
    );
}

TotalScore.propTypes = {
    score: PropTypes.number,
    maxScore: PropTypes.number,
};

export default TotalScore;