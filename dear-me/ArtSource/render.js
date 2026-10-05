// Renders the painted scenes and objects into Assets/DearMe/Resources/DearMe/Art.
//   node ArtSource/render.js          (set PLAYWRIGHT to a playwright module path if not installed locally)
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const out = path.join(__dirname, '../Assets/DearMe/Resources/DearMe/Art');
const jobs = [
  { page: 'paint-room.html', file: 'room_present.png', w: 1920, h: 1080 },
  { page: 'paint-objects.html#diary', file: 'obj_diary.png', w: 320, h: 200, transparent: true },
  { page: 'paint-objects.html#photo', file: 'obj_photo.png', w: 320, h: 200, transparent: true },
];
(async () => {
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  for (const j of jobs) {
    const p = await b.newPage({ viewport: { width: j.w, height: j.h } });
    await p.goto('file://' + path.join(__dirname, j.page));
    await p.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
    await (await p.$('#c')).screenshot({ path: path.join(out, j.file), omitBackground: !!j.transparent });
    await p.close();
  }
  await b.close();
})();
