// Keyboard (WASD / arrows, E / Space) + touch joystick fallback.
// getMove() returns screen-space intent: x = right, y = up (both -1..1).

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};

export class Input {
  constructor() {
    this.held = new Set();
    this.interactQueued = false;
    this.anyKeyQueued = false;
    this.joy = { x: 0, y: 0, active: false, id: null, cx: 0, cy: 0 };
    this.touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches;

    addEventListener('keydown', (e) => {
      if (e.code in KEYMAP) { this.held.add(KEYMAP[e.code]); e.preventDefault(); }
      if (!e.repeat && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter')) {
        this.interactQueued = true; e.preventDefault();
      }
      if (!e.repeat) this.anyKeyQueued = e.code;
    });
    addEventListener('keyup', (e) => { if (e.code in KEYMAP) this.held.delete(KEYMAP[e.code]); });
    addEventListener('blur', () => this.held.clear());

    if (this.touch) this.buildTouchUI();
  }

  buildTouchUI() {
    document.body.classList.add('touch');
    const zone = document.createElement('div');
    zone.className = 'joy-zone';
    const base = document.createElement('div'); base.className = 'joy-base';
    const knob = document.createElement('div'); knob.className = 'joy-knob';
    base.appendChild(knob); zone.appendChild(base);
    const btn = document.createElement('div'); btn.className = 'touch-btn'; btn.textContent = '●';
    document.body.append(zone, btn);
    this.touchEls = { zone, base, knob, btn };
    const R = 55;
    const move = (t) => {
      let dx = t.clientX - this.joy.cx, dy = t.clientY - this.joy.cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joy.x = dx / R; this.joy.y = -dy / R;
    };
    zone.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      Object.assign(this.joy, { active: true, id: t.identifier, cx: t.clientX, cy: t.clientY });
      base.style.left = t.clientX - 60 + 'px'; base.style.top = t.clientY - 60 + 'px';
      base.classList.add('on'); move(t); e.preventDefault();
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) if (t.identifier === this.joy.id) move(t);
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) if (t.identifier === this.joy.id) {
        Object.assign(this.joy, { active: false, x: 0, y: 0, id: null });
        knob.style.transform = ''; base.classList.remove('on');
      }
    };
    zone.addEventListener('touchend', end); zone.addEventListener('touchcancel', end);
    btn.addEventListener('touchstart', (e) => { this.interactQueued = true; btn.classList.add('on'); e.preventDefault(); }, { passive: false });
    btn.addEventListener('touchend', () => btn.classList.remove('on'));
  }

  setTouchVisible(v) {
    if (!this.touchEls) return;
    this.touchEls.zone.style.display = this.touchEls.btn.style.display = v ? '' : 'none';
  }

  getMove() {
    let x = 0, y = 0;
    if (this.held.has('left')) x -= 1;
    if (this.held.has('right')) x += 1;
    if (this.held.has('up')) y += 1;
    if (this.held.has('down')) y -= 1;
    if (this.joy.active) { x += this.joy.x; y += this.joy.y; }
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    if (m < 0.12) return { x: 0, y: 0 };
    return { x, y };
  }

  consumeInteract() { const v = this.interactQueued; this.interactQueued = false; return v; }
  consumeAnyKey() { const v = this.anyKeyQueued; this.anyKeyQueued = false; return v; }
}
