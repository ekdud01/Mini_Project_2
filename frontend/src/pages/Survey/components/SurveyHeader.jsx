/** 검사명·안내 문구 */
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

/**  */
const TITLES = {
    P: 'KDSQ-P 인지선별검사 (1차)',
    C: 'KDSQ-C 상세검사',
};

/** 단계 배지 (1차: 파랑 / 2차: 주황) */
const STEP_BADGE = {
    P: { label: '1차 선별검사', className: 'bg-primary/10 text-primary' },
    C: { label: '2차 상세검사', className: 'bg-amber-100 text-amber-800' },
};

/** API의 description이 오기 전·없을 때 쓰는 기본 문구 */
const DEFAULT_DESCRIPTION =
    '아래의 각 항목에 대하여, 1년 전과 비교하여, 현재 상태에 해당하는 곳에 표시해 주십시오. (동행한 가족이 있으면 가족이 작성하시고, 없으면 본인이 작성하십시오.)';

/** 2차 검사 상단 안내 */
const SECOND_TEST_NOTICE =
    '1차 검사 결과 추가 검사가 필요합니다. 2차 검사까지 완료해야 결과가 저장됩니다.';

function SurveyHeader({ type, description = DEFAULT_DESCRIPTION }) {
    const badge = STEP_BADGE[type];

    return (
        <header className="space-y-4">
            <span className={cn('inline-block rounded-md px-2.5 py-1 text-xs font-bold', badge.className)}>
                {badge.label}
            </span>
            <h1 className="text-2xl font-bold">{TITLES[type]}</h1>
            {type === 'C' && (
                <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                    {SECOND_TEST_NOTICE}
                </p>
            )}
            <p className="rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700">
                <span aria-hidden="true">💡 </span>
                {description}
            </p>
        </header>
    );
}

SurveyHeader.propTypes = {
    type: PropTypes.oneOf(['P', 'C']).isRequired,
    description: PropTypes.string,
};

export default SurveyHeader;
