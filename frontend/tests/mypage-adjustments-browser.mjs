// 실행: node tests/mypage-adjustments-browser.mjs [Vite URL]
// Chrome headless + CDP. CHROME_PATH로 실행 파일을 지정할 수 있다.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5184';
const out = new URL('./artifacts/mypage-adjustments/', import.meta.url);
mkdirSync(out, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9336',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mypage-adjustments-'))}`,
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
    try { target = (await (await fetch('http://127.0.0.1:9336/json/list')).json()).find((tab) => tab.type === 'page'); } catch { /* Chrome 시작 대기 */ }
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
  const section = "document.querySelector('[aria-labelledby=mypage-history-title]')";
  const rows = `Array.from(${section}.querySelectorAll('tbody tr, ul > li')).filter(el => el.getClientRects().length)`;
  const choose = async (label) => {
    await clickText(label);
    await waitFor(`!!${section}`);
    await sleep(150);
  };
  const assertLatest = async () => {
    const chart = await inspect();
    assert.ok(Math.abs(chart.scrollLeft - (chart.scrollWidth - chart.clientWidth)) <= 1, '최근 검사 오른쪽 끝');
    assert.equal(chart.instances, 1);
    return chart;
  };
  const capture = async (name, selector) => {
    await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'start'})`);
    const shot = await send('Page.captureScreenshot', {format:'png'});
    writeFileSync(new URL(`${name}.png`, out), Buffer.from(shot.data, 'base64'));
  };
  await send('Page.enable');
  await send('Runtime.enable');
  for (const width of [375, 768, 1280]) {
    await resize(width);
    await send('Page.navigate', {url: `${base}/tests/mypage-browser.html`});
    await waitFor(`!!${section}`);
    await choose('이력 11건');
    const chart = await assertLatest();
    assert.deepEqual(await evaluate("Array.from(document.querySelectorAll('[data-page=mypage] h2')).map(el => el.textContent)"), ['회원 정보', '검사 결과 추이', '검사 이력']);
    // 화면에 차트가 실제로 들어온 뒤에도 초기 위치가 유지되어야 한다.
    await capture(`trend-${width}`, '[aria-labelledby=mypage-trend-title]');
    await assertLatest();
    records.push({scenario:`${width}px 첫 진입·실제 노출 최근 검사 / 섹션 순서`, left:chart.scrollLeft, max:chart.scrollWidth-chart.clientWidth});
  }
  await resize(375);
  await assertLatest();
  await choose('이력 1건');
  await resize(1280);
  await assertLatest();
  await resize(375);
  await assertLatest();
  await choose('이력 100건');
  await assertLatest();
  const before = await inspect();
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 180");
  await sleep(100);
  await evaluate(`${section}.querySelector('[aria-label="2페이지"]').click()`);
  await sleep(100);
  assert.equal((await inspect()).scrollLeft, 180);
  await resize(1280);
  assert.equal((await inspect()).scrollLeft, 180, '사용자가 고른 과거 위치는 resize에도 유지');
  assert.equal((await inspect()).id, before.id);
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 999999");
  await sleep(100);
  await resize(375);
  await assertLatest();
  records.push({scenario:'resize 시 최근 끝 유지 / 수동 과거 탐색 후 페이지·resize 위치 유지 / 단건·새 데이터', passed:true});

  await choose('이력 5건');
  assert.equal(await evaluate(`${rows}.length`), 5);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 1페이지');
  await choose('이력 6건');
  assert.equal(await evaluate(`${rows}.length`), 5);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 2페이지');
  await capture('history-six-375', '[aria-labelledby=mypage-history-title]');
  await evaluate(`${section}.querySelector('[aria-label="2페이지"]').click()`);
  await waitFor(`${rows}.length === 1`);
  await resize(768);
  assert.equal(await evaluate(`${rows}.length`), 6);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 1페이지');
  await resize(375);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 2페이지');
  await choose('전체 101건 · 응답 100건');
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 20페이지');
  const ids = [];
  for (let page = 1; page <= 20; page++) {
    await evaluate(`${section}.querySelector('[aria-label="${page}페이지"]').click()`);
    await waitFor(`${section}.querySelector('[aria-current="page"]').textContent === '${page}'`);
    const pageIds = await evaluate(`${rows}.map(el => Number(el.querySelector('button').getAttribute('aria-label').match(/결과 ([0-9]+) 상세/)[1]))`);
    assert.equal(pageIds.length, 5);
    ids.push(...pageIds);
  }
  assert.equal(new Set(ids).size, 100);
  await resize(768);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 10페이지');
  await resize(375);
  assert.equal(await evaluate(`${section}.querySelector('[role=status]').textContent`), '1 / 20페이지');
  records.push({scenario:'모바일 5→6건 경계 / 100건 20페이지 중복·누락 없음 / md 전환 시 첫 페이지', passed:true});

  await choose('이력 6건');
  await evaluate("import('/src/store/memberStore.js').then(({useMemberStore:s}) => s.setState({me:{...s.getState().me,email:'hong@test.com'}}))");
  const emailLayout = () => evaluate(`(() => {
    const dl = document.querySelector('[aria-labelledby=mypage-profile-title] dl');
    const label = dl.querySelector('dt').getBoundingClientRect();
    const value = dl.querySelector('dd').getBoundingClientRect();
    return {labelTop:label.top, labelBottom:label.bottom, valueTop:value.top, valueBottom:value.bottom, labelRight:label.right, valueLeft:value.left, height:value.height, lineHeight:parseFloat(getComputedStyle(dl.querySelector('dd')).lineHeight)};
  })()`);
  let email = await emailLayout();
  assert.ok(email.valueLeft > email.labelRight);
  assert.ok(email.valueTop < email.labelBottom && email.labelTop < email.valueBottom);
  assert.equal(email.height, email.lineHeight);
  await capture('profile-375', '[aria-labelledby=mypage-profile-title]');
  await choose('긴 이메일');
  email = await emailLayout();
  assert.ok(email.height > email.lineHeight, '긴 이메일만 줄바꿈');
  assert.ok(email.valueLeft > email.labelRight);
  assert.ok(email.valueTop < email.labelBottom);
  for (const width of [375,768,1280]) {
    await resize(width);
    assert.equal(await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0);
  }
  await resize(375);
  await capture('profile-long-375', '[aria-labelledby=mypage-profile-title]');
  records.push({scenario:'이메일 항목·값 같은 줄 / 100자 이메일 줄바꿈 / 375·768·1280 가로 넘침 0',passed:true});
  assert.deepEqual(errors, []);
  writeFileSync(new URL('results.json', out), JSON.stringify({records,errors},null,2));
  console.log(JSON.stringify({records,errors},null,2));
} finally { ws?.close(); chrome.kill(); }
