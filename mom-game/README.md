# 엄마의 하루 — birthday game for Mom

Cozy low-poly 3D game (Vite + Three.js). Home → LF Square (Dad's car key) → The Past
(black rubber shoes) → Ungcheon Beach at dusk (front door) with the birthday letter.

## Run
```
npm install
npm run dev      # open the printed link
npm run build    # static site in dist/ (works from any host / sub-path)
```

## Make it yours
- **All text** (notes, gifts, bubbles, shop names, the letter): `src/content.js`.
  Lines marked ✍️ are gentle defaults — replace them. `hidden: true` removes an item.
- **Photos**: put files in `public/assets/photos/` named as in `content.js`
  (`01.jpg` … `05.jpg` for the TV, `06.jpg` fridge magnet, `07.jpg` mall mirror,
  `08.jpg` photo booth, `09.jpg` paper boat). Max ~1024 px. Missing photos show a soft placeholder.
- **Voice message**: `public/assets/audio/voice_message.mp3` (landline phone).
  Optional `intercom.mp3`, and music/ambience: `bgm_home.mp3`, `bgm_mall.mp3`, `bgm_past.mp3`,
  `bgm_beach.mp3`, `waves.mp3`, `gulls.mp3`, `cicadas.mp3`, `squeak.mp3`, `chime.mp3`.
  Anything missing falls back to a built-in synthesized sound.
- **Room layout** (furniture positions, meters): `src/worlds/layout.js`.
- Turn a world off: `features` in `content.js` (its trigger object disappears).

## Controls
WASD / arrow keys walk · E or Space interact · touch: left joystick + round button (landscape).

## Testing helpers (URL params)
`?world=beach|mall|past` jump to a world · `?sunset=0.7` set the home sunset ·
`?reset` forget found items · `?debug` fps counter.

## Deploy (unlisted link)
`npm run build`, then drag the `dist/` folder onto https://app.netlify.com/drop
(or Cloudflare Pages / GitHub Pages). `index.html` has `noindex`.
