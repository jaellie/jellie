/*
 * render-art.js — turns the paper sprites (tools/paper/*.js) into PNGs for Unity.
 *   node tools/render-art.js              every sprite
 *   node tools/render-art.js layer_ bear  only names starting with these
 *
 * Each sprite is a stack of plies (flat SVG sheets). In Chromium, every ply is
 * rasterised and finished as paper: fibre grain, light through the paper
 * (backlight x cloudy pulp), a warm rim on top edges, a dark band on bottom
 * edges, and a soft cast shadow on what lies behind. Then the glow pass adds
 * bloom around lit holes. Output: Assets/BigGreenBear/Resources/BGB/Art/<name>.png
 * The SVG of every ply also goes to ArtSource/ for reference.
 *
 * Paper finishing follows the "Paper-cut Lightbox" style of
 * github.com/lemomo-ai/lemo-opuscar (MIT, (c) 2026 LemoLab): paper.js finish().
 */
const fs = require("fs");
const path = require("path");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const { font } = require("./paper/kit.js");
const sprites = Object.assign({}, require("./paper/cast.js").sprites, require("./paper/places.js").sprites, require("./paper/ui.js").sprites);
const only = process.argv.slice(2);

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art");
const SRC = path.join(ROOT, "ArtSource");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SRC, { recursive: true });

function wrap(w, h, body, wobble, seed) {
  const f = wobble > 0
    ? `<filter id="cut" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${seed}" result="n"/>
       <feDisplacementMap in="SourceGraphic" in2="n" scale="${wobble}" xChannelSelector="R" yChannelSelector="G"/></filter>`
    : "";
  const fnt = body.includes("<text") ? font() : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${fnt}<defs>${f}</defs><g${wobble > 0 ? ' filter="url(#cut)"' : ""}>${body}</g></svg>`;
}

// ---------------- runs inside the page ----------------
const PAGE = `
<html><body style="margin:0;background:transparent"><script>
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const TAU = Math.PI * 2;
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
// paper fibre (face texture)
function makeGrain(n, seed){
  const c=cv(n,n),x=c.getContext('2d'),R=mulberry(seed),img=x.createImageData(n,n),d=img.data;
  for(let i=0;i<n*n;i++){const v=R();d[i*4]=d[i*4+1]=d[i*4+2]=v<.5?0:255;d[i*4+3]=Math.abs(v-.5)*34;}
  x.putImageData(img,0,0);x.lineCap='round';
  for(let i=0;i<n*1.4;i++){const px=R()*n,py=R()*n,a=R()*TAU,l=5+R()*22;
    x.strokeStyle=R()<.5?'rgba(40,30,20,.10)':'rgba(255,255,255,.16)';x.lineWidth=.5+R()*.8;
    x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+.5)*l*.5,py+Math.sin(a+.5)*l*.5,px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}
  return c;
}
// pulp clouds (what you see when light comes through the paper), grey, tileable
function makeCloud(n, seed){
  const R=mulberry(seed),c=cv(n,n),x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,n,n);
  for(const [cnt,rmin,rmax,a] of [[60,40,120,.22],[260,10,40,.16],[900,3,10,.12]]){
    for(let i=0;i<cnt;i++){const px=R()*n,py=R()*n,r=rmin+R()*(rmax-rmin),v=R()<.5?0:255;
      for(const ox of [-n,0,n])for(const oy of [-n,0,n]){const g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r);
        g.addColorStop(0,'rgba('+v+','+v+','+v+','+a+')');g.addColorStop(1,'rgba('+v+','+v+','+v+',0)');x.fillStyle=g;x.fillRect(px+ox-r,py+oy-r,r*2,r*2);}}}
  x.lineCap='round';
  for(let i=0;i<n*2;i++){const px=R()*n,py=R()*n,a=R()*TAU,l=6+R()*30;x.strokeStyle='rgba(255,255,255,'+(.05+R()*.12)+')';x.lineWidth=.6+R();
    x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+.6)*l*.5,py+Math.sin(a+.6)*l*.5,px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}
  return c;
}
const GRAIN = makeGrain(512, 7), CLOUD = makeCloud(512, 3);
const cloudData = CLOUD.getContext('2d').getImageData(0,0,512,512).data;

function load(svg){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));});}
function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16)/255,parseInt(c.slice(2,4),16)/255,parseInt(c.slice(4,6),16)/255];}

