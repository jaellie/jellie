import { ROOMS, ROOM_INFO, CANDLE_BY_VISIT } from './data.js';
import { bearSVG, niniSVG } from './bear.js';

const W = 1600, STAGE_W = 960, FLOOR = 470, BEAR_SCREEN_X = 860;
const PARALLAX = { bg: 0.6, mid: 1, char: 1, fg: 1.25, light: 1 };
const el = (cls, css = {}, html = '') => {
  const d = document.createElement('div'); d.className = cls; d.innerHTML = html;
  Object.assign(d.style, Object.fromEntries(Object.entries(css).map(([k, v]) => [k, typeof v === 'number' ? v + 'px' : v])));
  return d;
};

function clockSVG(sec) {
  const h = 11 * 30 + 47 * 0.5, m = 47 * 6; // 11:47
  const tick = [...Array(12)].map((_, i) => `<line x1="100" y1="12" x2="100" y2="22" stroke="#243044" stroke-width="3" transform="rotate(${i * 30} 100 100)"/>`).join('');
  return `<svg viewBox="0 0 200 200">${tick}
    <line class="hh" x1="100" y1="100" x2="100" y2="54" stroke="#111923" stroke-width="6" stroke-linecap="round" transform="rotate(${h} 100 100)"/>
    <line class="mh" x1="100" y1="100" x2="100" y2="30" stroke="#111923" stroke-width="4" stroke-linecap="round" transform="rotate(${m} 100 100)"/>
    <line class="sh" x1="100" y1="112" x2="100" y2="24" stroke="#9C5442" stroke-width="1.6" transform="rotate(${sec} 100 100)"/>
    <circle cx="100" cy="100" r="5" fill="#111923"/></svg>`;
}

/** Build one paper shadow-box room into `root`. `mirror` = the reflected clone (one tiny diff). */
export function buildRoom(root, roomId, visit, { mirror = false } = {}) {
  root.innerHTML = '';
  const idx = ROOMS.indexOf(roomId);
  const layers = {};
  for (const k of ['bg', 'mid', 'char', 'fg', 'light']) { layers[k] = el(`layer l-${k}`); root.appendChild(layers[k]); }

  // BG: cold wall + symmetrical arches
  layers.bg.append(el('wall', { left: 0, top: 0, width: W, height: 540, background: `hsl(${215 + idx * 3} 32% ${22 - idx}%)` }));
  [400, 1200].forEach((x, i) => layers.bg.append(el('win' + (i === 1 && idx % 2 ? ' lit' : ''), { left: x - 60, top: 70, width: 120, height: 200 })));

  for (let i = 0; i < 40; i++) layers.bg.append(el('', { left: (i * i * 53 + i * 211) % W, top: (i * 97 + (i % 3) * 61) % 260, width: 3, height: 3, borderRadius: '50%', background: '#f2e8d4', opacity: .35 + (i % 4) * .12 }));

  // MID: architecture
  layers.mid.append(el('floor', { left: 0, top: FLOOR, width: W }));
  layers.mid.append(el('paper', { left: 760, top: 140, width: 80, height: 330, background: 'var(--muted)' }));
  if (roomId === 'mechanism') layers.mid.append(el('clock', { left: 620, top: 40, width: 360, height: 360 }, clockSVG(0)));
  if (roomId === 'archive') [180, 1300].forEach(x => layers.mid.append(el('paper', { left: x, top: 250, width: 140, height: 220, background: '#8a7a64' })));
  if (roomId === 'bell') layers.mid.append(el('paper', { left: 730, top: 80, width: 140, height: 160, background: 'var(--scarf)', borderRadius: '70px 70px 12px 12px' }));
  if (roomId === 'stairs') for (let i = 0; i < 8; i++) layers.mid.append(el('paper', { left: 560 + i * 60, top: FLOOR - 20 - i * 24, width: 70, height: 20 + i * 24, background: 'var(--paper)' }));

  // Doors (prev on the left, next on the right)
  const doors = [];
  if (idx > 0) { layers.mid.append(el('door', { left: 40, top: FLOOR - 270, width: 120, height: 270 }, '<i class="knob"></i>')); doors.push({ x: 90, to: ROOMS[idx - 1], from: 'right' }); }
  if (idx < ROOMS.length - 1) { layers.mid.append(el('door', { left: W - 140, top: FLOOR - 270, width: 120, height: 270 }, '<i class="knob"></i>')); doors.push({ x: W - 90, to: ROOMS[idx + 1], from: 'left' }); }

  // Candles: visit-based (section 11). Mirror gets exactly one discrepancy (extinguished / newly lit).
  const candles = CANDLE_BY_VISIT[Math.min(visit - 1, CANDLE_BY_VISIT.length - 1)];
  candles.forEach((c, i) => {
    const out = mirror && i === 0;
    const cd = el('candle', { left: c.x, top: FLOOR - 34 }, out ? '' : '<i class="flame"></i>');
    layers.mid.append(cd, el('glow', { left: c.x - 100, top: FLOOR - 140, width: 212, height: 212 }));
  });
  if (mirror && !candles.length) layers.mid.append(el('candle', { left: 420, top: FLOOR - 34 }, '<i class="flame"></i>'));

  // FG: foreground paper edges
  layers.fg.append(el('fg', { left: -20, top: 0, width: 70, height: 540 }), el('fg', { left: W - 50, top: 0, width: 70, height: 540 }),
                   el('fg', { left: 0, top: 510, width: W, height: 40 }));
  layers.light.append(el('cold', { left: 0, top: 0, width: W, height: 540 }));

  // Player puppet (same for the mirror clone; flip + lag handled by container/loop)
  const player = el('bear', { left: 200, top: FLOOR - 228 }, bearSVG('bear'));
  // Nini waits at the entrance; talk with E
  const nini = roomId === 'entrance' ? el('bear', { left: 640, top: FLOOR - 140, width: 110, height: 151 }, niniSVG()) : null;
  if (nini) { nini.style.marginLeft = '-55px'; layers.char.append(nini); }
  layers.char.append(player);
  return { layers, player, doors, nini: nini ? 640 : null, clockHands: root.querySelector('.sh') };
}

