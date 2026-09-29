-- 설문지 (data.sql)
INSERT IGNORE INTO surveys (id, exam_type, title, description, created_at) VALUES
 (1, 'KDSQ_P', 'KDSQ-P 1차 선별검사', '아래의 각 항목에 대하여, 1년 전과 비교하여, 현재 상태에 해당하는 곳에 표시해 주십시오. (동행한 가족이 있으면 가족이 작성하시고, 없으면 본인이 작성하십시오.)', NOW()),
 (2, 'KDSQ_C', 'KDSQ-C 2차 상세검사', '아래의 각 항목에 대하여, 1년 전과 비교하여, 현재 상태에 해당하는 곳에 표시해 주십시오. (동행한 가족이 있으면 가족이 작성하시고, 없으면 본인이 작성하십시오.)', NOW());

-- 문항 (data.sql, KDSQ-P 5건 + KDSQ-C 15건)
INSERT IGNORE INTO questions (id, survey_id, question_number, content, created_at) VALUES
 -- KDSQ-P (survey_id = 1, question id 1~5)
 (1, 1, 1, '자신의 기억력이 친구나 동료들에 비해 못하다고 생각하십니까?', NOW()),
 (2, 1, 2, '자신의 기억력이 1년 전에 비해 더 나빠졌다고 생각하십니까?', NOW()),
 (3, 1, 3, '중요한 일을 하는데 있어서도 기억력이 문제가 되는 경우가 있습니까?', NOW()),
 (4, 1, 4, '자신의 기억력이 떨어진 것을 남들도 알고 있습니까?', NOW()),
 (5, 1, 5, '잘해오던 일상적인 일을 하는데 예전보다 서툴러졌다고 생각하십니까?', NOW()),
 -- KDSQ-C (survey_id = 2, question id 6~20)
 -- 1~5번: 기억력 (memoryScore)
 (6, 2, 1, '오늘이 몇 월이고, 무슨 요일인지를 모른다.', NOW()),
 (7, 2, 2, '자기가 놔둔 물건을 찾지 못 한다.', NOW()),
 (8, 2, 3, '같은 질문을 반복해서 한다.', NOW()),
 (9, 2, 4, '약속을 하고서 잊어버린다.', NOW()),
 (10, 2, 5, '물건을 가지러 갔다가 잊어버리고 그냥 온다.', NOW()),
 -- 6~10번: 기타 인지기능 (otherScore)
 (11, 2, 6, '물건이나, 사람의 이름을 대기가 힘들어 머뭇거린다.', NOW()),
 (12, 2, 7, '대화 중 내용이 이해되지 않아 반복해서 물어 본다.', NOW()),
 (13, 2, 8, '길을 잃거나 헤맨 적이 있다.', NOW()),
 (14, 2, 9, '예전에 비해서 계산 능력이 떨어졌다(예: 물건값이나 거스름돈 계산을 못한다).', NOW()),
 (15, 2, 10, '예전에 비해 성격이 변했다.', NOW()),
 -- 11~15번: 일상생활 수행능력 (adlScore)
 (16, 2, 11, '이전에 잘 다루던 기구의 사용이 서툴러졌다(세탁기, 전기밥솥, 경운기 등).', NOW()),
 (17, 2, 12, '예전에 비해 방이나 집안의 정리 정돈을 하지 못한다.', NOW()),
 (18, 2, 13, '상황에 맞게 스스로 옷을 선택하여 입지 못 한다.', NOW()),
 (19, 2, 14, '혼자 대중교통 수단을 이용하여 목적지에 가기 힘들다(신체적인 문제(관절염)로 인한 것은 제외됨).', NOW()),
 (20, 2, 15, '내복이나 옷이 더러워져도 갈아입지 않으려고 한다.', NOW());

-- 관리 안내 (data.sql)
INSERT IGNORE INTO solutions (id, risk_level, title, content, created_at) VALUES
 (1, 'Borderline', '인지건강 관리 안내', '규칙적인 운동, 사회 활동, 정기적인 재검사 권장 등', NOW()),
 (2, 'HighRisk', '전문 검진 안내', '가까운 치매안심센터 또는 전문 의료기관 방문 권장 등', NOW());

-- ↓ 여기부터는 data.sql에 넣지 않는 수동 테스트용 SQL
-- 테스트용 회원 (비밀번호는 BCrypt 해시)
INSERT INTO members (email, password, name, gender, birth_year, status, role, created_at) VALUES
 ('hong@test.com', '$2a$10$...', '홍길동', 'MALE', 1960, 'ACTIVE', 'MEMBER', NOW());

-- 테스트용 검사 결과 (1차 종료 / 2차 주의 / 2차 위험)
-- member_id 2 = 위 테스트 회원 (1번은 AdminInitializer가 먼저 등록한 관리자). 회원가입 API(backend/http/member.http)로 가입했다면 위 회원 INSERT는 생략한다
INSERT INTO survey_results (member_id, survey_id, first_score, memory_score, other_score, adl_score, risk_level, active, created_at) VALUES
 (2, 1, 2, NULL, NULL, NULL, 'Normal', 1, '2026-07-10 10:00:00'),
 (2, 2, 5, 2, 1, 1, 'Borderline', 1, '2026-08-12 10:00:00'),
 (2, 2, 7, 4, 2, 3, 'HighRisk', 1, '2026-09-15 10:00:00');