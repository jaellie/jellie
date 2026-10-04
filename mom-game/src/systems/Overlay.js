import { content } from '../content.js';

// All 2D UI: start screen, fades, interaction hint, speech bubble, and the cards
// (note / photo / gift / voice / letter / memory shelf). No counters, no HUD.

const BASE = import.meta.env.BASE_URL;
export const assetUrl = (f) => `${BASE}assets/${f}`;
const PLACEHOLDER = '…';

function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function esc(s) { return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
const TYPE_ICON = { note: '✉️', photo: '🖼️', gift: '🎁', voice: '📞' };

export class Overlay {
  constructor(audio) {
    this.audio = audio;
    const b = document.body;
    this.vignette = el('div'); this.vignette.id = 'vignette';
    this.sepia = el('div'); this.sepia.id = 'sepia';
    this.grain = el('div'); this.grain.id = 'grain';
    this.grain.style.backgroundImage = `url(${makeGrain()})`;
    this.fadeEl = el('div'); this.fadeEl.id = 'fade';
    this.hint = el('div', null, 'E'); this.hint.id = 'hint';
    if (document.body.classList.contains('touch')) this.hint.textContent = '●';
    this.bubble = el('div'); this.bubble.id = 'bubble';
    this.layer = el('div'); this.layer.id = 'cardLayer';
    this.portrait = el('div', null, '폰을 가로로 돌려주세요 🙂'); this.portrait.id = 'portrait';
    b.append(this.vignette, this.sepia, this.grain, this.fadeEl, this.hint, this.bubble, this.layer, this.portrait);
    this.card = null;
    this.bubbleUntil = 0;
    this.layer.addEventListener('click', (e) => { if (e.target === this.layer) this.key('close'); });
  }

  // ── start screen ─────────────────────────────────────────
  startScreen() {
    return new Promise((resolve) => {
      const s = el('div', null, '<p>화면을 한 번 눌러주세요 🌙</p>'); s.id = 'start';
      document.body.appendChild(s);
      const go = () => {
        removeEventListener('keydown', go); s.removeEventListener('pointerdown', go);
        s.classList.add('hide'); setTimeout(() => s.remove(), 1500); resolve();
      };
      s.addEventListener('pointerdown', go); addEventListener('keydown', go);
    });
  }

  fade(to, { color = '#000', ms = 1000 } = {}) {
    return new Promise((res) => {
      this.fadeEl.style.transition = `opacity ${ms}ms ease`;
      this.fadeEl.style.background = color;
      requestAnimationFrame(() => { this.fadeEl.style.opacity = to; setTimeout(res, ms + 30); });
    });
  }

  showHint(x, y) {
    if (x == null) { this.hint.classList.remove('on'); return; }
    this.hint.classList.add('on');
    this.hint.style.left = x + 'px'; this.hint.style.top = y + 'px';
  }

  say(text, ms = 2600) {
    if (!text) return;
    this.bubble.textContent = text;
    this.bubble.classList.add('on');
    this.bubbleUntil = performance.now() + ms;
  }
  placeBubble(x, y) {
    if (performance.now() > this.bubbleUntil) this.bubble.classList.remove('on');
    this.bubble.style.left = x + 'px'; this.bubble.style.top = y + 'px';
  }

  get isOpen() { return !!this.card; }

  // ── cards ────────────────────────────────────────────────
  _open(cardEl, handlers = {}) {
    return new Promise((resolve) => {
      if (this.card) this._close(true);
      const x = el('div', 'xbtn', '×'); x.addEventListener('click', () => this.key('close'));
      cardEl.appendChild(x);
      this.layer.innerHTML = ''; this.layer.appendChild(cardEl);
      this.layer.classList.add('on');
      this.card = { el: cardEl, resolve, handlers, openedAt: performance.now() };
      this.hint.classList.remove('on');
      cardEl.addEventListener('click', (e) => { if (e.target !== x) this.key('interact'); });
    });
  }

  _close(silent) {
    const c = this.card; if (!c) return;
    this.card = null;
    c.handlers.onClose?.();
    this.layer.classList.remove('on');
    setTimeout(() => { if (!this.card) this.layer.innerHTML = ''; }, 400);
    if (!silent) c.resolve();
  }

  // input routed from main while a card is open: 'interact' | 'close' | 'left' | 'right' | 'up' | 'down'
  key(k) {
    const c = this.card; if (!c) return;
    if (performance.now() - c.openedAt < 350) return;
    if (c.handlers[k]) { if (c.handlers[k]() === false) return; else return; }
    if (k === 'interact' || k === 'close') this._close();
  }

  openDiscoverable(id, d) {
    switch (d.type) {
      case 'photo': return this.photoCard(d.files || [d.file], d.captions || [d.caption], d.title);
      case 'gift': return this.giftCard(d);
      case 'voice': return this.voiceCard(d);
      default: return this.noteCard(d);
    }
  }

  noteCard(d) {
    const c = el('div', 'card note');
    c.innerHTML = `${d.title ? `<div class="title">${esc(d.title)}</div>` : ''}<div class="hand lines">${esc(d.text || PLACEHOLDER)}</div><div class="close-tip">닫기 · E</div>`;
    return this._open(c);
  }

  photoCard(files, captions = [], title) {
    files = (files || []).filter(Boolean);
    if (!files.length) files = [null];
    let i = 0;
    const c = el('div', 'card photo');
    const img = el('div', 'img'); const cap = el('div', 'cap'); const dots = el('div', 'dots');
    c.append(img, cap, dots);
    const show = () => {
      img.innerHTML = '';
      const f = files[i];
      const fallback = () => { img.innerHTML = '📷'; img.style.background = 'linear-gradient(135deg,#f3e2cc,#e8c9b8)'; };
      if (f) {
        const im = new Image(); im.alt = '';
        im.onload = () => { img.innerHTML = ''; img.style.background = ''; img.appendChild(im); };
        im.onerror = fallback; im.src = assetUrl(f);
        fallback();
      } else fallback();
      cap.textContent = captions[i] || title || '';
      dots.textContent = files.length > 1 ? files.map((_, j) => (j === i ? '●' : '○')).join('') : '';
    };
    show();
    const step = (s) => { if (files.length < 2) return; i = (i + s + files.length) % files.length; show(); this.audio?.play('page'); };
    return this._open(c, {
      left: () => step(-1), right: () => step(1),
      interact: () => { if (i < files.length - 1) { step(1); return; } this._close(); },
    });
  }

  giftCard(d) {
    const c = el('div', 'card note');
    c.style.rotate = '0deg';
    c.innerHTML = `
      <div class="giftbox shake"><div class="inside">${d.icon || '🎁'}</div><div class="base"><div class="rib"></div></div><div class="lid"><div class="rib"></div><div class="bow"></div></div></div>
      <div class="reveal">${d.title ? `<div class="title" style="text-align:center">${esc(d.title)}</div>` : ''}<div class="hand" style="text-align:center">${esc(d.text || PLACEHOLDER)}</div><div class="close-tip">닫기 · E</div></div>`;
    const p = this._open(c);
    const bx = c.querySelector('.giftbox');
    setTimeout(() => { bx.classList.remove('shake'); bx.classList.add('open'); this.audio?.play('pop'); c.querySelector('.reveal').classList.add('on'); }, 1000);
    return p;
  }

  voiceCard(d) {
    const c = el('div', 'card voice');
    c.innerHTML = `<div class="title">${esc(d.title || '')}</div><div class="wave">${'<i></i>'.repeat(9)}</div><div class="hand sub"></div><div class="close-tip">닫기 · E</div>`;
    c.querySelectorAll('.wave i').forEach((n, i) => (n.style.animationDelay = `${(i % 5) * 0.12}s`));
    const sub = c.querySelector('.sub');
    const lines = d.subtitles?.length ? d.subtitles : [d.text || PLACEHOLDER];
    let timer, handle;
    const run = (per) => {
      let i = 0;
      const next = () => {
        if (i >= lines.length) { c.querySelector('.wave').style.opacity = 0.3; return; }
        sub.style.opacity = 0; setTimeout(() => { sub.textContent = lines[i++]; sub.style.transition = 'opacity .5s'; sub.style.opacity = 1; }, 250);
        timer = setTimeout(next, per);
      };
      next();
    };
    const p = this._open(c, { onClose: () => { clearTimeout(timer); handle?.stop(); } });
    this.audio?.playVoice(d.file).then((h) => {
      handle = h;
      if (!this.card || this.card.el !== c) { h?.stop(); return; }
      const per = h ? Math.max(1800, (h.duration * 1000) / lines.length) : 2600;
      run(per);
    });
    return p;
  }

  letterCard() {
    const c = el('div', 'card letter');
    const hand = el('div', 'hand');
    const text = content.letter || PLACEHOLDER;
    const chars = [];
    for (const ch of text) {
      if (ch === '\n') { hand.appendChild(document.createElement('br')); continue; }
      const s = el('span', 'ch'); s.textContent = ch; hand.appendChild(s); chars.push(s);
    }
    const fin = el('div', 'final'); fin.textContent = content.finalLine;
    const from = el('div', 'from'); from.textContent = content.letterFrom || '';
    const tip = el('div', 'close-tip'); tip.textContent = '';
    c.append(hand, fin, from, tip);
    let i = 0, done = false, timer;
    const finish = () => {
      done = true; clearInterval(timer);
      chars.forEach((s) => s.classList.add('on'));
      setTimeout(() => { fin.classList.add('on'); from.classList.add('on'); tip.textContent = '닫기 · E'; c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); }, 400);
    };
    timer = setInterval(() => {
      for (let k = 0; k < 2 && i < chars.length; k++) chars[i++].classList.add('on');
      const last = chars[i - 1];
      if (last && last.offsetTop > c.scrollTop + c.clientHeight - 90) c.scrollTop = last.offsetTop - c.clientHeight + 140;
      if (i >= chars.length) finish();
    }, 70);
    return this._open(c, {
      onClose: () => clearInterval(timer),
      interact: () => { if (!done) { finish(); return; } this._close(); },
      up: () => { c.scrollBy({ top: -120, behavior: 'smooth' }); },
      down: () => { c.scrollBy({ top: 120, behavior: 'smooth' }); },
    });
  }

  // Memory shelf browser: every found item, re-openable.
  shelfCard(items, onPick) {
    const c = el('div', 'card shelf');
    c.innerHTML = '<div class="title">추억 선반</div>';
    if (!items.length) {
      c.innerHTML += '<div class="empty">아직 비어 있어요.<br>집 안 어딘가에 뭔가 숨어 있을지도…</div>';
      return this._open(c);
    }
    const grid = el('div', 'grid'); c.appendChild(grid);
    let sel = 0;
    const nodes = items.map(({ id, d }, i) => {
      const n = el('div', 'it', `<div class="e">${d.icon || TYPE_ICON[d.type] || '✉️'}</div><div class="t">${esc(d.title || '쪽지')}</div>`);
      n.addEventListener('click', (e) => { e.stopPropagation(); sel = i; pick(); });
      grid.appendChild(n); return n;
    });
    const mark = () => nodes.forEach((n, i) => n.classList.toggle('sel', i === sel));
    mark();
    const cols = () => Math.max(1, Math.round(grid.clientWidth / 106));
    const pick = () => { const it = items[sel]; this._close(true); this.card = null; onPick(it.id).then(() => this.shelfCard(items, onPick)); };
    return this._open(c, {
      left: () => { sel = Math.max(0, sel - 1); mark(); },
      right: () => { sel = Math.min(items.length - 1, sel + 1); mark(); },
      up: () => { sel = Math.max(0, sel - cols()); mark(); },
      down: () => { sel = Math.min(items.length - 1, sel + cols()); mark(); },
      interact: pick,
    });
  }
}

function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); return c.toDataURL();
}
