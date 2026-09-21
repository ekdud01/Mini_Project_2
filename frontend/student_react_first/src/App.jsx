/* ---------------------------------------------------------
   App.jsx — 4부의 main.js 자리
   하는 일은 main.js 와 같습니다. 서버를 부르고, 그 결과로
   화면을 바꾸고, 사용자의 동작을 받아 처리합니다.

   달라진 것은 "화면을 바꾸는 방법" 하나뿐입니다.

     4부 : renderStudentTable(students)  — 내가 DOM 을 고친다
     5부 : setStudents(students)         — 값만 바꾸면 React 가 다시 그린다

   그래서 이 파일에는 document 가 한 번도 나오지 않습니다.
   --------------------------------------------------------- */

import { useCallback, useEffect, useRef, useState } from "react";

// 서버와 대화하는 함수들 — 4부에서 쓰던 파일을 그대로 쓴다.
import {
  fetchStudents,
  fetchStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "./api/studentApi.js";

// 입력값 검사 — 이것도 4부 파일 그대로다.
import { validateStudent } from "./lib/validation.js";

// 폼 값과 서버 데이터 사이의 변환
import { EMPTY_FORM, toRequest, toFormValues } from "./lib/studentData.js";

// 화면 조각들
import StudentForm from "./components/StudentForm.jsx";
import StudentTable from "./components/StudentTable.jsx";

// 지금 어느 모드로 도는지 (TEST / PROD)
import { APP_MODE } from "./config.js";

import "./style.css";

// 성공 메시지가 저절로 사라지기까지의 시간(ms) — 4부와 같다.
const MESSAGE_TIMEOUT = 3000;

function App() {
  /* -----------------------------------------------------
     화면을 이루는 값들
     useState 는 [지금 값, 값을 바꾸는 함수] 두 개를 돌려준다.
     바꾸는 함수를 부르면 React 가 화면을 다시 그린다.

     4부에서 전역 변수와 DOM 에 흩어져 있던 상태가 여기 모였다.
     이 여섯 개만 보면 화면이 어떤 모습인지 알 수 있다.
     ----------------------------------------------------- */
  const [students, setStudents] = useState([]);          // 표에 그릴 학생 목록
  const [form, setForm] = useState(EMPTY_FORM);          // 입력칸 여섯 개의 값
  const [editingId, setEditingId] = useState(null);      // null 이면 등록 모드
  const [loading, setLoading] = useState(false);         // "로딩 중..." 을 보일까
  const [listError, setListError] = useState(null);      // 표 자리에 낼 오류 문구
  // 메시지는 { text: "문구", type: "error" 또는 "success" } 모양으로 담는다.
  const [message, setMessage] = useState(null);

  /* useRef 는 화면에 그려진 실제 요소를 붙잡아 두는 자리다.
     state 와 달리 값이 바뀌어도 화면을 다시 그리지 않는다.
     수정 버튼을 눌렀을 때 폼으로 스크롤하는 데만 쓴다. */
  const formRef = useRef(null);

  // 수정 모드인지는 editingId 로 알 수 있으므로 따로 state 를 두지 않는다.
  const isEditing = editingId !== null;

  /* -----------------------------------------------------
     목록 불러오기 — 4부 loadStudents 와 거의 같다
     ----------------------------------------------------- */
  /* useCallback 으로 감싸면 같은 함수를 계속 쓴다(실습 5-13).
     안에서 쓰는 것이 set 함수와 import 한 함수뿐이라 의존성이 [] 다.
     set 함수는 React 가 바뀌지 않는다고 보장한다. */
  //async function loadStudent() {
  const loadStudents = useCallback(async () => {
    setLoading(true);
    setListError(null);

    try {
      const data = await fetchStudents();

      // 4부에서는 renderStudentTable(data) 를 불렀다.
      // 여기서는 값만 바꾸면 React 가 표를 다시 그린다.
      setStudents(data);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.message, type: "error" });
      setListError("오류: 데이터를 불러올 수 없습니다.");
    } finally {
      // 성공하든 실패하든 로딩 표시는 반드시 끈다.
      setLoading(false);
    }
  }, []);

  /* -----------------------------------------------------
     처음 한 번만 목록을 불러온다
     4부에서 파일 맨 아래에 적었던 loadStudents() 한 줄에 해당한다.
     useEffect 의 두 번째 인자 [] 는 "처음 한 번만" 이라는 뜻이다.

     실습 5-13 에서 loadStudents 를 useCallback 으로 감싸면서
     [] 가 [loadStudents] 가 되었다. loadStudents 가 한 번 만들어진 뒤
     바뀌지 않으므로 뜻은 그대로 "처음 한 번만" 이다.
     ----------------------------------------------------- */
  useEffect(() => {
    // 아래 주석은 ESLint 에게 "이 경고는 알고 있다"고 알려 주는 줄이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 처음 한 번 목록을 불러오는 것은 의도된 동작입니다
    loadStudents();
  }, [loadStudents]);

  /* -----------------------------------------------------
     성공 메시지는 3초 뒤에 저절로 사라진다
     4부에서 messageTimer 변수를 두고 clearTimeout 을 부르던 일을
     useEffect 가 대신한다. return 으로 돌려준 함수를 정리 함수라고
     하는데, 메시지가 바뀌기 직전에 React 가 이것을 먼저 불러 준다.
     그래서 이전 예약이 새 메시지를 지워 버리는 일이 없다.
     ----------------------------------------------------- */
  useEffect(() => {
    if (!message) {
      return;
    }

    // 오류 메시지는 사용자가 고칠 때까지 남겨 둔다.
    if (message.type !== "success") {
      return;
    }

    const timer = setTimeout(() => setMessage(null), MESSAGE_TIMEOUT);

    // 정리 함수 — 다음 번 실행 직전과 화면에서 사라질 때 불린다.
    return () => clearTimeout(timer);
  }, [message]);

  /* -----------------------------------------------------
     입력칸 한 개가 바뀔 때
     입력칸 여섯 개가 모두 이 함수 하나를 부른다.
     어느 칸인지는 event 가 알려 준다.

       event.target       방금 글자를 친 input 요소
       event.target.name  그 input 에 적어 둔 name 값
       event.target.value 지금 칸에 들어 있는 글자

     state 는 직접 고치지 않고 언제나 새 객체로 바꾼다.
     form.name = ... 처럼 고치면 React 가 바뀐 줄 모른다.
     ----------------------------------------------------- */
  function handleChange(event) {
    // 어느 칸이 바뀌었는지, 값은 무엇인지 꺼낸다.
    const name = event.target.name;
    const value = event.target.value;

    // 기존 값을 그대로 복사한 새 객체를 만든다.
    const next = { ...form };

    // 바뀐 칸 하나만 덮어쓴다.
    // next.name 이 아니라 next[name] 인 이유는
    // 어느 칸인지가 name 변수에 담겨 있기 때문이다.
    next[name] = value;

    setForm(next);
  }

  // 폼을 비우고 등록 모드로 되돌린다 — 4부 resetForm()
  // 아래 handleDelete 가 이 함수를 쓰므로 이쪽도 고정해 둔다.
  //function resetFrom() {
  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  /* -----------------------------------------------------
     등록 / 수정 — 폼 제출
     ----------------------------------------------------- */
  async function handleSubmit(event) {
    event.preventDefault();          // 페이지 새로고침 막기
    setMessage(null);            // 앞선 메시지를 지운다

    const studentData = toRequest(form);

    // 검사에 걸리면 메시지만 보여 주고 끝낸다.
    const errorMessage = validateStudent(studentData);
    if (errorMessage) {
      setMessage({ text: errorMessage, type: "error" });
      return;
    }

    try {
      if (isEditing) {
        await updateStudent(editingId, studentData);
        setMessage({ text: "학생 정보가 성공적으로 수정되었습니다.", type: "success" });
      } else {
        await createStudent(studentData);
        setMessage({ text: "학생이 성공적으로 등록되었습니다.", type: "success" });
      }

      resetForm();
      await loadStudents();         // 목록 새로고침
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.message, type: "error" });   // 서버가 보낸 실제 메시지
    }
  }

  /* -----------------------------------------------------
     수정할 학생을 불러와 폼에 채운다 — 4부 startEdit()
     ----------------------------------------------------- */
  // async function handleEdit(stduentId) {
  const handleEdit = useCallback(async (studentId) => {
    setMessage(null);            // 앞선 메시지를 지운다

    try {
      const student = await fetchStudent(studentId);

      // 4부에서는 fillForm 이 input.value 에 하나씩 넣었다.
      // 여기서는 state 만 바꾸면 입력칸이 따라서 바뀐다.
      setForm(toFormValues(student));
      setEditingId(studentId);

      // formRef.current 는 화면에 그려진 form-container 요소다.
      // 아직 안 그려졌을 수도 있으므로 먼저 확인한다.
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.message, type: "error" });
    }
  }, []);

  /* -----------------------------------------------------
     확인을 받은 뒤 삭제한다 — 4부 removeStudent()
     ----------------------------------------------------- */
  // async function handleDelete(stduentId) {
  const handleDelete = useCallback(async (studentId) => {
    if (!confirm("정말로 이 학생을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteStudent(studentId);
      setMessage({ text: "학생이 성공적으로 삭제되었습니다.", type: "success" });

      // 수정 중이던 학생을 삭제했다면 폼도 등록 모드로 되돌린다.
      if (editingId === studentId) {
        resetForm();
      }

      await loadStudents();
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: error.message, type: "error" });
    }
  }, [editingId, resetForm, loadStudents]);
  /* 여기만 [] 가 아니다. 안에서 editingId 를 읽기 때문이다.
     그래도 editingId 는 글자를 칠 때 바뀌지 않으므로,
     입력 중에 표가 다시 그려지는 일은 없다. */

  /* -----------------------------------------------------
     화면
     4부의 index.html 에 있던 내용이 여기로 왔다.
     자식 컴포넌트에게 값과 함수를 내려 주는 것을 props 라고 한다.
     아래의 <> </> 는 태그 하나로 묶기 위한 빈 껍데기다(프래그먼트).
     ----------------------------------------------------- */

  // 제목 옆에 붙일 배지의 class. 운영이면 빨강, 아니면 회색.
  let modeClass = "app-mode test";
  if (APP_MODE === "PROD") {
    modeClass = "app-mode prod";
  }

  return (
    <>
      <h1>학생 관리 시스템 <span className={modeClass}>{APP_MODE}</span></h1>

      <StudentForm
        form={form}
        isEditing={isEditing}
        message={message}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={resetForm}
        containerRef={formRef}
      />

      <StudentTable
        students={students}
        loading={loading}
        error={listError}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
}

export default App;