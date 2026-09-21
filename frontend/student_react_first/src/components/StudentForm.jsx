/* ---------------------------------------------------------
   학생 등록 · 수정 폼
   4부까지는 폼이 index.html 에 있었고, ui/studentForm.js 가
   그 요소를 찾아 값을 읽고 쓰고 버튼 글자를 바꿨습니다.

   React 에서는 폼이 이 파일 안에 있습니다. 그리고 입력칸의
   값은 DOM 이 아니라 부모가 준 form 객체에서 옵니다.

     화면에 보이는 값 = props.form
     값이 바뀌면      = props.onChange 로 부모에게 알린다

   이런 입력을 제어 컴포넌트(controlled component)라고 합니다.
   이 컴포넌트는 값을 저장하지 않습니다. 그리기만 합니다.

   입력칸 여섯 개가 생김새는 같지만 일부러 하나씩 펼쳐 적었습니다.
   위에서 아래로 한 번에 읽히는 것이 지금은 더 중요하기 때문입니다.
   --------------------------------------------------------- */

import MessageBox from "./MessageBox.jsx";

/* 부모(App)가 넘겨주는 값들 */
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
                <div className="form-grid">
                    {/* 입력칸 한 개는 언제나 이 세 가지가 짝이다.
                          value    = {form.어느칸}   보이는 값은 부모에게서 온다
                          onChange = {onChange}      바뀌면 부모에게 알린다
                          name     = "어느칸"        부모가 어느 칸인지 알아보는 이름 */}
                    <div className="form-group">
                        <label htmlFor="name">이름:</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={form.name}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="studentNumber">학번:</label>
                        <input
                            id="studentNumber"
                            name="studentNumber"
                            type="text"
                            required
                            value={form.studentNumber}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">주소:</label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            required
                            value={form.address}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">전화번호:</label>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            required
                            value={form.phoneNumber}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">이메일:</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dateOfBirth">생년월일:</label>
                        <input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            value={form.dateOfBirth}
                            onChange={onChange}
                        />
                    </div>
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