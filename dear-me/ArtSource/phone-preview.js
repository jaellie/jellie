// Phone-sized previews of the game screen (UI drawn at the game's 720×1280 reference scale).
//   node ArtSource/phone-preview.js   → Docs/preview-*.png
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const A = path.join(__dirname, '../Assets/DearMe/Resources/DearMe');
const room = JSON.parse(fs.readFileSync(A + '/Data/rooms.json')).rooms[0];
const k = 540 / 720; // px per canvas unit on a 540-wide screen
const u = v => (v * k).toFixed(1) + 'px';
const css = `
@font-face{font-family:P;src:url(file://${A}/Fonts/Pretendard-Regular-KS.ttf)}
@font-face{font-family:PS;src:url(file://${A}/Fonts/Pretendard-SemiBold-KS.ttf)}
body{margin:0;background:#e9e4da}
.ph{position:relative;width:540px;height:960px;overflow:hidden;font-family:P}
.ph>img{position:absolute;inset:0;width:100%;height:100%}
.hint{position:absolute;left:${u(32)};top:${u(32)};color:rgba(244,239,228,.92);font-size:${u(22)};text-shadow:0 1px 6px rgba(30,30,60,.5)}
.menu{position:absolute;right:${u(24)};top:${u(24)};width:${u(134)};height:${u(84)};box-sizing:border-box;border:1.5px solid rgba(244,239,228,.6);background:rgba(27,33,48,.35);color:#F4EFE4;font-size:${u(28)};display:flex;align-items:center;padding-left:${u(24)}}
.hs{position:absolute}
.mk{position:absolute;left:50%;top:50%;width:${u(14)};height:${u(14)};margin:-${u(7)} 0 0 -${u(7)};background:rgba(244,239,228,.85);transform:rotate(45deg);box-shadow:0 0 8px rgba(255,240,210,.9)}
.on{box-shadow:inset 0 0 0 2px rgba(244,239,228,.9)}
.label{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);white-space:nowrap;background:rgba(27,33,48,.88);color:#F4EFE4;padding:3px 9px;font-size:${u(18)};display:flex;gap:6px;align-items:center}
.label span{font-size:${u(16)};opacity:.7}
.panel{position:absolute;left:${u(24)};right:${u(24)};bottom:${u(24)};background:rgba(244,239,228,.97);box-shadow:inset 0 0 0 1.5px #CFC6B4;padding:${u(22)} ${u(36)} ${u(18)}}
.sp{font-family:PS;font-size:${u(22)};margin-bottom:${u(10)}}
.line{font-size:${u(30)};color:#1E2433;display:flex;flex-wrap:wrap;gap:${u(8)} ${u(10)};align-items:flex-end}
.u{display:inline-flex}.t{padding-bottom:2px;box-shadow:inset 0 -1.5px 0 rgba(30,36,51,.22)}.g{color:#A86A35;box-shadow:inset 0 -1.5px 0 rgba(168,106,53,.75)}
.en{font-size:${u(18)};color:#7D828C;padding-bottom:3px}.cont{text-align:right;font-size:${u(18)};color:rgba(30,36,51,.45)}
.tip{position:absolute;background:rgba(27,33,48,.97);border-top:2px solid #A86A35;padding:${u(16)};color:#F4EFE4;max-width:${u(520)}}
.tt{font-size:${u(24)}}.tm{font-size:${u(22)};margin-top:3px}.tn{font-size:${u(18)};opacity:.72;margin-top:3px}`;
const pct = o => `left:${o.x*100}%;top:${o.y*100}%;width:${o.w*100}%;height:${o.h*100}%`;
const img = n => `<img src="file://${A}/Art/${n}.png">`;
const menu = `<div class="menu">메뉴</div>`;

function explore(pressed) {
  let h = img('room_present') + `<div class="hint">${room.hintKo}</div>` + menu;
  for (const o of room.objects) {
    const on = o.id === pressed;
    h += `<div class="hs ${on ? 'on' : ''}" style="${pct(o)}">`;
    if (o.image) h += `<img src="file://${A}/Art/${o.image}.png" style="position:absolute;inset:0;width:100%;height:100%">`;
    h += `<div class="mk"></div>`;
    if (on) h += `<div class="label"><b>${o.labelKo}</b><span>· ${o.verbKo}  ${o.verbEn}</span></div>`;
    h += `</div>`;
  }
  return h;
}
const roomLine = img('room_present') + menu + `
  <div class="tip" style="left:${u(150)};top:${u(830)}"><div class="tt">-(으)려고 하다</div><div class="tm">to intend to / be planning to</div><div class="tn">Used when talking about an intention or plan.</div></div>
  <div class="panel"><div class="line">
    <span class="u"><span>‘</span><span class="t">저는</span></span><span class="t">이번</span>
    <span class="u"><span class="t">프로그램</span><span>에</span></span>
    <span class="u"><span class="t">지원</span><span class="t g">하려고 합니다</span><span>.’</span></span><span class="en">EN</span>
  </div><div class="cont">▼</div></div>`;
const cafeLine = img('cafe_2018') + menu + `
  <div class="panel"><div class="sp" style="color:#8a5a3c">유리</div><div class="line">
    <span class="t">나</span><span class="t">이번에</span><span class="u"><span class="t">신청</span><span class="t">했어</span><span>.</span></span><span class="en">EN</span>
  </div><div class="cont">▼</div></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  const shots = { explore: explore('diary'), dialogue: roomLine, cafe: cafeLine };
  for (const [name, body] of Object.entries(shots)) {
    // Written to a file so file:// art and fonts are allowed to load.
    const tmp = path.join(require('os').tmpdir(), 'dearme-preview-' + name + '.html');
    fs.writeFileSync(tmp, `<!doctype html><meta charset=utf-8><style>${css}</style><div class="ph">${body}</div>`);
    await p.goto('file://' + tmp);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(__dirname, '../Docs/preview-' + name + '.png') });
  }
  await b.close();
})();
