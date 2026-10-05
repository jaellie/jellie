let DENS = null;

// Shared painting helpers. Call init(width, height) before painting.
let W = 1920, H = 1080, g = null;
function init(w, h){ W = w; H = h; const cv = document.getElementById('c'); cv.width = W; cv.height = H; g = cv.getContext('2d'); DENS = null; }

// ---------- deterministic randomness + noise ----------
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = rng(7);
const rnd = (a=0,b=1) => a + (b-a)*R();
const perm = new Uint8Array(512); for (let i=0;i<256;i++) perm[i]=i; for (let i=255;i>0;i--){const j=Math.floor(rnd(0,i+1)); [perm[i],perm[j]]=[perm[j],perm[i]];} for(let i=0;i<256;i++) perm[i+256]=perm[i];
function vnoise(x,y){ const xi=Math.floor(x)&255, yi=Math.floor(y)&255, xf=x-Math.floor(x), yf=y-Math.floor(y);
  const h=(i,j)=>perm[perm[xi+i]+yi+j]/255; const s=t=>t*t*(3-2*t);
  const a=h(0,0),b=h(1,0),c=h(0,1),d=h(1,1); const u=s(xf),v=s(yf); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function fbm(x,y,o=4){ let s=0,a=.5,f=1; for(let i=0;i<o;i++){ s+=a*vnoise(x*f,y*f); a*=.5; f*=2; } return s; }

const X = v => v*W, Y = v => v*H;
const SEPIA = '#4a3627';

// ---------- paper ----------
function paper(){
  const img = g.createImageData(W,H); const d = img.data;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const m = fbm(x/420,y/420,3)*0.06 + fbm(x/60,y/60,2)*0.03 + (rnd()-.5)*0.035;
    const i=(y*W+x)*4; d[i]=(240+m*255-10)|0; d[i+1]=(231+m*255-10)|0; d[i+2]=(212+m*255-10)|0; d[i+3]=255; }
  g.putImageData(img,0,0);
}

// ---------- watercolor wash: rough polygon, misregistered, dried edge, granulation ----------
function roughPath(ctx, pts, rough, close=true){
  ctx.beginPath();
  const n = pts.length;
  for (let i=0;i<n;i++){
    const [x0,y0]=pts[i], [x1,y1]=pts[(i+1)%n];
    if (!close && i===n-1) break;
    const len = Math.hypot(x1-x0,y1-y0), steps = Math.max(2, Math.ceil(len/14));
    for (let s=0;s<steps;s++){
      const t=s/steps, x=x0+(x1-x0)*t, y=y0+(y1-y0)*t;
      const nx = (fbm(x/90,y/90,3)-.5)*rough*2, ny=(fbm(y/90+9,x/90,3)-.5)*rough*2;
      (i===0&&s===0)?ctx.moveTo(x+nx,y+ny):ctx.lineTo(x+nx,y+ny);
    }
  }
  if (close) ctx.closePath();
}
function density(){
  if (DENS) return DENS;
  DENS=document.createElement('canvas'); DENS.width=W*1.5; DENS.height=H*1.5; const c=DENS.getContext('2d');
  const img=c.createImageData(DENS.width,DENS.height), d=img.data;
  for (let y=0;y<DENS.height;y++) for (let x=0;x<DENS.width;x++){ const v=fbm(x/260+3,y/260+7,4); const i=(y*DENS.width+x)*4; d[i]=d[i+1]=d[i+2]=0; d[i+3]=Math.max(0,Math.min(255,(0.45+0.75*v)*255)); }
  c.putImageData(img,0,0); return DENS;
}
function wash(pts, color, {alpha=.55, rough=10, layers=2, edge=.35, gran=.36, off=3, blur=1.2}={}){
  const o = document.createElement('canvas'); o.width=W; o.height=H; const c=o.getContext('2d');
  const P = pts.map(([x,y])=>[X(x)+rnd(-off,off), Y(y)+rnd(-off,off)]);
  c.filter = `blur(${blur}px)`;
  for (let l=0;l<layers;l++){
    const shifted = P.map(([x,y])=>[x+rnd(-rough*.4,rough*.4), y+rnd(-rough*.4,rough*.4)]);
    c.globalAlpha = alpha/layers*1.3; c.fillStyle=color; roughPath(c, shifted, rough); c.fill();
  }
  // dried edge: pigment pools at the rim
  c.globalAlpha = edge*alpha; c.strokeStyle=color; c.lineWidth=3; roughPath(c,P,rough); c.stroke();
  c.filter='none';
  // uneven pigment: some areas pool, some thin out
  c.globalCompositeOperation='destination-in'; c.globalAlpha=1;
  c.drawImage(density(), -rnd(0,W*.5), -rnd(0,H*.5));
  // granulation
  c.globalCompositeOperation='destination-out';
  for (let i=0;i<3500*(gran/0.36)*(1);i++){ const x=rnd(0,W), y=rnd(0,H); if (fbm(x/30,y/30,2)>.55){ c.globalAlpha=rnd(.05,.25); c.fillRect(x,y,rnd(1,3),rnd(1,3)); } }
  g.save(); g.globalCompositeOperation='multiply'; g.drawImage(o,0,0); g.restore();
}
function washRect(x,y,w,h,color,opt){ wash([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],color,opt); }

// ---------- ink: wobbly fineliner with overshoot and gaps ----------
function ink(pts, {w=2.4, color=SEPIA, overshoot=6, gap=true, close=false}={}){
  let P = pts.map(([x,y])=>[X(x),Y(y)]);
  if (close) P = P.concat([P[0]]);
  for (let i=0;i<P.length-1;i++){
    let [x0,y0]=P[i],[x1,y1]=P[i+1];
    const dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L;
    const os = overshoot*rnd(.4,1.2);
    x0-=ux*os*rnd(0,1); y0-=uy*os*rnd(0,1); x1+=ux*os; y1+=uy*os;
    const L2=Math.hypot(x1-x0,y1-y0), steps=Math.max(2,Math.ceil(L2/6));
    const gapAt = gap && L2>140 && R()<.45 ? rnd(.3,.7) : -1;
    g.strokeStyle=color; g.lineCap='round'; g.lineJoin='round';
    g.beginPath(); let pen=false;
    for (let s=0;s<=steps;s++){
      const t=s/steps; if (gapAt>0 && Math.abs(t-gapAt)<6/L2*2){ pen=false; continue; }
      const x=x0+(x1-x0)*t+(fbm(t*6+i,3.1)-.5)*2.2, y=y0+(y1-y0)*t+(fbm(5.2,t*6+i)-.5)*2.2;
      g.lineWidth = w*(0.85+0.3*fbm(t*4,i));
      if(!pen){ g.moveTo(x,y); pen=true; } else g.lineTo(x,y);
    }
    g.globalAlpha=.92; g.stroke(); g.globalAlpha=1;
  }
}
function reserve(pts, color='#f0e7d3'){ g.save(); g.fillStyle=color; roughPath(g, pts.map(([x,y])=>[X(x),Y(y)]), 3); g.fill(); g.restore(); }
const inkRect=(x,y,w,h,o)=>ink([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],{...o,close:true});

// ---------- paper-lantern light ----------
function glow(x,y,r,color,a=.55, op='screen'){
  const gr=g.createRadialGradient(X(x),Y(y),0,X(x),Y(y),r);
  gr.addColorStop(0,color); gr.addColorStop(1,'rgba(0,0,0,0)');
  g.save(); g.globalCompositeOperation=op; g.globalAlpha=a; g.fillStyle=gr; g.fillRect(0,0,W,H); g.restore();
}
