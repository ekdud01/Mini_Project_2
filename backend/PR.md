**PR** (base: `develop` 확인)

- 제목: `feat: 결과 관련 Repository 4개와 대시보드 projection 추가`
- 본문:

```
## 작업 내용
- SurveyRepository, QuestionRepository, SolutionRepository, SurveyResultRepository 추가 (Entity 설계서 8.0 표 메서드 전체)
- SurveyResultRepository에 JpaSpecificationExecutor 상속, findAll(Specification, Pageable)에 @EntityGraph
- 대시보드 projection: RiskLevelCount, ScoreAverages, MonthlyTrend (result 패키지)

## 확인
- 서버 정상 기동 (쿼리 문법 검사 통과)
- 메서드 12개 설계서 8.0 표와 대조 완료

## 참고
- 메서드 선언만 포함. 서비스·컨트롤러·data.sql은 다음 PR
- 사용: 이원구(findActiveByMemberId, findAll), 윤수연(대시보드 5개)