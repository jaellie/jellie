import { ROOMS } from './data.js';

const KEY = 'bgb2.save.v1';
const fresh = () => ({
  room: 'entrance',
  visits: Object.fromEntries(ROOMS.map(r => [r, 0])),
  phase: 0,                // index into PHASES
  board: {},               // evidenceId -> 'bear' | 'green'
  timeline: {},            // evidenceId -> time label
  found: ['pencil', 'cup', 'knotL', 'knotR', 'cafe', 'tower', 'photo', 'smileC', 'smileO', 'ear', 'bellLike', 'bellNo'],
});

export const state = fresh();

export function load() {
  try { Object.assign(state, fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); return true; }
  catch { return false; }
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
export function reset() { Object.assign(state, fresh()); save(); }
export const hasSave = () => { try { return !!localStorage.getItem(KEY); } catch { return false; } };
