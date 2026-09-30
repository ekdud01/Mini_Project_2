/** 검사 단계 배지 · 검사명 · (2차) 진행 안내 · 안내 문구 */

import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { DEFAULT_SURVEY_DESCRIPTION } from '@/utils/kdsq';

/** 검사명 */
const TITLES = {
  P: 'KDSQ-P 인지선별검사 (1차)',
  C: 'KDSQ-C 상세검사',
};

/** 단계 배지 (1차: 파랑 / 2차: 주황) */
const STEP_BADGE = {
  P: { label: '1차 선별검사', className: 'bg-primary/10 text-primary' },
  C: { label: '2차 상세검사', className: 'bg-amber-100 text-amber-800' },
};

/** 2차 검사 상단 안내 */
const SECOND_TEST_NOTICE = '1차 검사 결과 추가 검사가 필요합니다. 2차 검사까지 완료해야 결과가 저장됩니다';

function SurveyHeader({ type, title = TITLES[type], description = DEFAULT_SURVEY_DESCRIPTION }) {
  const badge = STEP_BADGE[type];

  return (
    <header className="space-y-4">
      <span className={cn('inline-block rounded-md px-2.5 py-1 text-xs font-bold', badge.className)}>
        {badge.label}
      </span>

      <h1 className="text-2xl font-bold">{title}</h1>

      {type === 'C' && (
        <p
          role="status"
          className="rounded-md bg-amber-100 px-4 py-3 text-sm font-bold text-amber-800"
        >
          {SECOND_TEST_NOTICE}
        </p>
      )}

      <p className="flex gap-1.5 rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium leading-relaxed text-slate-700">
        <span aria-hidden="true">💡</span>
        <span className="whitespace-pre-line">{description}</span>
      </p>
    </header>
  );
}

SurveyHeader.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
  /** 기본 검사명 대신 쓸 제목 (시작 안내 화면용) */
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SurveyHeader;
