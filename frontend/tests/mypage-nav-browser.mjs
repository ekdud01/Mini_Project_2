// 실행: node tests/mypage-nav-browser.mjs [Vite URL]
// Chrome headless + CDP. CHROME_PATH로 실행 파일을 지정할 수 있다.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:5184';
const out = new URL('./artifacts/mypage-nav/', import.meta.url);
mkdirSync(out, { recursive: true });
const chrome = spawn(process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--remote-debugging-port=9337',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mypage-nav-'))}`,
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
    try { target = (await (await fetch('http://127.0.0.1:9337/json/list')).json()).find((tab) => tab.type === 'page'); } catch { /* Chrome 시작 대기 */ }
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
    await sleep(200);
  };
  const nav = `document.querySelector('nav[aria-label="마이페이지 목차"]')`;
  const ids = ['mypage-profile-title', 'mypage-trend-title', 'mypage-history-title'];
  const choose = async (label) => {
    await clickText(label);
    await waitFor('!!document.getElementById("mypage-profile-title")');
    await sleep(200);
  };
  const current = () => evaluate(`${nav}.querySelector('[aria-current="location"]').hash.slice(1)`);
  const jump = async (id) => {
    await evaluate(`${nav}.querySelector('[href="#${id}"]').click()`);
    await sleep(850);
    const bounds = await evaluate(`({heading:document.getElementById('${id}').getBoundingClientRect().top, bottom:${nav}.getBoundingClientRect().bottom, focus:document.activeElement.id})`);
    assert.ok(bounds.heading >= bounds.bottom, JSON.stringify(bounds));
    assert.ok(bounds.heading < 900, '이동 제목이 화면 안에 보임');
    assert.equal(bounds.focus, id);
    assert.equal(await current(), id);
  };
  const key = async (key, code, windowsVirtualKeyCode) => {
    await send('Input.dispatchKeyEvent', {type:'keyDown', key, code, windowsVirtualKeyCode});
    await send('Input.dispatchKeyEvent', {type:'keyUp', key, code, windowsVirtualKeyCode});
  };
  const capture = async (name) => {
    const shot = await send('Page.captureScreenshot', {format:'png'});
    writeFileSync(new URL(`${name}.png`, out), Buffer.from(shot.data, 'base64'));
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', {url:`${base}/tests/mypage-browser.html`});
  await waitFor('!!document.querySelector("[data-page=mypage]")');
  for (const width of [375,767,768,1280]) {
    await resize(width);
    await choose('이력 100건');
    if (width >= 768) {
      assert.equal(await evaluate(`!!${nav}`),false);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('header')).position"),'static');
      assert.equal(await evaluate("document.querySelector('[data-page=mypage]').style.getPropertyValue('--mypage-scroll-offset')"),'');
      assert.equal(await evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth'),0);
      await evaluate("document.querySelector('[data-page=mypage]').scrollIntoView()");
      await capture(`nav-${width}`);
      records.push({scenario:`${width}px 목차 미렌더·헤더 비고정·이동 여백 정리·가로 넘침 0`,passed:true});
      continue;
    }
    await jump(ids[0]);
    const geometry = await evaluate(`(() => {
      const n = ${nav};
      return {width:n.clientWidth, group:n.firstElementChild.clientWidth,
        links:[...n.querySelectorAll('a')].map(a=>({width:a.getBoundingClientRect().width,height:a.clientHeight,font:parseFloat(getComputedStyle(a).fontSize)})),
        headerBottom:document.querySelector('header').getBoundingClientRect().bottom, top:n.getBoundingClientRect().top,
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        hidden:[...document.querySelectorAll('[data-page=mypage] h2')].some(h=>!h.getClientRects().length)};
    })()`);
    assert.equal(geometry.overflow,0);
    assert.equal(geometry.hidden,false);
    assert.ok(Math.abs(geometry.top-geometry.headerBottom)<2);
    geometry.links.forEach(link=>{assert.ok(link.height>=48);assert.ok(link.font>=16);});
    assert.equal(new Set(geometry.links.map(link=>link.height)).size,1);
    if(width<768) {
      assert.equal(geometry.width,geometry.group);
      assert.ok(Math.max(...geometry.links.map(l=>l.width))-Math.min(...geometry.links.map(l=>l.width))<1);
    } else assert.ok(geometry.group<geometry.width);
    await capture(`nav-${width}`);
    for(const id of ids.slice(1)) await jump(id);
    // 일반 스크롤은 표시만 바꾸고 포커스를 유지한다.
    await evaluate(`window.scrollTo({top:window.scrollY+document.getElementById('${ids[1]}').getBoundingClientRect().top-parseFloat(getComputedStyle(document.getElementById('${ids[1]}')).scrollMarginTop),behavior:'instant'})`);
    await sleep(200);
    assert.equal(await current(),ids[1]);
    assert.equal(await evaluate('document.activeElement.id'),ids[2]);
    await evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})");
    await sleep(200);
    assert.equal(await current(),ids[2]);
    const chart = await inspect();
    await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft=180; document.querySelector('[aria-label=\"2페이지\"]').click()");
    await sleep(100);
    const requestsBefore = await evaluate("document.querySelector('aside').innerText");
    await jump(ids[0]); await jump(ids[1]); await jump(ids[2]);
    assert.equal((await inspect()).id,chart.id);
    assert.equal((await inspect()).scrollLeft,180);
    assert.equal(await evaluate("document.querySelector('[data-page=mypage] [aria-current=page]').textContent"),'2');
    assert.equal(await evaluate("document.querySelector('aside').innerText"),requestsBefore);
    records.push({scenario:`${width}px 배치·제목 노출·일반 스크롤·하단 표시·데이터/페이지/차트 유지`,geometry});
  }
  const beforeResize = await inspect();
  await evaluate("document.querySelector('canvas').parentElement.parentElement.scrollLeft=180");
  const requestsBeforeResize = await evaluate("document.querySelector('aside').innerText");
  for (const width of [767,768,375]) {
    await resize(width);
    assert.equal(await evaluate(`!!${nav}`),width<768);
    assert.equal((await inspect()).id,beforeResize.id);
    assert.equal((await inspect()).scrollLeft,180);
    assert.equal(await evaluate("document.querySelector('aside').innerText"),requestsBeforeResize);
  }
  records.push({scenario:'md 경계 왕복: 모바일 목차 복원·데스크톱 제거·조회/차트 인스턴스/가로 위치 유지',passed:true});
  await resize(375);
  await jump(ids[0]);
  await evaluate(`${nav}.querySelector('a').focus()`);
  await key('Tab','Tab',9);
  assert.equal(await evaluate('document.activeElement.hash'),`#${ids[1]}`);
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'),'solid');
  await key('Enter','Enter',13); await sleep(850);
  assert.equal(await evaluate('document.activeElement.id'),ids[1]);
  await key('Tab','Tab',9);
  assert.equal(await evaluate('document.activeElement.getAttribute("role")'),'region');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate(`${nav}.querySelector('a').click()`);
  const instantY = await evaluate('window.scrollY');
  await sleep(150);
  assert.equal(await evaluate('window.scrollY'),instantY);
  assert.equal(await current(),ids[0]);
  // 헤더 실제 높이 변화와 목차 줄바꿈도 ResizeObserver가 반영한다.
  await evaluate("document.querySelector('[aria-label=\"메뉴 열기\"]').click()");
  await sleep(200);
  assert.ok(await evaluate(`Math.abs(${nav}.getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().bottom)<2`));
  await evaluate("document.querySelector('[aria-label=\"메뉴 닫기\"]').click()");
  await evaluate("document.documentElement.style.fontSize='32px'");
  await sleep(250);
  await jump(ids[1]);
  assert.equal(await evaluate('document.documentElement.scrollWidth-document.documentElement.clientWidth'),0);
  await capture('nav-large-text-375');
  await evaluate("document.documentElement.style.fontSize=''");
  await sleep(200);
  records.push({scenario:'Tab/Enter·포커스 윤곽선·제목 다음 차트 진입·동작 축소 즉시 이동·헤더 메뉴 높이·큰 글자 줄바꿈',passed:true});
  await choose('빈 이력');
  assert.equal(await evaluate(`${nav}.querySelectorAll('a').length`),2);
  assert.equal(await evaluate('!!document.querySelector("canvas")'),false);
  await jump(ids[2]);
  await capture('nav-empty-375');
  await clickText('두 조회 지연');
  await sleep(100);
  assert.equal(await evaluate(`!!${nav}`),false);
  await clickText('지연 응답 해제');
  await waitFor(`!!${nav}`);
  for(const failure of ['프로필 500','이력 500']) {
    await clickText(failure);
    await waitFor("[...document.querySelectorAll('button')].some(b=>b.textContent==='다시 시도')");
    assert.equal(await evaluate(`!!${nav}`),false);
    await clickText('다음 응답 정상으로');
    await clickText('다시 시도');
    await waitFor(`!!${nav}`);
  }
  await clickText('회원 탈퇴');
  await waitFor('!!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('document.activeElement.textContent'),'취소');
  await clickText('취소');
  await waitFor('!document.querySelector("[role=dialog]")');
  assert.equal(await evaluate('document.activeElement.textContent'),'회원 탈퇴');
  records.push({scenario:'빈 이력 두 링크·로딩 숨김/복원·프로필/이력 오류 재시도·탈퇴 대화상자 취소',passed:true});
  await choose('이력 100건');
  await evaluate("document.querySelector('[aria-labelledby=\"mypage-history-title\"] button[aria-label*=\"상세 보기\"]').click()");
  await waitFor('!document.querySelector("[data-page=mypage]")');
  assert.equal((await inspect()).instances,0);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('header')).position"),'static');
  await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent==='마이페이지').click()");
  await waitFor(`!!${nav}`);
  await sleep(200);
  assert.equal((await inspect()).instances,1);
  assert.equal(await evaluate(`document.querySelectorAll('nav[aria-label="마이페이지 목차"]').length`),1);
  await jump(ids[1]);
  records.push({scenario:'StrictMode·상세 왕복 목차 정리/복원·타 화면 헤더 비고정·차트 단일 인스턴스',passed:true});
  assert.deepEqual(errors,[]);
  writeFileSync(new URL('results.json',out),JSON.stringify({records,errors},null,2));
  console.log(JSON.stringify({records,errors},null,2));
} finally { ws?.close(); chrome.kill(); }
