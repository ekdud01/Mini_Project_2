// KDSQ 관리자 화면 공통 스크립트
// 1. 확인 모달   2. 제출 중 표시·중복 제출 방지   3. 알림 닫기
// 4. 비밀번호 보기   5. 에러 페이지 버튼   6. 기간 빠른 선택   7. 막대 채우기 효과
(() => {
  'use strict';

  // ---------- 1. 확인 모달 ----------
  // 사용: <button type="submit" data-confirm="설명 문구" data-confirm-title="제목" data-confirm-ok="삭제">
  //       (form에 data-confirm을 달아도 동작)
  // <dialog>를 지원하지 않는 브라우저는 기본 confirm()으로 대체
  let dialog = null;

  function buildDialog() {
    const d = document.createElement('dialog');
    d.className = 'confirm-dialog';
    d.setAttribute('aria-labelledby', 'confirm-title');
    d.setAttribute('aria-describedby', 'confirm-desc');
    d.innerHTML =
      '<div class="dialog-body">' +
      '  <span class="dialog-icon" aria-hidden="true">' +
      '    <svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
      '  </span>' +
      '  <div><h2 id="confirm-title"></h2><p id="confirm-desc"></p></div>' +
      '</div>' +
      '<form method="dialog" class="dialog-actions">' +
      '  <button value="cancel" class="btn">취소</button>' +
      '  <button value="ok" class="btn btn-danger"></button>' +
      '</form>';
    document.body.appendChild(d);
    return d;
  }

  function askConfirm({ title, message, ok }, onOk, trigger) {
    if (typeof HTMLDialogElement !== 'function') {        // 미지원 브라우저
      if (window.confirm(message)) onOk();
      return;
    }
    dialog = dialog || buildDialog();
    // 사용자 문구는 textContent로만 넣는다 (XSS 방지)
    dialog.querySelector('#confirm-title').textContent = title;
    dialog.querySelector('#confirm-desc').textContent = message;
    dialog.querySelector('button[value="ok"]').textContent = ok;
    dialog.returnValue = '';
    dialog.onclose = () => {
      if (trigger) trigger.focus();                        // 닫히면 원래 버튼으로 포커스 복귀
      if (dialog.returnValue === 'ok') onOk();
    };
    dialog.showModal();                                    // Esc로 닫기·포커스 가두기는 브라우저 기본 동작
    dialog.querySelector('button[value="cancel"]').focus(); // 실수 방지: 취소에 먼저 포커스
  }

  // ---------- 2. 제출 중 표시 · 중복 제출 방지 ----------
  function lockSubmit(form) {
    setTimeout(() => {                                     // 전송 시작 후 잠금 (버튼 값이 빠지지 않도록)
      form.querySelectorAll('button[type="submit"]').forEach((b) => {
        b.disabled = true;
        if (b.dataset.loadingText) {
          b.dataset.originalText = b.textContent;
          b.textContent = b.dataset.loadingText;          // 예: "로그인 중..."
        }
      });
    }, 0);
  }

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.method === 'dialog') return;                  // 모달 안 버튼은 제외
    const submitter = e.submitter;
    const source = (submitter && submitter.dataset.confirm) ? submitter : form;
    const message = source.dataset.confirm;

    if (message && form.dataset.confirmed !== 'true') {
      e.preventDefault();
      askConfirm({
        title: source.dataset.confirmTitle || '진행하시겠습니까?',
        message,
        ok: source.dataset.confirmOk || '확인'
      }, () => {
        form.dataset.confirmed = 'true';
        if (form.requestSubmit) form.requestSubmit(submitter || undefined);
        else form.submit();
      }, submitter);
      return;
    }
    delete form.dataset.confirmed;
    lockSubmit(form);
  });

  // 뒤로가기로 돌아왔을 때 잠긴 버튼 되돌리기
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('button[type="submit"]:disabled').forEach((b) => {
      b.disabled = false;
      if (b.dataset.originalText) b.textContent = b.dataset.originalText;
    });
  });

  // ---------- 3. 알림 닫기 ----------
  document.querySelectorAll('.flash-success').forEach((el) => {
    setTimeout(() => el.remove(), 3000);                  // 성공 메시지는 3초 후 자동 닫힘
  });
  document.addEventListener('click', (e) => {
    const close = e.target.closest('.flash-close');       // 오류 메시지는 × 버튼으로 닫기
    if (close) close.closest('.flash').remove();
  });

  // ---------- 4. 비밀번호 보기/숨기기 ----------
  // 사용: <button type="button" data-toggle-password="password" aria-label="비밀번호 보기" aria-pressed="false">
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle-password]');
    if (!btn) return;
    const input = document.getElementById(btn.dataset.togglePassword);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
  });

  // ---------- 5. 에러 페이지 버튼 ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'back') {
      if (history.length > 1) history.back();
      else location.href = btn.dataset.fallback || '/admin/dashboard';
    }
    if (btn.dataset.action === 'reload') location.reload();
  });

  // ---------- 6. 기간 빠른 선택 (검사 결과 목록) ----------
  // 사용: <button type="button" data-range="7d" data-from="from" data-to="to">최근 7일</button>
  //       data-range="month" → 이번 달 1일 ~ 오늘. 날짜만 채우고, 검색은 사용자가 [검색]으로 실행
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-range]');
    if (!btn) return;
    const from = document.getElementById(btn.dataset.from || 'from');
    const to = document.getElementById(btn.dataset.to || 'to');
    if (!from || !to) return;
    const today = new Date();
    const start = new Date(today);
    if (btn.dataset.range === '7d') start.setDate(today.getDate() - 6);
    if (btn.dataset.range === 'month') start.setDate(1);
    from.value = ymd(start);
    to.value = ymd(today);
  });

  // ---------- 7. 막대 채우기 효과 (대시보드 영역별 점수) ----------
  // 사용: <meter ... data-animate> → 처음 열 때 0에서 실제 값까지 0.8초 동안 채움
  //       "동작 줄이기" 설정 사용자는 바로 최종 값 표시. 값 자체는 서버가 넣은 그대로 유지
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('meter[data-animate]').forEach((m) => {
      const target = m.value;
      const start = performance.now();
      const duration = 800;
      m.value = 0;
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        m.value = target * (1 - Math.pow(1 - p, 3));      // 끝으로 갈수록 천천히
        if (p < 1) requestAnimationFrame(step);
        else m.value = target;                             // 마지막은 정확한 값으로
      };
      requestAnimationFrame(step);
    });
  }
})();
