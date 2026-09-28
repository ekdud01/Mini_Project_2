// KDSQ 관리자 화면 공통 스크립트

// 1. 탈퇴·삭제 확인창 + 제출 버튼 중복 클릭 방지
//    사용: <form ... data-confirm="이 회원을 탈퇴 처리하시겠습니까?">
document.addEventListener('submit', (e) => {
  const form = e.target;
  const message = form.dataset.confirm || (e.submitter && e.submitter.dataset.confirm);
  if (message && !confirm(message)) {
    e.preventDefault();
    return;
  }
  // 전송이 시작된 뒤에 버튼을 잠금 (바로 잠그면 버튼 값이 전송되지 않을 수 있음)
  setTimeout(() => {
    form.querySelectorAll('button[type="submit"]').forEach((b) => { b.disabled = true; });
  }, 0);
});

// 브라우저 뒤로가기로 돌아왔을 때 잠긴 버튼 다시 풀기
window.addEventListener('pageshow', () => {
  document.querySelectorAll('button[type="submit"]:disabled').forEach((b) => { b.disabled = false; });
});

// 2. 성공 메시지는 3초 후 자동으로 닫기
document.querySelectorAll('.flash-success').forEach((el) => {
  setTimeout(() => el.remove(), 3000);
});

// 3. 오류 메시지는 × 버튼으로 닫기
document.addEventListener('click', (e) => {
  if (e.target.closest('.flash-close')) {
    e.target.closest('.flash').remove();
  }
});