export class Game {
  constructor(stageEl, mirrorEl, hooks) {
    this.stage = stageEl; this.mirrorRoot = mirrorEl; this.hooks = hooks;
    this.keys = new Set(); this.px = 200; this.mx = 200; this.cam = 0; this.running = false; this.sec = 0;
    addEventListener('keydown', e => { this.keys.add(e.key.toLowerCase()); if (e.key.toLowerCase() === 'e') this.interact(); });
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    this.clockLoop();
  }

  enter(roomId, visit, spawn = 'left') {
    this.roomId = roomId;
    this.main = buildRoom(this.stage, roomId, visit);
    this.mir = buildRoom(this.mirrorRoot, roomId, visit, { mirror: true });
    this.px = this.mx = spawn === 'left' ? 900 : W - 220;
    this.hooks.onEnter?.(roomId, visit);
    this.running = true;
  }

  interact() {
    if (!this.running || !this.main) return;
    const d = this.main.doors.find(d => Math.abs(d.x - this.px) < 80);
    if (d) this.hooks.onDoor?.(d);
    else if (this.main.nini && Math.abs(this.main.nini - this.px) < 110) this.hooks.onTalk?.('nini');
  }

  // The clock behaves mechanically: long rest, then stutter forward / slip back a hair / resume. Never supernatural.
  clockLoop() {
    const seq = [3, 0, -1, 0, 2];
    const run = async () => {
      for (;;) {
        await new Promise(r => setTimeout(r, 7000 + Math.random() * 6000));
        for (const step of seq) { this.sec += step * 6; this.setClock(); await new Promise(r => setTimeout(r, 450)); }
      }
    };
    run();
  }
  setClock() {
    for (const root of [this.stage, this.mirrorRoot]) root.querySelector('.sh')?.setAttribute('transform', `rotate(${this.sec} 100 100)`);
  }

  frame(dt) {
    if (!this.running) return;
    const dir = (this.keys.has('arrowright') || this.keys.has('d')) - (this.keys.has('arrowleft') || this.keys.has('a'));
    this.px = Math.max(160, Math.min(W - 160, this.px + dir * 260 * dt));
    this.mx += (this.px - this.mx) * Math.min(1, dt / 0.4);       // reflection lags ~0.4s
    this.cam = Math.max(0, Math.min(W - STAGE_W, this.px - BEAR_SCREEN_X)); // bear lives on the right, next to the mirror
    for (const [rt, x, r] of [[this.main, this.px, this.stage], [this.mir, this.mx, this.mirrorRoot]]) {
      for (const k in PARALLAX) rt.layers[k].style.transform = `translateX(${-this.cam * PARALLAX[k]}px)`;
      rt.player.style.left = x + 'px';
      rt.player.classList.toggle('walk', !!dir && r === this.stage);
      if (r === this.mirrorRoot) rt.player.classList.toggle('walk', Math.abs(this.px - this.mx) > 3);
    }
    // camera for the mirror shows the same world slice as the stage (it flips the right edge)
    const near = this.main.doors.find(d => Math.abs(d.x - this.px) < 80);
    this.hooks.onNear?.(near || (this.main.nini && Math.abs(this.main.nini - this.px) < 110 ? { talk: true } : null));
  }
}
