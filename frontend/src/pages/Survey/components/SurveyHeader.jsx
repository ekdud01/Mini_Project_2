/** 검사명·안내 문구 */
import PropTypes from "prop-types";

/**  */
const TITLES = {
    P: 'KDSQ-P 인지선별검사 (1차)',
    C: 'KDSQ-C 상세검사 (2차)',
};

/** 설문에 대한 안내 문구 */
const DEFAULT_DESCRIPTION =
    '아래의 각 항목에 대하여, 1년 전과 비교하여 현재 상태에 해당하는 곳에 표시해 주십시오. (동행한 가족이 있으면 가족이 작성하시고, 없으면 본인이 작성하십시오.';

function SurveyHeader({ type, description = DEFAULT_DESCRIPTION}) {
    return (
        <header className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">{TITLES[type]}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </header>
    );
}

SurveyHeader.PropTypes = {
    type: PropTypes.oneOf(['P', 'C']).isRequired,
    description: PropTypes.string,
};

export default SurveyHeader;