/* ---------------------------------------------------------
   학생 등록 · 수정 폼 — 리팩토링한 것 (실습 5-12)

   StudentForm.jsx 와 하는 일이 똑같습니다. 화면도 동작도 같습니다.
   달라진 것은 코드의 모양뿐입니다.

     StudentForm.jsx        입력칸 여섯 개를 하나씩 펼쳐 적었다
     StudentFormField.jsx   같은 부분을 Field 하나로 묶었다

   동작을 바꾸지 않고 코드의 모양만 고치는 일을
   리팩토링(refactoring)이라고 합니다. 그래서 앱을 다 만든 뒤에 합니다.

   두 파일 중 하나만 씁니다. App.jsx 의 import 한 줄을 바꿔 가며
   어느 쪽이 읽기 좋은지 직접 견주어 보세요.
   --------------------------------------------------------- */

import MessageBox from "./MessageBox.jsx";

/* 입력칸 한 개를 그리는 작은 컴포넌트.
   여섯 칸에서 달라지는 것은 아래 네 가지뿐이라, 그것만 밖에서 받는다.

     name      칸의 이름. id 와 name 속성에 함께 쓴다
     label     화면에 보일 글자
     type      text · tel · email · date
     required  반드시 채워야 하는 칸인가

   value 와 onChange 는 받은 것을 그대로 넘긴다.
   이 컴포넌트도 값을 갖지 않는다. 그리기만 한다.

   컴포넌트 이름은 반드시 대문자로 시작해야 한다.
   소문자로 쓰면 React 가 <div> 같은 HTML 태그로 본다. */
function Field({ name, label, type, required, value, onChange }) {
    return (
        <div className="form-group">
            <label htmlFor={name}>{label}:</label>
            <input
                id={name}
                name={name}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}

/* 부모(App)가 넘겨주는 값들 — StudentForm.jsx 와 똑같다 */
function StudentForm({
    form,          // 화면에 보일 입력값 여섯 개
    isEditing,     // 수정 모드인가
    message,       // 폼 아래 보여 줄 메시지
    onChange,      // 입력칸이 바뀔 때 부를 함수
    onSubmit,      // 제출할 때 부를 함수
    onCancel,      // 취소를 누를 때 부를 함수
    containerRef,  // 수정 시 이 위치로 스크롤하기 위한 참조
}) {
    // 4부 setEditMode 가 classList.toggle 로 하던 일을 문자열로 표현한다.
    let containerClass = "form-container";
    if (isEditing) {
        containerClass = "form-container editing";
    }

    // 등록 모드와 수정 모드에서 글자만 달라진다.
    let actionLabel = "등록";
    if (isEditing) {
        actionLabel = "수정";
    }

    return (
        <div className={containerClass} ref={containerRef}>
            <h2>학생 {actionLabel}</h2>

            {/* onSubmit 안에서 event.preventDefault() 를 부르는 것은 4부와 같다. */}
            <form onSubmit={onSubmit}>
                {/* 펼쳐 쓸 때 여덟 줄이던 칸 하나가 한 줄이 됐다.
                    달라지는 네 가지만 적고 나머지는 Field 가 알아서 한다. */}
                <div className="form-grid">
                    <Field name="name" label="이름" type="text" required
                           value={form.name} onChange={onChange} />
                    <Field name="studentNumber" label="학번" type="text" required
                           value={form.studentNumber} onChange={onChange} />
                    <Field name="address" label="주소" type="text" required
                           value={form.address} onChange={onChange} />
                    <Field name="phoneNumber" label="전화번호" type="tel" required
                           value={form.phoneNumber} onChange={onChange} />
                    <Field name="email" label="이메일" type="email" required
                           value={form.email} onChange={onChange} />

                    {/* 생년월일만 required 를 적지 않는다. 비워 두어도 된다. */}
                    <Field name="dateOfBirth" label="생년월일" type="date"
                           value={form.dateOfBirth} onChange={onChange} />
                </div>

                <div className="button-group">
                    <button type="submit">학생 {actionLabel}</button>

                    {/* 4부에서는 style.display 를 바꿨지만, 여기서는 아예 그리지 않는다.
                        조건 && 화면 은 "조건이 참일 때만 그린다"는 뜻이다. */}
                    {isEditing && (
                        <button type="button" className="cancel-btn" onClick={onCancel}>
                            취소
                        </button>
                    )}

                    <MessageBox message={message} />
                </div>
            </form>
        </div>
    );
}

export default StudentForm;