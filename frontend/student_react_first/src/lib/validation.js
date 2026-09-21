/* ---------------------------------------------------------
   유효성 검사 — 화면도 서버도 모르는 순수 함수
   3부 form.js 의 validateStudent, isValidEmail,
   isValidStudentNumber 가 여기로 왔습니다.

   달라진 점은 하나입니다. alert 을 띄우지 않고
   "무엇이 잘못됐는지" 메시지만 돌려줍니다.
   그것을 어떻게 보여줄지는 부르는 쪽이 정합니다.
   덕분에 나중에 alert 대신 화면 안 메시지로 바꿀 때
   이 파일은 한 줄도 고치지 않아도 됩니다.
   --------------------------------------------------------- */

// 학번: 영문 2자 + 숫자 3자 (예: EE002)
//   ^     문자열의 시작        [A-Z]{2}  영문 대문자 2개
//   \d{3} 숫자 3개             $         문자열의 끝
//   /i    대소문자를 가리지 않는다 (ee002 도 통과)
const STUDENT_NUMBER_PATTERN = /^[A-Z]{2}\d{3}$/i;

// 전화번호: 숫자, 하이픈, 공백만 한 개 이상(+)
const PHONE_PATTERN = /^[0-9-\s]+$/;

// 이메일: @ 앞뒤와 점 뒤에 "공백도 @도 아닌 글자"가 있어야 한다
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// test() 는 정규식과 맞으면 true, 아니면 false 를 돌려준다.
export const isValidEmail = (email) => EMAIL_PATTERN.test(email);

// 앞뒤에 공백이 섞여 들어올 수 있으므로 trim() 으로 지운 뒤 검사한다.
export const isValidStudentNumber = (studentNumber) =>
    STUDENT_NUMBER_PATTERN.test(studentNumber.trim());

/* 문제가 없으면 null, 있으면 첫 번째 오류 메시지를 돌려준다.
   3부에서는 여기서 alert 을 띄우고 true / false 를 돌려주었다. */
export function validateStudent(student) {
    // 구조 분해 — 객체에서 필요한 값만 이름 그대로 꺼낸다.
    // const name = student.name; 을 세 번 쓰는 것과 같다.
    //
    // detailRequest = {} 는 기본값이다. detailRequest 가 없는 객체가
    // 들어와도 빈 객체로 대신해 "Cannot destructure property" 를 막는다.
    const { name, studentNumber, detailRequest = {} } = student;
    const { phoneNumber, email } = detailRequest;
    //const { name, studentNumber, detailRequest:{phoneNumber, email} } = student;

    // 문제를 찾으면 그 자리에서 바로 돌려주고 끝낸다(early return).
    // 아래로 갈수록 조건이 중첩되지 않아 읽기 쉽다.
    if (!name) return "이름을 입력해주세요.";

    // || 는 왼쪽이 거짓이면 오른쪽을 검사한다.
    // !studentNumber 가 먼저 걸러 주므로 안쪽 trim() 이 안전하다.
    if (!studentNumber || !isValidStudentNumber(studentNumber)) {
        return "학번을 입력하지 않거나 올바른 형식이 아닙니다.";
    }

    if (!phoneNumber || !PHONE_PATTERN.test(phoneNumber)) {
        return "전화번호를 입력하지 않거나 올바른 전화번호 형식이 아닙니다.";
    }

    // 이메일은 선택이 아니라 필수다.
    // collectStudentData 가 빈 칸을 null 로 바꿔 주므로 !email 에 걸린다.
    if (!email || !isValidEmail(email)) {
        return "이메일을 입력하지 않거나 올바른 이메일 형식이 아닙니다.";
    }

    // 여기까지 왔으면 문제가 없다는 뜻이다.
    return null;
}