// light coming through the paper: albedo * light * trans * falloff * pulp
function backlight(c, o){
  const W=c.width,H=c.height,x=c.getContext('2d'),img=x.getImageData(0,0,W,H),d=img.data;
  const L=o.light||{x:W/2,y:H*0.4,r:Math.max(W,H)*0.6}, col=hex(o.lightCol||'#FFC27A'), tr=o.trans, cs=o.cloudScale||1.6;
  for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++){const i=(y*W+xx)*4;if(d[i+3]===0)continue;
    const dx=xx-L.x,dy=y-L.y,fall=0.22+0.78*Math.exp(-(dx*dx+dy*dy)/(L.r*L.r));
    const g=cloudData[(((y/cs)|0)%512*512+((xx/cs)|0)%512)*4]/255;
    const k=tr*fall*(0.35+1.3*g);
    for(let ch=0;ch<3;ch++){const a=d[i+ch]/255;d[i+ch]=Math.min(255,255*(a+a*col[ch]*k));}}
  x.putImageData(img,0,0);
}
// top rim of light, bottom band of shade (paper.js finish)
function band(c, dy, col, blur){
  const W=c.width,H=c.height,x=c.getContext('2d'),t=cv(W,H),y=t.getContext('2d');
  y.drawImage(c,0,0);y.globalCompositeOperation='destination-out';y.drawImage(c,0,dy);
  y.globalCompositeOperation='source-in';y.fillStyle=col;y.fillRect(0,0,W,H);
  x.save();x.globalCompositeOperation='source-atop';if(blur)x.filter='blur('+blur+'px)';x.drawImage(t,0,0);x.restore();
}
function finish(c, o){
  const x=c.getContext('2d'),W=c.width,H=c.height;
  if(o.trans>0) backlight(c,o);
  const g=o.grain??0.6; if(g>0){x.save();x.globalCompositeOperation='source-atop';x.globalAlpha=g;x.fillStyle=x.createPattern(GRAIN,'repeat');x.fillRect(0,0,W,H);x.restore();}
  if((o.rim??0.35)>0) band(c,o.rimPx??3,o.rimCol?(o.rimCol+Math.round((o.rim??0.35)*255).toString(16).padStart(2,'0')):'rgba(255,236,200,'+(o.rim??0.35)+')',0.6);
  if((o.under??0.28)>0) band(c,-(o.underPx??3),'rgba(0,0,0,'+(o.under??0.28)+')',0.8);
}
async function render(spec){
  const out=cv(spec.w,spec.h),ox=out.getContext('2d');
  for(const p of spec.plies){
    const img=await load(p.svg);const c=cv(spec.w,spec.h);c.getContext('2d').drawImage(img,0,0);
    finish(c,p);
    const sh=p.shadow===undefined?{dx:5,dy:9,blur:9,a:0.42}:p.shadow;
    if(sh){const s=cv(spec.w,spec.h),sx=s.getContext('2d');sx.drawImage(c,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle='#000';sx.fillRect(0,0,spec.w,spec.h);
      ox.save();ox.globalAlpha=sh.a;ox.filter='blur('+(sh.blur+(p.blur||0))+'px)';ox.drawImage(s,sh.dx,sh.dy);ox.restore();}
    ox.save();if(p.blur)ox.filter='blur('+p.blur+'px)';ox.drawImage(c,0,0);ox.restore();
  }
  if(spec.glow){const img=await load(spec.glow.svg);
    for(const [blur,a] of spec.glow.passes||[[18,0.55],[50,0.35]]){ox.save();ox.globalCompositeOperation='lighter';ox.globalAlpha=a;ox.filter='blur('+blur+'px)';ox.drawImage(img,0,0);ox.restore();}}
  return out.toDataURL('image/png');
}
</script></body></html>`;

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(PAGE);
  let n = 0;
  for (const [name, fn] of Object.entries(sprites)) {
    if (only.length && !only.some((o) => name.startsWith(o))) continue;
    const s = fn();
    const spec = {
      w: s.w, h: s.h,
      plies: s.plies.map((p, i) => Object.assign({}, p, { svg: wrap(s.w, s.h, p.body, p.wobble ?? 1.6, 11 + i * 7), body: undefined })),
      glow: s.glow ? { svg: wrap(s.w, s.h, s.glow.body, s.glow.wobble ?? 0, 3), passes: s.glow.passes } : null,
    };
    fs.writeFileSync(path.join(SRC, name + ".svg"), spec.plies.map((p) => p.svg).join("\n"));
    const url = await page.evaluate((sp) => render(sp), spec);
    fs.writeFileSync(path.join(OUT, name + ".png"), Buffer.from(url.split(",")[1], "base64"));
    console.log("rendered", name, s.w + "x" + s.h, s.plies.length + " plies");
    n++;
  }
  await browser.close();
  if (!n) console.log("nothing matched", only.join(" "));
})();
