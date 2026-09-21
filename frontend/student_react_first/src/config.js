// import.meta.env 는 Vite 가 .env 파일의 값을 넣어 주는 자리다.
//   ?.  왼쪽이 없으면(undefined) 멈추고 undefined 를 돌려준다.
//       Vite 없이 열었을 때 "Cannot read properties of undefined" 를 막는다.
//   ??  왼쪽이 null 이나 undefined 일 때만 오른쪽 값을 쓴다.
//       || 와 달리 빈 문자열("")과 0 은 그대로 살린다.
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8080";
 
// 백틱(`)으로 감싸면 ${ } 안에 값을 끼워 넣을 수 있다(템플릿 리터럴).
// 3부의 `${API_BASE_URL}/api/students` 를 매번 쓰던 것을 한 번만 만들어 둔다.
export const STUDENTS_URL = `${API_BASE_URL}/api/students`;
 
// POST 와 PUT 에서 똑같이 쓰던 헤더. 3부에서는 함수마다 적어 두었다.
export const JSON_HEADERS = {
    "Content-Type": "application/json",
};

// 지금 테스트 모드인지 운영 모드인지.
//   npm run dev   → .env.development 를 읽어 "TEST"
//   npm run build → .env.production 을 읽어 "PROD"
// .env 파일이 없을 때를 대비해 기본값을 "TEST" 로 둔다.
// 운영 화면에 실수로 TEST 가 뜨는 편이, 테스트 화면에 PROD 가 뜨는 것보다 안전하다.
export const APP_MODE = import.meta.env?.VITE_MODE ?? "TEST";