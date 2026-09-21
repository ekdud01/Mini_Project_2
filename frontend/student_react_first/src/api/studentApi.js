/* ---------------------------------------------------------
   학생 API — 서버와 대화하는 부분만 모아 둔다
   3부 form.js 의 loadStudents, createStudent, updateStudent,
   deleteStudent, editStudent 안에 있던 fetch 부분이 여기로 왔습니다.

   이 파일은 값을 돌려주거나 오류를 던지기만 합니다.
   alert 도 innerHTML 도 여기에는 없습니다.
   화면에 무엇을 보여줄지는 main.js 가 정합니다.
   --------------------------------------------------------- */

// 다른 파일에서 export 한 값을 가져온다. 필요한 이름만 { } 안에 적는다.
import { STUDENTS_URL, JSON_HEADERS } from "../config.js";

// 서버가 message 를 주지 않을 때 대신 쓸 문구.
// 객체를 이렇게 두면 DEFAULT_MESSAGES[404] 처럼 상태 코드로 바로 꺼낼 수 있다.
const DEFAULT_MESSAGES = {
    400: "입력한 값이 올바르지 않습니다.",
    404: "존재하지 않는 학생입니다.",
    409: "이미 등록된 학번입니다.",
    500: "서버에서 오류가 발생했습니다.",
};

/* 아래 다섯 함수가 똑같이 반복하던 일을 이 함수 하나로 모았다.
     fetch 로 요청 → 실패면 오류 던지기 → 성공이면 JSON 으로 바꾸기

   async 를 붙이면 그 함수 안에서 await 을 쓸 수 있다.
   await 은 "이 줄이 끝날 때까지 기다렸다가 다음 줄로 간다"는 뜻이라,
   3부의 .then().then().catch() 사슬을 위에서 아래로 읽는 코드로 바꿔 준다.

   options = {} 는 기본 매개변수다. 인자를 넘기지 않으면 {} 가 들어가므로
   request(url) 처럼 한 개만 넘겨도 오류가 나지 않는다. */
async function request(url, options = {}) {
    const response = await fetch(url, options);

    // response.ok 는 상태 코드가 200~299 일 때만 true 다.
    // fetch 는 404 나 500 을 받아도 오류를 내지 않으므로 직접 확인해야 한다.
    if (!response.ok) {
        // 서버가 JSON 이 아닌 오류 페이지를 줄 수도 있다.
        // 그때 json() 이 실패하므로 catch 로 빈 객체를 대신 쓴다.
        const errorData = await response.json().catch(() => ({}));

        // ?? 를 이어 쓰면 앞에서부터 값이 있는 것을 고른다.
        //   서버 메시지 → 상태 코드별 기본 문구 → 마지막 안전망
        const message =
            errorData.message ??
            DEFAULT_MESSAGES[response.status] ??
            `요청에 실패했습니다. (${response.status})`;

        // throw 로 던지면 이 함수를 부른 쪽의 try / catch 가 받는다.
        throw new Error(message);
    }

    // 204 No Content 는 돌려줄 본문이 없다(삭제 성공 등).
    // 여기서 response.json() 을 부르면 "Unexpected end of JSON input" 이 난다.
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/* 아래 다섯 개는 화살표 함수다.
     const 이름 = (매개변수) => 돌려줄 값;
   중괄호와 return 없이 한 줄로 쓰면 그 값이 그대로 돌아간다.
   function fetchStudents() { return request(STUDENTS_URL); } 와 같은 뜻이다. */

// 학생 목록 조회
export const fetchStudents = () => request(STUDENTS_URL);
// 학생 ID 개별 조회
export const fetchStudent = (id) => request(`${STUDENTS_URL}/${id}`);

// 돌려줄 값이 객체나 여러 줄이면 이렇게 줄을 바꿔 쓴다.
// 학생 등록
export const createStudent = (student) =>
    request(STUDENTS_URL, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(student),   // 객체를 JSON 문자열로 바꾼다
    });

// 학생 수정
export const updateStudent = (id, student) =>
    request(`${STUDENTS_URL}/${id}`, {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify(student),
    });

// 학생 삭제    
export const deleteStudent = (id) =>
    request(`${STUDENTS_URL}/${id}`, {
        method: "DELETE",
    });