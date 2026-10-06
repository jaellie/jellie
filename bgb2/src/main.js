import { ROOM_INFO } from './data.js';
import { state, load, save, reset, hasSave } from './state.js';
import { Game } from './scene.js';
import { buildSpine, openFolder, closeFolder } from './ui.js';
import { bearSVG } from './bear.js';
import { sfx } from './audio.js';

const $ = s => document.querySelector(s);
const canvas = $('#canvas');

function fit() {
  const s = Math.min(innerWidth / 1280, innerHeight / 720);
  canvas.style.transform = `scale(${s}) translate(-50%,-50%)`;
  canvas.style.transformOrigin = '0 0';
  canvas.style.left = '50%'; canvas.style.top = '50%';
  canvas.style.marginLeft = '0';
}
// translate(-50%,-50%) is applied in pre-scale units, so it centres the canvas at any size
addEventListener('resize', fit); fit();

/* ---------- game ---------- */
const mirrorRoot = $('#mirror-inner');
const game = new Game($('#stage'), mirrorRoot, {
  onEnter(room, visit) {
    $('#hdr-room').textContent = `${ROOM_INFO[room].label} · VISIT ${visit}`;
    $('#narration').textContent = ROOM_INFO[room].line;
  },
  onDoor(d) { go(d.to, d.from === 'right' ? 'right' : 'left'); },
  onTalk() { say('Nini', 'var(--nini)', 'Bear! Bear! Is it true you have bells?'); },
  onNear(d) { $('#keys').textContent = d ? (d.talk ? 'E  talk' : 'E  open door') : '← → move · E interact · Tab case file'; },
});

function say(who, color, text) {
  $('#narration').innerHTML = `<b style="color:${color};display:block;font-size:13px">${who}</b>${text}`;
}

function go(room, spawn) {
  state.room = room; state.visits[room]++; save();
  game.enter(room, state.visits[room], spawn);
}

function start({ fresh }) {
  if (fresh) reset(); else load();
  $('#menu').hidden = true;
  go(state.room, 'left');
}

/* ---------- folder ---------- */
buildSpine(openFolder);
addEventListener('keydown', e => {
  if ($('#menu').hidden === false) return;
  if (e.key === 'Tab') { e.preventDefault(); $('#folder').hidden ? openFolder('PEOPLE') : closeFolder(); }
  if (e.key === 'Escape') closeFolder();
});

/* ---------- menu ---------- */
const items = [
  ['CONTINUE', () => hasSave() && start({ fresh: false })],
  ['NEW GAME', () => start({ fresh: true })],
  ['CASE FILE', () => { load(); $('#menu').hidden = true; go(state.room, 'left'); openFolder('PEOPLE'); }],
  ['SETTINGS', () => alert('Settings: TODO (volume, text size, reduced motion)')],
];
$('#menu-tabs').innerHTML = items.map(([t], i) => `<li><button data-i="${i}">${t}</button></li>`).join('');
$('#menu-tabs').addEventListener('click', e => { const i = e.target.dataset.i; if (i) { sfx('tap'); items[i][1](); } });

// Symmetrical tower silhouette + two bears (one slightly offset)
$('#menu-art').innerHTML = `
  <div style="position:absolute;left:560px;top:30px;width:160px;height:310px;background:var(--env2);filter:url(#cut);box-shadow:4px 6px 0 #0006"></div>
  <div style="position:absolute;left:520px;top:20px;width:240px;height:240px;border-radius:50%;background:var(--cream);box-shadow:0 0 0 10px var(--shadow)"></div>
  <div style="position:absolute;left:540px;top:215px;width:200px;height:8px;background:var(--shadow)"></div>
  <div class="bear cutout" style="left:430px;top:210px;filter:brightness(0) opacity(.85)">${bearSVG('bear')}</div>
  <div class="bear cutout" style="left:858px;top:216px;filter:brightness(0) opacity(.85)">${bearSVG('bear')}</div>`;
$('#menu-art .bear').style.cssText += ';position:absolute;transform:scale(1.8)';
$('#menu-art .bear:last-child').style.cssText += ';position:absolute;transform:scale(1.8)';

/* ---------- loop ---------- */
let last = performance.now();
(function tick(t) { game.frame(Math.min(.05, (t - last) / 1000)); last = t; requestAnimationFrame(tick); })(last);

// dev helper: ?dev=1 -> window.bgb for poking at phases
if (location.search.includes('dev')) window.bgb = { state, openFolder, go, game };
