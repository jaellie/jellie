import { content } from '../content.js';

// Notes, photos, gifts and voices. Found ones are remembered (per browser) and
// appear on the Memory Shelf. Nothing ever shows a count.

const KEY = 'mom-game-found-v1';

export class Discoverables {
  constructor(overlay, audio) {
    this.overlay = overlay; this.audio = audio; this.listeners = [];
    if (new URLSearchParams(location.search).has('reset')) { try { localStorage.removeItem(KEY); } catch {} }
    try { this.order = JSON.parse(localStorage.getItem(KEY) || '[]').filter((id) => this.exists(id)); } catch { this.order = []; }
    this.found = new Set(this.order);
  }

  get(id) { return content.discoverables[id]; }
  exists(id) { const d = this.get(id); return !!d && !d.hidden; }
  isFound(id) { return this.found.has(id); }
  onFound(fn) { this.listeners.push(fn); }

  save() { try { localStorage.setItem(KEY, JSON.stringify(this.order)); } catch {} }

  // returns a promise that resolves when the card is closed
  discover(id) {
    const d = this.get(id);
    if (!d || d.hidden) return Promise.resolve(false);
    if (!this.found.has(id)) {
      this.found.add(id); this.order.push(id); this.save();
      this.audio.play('chime');
      this.listeners.forEach((fn) => fn(id, d));
    }
    return this.overlay.openDiscoverable(id, d).then(() => true);
  }

  open(id) { const d = this.get(id); return d ? this.overlay.openDiscoverable(id, d) : Promise.resolve(); }

  // { found, total } over the findable items (hidden items and switched-off worlds don't count)
  progress() {
    const on = (d) => !d.hidden && (d.world === 'home' || content.features?.[d.world] !== false);
    const all = Object.entries(content.discoverables).filter(([, d]) => on(d));
    return { found: all.filter(([id]) => this.found.has(id)).length, total: all.length };
  }

  listFound() { return this.order.filter((id) => this.exists(id)).map((id) => ({ id, d: this.get(id) })); }
}
