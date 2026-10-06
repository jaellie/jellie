const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs = require('fs');
const S = process.argv[2]; const out = S + '/sprites'; fs.mkdirSync(out, { recursive: true });
const models = ['Tree_1_A','Tree_2_A','Tree_3_A','Tree_4_A','Tree_Bare_1_A','Tree_Bare_2_A','Rock_1_A','Rock_3_A','Bush_1_A','Bush_4_A'];
const tones = { far: '#4d6290', mid: '#37507d', near: '#1f3052' };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type()==='error' && console.log('C', m.text()));
  await p.goto('http://localhost:8140/render.html'); await p.waitForFunction('window.ready', null, { timeout: 15000 });
  for (const m of models) for (const [t, c] of Object.entries(tones)) {
    const url = await p.evaluate(([m, c]) => window.render(m, c), [m, c]);
    fs.writeFileSync(`${out}/${m}_${t}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log('done'); await b.close();
})();
