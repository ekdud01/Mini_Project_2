import PropTypes from 'prop-types';

/** 도메인 타입의 PropTypes shape (React 설계서 3.2). 여러 컴포넌트가 함께 쓴다. */

export const RiskLevelType = PropTypes.oneOf(['Normal', 'Borderline', 'HighRisk']);

export const QuestionShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  questionNumber: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
});

export const SolutionShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
});

export const SurveyResultShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  examType: PropTypes.oneOf(['KDSQ_P', 'KDSQ_C']).isRequired,
  firstScore: PropTypes.number.isRequired,
  memoryScore: PropTypes.number, // KDSQ-P로 끝나면 null
  otherScore: PropTypes.number,
  adlScore: PropTypes.number,
  totalScore: PropTypes.number,
  riskLevel: RiskLevelType.isRequired,
  createdAt: PropTypes.string.isRequired,
  solutions: PropTypes.arrayOf(SolutionShape),
});

export const MemberShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  gender: PropTypes.oneOf(['MALE', 'FEMALE']).isRequired,
  birthYear: PropTypes.number.isRequired,
});
