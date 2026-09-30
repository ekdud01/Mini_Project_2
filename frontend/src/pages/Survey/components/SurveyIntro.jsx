/**
 * 검사 시작 안내 (KDSQ-P 1차 검사 전에 표시)
 * [검사 시작하기]를 누르면 문항 화면으로 넘어간다.
 * 2차(KDSQ-C)는 1차에서 바로 이어지므로 표시하지 않는다.
 */

import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import SurveyHeader from './SurveyHeader';

const GUIDE_ITEMS = [
  { label: '문항 수', value: '5문항' },
  { label: '소요 시간', value: '약 1~2분 (시간 제한 없음)' },
  { label: '응답 방법', value: '아니다 · 가끔(조금) 그렇다 · 자주(많이) 그렇다 중 선택' },
  { label: '진행 안내', value: '1차 점수가 4점 이상이면 2차 상세검사(15문항)로 이어집니다' },
];

function SurveyIntro({ description, onStart }) {
  return (
    <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
      <SurveyHeader type="P" title="KDSQ-P 인지선별검사" description={description} />

      <dl className="divide-y rounded-xl border">
        {GUIDE_ITEMS.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 px-4 py-3 md:flex-row md:gap-4">
            <dt className="shrink-0 font-semibold text-slate-500 md:w-24">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm text-muted-foreground">이 검사는 선별검사이며 의학적 진단이 아닙니다</p>

      <Button type="button" size="lg" className="h-14 w-full text-lg font-bold" onClick={onStart}>
        검사 시작하기
      </Button>
    </div>
  );
}

SurveyIntro.propTypes = {
  description: PropTypes.string,
  onStart: PropTypes.func.isRequired,
};

export default SurveyIntro;
