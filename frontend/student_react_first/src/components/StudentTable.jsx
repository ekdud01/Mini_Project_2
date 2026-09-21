/* ---------------------------------------------------------
   학생 목록 표
   4부 ui/studentTable.js 에서 사라진 것들입니다.

     createElement / appendChild   →  JSX 로 바로 쓴다
     innerHTML = ""                →  students 가 바뀌면 React 가 다시 그린다
     addCell / createActionButton  →  필요 없다
     data-action + 이벤트 위임     →  onClick 에 함수를 직접 넘긴다

   4부에서 이벤트 위임을 쓴 이유는 "행을 다시 그리면 이벤트가
   떨어져 나가기 때문" 이었습니다. React 는 그릴 때마다 onClick 을
   다시 붙여 주므로 그 문제가 없습니다.
   --------------------------------------------------------- */

import { memo } from "react";

// 표의 열 개수. colSpan 에 쓴다.
const COLUMN_COUNT = 7;

/* 부모(App)가 넘겨주는 값들
     students  학생 배열
     loading   불러오는 중인가
     error     목록을 못 불러왔을 때의 메시지 (없으면 null)
     onEdit    수정 버튼을 눌렀을 때 부를 함수
     onDelete  삭제 버튼을 눌렀을 때 부를 함수 */
function StudentTable({ students, loading, error, onEdit, onDelete }) {
    /* tbody 안에 무엇을 그릴지 세 경우로 나눠서 정한다.
       JSX 안에 && 와 ? : 를 이어 쓰면 읽기 어려우므로,
       먼저 rows 에 담아 두고 아래 표 안에 끼워 넣는다. */
    let rows;

    if (error) {
        // (1) 목록을 못 불러왔다
        rows = (
            <tr>
                <td colSpan={COLUMN_COUNT} className="error-row">{error}</td>
            </tr>
        );
    } else if (students.length === 0 && !loading) {
        // (2) 목록이 비었다. 불러오는 중일 때는 안내를 내지 않는다.
        //     그래야 화면이 잠깐 깜빡이지 않는다.
        rows = (
            <tr>
                <td colSpan={COLUMN_COUNT} className="empty-row">등록된 학생이 없습니다.</td>
            </tr>
        );
    } else {
        // (3) 학생 한 명을 행 하나로 그린다.
        //     map 은 배열의 값 하나하나를 화면 조각으로 바꿔 준다.
        rows = students.map((student) => (
            // key 는 React 가 어느 행이 어느 행인지 알아보는 표시다.
            // 없으면 목록이 바뀔 때 엉뚱한 행이 다시 그려질 수 있다.
            <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.studentNumber}</td>
                <td>{student.detail?.address ?? "-"}</td>
                <td>{student.detail?.phoneNumber ?? "-"}</td>
                <td>{student.detail?.email ?? "-"}</td>
                <td>{student.detail?.dateOfBirth ?? "-"}</td>
                <td>
                    {/* data-id 도 Number(id) 도 필요 없다. id 를 그대로 넘긴다.
                        onClick 에는 함수를 "넘겨야" 한다. onEdit(student.id) 라고
                        쓰면 그리는 순간 바로 실행되므로 () => 로 감싼다. */}
                    <button type="button" className="edit-btn"
                            onClick={() => onEdit(student.id)}>수정</button>
                    <button type="button" className="delete-btn"
                            onClick={() => onDelete(student.id)}>삭제</button>
                </td>
            </tr>
        ));
    }

    return (
        <div className="table-container">
            <h2>학생 목록</h2>

            {/* 4부 setLoading() 대신 조건부 렌더링을 쓴다. */}
            {loading && <div className="loading">로딩 중...</div>}

            <table>
                <thead>
                    <tr>
                        <th>이름</th>
                        <th>학번</th>
                        <th>주소</th>
                        <th>전화번호</th>
                        <th>이메일</th>
                        <th>생년월일</th>
                        <th>액션</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}

/* 받은 props 가 그대로면 다시 그리지 않는다(실습 5-13).
   폼에 글자를 칠 때마다 App 이 다시 그려지는데, 그때 students 는
   바뀌지 않았으므로 이 표까지 다시 그릴 까닭이 없다.

   이것이 듣게 하려면 onEdit 과 onDelete 가 매번 새 함수여서는 안 된다.
   그래서 App 쪽에서 useCallback 으로 고정해 두었다. */
export default memo(StudentTable);