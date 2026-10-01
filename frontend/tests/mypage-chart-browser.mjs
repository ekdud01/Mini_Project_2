// 실행: node tests/mypage-chart-browser.mjs [MSW Vite URL]
// Chrome headless + CDP. CHROME_PATH로 실행 파일을 지정할 수 있다.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5184';
const out = new URL('./artifacts/mypage-chart/', import.meta.url);
mkdirSync(out, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9334',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mypage-chart-'))}`,
  '--no-first-run', '--force-device-scale-factor=1', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const records = [];
const errors = [];
let ws;
try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch('http://127.0.0.1:9334/json/list')).json()).find((tab) => tab.type === 'page'); } catch { /* Chrome 시작 대기 */ }
  }
  assert.ok(target, 'Chrome 시작');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, { resolve, reject });
    ws.send(JSON.stringify({ id: callId, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let i = 0; i < 75; i++) {
      if (await evaluate(expression)) return;
      await sleep(200);
    }
    throw new Error(`대기 초과: ${expression}`);
  };
  const inspect = () => evaluate("import('/tests/mypage-chart-inspection.js').then(m => m.inspectTrendChart())");
  const clickText = (text) => evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === ${JSON.stringify(text)}).click()`);
  const resize = async (width) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(350);
  };
  const screenshot = async (name) => {
    await evaluate("document.querySelector('[aria-labelledby=mypage-trend-title]').scrollIntoView({block:'start'})");
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(new URL(`${name}.png`, out), Buffer.from(shot.data, 'base64'));
  };
  const assertLayout = async (name) => {
    const chart = await inspect();
    assert.equal(await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0, `${name} 페이지 넘침`);
    assert.ok(chart.chipOffsets.every((offset) => Math.abs(offset) < 1), `${name} 칩 높이`);
    assert.equal(chart.instances, 1, `${name} 단일 Chart 인스턴스`);
    assert.equal(chart.latestIds.length, 1, `${name} 최근 검사 1개`);
    assert.ok(chart.points.every((point, i) => i === 0 || point.x - chart.points[i - 1].x >= 95), `${name} 점 간격`);
    return chart;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await resize(1280);
  await send('Page.navigate', { url: `${base}/tests/mypage-browser.html` });
  await waitFor("document.body.textContent.includes('설정: empty')");
  assert.equal((await inspect()).count, 0);
  for (const [label, count] of [['이력 1건', 1], ['이력 11건', 11], ['이력 100건', 100], ['전체 101건 · 응답 100건', 100]]) {
    await clickText(label);
    await waitFor('!!document.querySelector("canvas")');
    await sleep(300);
    const chart = await assertLayout(label);
    assert.equal(chart.count, count);
    assert.equal(chart.drawnPoints, count);
    assert.equal(chart.dashPills, Math.floor(count / 3));
    assert.ok(Math.abs(chart.scrollLeft - (chart.scrollWidth - chart.clientWidth)) <= 1);
    if (label.startsWith('전체')) assert.ok(chart.description.startsWith('최근 100건'));
    records.push({ scenario: label, count, drawnPoints: chart.drawnPoints, dashPills: chart.dashPills });
  }
  let before = await inspect();
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 240");
  await evaluate("document.querySelector('button[aria-label=\"2페이지\"]').click()");
  await sleep(150);
  let after = await inspect();
  assert.equal(after.id, before.id, '페이지 변경 시 Chart 유지');
  assert.equal(after.scrollLeft, 240, '페이지 변경 시 스크롤 유지');
  for (const width of [375, 768, 1280]) {
    await resize(width);
    after = await assertLayout(`100건 ${width}px`);
    assert.equal(after.id, before.id, 'resize 시 Chart 유지');
    assert.equal(after.scrollLeft, 240, 'resize 시 스크롤 유지');
  }
  await resize(375);
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 99999");
  await screenshot('fixture-100-mobile');
  await evaluate("document.querySelector('[aria-label=\"검사 결과 추이 가로 스크롤\"]').focus()");
  before = await inspect();
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
  await sleep(300);
  assert.ok((await inspect()).scrollLeft < before.scrollLeft, '기본 방향키 스크롤');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.notEqual(await evaluate("document.activeElement.getAttribute('aria-label')"), '검사 결과 추이 가로 스크롤');
  await clickText('알 수 없는 판정');
  await sleep(250);
  assert.equal((await inspect()).drawnPoints, 0);
  await clickText('빈 이력');
  await sleep(250);
  assert.equal((await inspect()).instances, 0, '빈 이력 전환 시 destroy');
  await clickText('이력 1건');
  await sleep(250);
  assert.equal((await inspect()).instances, 1, 'StrictMode 재진입');
  assert.equal(await evaluate("document.querySelector('canvas').parentElement.parentElement.getAttribute('tabindex')"), null, '단건은 스크롤 포커스 없음');
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === '보기' && b.getClientRects().length).click()");
  await waitFor("document.body.textContent.includes('현재 경로: /results/')");
  assert.equal((await inspect()).instances, 0, '상세 이동 시 Chart 해제');
  await evaluate("document.querySelector('a[href=\"/mypage\"]').click()");
  await waitFor('!!document.querySelector("canvas")');
  assert.equal((await inspect()).instances, 1, '상세 왕복 후 Chart 1개');
  records.push({ scenario: '표 페이지·resize 위치 유지 / 키보드 / null·0·알 수 없는 판정 / StrictMode', passed: true });

  for (const [account, count] of [['hong', 6], ['park', 1], ['testuser26', 23], ['kim', 0]]) {
    await send('Page.navigate', { url: `${base}/login` });
    await waitFor('typeof window.devLogin === "function"');
    await evaluate(`localStorage.clear(); sessionStorage.clear(); devLogin('${account}@test.com')`);
    await send('Page.navigate', { url: `${base}/mypage` });
    await waitFor("!!document.querySelector('[aria-labelledby=mypage-profile-title]')");
    await sleep(300);
    assert.equal((await inspect()).count, count);
    if (count) {
      for (const width of [375, 768, 1280]) {
        await resize(width);
        await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 99999");
        const chart = await assertLayout(`${account} ${width}px`);
        assert.equal(chart.drawnPoints, count);
        if (width !== 768) await screenshot(`${account}-${width}`);
        if (width === 375) {
          const location = await evaluate(`(() => {
            const canvas = document.querySelector('canvas');
            const rect = canvas.getBoundingClientRect();
            return { x: rect.left + ${chart.points.at(-1).x}, y: rect.top + ${chart.points.at(-1).y} };
          })()`);
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...location });
          await sleep(150);
          const hovered = await inspect();
          assert.ok(hovered.tooltip, `${account} 툴팁 표시`);
          assert.match(hovered.tooltip.title[0], /^\d{4}-\d{2}-\d{2}$/);
          assert.ok(hovered.tooltip.left >= 0 && hovered.tooltip.right <= hovered.clientWidth, `${account} 툴팁 잘림`);
          await screenshot(`${account}-tooltip-375`);
          await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        }
      }
    }
    records.push({ account, count, passed: true });
  }
  assert.deepEqual(errors, [], '브라우저 warning/error');
  writeFileSync(new URL('results.json', out), JSON.stringify({ records, errors }, null, 2));
  console.log(JSON.stringify({ records, errors }, null, 2));
} finally {
  ws?.close();
  chrome.kill();
}
