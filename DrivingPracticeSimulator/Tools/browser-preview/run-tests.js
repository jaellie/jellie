const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
// Usage: npm pack three@0.128.0 && tar xzf three-0.128.0.tgz   (in this folder), then: node run-tests.js
// Needs Node + Playwright with Chromium. Runs the steering and pedal checks against index.html.
const dir = __dirname, repo = path.join(__dirname, '../../Assets/DrivingSim');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const check = (group, name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  [${group}] ${name}${detail ? '  — ' + detail : ''}`);

(async () => {
  // ---------- Unity <-> preview configuration consistency (static) ----------
  const cs = f => fs.readFileSync(path.join(repo, f), 'utf8');
  const csNum = (src, field) => { const m = src.match(new RegExp(field + '\\s*=\\s*([0-9.]+)f?')); return m ? parseFloat(m[1]) : NaN; };
  const steer = cs('Core/SteeringModel.cs'), touch = cs('Runtime/Controls/TouchSteeringController.cs'), kb = cs('Runtime/Controls/KeyboardDrivingInput.cs'), pedal = cs('Core/PedalStateMachine.cs');
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/three.min.js', r => r.fulfill({ body: fs.readFileSync(path.join(dir, 'package/build/three.min.js')), contentType: 'application/javascript' }));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));
  fs.mkdirSync(path.join(dir, 'shots'), { recursive: true });
  await page.goto('file://' + path.join(dir, 'index.html')); await sleep(1200);
  const P = e => page.evaluate(e);
  const js = await P('({ st: __preview.C.st })');
  const pairs = [['maxSteeringWheelAngleDeg', steer, js.st.maxW], ['maxFrontWheelAngleDeg', steer, js.st.maxF], ['selfCenterMinSpeedKmh', steer, js.st.scMin],
    ['selfCenterFullSpeedKmh', steer, js.st.scFull], ['selfCenterGainPerSec', steer, js.st.scGain], ['selfCenterMaxRateDegPerSec', steer, js.st.scMax],
    ['selfCenterReverseFactor', steer, js.st.scRev], ['releaseGraceSeconds', steer, js.st.grace], ['degreesPerScreenHeight', touch, js.st.dragPerHeight],
    ['steerRateDegPerSec', kb, js.st.keyRate], ['highSpeedSteerScale', steer, js.st.hi], ['frontWheelMaxSlewDegPerSec', steer, js.st.slew]];
  for (const [f, src, v] of pairs) check('config', `${f}: Unity ${csNum(src, f)} = preview ${v}`, csNum(src, f) === v);
  const pedalPairs = [['acceleratorRiseTime', 'accRise'], ['acceleratorReleaseTime', 'accRelease'], ['brakeInitialAmount', 'brakeInit'], ['brakeRampTime', 'brakeRamp'],
    ['brakeReleaseTime', 'brakeRelease'], ['brakeReleaseDebounce', 'brakeDebounce'], ['acceleratorReengageDelay', 'reengage'], ['failSafeBrake', 'failSafe']];
  for (const [f, k] of pedalPairs) { const m = html.match(new RegExp(k + ':\\s*([0-9.]+)')); check('config', `${f}: Unity ${csNum(pedal, f)} = preview ${m && m[1]}`, m && csNum(pedal, f) === parseFloat(m[1])); }

  const stage = await page.$('#stage'); let box = await stage.boundingBox();
  const at = (x, y) => ({ x: box.x + x * box.width / 1120, y: box.y + y * box.width / 1120 });
  const c = at(560, 300);
  const midDrag = async (dx, steps = 10) => { await page.mouse.move(c.x - dx / 2, c.y); await page.mouse.down({ button: 'middle' }); await page.mouse.move(c.x + dx / 2, c.y, { steps }); await page.mouse.up({ button: 'middle' }); };

  // ---------- Steering ----------
  await midDrag(20);
  let sw = await P('__preview.S.sw'), fr = await P('__preview.S.front');
  await sleep(300); fr = await P('__preview.S.front');
  check('steering', 'Small drag (20 px) = small wheel change', sw > 1 && sw < 5, `stage ${box.height.toFixed(0)} px tall → wheel ${sw.toFixed(2)}°, front ${fr.toFixed(2)}°`);
  let drags = 0;
  // Drag across the road area only (the right column holds the mini-map and gear selector buttons).
  const L = at(40, 300), Rr = at(940, 300);
  while ((await P('__preview.S.sw')) < 539.9 && drags < 10) { await page.mouse.move(L.x, L.y); await page.mouse.down({ button: 'middle' }); await page.mouse.move(Rr.x, Rr.y, { steps: 12 }); await page.mouse.up({ button: 'middle' }); drags++; }
  sw = await P('__preview.S.sw'); await sleep(300);
  check('steering', 'Full right lock (from ~0°) needs several deliberate long drags', drags >= 3 && drags <= 5 && sw === 540, `${drags} drags of ${(Rr.x - L.x).toFixed(0)} px → ${sw}°, front ${(await P('__preview.S.front')).toFixed(1)}°`);
  check('steering', 'Front wheel = wheel/540×35 at full lock (inner wheel)', Math.abs((await P('__preview.S.front')) - 35) < 0.01);
  check('steering', 'Cockpit wheel shows the accumulated wheel angle (1.5 turns)', Math.abs((await P('__preview.wheelSpinDeg')) - 540) < 0.5, `${(await P('__preview.wheelSpinDeg')).toFixed(1)}°`);
  await sleep(3000);
  check('steering', 'Released while stopped: wheel stays', (await P('__preview.S.sw')) === 540);
  let back = 0;
  while ((await P('__preview.S.sw')) > -539.9 && back < 12) { await page.mouse.move(Rr.x, Rr.y); await page.mouse.down({ button: 'middle' }); await page.mouse.move(L.x, L.y, { steps: 12 }); await page.mouse.up({ button: 'middle' }); back++; }
  check('steering', 'Full right → full left lock (1080°, 3 turns) clamps at -540', (await P('__preview.S.sw')) === -540, `${back} drags`);

  // U-turn at creep: full left lock, D, measure diameter by 180° heading change
  await page.keyboard.down('KeyS'); await sleep(400);
  let g = await page.$('#gears .btn[data-g="D"]'), gb = await g.boundingBox(); await page.mouse.click(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.keyboard.press('Space'); await page.keyboard.up('KeyS');
  const start = await P('({ x: __preview.S.x, z: __preview.S.z, h: __preview.S.h })');
  let st = start, t0 = Date.now();
  while (Date.now() - t0 < 40000) { st = await P('({ x: __preview.S.x, z: __preview.S.z, h: __preview.S.h, v: __preview.S.v })'); if (Math.abs(st.h - start.h) >= Math.PI) break; await sleep(200); }
  const diameter = Math.hypot(st.x - start.x, st.z - start.z);
  check('steering', 'Low-speed U-turn at full lock: matches Ackermann geometry (rear axle)', diameter > 8.7 && diameter < 9.5, `heading 180° → rear-axle path diameter ${diameter.toFixed(2)} m (geometric 9.12 m; outer front wheel radius 5.96 m)`);

  // Release while moving: grace, then gradual return
  await page.keyboard.down('KeyS'); await sleep(1500); await page.keyboard.up('KeyS');
  await P('__preview.S.sw = 0');
  await page.keyboard.down('KeyW'); await sleep(4000);
  const speed = await P('__preview.S.v * 3.6');
  await page.mouse.move(box.x + 30, c.y); await page.mouse.down({ button: 'middle' }); await page.mouse.move(box.x + box.width - 30, c.y, { steps: 10 }); await page.mouse.up({ button: 'middle' });
  const swRel = await P('__preview.S.sw'); await sleep(350);
  const swGrace = await P('__preview.S.sw'); await sleep(1500);
  const swLater = await P('__preview.S.sw'); await page.keyboard.up('KeyW');
  check('steering', 'Released while moving: no unwind during 0.6 s grace', Math.abs(swGrace - swRel) < 1, `${speed.toFixed(0)} km/h: ${swRel.toFixed(0)}° → ${swGrace.toFixed(0)}° after 0.35 s`);
  check('steering', 'Released while moving: gradual (not instant) self-centering', swLater < swGrace && swLater > 5, `${swGrace.toFixed(0)}° → ${swLater.toFixed(0)}° after 1.5 s more`);

  // Reverse steering direction
  await page.keyboard.down('KeyS'); await sleep(2500);
  g = await page.$('#gears .btn[data-g="R"]'); gb = await g.boundingBox(); await page.mouse.click(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await P('__preview.S.sw = 540'); await page.keyboard.up('KeyS');
  const h0 = await P('__preview.S.h'); await sleep(3000); const h1 = await P('__preview.S.h'), vr = await P('__preview.S.v');
  check('steering', 'Reverse with wheel right: car backs up and the nose swings left (heading decreases)', vr < -0.3 && h1 < h0 - 0.05, `v ${(vr * 3.6).toFixed(1)} km/h, heading ${(h0 * 57.3).toFixed(0)}° → ${(h1 * 57.3).toFixed(0)}°`);
  await page.keyboard.down('KeyS'); await sleep(1500);
  g = await page.$('#gears .btn[data-g="P"]'); gb = await g.boundingBox(); await page.mouse.click(gb.x + gb.width / 2, gb.y + gb.height / 2); await page.keyboard.up('KeyS');

  // ---------- Pedal calibration ----------
  await P('__preview.openWizard()'); await sleep(100);
  const wizBtn = async label => { const b = page.locator('#w-buttons .btn', { hasText: label }); if (!(await b.count())) return false; const bb = await b.first().boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); return true; };
  const press = async keys => { for (const k of keys) { await page.keyboard.down(k); await sleep(15); } await sleep(90); for (const k of keys) { await page.keyboard.up(k); await sleep(10); } await sleep(320); };
  await wizBtn('보정 시작');
  for (const k of [['KeyG', 'KeyH', 'KeyJ'], ['KeyG', 'KeyH'], ['KeyH', 'KeyJ', 'KeyB'], ['KeyG', 'KeyH', 'KeyB'], ['KeyG', 'KeyH']]) await press(k);   // inconsistent attempts
  for (const k of [['Quote', 'Enter', 'KeyJ'], ['Quote', 'Enter'], ['Quote', 'KeyJ', 'KeyH'], ['Enter', 'Quote'], ['Quote', 'Enter']]) await press(k);
  await sleep(200);
  const rv = await P('({ step: __preview.wiz.step, brake: [...__preview.wiz.brake], acc: [...__preview.wiz.acc], amb: __preview.wiz.amb, un: __preview.wiz.unresolved })');
  check('calibration', 'Inconsistent attempts: recurring keys proposed (≥2 of 5)', rv.step === 'review' && ['KeyG', 'KeyH', 'KeyB'].every(k => rv.brake.includes(k)) && ['Quote', 'Enter'].every(k => rv.acc.includes(k)), JSON.stringify({ brake: rv.brake, acc: rv.acc }));
  check('calibration', 'Overlapping key J (2 vs 2) flagged and excluded from both', rv.amb.includes('KeyJ') && rv.un.includes('KeyJ') && !rv.brake.includes('KeyJ') && !rv.acc.includes('KeyJ'));
  check('calibration', 'Key H (brake 5, accel 1) flagged ambiguous but kept on brake', rv.amb.includes('KeyH') && rv.brake.includes('KeyH') && !rv.acc.includes('KeyH'));
  check('calibration', 'No save before live validation', !(await page.locator('#w-buttons .btn', { hasText: '저장' }).count()));
  await page.screenshot({ path: path.join(dir, 'shots/v5-review.png') });

  // Validation: failure path first
  await wizBtn('실제 테스트'); await press(['KeyG', 'Quote']);
  check('validation', 'Wrong pedal during brake prompt fails validation', (await P('__preview.wiz.val.step')) === 'failed' && !(await page.locator('#w-buttons .btn', { hasText: '저장' }).count()), await page.textContent('#w-body'));
  await wizBtn('다시 테스트');
  await press(['KeyZ']);                                                     // accidental key outside both regions
  for (let i = 0; i < 2; i++) await press(['KeyG']);
  await page.keyboard.down('KeyB'); await sleep(150);                       // 3rd brake press, held to look at the indicator
  const ind = await P("({ b: document.getElementById('w-ib').className, a: document.getElementById('w-ia').className })");
  await page.keyboard.up('KeyB'); await sleep(320);
  for (let i = 0; i < 3; i++) await press(['Quote', 'Enter']);
  const val = await P('({ step: __preview.wiz.val.step, missed: __preview.wiz.val.missed, wrong: __preview.wiz.val.wrong })');
  check('validation', 'Clean presses pass; one stray key = 1 missed press (tolerated)', val.step === 'passed' && val.missed === 1 && val.wrong === 0, JSON.stringify(val));
  check('validation', 'Big BRAKE indicator lights for a brake key', ind.b === 'on-b');
  await page.screenshot({ path: path.join(dir, 'shots/v5-validated.png') });
  await wizBtn('저장');
  const saved = await P('__preview.mapping');
  check('calibration', 'Saved as validated, pedals active', saved.validated && (await P('__preview.pedalsActive')), JSON.stringify(saved));

  // ---------- Pedal state machine in driving ----------
  const pm = () => P('({ b: __preview.pm.brake, a: __preview.pm.acc, bp: __preview.pm.brakePressed, ap: __preview.pm.accPressed, c: __preview.pm.conflict, sup: __preview.pm.suppressed, safety: __preview.pm.safety, thr: __preview.S.thr, brk: __preview.S.brk })');
  await page.keyboard.down('KeyG'); await sleep(60); let s1 = await pm();
  check('pedals', '1. One brake key: brake on immediately (initial 0.3)', s1.bp && s1.b >= 0.3 && s1.b < 0.4, JSON.stringify(s1));
  await page.keyboard.down('KeyH'); await page.keyboard.down('KeyB'); await sleep(60); let s2 = await pm();
  check('pedals', '2. Several brake keys: same pedal, no repeated activation (amount from hold time, not key count)', s2.bp && s2.b < 0.45, `b ${s2.b.toFixed(2)}`);
  await page.keyboard.up('KeyG'); await page.keyboard.up('KeyH'); await sleep(100); let s7 = await pm();
  check('pedals', '7. One key still held while others released: brake stays on', s7.bp && s7.b > s2.b, `b ${s7.b.toFixed(2)}`);
  await sleep(1300); let s1b = await pm();
  check('pedals', 'Sustained brake ramps to full', s1b.b > 0.99, `b ${s1b.b.toFixed(2)}`);
  await page.keyboard.up('KeyB'); await sleep(200); let rel = await pm();
  check('pedals', 'Brake release clears promptly', !rel.bp && rel.b === 0, JSON.stringify(rel));
  // Accelerator (car in P: throttle allowed, car holds)
  await page.keyboard.down('Quote'); await sleep(500); let s3 = await pm();
  check('pedals', '3. One accelerator key: gradual rise (≈0.2 after 0.5 s)', s3.ap && s3.a > 0.12 && s3.a < 0.3, `a ${s3.a.toFixed(2)}`);
  await page.keyboard.down('Enter'); await sleep(500); let s4 = await pm();
  check('pedals', '4. Several accelerator keys: one pedal, continues rising smoothly', s4.ap && s4.a > s3.a && s4.a < 0.5, `a ${s4.a.toFixed(2)}`);
  await page.keyboard.down('KeyG'); await sleep(60); let s5 = await pm();
  check('pedals', '5. Brake + accelerator: brake wins, throttle 0, conflict flagged', s5.bp && s5.a === 0 && s5.thr === 0 && s5.c && s5.sup, JSON.stringify(s5));
  await page.keyboard.up('KeyG'); await sleep(70); let s6a = await pm(); await sleep(400); let s6b = await pm();
  check('pedals', '6. Rapid switch brake→accelerator: brief re-engage delay, then rises from 0 (no jump)', s6a.a === 0 && s6b.a > 0 && s6b.a < 0.25, `+70 ms a=${s6a.a.toFixed(2)}, +470 ms a=${s6b.a.toFixed(2)}`);
  // 8/9. Focus loss while accelerating
  await sleep(500);
  await P("window.dispatchEvent(new Event('blur'))"); await sleep(250); let s9 = await pm();
  check('pedals', '8/9. Input loss while accelerating: throttle cut, fail-safe brake', s9.safety === 'failsafe' && s9.a === 0 && s9.brk >= 0.59, JSON.stringify(s9));
  await page.keyboard.up('Quote'); await page.keyboard.up('Enter');
  await P("window.dispatchEvent(new Event('focus'))"); await sleep(200); let s9b = await pm();
  await page.keyboard.down('Quote'); await sleep(300); let s9c = await pm(); await page.keyboard.up('Quote');
  check('pedals', 'After input returns: accelerator stays blocked until a brake press', s9b.safety === 'rearm' && s9c.a === 0 && s9c.brk >= 0.59, JSON.stringify({ s9b: s9b.safety, a: s9c.a }));
  await press(['KeyG']); let s9d = await pm();
  check('pedals', 'Brake press re-arms pedals', s9d.safety === 'normal');
  // 12. Accidental unmapped key does nothing
  await page.keyboard.down('KeyM'); await sleep(200); let s12 = await pm(); await page.keyboard.up('KeyM');
  check('pedals', '12. Key outside calibrated regions: no pedal input', !s12.bp && !s12.ap && s12.a === 0);
  // 13/14. Steering with pedals
  const swA = await P('__preview.S.sw');
  await page.keyboard.down('KeyG'); await midDrag(-300); let s13 = await pm(); const swB = await P('__preview.S.sw'); await page.keyboard.up('KeyG');
  check('pedals', '13. Drag steering while braking', s13.bp && Math.abs(swB - swA) > 20, `wheel ${swA.toFixed(0)}° → ${swB.toFixed(0)}°`);
  await page.keyboard.down('Quote'); await sleep(300); await midDrag(300); const s14 = await pm(); const swC = await P('__preview.S.sw'); await page.keyboard.up('Quote');
  check('pedals', '14. Middle-mouse steering while accelerating', s14.ap && s14.a > 0 && Math.abs(swC - swB) > 20, `a ${s14.a.toFixed(2)}, wheel → ${swC.toFixed(0)}°`);
  // Reserved keys: H is a hazard shortcut but now a pedal key
  const hz = await P('__preview.S.headlights'); await press(['KeyL']);
  check('pedals', 'Unmapped shortcut (L headlights) still works; mapped pedal keys never trigger shortcuts', (await P('__preview.S.headlights')) !== hz);
  // 16. Restart after save
  await page.reload(); await sleep(1200);
  check('pedals', '16. Restart: mapping restored, validated, active', (await P('__preview.pedalsActive')) && (await P('__preview.mapping.validated')));
  // Defaults: unvalidated until tested
  await P('__preview.openWizard()'); await sleep(100); await wizBtn('기본값으로 초기화'); await sleep(100);
  check('calibration', 'Reset to defaults: template loaded but not active until validated', !(await P('__preview.pedalsActive')) && (await P('__preview.mapping.source')) === 'default');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: path.join(dir, 'shots/v5-hud.png') });

  results.forEach(r => console.log(r));
  console.log(`\n${results.filter(r => r.startsWith('PASS')).length}/${results.length} passed; page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  await browser.close();
})().catch(e => { results.forEach(r => console.log(r)); console.error(e); process.exit(1); });
