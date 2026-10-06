import { EVIDENCE, PEOPLE, STATEMENTS, TIMES, PHASES } from './data.js';
import { state, save } from './state.js';
import { bearSVG } from './bear.js';
import { sfx } from './audio.js';

const $ = s => document.querySelector(s);
export const TABS = ['PEOPLE', 'EVIDENCE', 'STATEMENTS', 'TIMELINE', 'IDENTITY'];
const SOUND = { PEOPLE: 'shuffle', EVIDENCE: 'tap' };
const ev = id => EVIDENCE.find(e => e.id === id);

export function buildSpine(onOpen) {
  $('#spine').innerHTML = TABS.map(t => `<button class="tab" data-tab="${t}">${t}</button>`).join('');
  $('#spine').addEventListener('click', e => { const t = e.target.dataset.tab; if (t) onOpen(t); });
}

export function openFolder(tab) {
  const f = $('#folder'); f.hidden = false;
  f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  sfx(SOUND[tab] || 'shuffle');
  f.innerHTML = `<div class="page">${PAGES[tab]()}</div>`;
  AFTER[tab]?.(f);
}
export function closeFolder() { $('#folder').hidden = true; document.querySelectorAll('.tab').forEach(b => b.classList.remove('on')); }

const portrait = (who, name) => `<div class="portrait"><div class="cutout" style="height:120px;width:120px;margin:0 auto;background:var(--env2)">${bearSVG(who)}</div><div class="nm">${name}</div></div>`;

const cardHTML = (e, cls = '') => `<div class="card ${cls}" draggable="true" data-id="${e.id}"><b>${e.title}</b><i>${e.where}</i>${e.obs}</div>`;

const PAGES = {
  PEOPLE() {
    const p = PHASES[state.phase];
    const known = l => l.map(k => `<li>${k}</li>`).join('');
    if (p === 'one') return `<h3>People</h3><div class="people-row">${portrait('bear', PEOPLE.bear.name)}<ul class="hand">${known(PEOPLE.bear.known)}</ul></div>`;
    return `<h3>People</h3><div class="people-row">${portrait('bear', PEOPLE.bear.name)}${portrait('bear', PEOPLE.green.name)}
      ${p === 'uncertain' ? '<div class="stamp">IDENTITY UNCERTAIN</div>' : ''}</div>
      <p class="hand" style="margin-top:18px">Which one waved at Nini?</p>`;
  },
  EVIDENCE() {
    return `<h3>Evidence</h3><div class="sub">${state.found.length} cards</div><div class="cards">${state.found.map(id => cardHTML(ev(id))).join('')}</div>`;
  },
  STATEMENTS() {
    return `<h3>Statements</h3>${STATEMENTS.map(s => `<div class="say"><small>${s.who} · ${s.when}</small>${s.text}</div>`).join('')}`;
  },
  TIMELINE() {
    return `<h3>Timeline</h3><div class="sub">drag evidence onto a time</div>
      <div class="timeline">${TIMES.map(t => `<div class="slot ${t === '11:47' ? 'stopped' : ''}" data-time="${t}"><span class="t hand">${t}</span>
      ${Object.entries(state.timeline).filter(([, v]) => v === t).map(([id]) => cardHTML(ev(id), 'attached')).join('')}</div>`).join('')}</div>
      <div class="tray" data-zone="tray">${trayIds(state.timeline).map(id => cardHTML(ev(id))).join('')}</div>`;
  },
  IDENTITY() {
    const col = side => Object.entries(state.board).filter(([, v]) => v === side).map(([id]) => cardHTML(ev(id), 'attached')).join('');
    return `<h3>Identity</h3><div class="board">
      <div class="col" data-zone="bear"><h4>BIG GREEN BEAR</h4>${col('bear')}</div>
      <div class="col" data-zone="green"><h4>GREEN</h4>${col('green')}</div></div>
      <div class="tray" data-zone="tray">${trayIds(state.board).map(id => cardHTML(ev(id))).join('')}</div>`;
  },
};
const trayIds = placed => state.found.filter(id => !(id in placed));

/** Same trait, different value, same column -> CONFLICT. Never says which side is right. */
export function conflicts(board) {
  const bad = new Set();
  for (const side of ['bear', 'green']) {
    const ids = Object.keys(board).filter(i => board[i] === side && ev(i).claim);
    for (const a of ids) for (const b of ids)
      if (a !== b && ev(a).claim[0] === ev(b).claim[0] && ev(a).claim[1] !== ev(b).claim[1]) bad.add(a);
  }
  return bad;
}

function markConflicts(root) {
  const bad = conflicts(state.board);
  root.querySelectorAll('.col .card').forEach(c => {
    const on = bad.has(c.dataset.id);
    c.classList.toggle('conflict', on);
    c.querySelector('.cf')?.remove();
    if (on) c.insertAdjacentHTML('beforeend', '<span class="cf">CONFLICT</span>');
  });
  return bad.size;
}

function dnd(root, store, onChange) {
  let drag;
  root.addEventListener('dragstart', e => { drag = e.target.closest('.card')?.dataset.id; });
  root.addEventListener('dragover', e => { const z = e.target.closest('[data-zone],.slot'); if (z) { e.preventDefault(); z.classList.add('over'); } });
  root.addEventListener('dragleave', e => e.target.closest?.('.over')?.classList.remove('over'));
  root.addEventListener('drop', e => {
    const z = e.target.closest('[data-zone],.slot'); if (!z || !drag) return;
    e.preventDefault();
    const dest = z.dataset.zone || z.dataset.time;
    if (dest === 'tray') delete store[drag]; else store[drag] = dest;
    const before = conflicts(state.board).size;
    save(); onChange();
    const after = markConflicts(root);
    sfx(after > before ? 'stop' : 'pencil');
    drag = null;
  });
}

const AFTER = {
  IDENTITY(f) {
    f.querySelectorAll('.attached').forEach(c => c.style.setProperty('--r', (Math.random() * 3 - 1.5).toFixed(1) + 'deg'));
    markConflicts(f);
    dnd(f, state.board, () => openFolder('IDENTITY'));
  },
  TIMELINE(f) { dnd(f, state.timeline, () => openFolder('TIMELINE')); },
};
