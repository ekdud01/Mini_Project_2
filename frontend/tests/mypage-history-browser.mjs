// 실행: node tests/mypage-history-browser.mjs [MSW Vite URL]
// Chrome headless + CDP. CHROME_PATH로 실행 파일을 지정할 수 있다.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5184';
const out = new URL('./artifacts/mypage-history/', import.meta.url);
mkdirSync(out, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9335',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mypage-history-'))}`,
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
    try { target = (await (await fetch('http://127.0.0.1:9335/json/list')).json()).find((tab) => tab.type === 'page'); } catch { /* Chrome 시작 대기 */ }
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
  const visibleRows = `Array.from(${section}.querySelectorAll('tbody tr, ul > li')).filter(el => el.getClientRects().length)`;
  const visibleButtons = `${section}.querySelectorAll('button')`;
  const choose = async (label) => {
    await clickText(label);
    await waitFor(`!!${section}`);
    await sleep(150);
  };
  const readRows = () => evaluate(`${visibleRows}.map(row => {
    const values = Array.from(row.querySelectorAll('td, dd')).map(cell => cell.innerText.replace(/\\s+/g, ' ').trim());
    return {
      values: row.tagName === 'LI'
        ? [row.querySelector('time').dateTime, values[2].replaceAll('점', '').replace(/\\s+/g, ' ').trim(), values[3].replaceAll('점', '').replace(/\\s+/g, ' ').trim(), values[1]]
        : values,
      id: Number(row.querySelector('button').getAttribute('aria-label').match(/결과 ([0-9]+) 상세/)[1])
    };
  })`);
  const readPages = () => evaluate(`Array.from(${section}.querySelectorAll('button[aria-label$="페이지"]')).map(b => b.textContent)`);
  const screenshot = async (name) => {
    await evaluate(`${section}.scrollIntoView({block:'start'})`);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(new URL(`${name}.png`, out), Buffer.from(shot.data, 'base64'));
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Accessibility.enable');
  await resize(1280);
  await send('Page.navigate', { url: `${base}/tests/mypage-browser.html` });
  await waitFor(`!!${section}`);
  assert.equal(await evaluate(`${section}.textContent.includes('총 0건')`), true);
  assert.equal((await readRows()).length, 0);
  assert.equal(await evaluate(`${section}.textContent.includes('검사 이력이 없습니다')`), true);
  records.push({ scenario: '빈 이력 기존 안내 / 총 0건', passed: true });

  await choose('이력 10건');
  assert.equal((await readRows()).length, 10);
  assert.deepEqual(await readPages(), ['1']);
  await choose('이력 11건');
  assert.equal((await readRows()).length, 10);
  assert.deepEqual(await readPages(), ['1', '2']);
  const before = await inspect();
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft = 80");
  const scrolled = await inspect();
  await evaluate(`${section}.querySelector('[aria-label="2페이지"]').click()`);
  await waitFor(`${visibleRows}.length === 1`);
  assert.equal((await inspect()).id, before.id);
  assert.equal((await inspect()).scrollLeft, scrolled.scrollLeft);
  assert.equal(await evaluate(`${section}.querySelector('[aria-current="page"]').textContent`), '2');
  records.push({ scenario: '10→11건 페이지 경계 / 차트 인스턴스·스크롤 유지', passed: true });

  await choose('이력 100건');
  assert.equal(await evaluate(`${section}.textContent.includes('최근 100건을 표시합니다')`), false);
  assert.equal((await readPages()).length, 10);
  await choose('전체 101건 · 응답 100건');
  assert.equal(await evaluate(`${section}.textContent.includes('총 101건')`), true);
  assert.equal(await evaluate(`${section}.textContent.includes('최근 100건을 표시합니다')`), true);
  assert.equal((await readPages()).length, 10, '서버 totalPages=2가 아닌 조회 이력 10페이지');
  const seen = [];
  for (let page = 1; page <= 10; page++) {
    await evaluate(`${section}.querySelector('[aria-label="${page}페이지"]').click()`);
    await waitFor(`${section}.querySelector('[aria-current="page"]').textContent === '${page}'`);
    const rows = await readRows();
    assert.equal(rows.length, 10);
    seen.push(...rows.map(row => row.id));
  }
  assert.equal(new Set(seen).size, 100, '100건 중복·누락 없음');
  assert.ok(await evaluate(`Array.from(${visibleButtons}).find(b => b.textContent === '다음').disabled`));
  records.push({ scenario: '100건 10페이지 / 전체101·응답100 범위 / 중복·누락 없음', passed: true });

  await choose('이력 10건');
  for (const width of [320, 375, 640, 767, 768, 1280]) {
    await resize(width);
    const rows = await readRows();
    assert.equal(rows.length, width < 768 ? 5 : 10);
    for (const row of rows) {
      const index = row.id - 1;
      const first = index % 3 === 0 ? (index === 0 ? '0' : '3') : '4';
      const second = index % 3 === 0 ? '—' : index % 3 === 2 ? '-' : index === 1 ? '0 / 30' : '18 / 30';
      const risk = index % 3 === 0 ? '정상' : (index % 3 === 1 && index > 1 ? '위험' : '주의');
      assert.equal(row.values[1], `${first} / 10`);
      assert.equal(row.values[2].replace('2차 검사 없음', '').trim(), second);
      assert.equal(row.values[3], risk);
    }
    assert.equal(await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0);
    assert.ok(await evaluate(`${visibleRows}.every(row => Array.from(row.querySelectorAll('td, dd')).every(cell => parseFloat(getComputedStyle(cell).fontSize) >= 16))`));
    assert.ok(await evaluate(`${visibleRows}.every(row => Array.from(row.querySelectorAll('strong')).every(el => parseFloat(getComputedStyle(el).fontSize) >= 18))`));
    assert.ok(await evaluate(`Array.from(${visibleButtons}).filter(b => b.getClientRects().length).every(b => b.getBoundingClientRect().height >= 48)`));
    if (width >= 768) {
      assert.deepEqual(await evaluate(`Array.from(${section}.querySelectorAll('th')).map(el => el.textContent)`), ['검사일', '1차 (KDSQ-P)', '2차 (KDSQ-C)', '위험도', '상세']);
      assert.equal(await evaluate(`(() => { const el = ${section}.querySelector('[data-slot="table-container"]'); return el.scrollWidth - el.clientWidth; })()`), 0);
    } else {
      assert.deepEqual(await evaluate(`Array.from(${visibleRows}[0].querySelectorAll('dt')).map(el => el.textContent)`), ['검사일', '위험도', '1차 검사 (KDSQ-P)', '2차 검사 (KDSQ-C)']);
      assert.ok(await evaluate(`${visibleRows}.every(row => {
        const boxes = Array.from(row.querySelectorAll('dl.grid > div')).map(el => el.getBoundingClientRect());
        const button = row.querySelector('button').getBoundingClientRect();
        return boxes.length === 2 && boxes[0].top === boxes[1].top && boxes[0].height === boxes[1].height
          && Math.abs(boxes[0].width - boxes[1].width) < 1 && Math.abs(button.width - (boxes[1].right - boxes[0].left)) < 1;
      })`), '점수 박스 동일 너비·높이 / 상세 버튼 전체 너비');
      assert.match(await evaluate(`${visibleRows}[0].querySelector('time').textContent`), /^2026년 9월 [0-9]+일$/);
      assert.equal(await evaluate(`${visibleRows}[0].querySelector('button').textContent.trim()`), '결과 자세히 보기');
    }
    const tree = await send('Accessibility.getFullAXTree');
    assert.ok(tree.nodes.some(node => !node.ignored && node.name?.value === '2차 검사 없음'));
    await screenshot(`history-${width}`);
    // 실제 결과 화면으로 이동하고 돌아와 이력의 점수·날짜를 다시 확인한다.
    const firstRow = rows[0];
    await evaluate(`${visibleRows}[0].querySelector('button').click()`);
    await waitFor(`document.body.textContent.includes('현재 경로: /results/${firstRow.id}')`);
    await waitFor("!!document.querySelector('a[href=\"/mypage\"]')");
    await evaluate("document.querySelector('a[href=\"/mypage\"]').click()");
    await waitFor(`!!${section}`);
    assert.deepEqual((await readRows())[0], firstRow);
    records.push({ scenario: `${width}px 표·카드 / P·C·0·null / 글자·48px / AX 대체 문구 / 상세 왕복`, passed: true });
  }
  await evaluate("import('/src/store/memberStore.js').then(({useMemberStore}) => useMemberStore.setState({historyMeta: null}))");
  await waitFor(`${section}.textContent.includes('총 10건')`);
  records.push({ scenario: '메타데이터 누락 시 조회 건수로 대체', passed: true });
  assert.deepEqual(errors, [], '브라우저 warning/error');
  writeFileSync(new URL('results.json', out), JSON.stringify({ records, errors }, null, 2));
  console.log(JSON.stringify({ records, errors }, null, 2));
} finally {
  ws?.close();
  chrome.kill();
}
