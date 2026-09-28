/**
 * SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */

import PropTypes from 'prop-types';
import SurveyHeader from './components/SurveyHeader';

export default function SurveyPage({ type }) {


  return (
    <section className="mx-auto max-w-2xl space-y-6 pb-24 md:pb-0">
      <SurveyHeader type={type} />

    </section>
  );
}

SurveyPage.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
};
