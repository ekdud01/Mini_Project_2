import PropTypes from 'prop-types';

/**
 * [뼈대] SCR-03·04 KDSQ-P / KDSQ-C 검사 — 담당: 서다영
 * 참고: UI 설계서 3.3·3.4, React 설계서 3·4장
 * 이 페이지에서만 쓰는 컴포넌트는 ./components/ 에 만든다.
 */
export default function SurveyPage({ type }) {
  return (
    <section>
      <h1 className="text-2xl font-bold">SCR-03·04 KDSQ-P / KDSQ-C 검사</h1>
      <p className="mt-2 text-muted-foreground">현재 검사: {type === 'P' ? 'KDSQ-P (1차)' : 'KDSQ-C (2차)'}</p>
    </section>
  );
}

SurveyPage.propTypes = {
  type: PropTypes.oneOf(['P', 'C']).isRequired,
};
