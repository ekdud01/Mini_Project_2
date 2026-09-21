/* ---------------------------------------------------------
   폼 값과 서버 데이터 사이의 변환
   4부 ui/studentForm.js 의 collectStudentData 와 fillForm 이
   여기로 왔습니다.

   document 를 만지던 코드는 전부 사라졌습니다. React 에서는
   입력값이 DOM 이 아니라 state 에 있기 때문입니다.

     4부 collectStudentData()  →  toRequest(form)
     4부 fillForm(student)     →  toFormValues(student)
   --------------------------------------------------------- */

// 등록 모드의 빈 폼. 폼을 되돌릴 때도 이 값을 쓴다.
// 입력칸 여섯 개의 이름이 여기에 모여 있다.
export const EMPTY_FORM = {
    name: "",
    studentNumber: "",
    address: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
};

// 폼 state 를 서버가 받는 구조로 바꾼다.
// 4부에서 FormData 로 하던 일인데, 이제 값이 form 객체에 이미 있다.
// 백엔드의 StudentDTO의 Request (요청) 객체 
export function toRequest(form) {
    return {
        name: form.name.trim(),
        studentNumber: form.studentNumber.trim(),
        detailRequest: {
            address: form.address.trim() || null,
            phoneNumber: form.phoneNumber.trim() || null,
            // 빈 문자열("")도 걸러야 하므로 여기서는 ?? 가 아니라 || 를 쓴다.
            email: form.email.trim() || null,
            dateOfBirth: form.dateOfBirth || null,
        },
    };
}

// 서버에서 받은 학생 정보를 폼 state 모양으로 바꾼다.
// 수정 버튼을 눌렀을 때 쓴다.
// 백엔드 StudentDTO의 Reponse (응답) 객체 
export function toFormValues(student) {
    const detail = student.detail;

    // input 의 value 에 undefined 를 넣으면 React 가 경고를 낸다.
    // 그래서 값이 없을 때는 반드시 빈 문자열로 바꿔 준다.
    //   detail?.address  detail 이 없으면 거기서 멈추고 undefined
    //   ?? ""            그 undefined 를 빈 문자열로 바꾼다
    return {
        name: student.name ?? "",
        studentNumber: student.studentNumber ?? "",
        address: detail?.address ?? "",
        phoneNumber: detail?.phoneNumber ?? "",
        email: detail?.email ?? "",
        dateOfBirth: detail?.dateOfBirth ?? "",
    };
}