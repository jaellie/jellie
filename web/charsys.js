/* Love Sim — modular pixel character system. One base body, parts combined, aging + body drift. */
(function(root){
'use strict';
const W=16,H=24,OUT='#2b2233';
const hx=c=>{c=c.replace('#','');return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16))};
const th=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const dk=(c,a)=>th(hx(c).map(v=>v*(1-a)));
const lt=(c,a)=>th(hx(c).map(v=>v+(255-v)*a));
const clamp=(v,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,v));
function hash(s,x,y){const n=Math.sin(s*12.9898+x*78.233+y*37.719)*43758.5453;return n-Math.floor(n)}
const SKINS=[{id:'light',ko:'밝은',en:'Light',c:'#f6dcc6'},{id:'lightmed',ko:'중간 밝은',en:'Light-medium',c:'#e6bd9a'},{id:'medium',ko:'중간',en:'Medium',c:'#c48e68'},{id:'deep',ko:'깊은',en:'Deep',c:'#8a5a40'}];
const HAIRC=[{id:'black',ko:'검정',en:'Black',c:'#2a2522'},{id:'dkbrown',ko:'진갈색',en:'Dark brown',c:'#4a3020'},{id:'ltbrown',ko:'밝은 갈색',en:'Light brown',c:'#8f6440'},{id:'blonde',ko:'금발',en:'Blonde',c:'#e6c36e'},{id:'red',ko:'빨간 머리',en:'Red',c:'#b83a2e'},{id:'orange',ko:'주황 머리',en:'Orange',c:'#e07c30'},{id:'green',ko:'초록 머리',en:'Green',c:'#4f9a5c'},{id:'blue',ko:'파란 머리',en:'Blue',c:'#4470c4'}];
const GRAYC=[214,212,208];
const FACES=[['neutral','무표정','Neutral'],['friendly','다정','Friendly'],['serious','진지','Serious'],['energetic','활발','Energetic'],['shy','수줍','Shy'],['calm','차분','Calm']];
const BODIES=[['slim','슬림','Slim'],['average','보통','Average'],['plump','통통','Plump']];
const HAIR_F=[['bobB','뱅 단발','Bob + bangs'],['bob','단발','Bob'],['medB','뱅 중단발','Medium + bangs'],['med','중단발','Medium'],['longB','뱅 긴 머리','Long + bangs'],['long','긴 머리','Long'],['wavy','웨이브','Wavy'],['vlong','아주 긴 머리','Very long']];
const HAIR_M=[['shortB','뱅 숏컷','Short + bangs'],['short','숏컷','Short'],['side','가르마','Side part'],['softside','소프트 가르마','Soft part'],['messy','부스스','Messy'],['textured','텍스처','Textured'],['medM','미디엄','Medium'],['casual','캐주얼 장발','Longer casual'],['bald','버즈컷','Buzz cut']];
const HS={bobB:{b:'full',len:10,w:1},bob:{b:'none',len:10,w:1},medB:{b:'full',len:14,w:2},med:{b:'none',len:14,w:2},longB:{b:'full',len:17,w:2},long:{b:'none',len:17,w:2},wavy:{b:'part',len:17,w:2,wave:1},vlong:{b:'full',len:20,w:2},
 shortB:{b:'full',len:6,w:1},short:{b:'none',len:5,w:1},side:{b:'side',len:6,w:1},softside:{b:'soft',len:7,w:1},messy:{b:'messy',len:7,w:1,spiky:1},textured:{b:'short',len:6,w:1,tex:1},medM:{b:'full',len:9,w:1},casual:{b:'part',len:11,w:1,flip:1},bald:{bald:1,buzz:1}};
const OUT_F=[['casual','캐주얼','Casual',{top:'tee',bot:'skirt',shoe:'sneaker'}],['soft','소프트','Soft casual',{top:'cardigan',bot:'skirt',shoe:'flat'}],['modern','모던','Modern casual',{top:'tee',bot:'jeans',shoe:'sneaker'}],['formal','포멀','Slightly formal',{top:'blouse',bot:'trousers',shoe:'flat'}]];
const OUT_M=[['casual','캐주얼','Casual',{top:'tee',bot:'jeans',shoe:'sneaker'}],['soft','소프트','Soft casual',{top:'sweater',bot:'trousers',shoe:'sneaker'}],['modern','모던','Modern casual',{top:'shirtOpen',bot:'trousers',shoe:'shoe'}],['formal','포멀','Slightly formal',{top:'collar',bot:'trousers',shoe:'shoe'}]];
const PALS=[['cherry','체리+크림','Cherry + cream',['#e8606a','#fff0c9','#3f4f8a']],['sky','하늘+레몬','Sky + lemon',['#6fb3e8','#ffd35c','#44507e']],['mint','민트+코랄','Mint + coral',['#79d0ad','#ff8c7a','#56657a']],['lemon','레몬+포도','Lemon + grape',['#ffd84d','#8a6ad0','#6a4a9a']],['lilac','라일락+핑크','Lilac + pink',['#b89ae6','#ff9fc0','#4a3d6a']],['tangerine','귤+데님','Tangerine + denim',['#ff9a4d','#fff0c9','#4f78b8']]];
const ACCS=[[null,'없음','None'],['glasses','안경','Glasses'],['earrings','귀걸이','Earrings'],['clip','헤어핀','Hair clip'],['cap','모자','Cap'],['scarf','목도리','Scarf']];
const CAPC=['#6fb3e8','#d9473f','#4f6fa8'];const SHOE={sneaker:'#f7f4ec',flat:'#d9546a',shoe:'#5a3a2a'};
const HEAD=[null,[5,10],[4,11],[3,12],[3,12],[3,12],[3,12],[3,12],[3,12],[4,11],[5,10]];
const HEADS=[null,[6,10],[5,11],[4,12],[4,12],[4,12],[4,12],[4,12],[4,12],[5,11],[6,10]];

function bodyAt(sp,age){const d=sp.drift||[0,0,0],b=sp.body==null?1:sp.body;const P=[[25,b],[35,b+d[0]],[45,b+d[0]+d[1]],[62,b+d[0]+d[1]+d[2]]];if(age<=25)return clamp(b,0,2);for(let i=0;i<3;i++){const[a0,v0]=P[i],[a1,v1]=P[i+1];if(age<=a1)return clamp(v0+(v1-v0)*(age-a0)/(a1-a0),0,2)}return clamp(P[3][1],0,2)}
const grayAmt=(sp,age)=>age<45?0:age<50?(age-45)/5*.15:age<60?.15+(age-50)/10*.15:age<75?.3+(age-60)/15*.15:.45;
const WV=[0,1,1,0,-1,-1];

function paint(sp,age,view){
 const G=[];for(let y=0;y<H;y++)G.push(new Array(W).fill(null));
 const set=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)G[y][x]=c};const get=(x,y)=>(x>=0&&x<W&&y>=0&&y<H)?G[y][x]:null;
 const rect=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)set(x,y,c)};
 const skin=SKINS[sp.skin||0].c,skD=dk(skin,.12),hc0=HAIRC[sp.hc||0].c,ga=grayAmt(sp,age),seed=sp.seed||1;
 const hcol=(x,y)=>{if(ga<=0)return hc0;const t=ga*(.55+.9*hash(seed,x,y)),a=hx(hc0);return th(a.map((v,i)=>v+(GRAYC[i]-v)*t))};
 const hair=(x,y)=>set(x,y,hcol(x,y));const hrect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)hair(x,y)};
 const b=bodyAt(sp,age),hw=3+b,L=Math.floor(8-hw),R=Math.floor(7+hw),aw=b>=1.5?2:1;
 let OS=((sp.g==='M'?OUT_M:OUT_F)[sp.outfit||0]||OUT_F[0])[3],P=(PALS[sp.pal||0]||PALS[0])[3];
 // Big days dress everyone for the occasion: a white gown or a black suit at the wedding, black at a funeral.
 if(sp.dress==='wedding'){if(sp.g==='M'){OS={top:'collar',bot:'trousers',shoe:'shoe'};P=['#2e2c3e','#f7f3ea','#2e2c3e']}else{OS={top:'blouse',bot:'gown',shoe:'flat'};P=['#fbf8f2','#ffd6e2','#fbf8f2']}}
 else if(sp.dress==='funeral'){OS=sp.g==='M'?{top:'collar',bot:'trousers',shoe:'shoe'}:{top:'blouse',bot:'skirt',shoe:'flat'};P=['#26232c','#f7f3ea','#26232c']}
 const top=P[0],acc=P[1],bot=OS.bot==='jeans'?'#4f78b8':P[2],shoeC=sp.dress==='wedding'&&sp.g!=='M'?'#f7f3ea':sp.dress?'#1c1a20':SHOE[OS.shoe];
 const hs=HS[sp.hair]||HS.short,fid=sp.face||0,E=OUT,mouthC=dk(skin,.38),BL='#e8a09a';
 const tall=[0,1,3].includes(fid)&&age<45,blink=[];
 const side=view==='right'||view==='left',back=view==='back',s=view==='34'?1:0;
 const lineC=dk(skin,.16);const lineIf=(x,y)=>{if(get(x,y)===skin)set(x,y,lineC)};
 if(!side){
  // back hair
  if(!hs.bald){if(hs.len>=9)hrect(3,10,12,Math.min(hs.len,13));if(hs.wave){hrect(1,3,2,4);hrect(13,3,14,4);for(let y=5;y<hs.len;y++){const o=WV[(y-5)%6];for(let k=0;k<3;k++){const xl=1+o+k,xr=14-o-k,cl=k===0?lt(hcol(xl,y),.18):k===2?dk(hcol(xl,y),.22):hcol(xl,y);set(xl,y,cl);set(xr,y,k===0?lt(hcol(xr,y),.18):k===2?dk(hcol(xr,y),.22):hcol(xr,y))}}const yl=hs.len;[[1,yl],[2,yl],[3,yl],[4,yl-1],[4,yl],[2,yl+1],[3,yl+1]].forEach(([x,y])=>{hair(x,y);hair(15-x,y)});set(3,yl,dk(hcol(3,yl),.22));set(12,yl,dk(hcol(12,yl),.22))}else if(hs.w===2){hrect(1,3,2,hs.len);hrect(13,3,14,hs.len)}else{hrect(2,4,2,hs.len);hrect(13,4,13,hs.len)}if(hs.flip){hair(1,hs.len);hair(14,hs.len)}}
  // body
  if(OS.bot==='gown'){rect(L,18,R,18,bot);rect(L-1,19,R+1,21,bot);rect(L-2,22,R+2,23,bot);rect(L-2,23,R+2,23,dk(bot,.1));rect(R+1,19,R+1,21,dk(bot,.06))}
  else if(OS.bot==='skirt'){rect(L,18,R,18,bot);rect(L-1,19,R+1,20,bot);const la=b>=1.5?4:5,ra=b>=1.5?11:10;rect(la,21,6,22,skin);rect(9,21,ra,22,skin);rect(la,23,6,23,shoeC);rect(9,23,ra,23,shoeC)}
  else{rect(L,18,R,18,bot);rect(L,19,6,22,bot);rect(9,19,R,22,bot);rect(R,19,R,22,dk(bot,.12));rect(L,23,6,23,shoeC);rect(9,23,R,23,shoeC)}
  rect(L,12,R,17,top);rect(R,13,R,17,dk(top,.1));
  const sl=OS.top==='tee'?13:OS.top==='blouse'?15:16;[[L-aw,L-1],[R+1,R+aw]].forEach(([a0,a1])=>{rect(a0,12,a1,sl,top);if(sl<16)rect(a0,sl+1,a1,16,skin);rect(a0,17,a1,17,skin)});
  if(!back){const T=OS.top;if(T==='tee'){set(7,12,skin);set(8,12,skin);if((sp.outfit||0)===0){rect(L,14,R,14,acc);rect(L,16,R,16,acc)}else set(Math.round((L+R)/2)+1,14,acc)}else if(T==='sweater'){rect(6,12,9,12,dk(top,.18));rect(L,17,R,17,dk(top,.15))}else if(T==='cardigan'){rect(7,12,8,17,acc);set(6,14,dk(top,.3));set(6,16,dk(top,.3))}else if(T==='blouse'){set(7,12,skin);set(8,12,skin);set(6,12,'#f7f3ea');set(9,12,'#f7f3ea')}else if(T==='shirtOpen'){rect(7,12,8,17,acc);set(6,12,dk(top,.2));set(9,12,dk(top,.2))}else if(T==='collar'){set(6,12,'#f7f3ea');set(9,12,'#f7f3ea');set(7,12,skin);set(8,12,skin);rect(7,13,7,16,dk(top,.15))}}
  // head
  HEAD.forEach((r,y)=>{if(r)rect(r[0],y,r[1],y,skin)});if(b>=1.5){set(3,9,skin);set(12,9,skin)}rect(7,11,8,11,skD);
  if(s){set(13,6,skin);set(13,7,skin)}
  if(!back){
   const ex=[5+s,10+s];
   if([0,1,3].includes(fid))ex.forEach(x=>{set(x,7,E);if(tall){set(x,6,E);blink.push([x,6])}else blink.push([x,7])});
   else if(fid===2)ex.forEach(x=>{set(x,7,E);blink.push([x,7]);rect(x-1,5,x+1,5,dk(hc0,.1))});
   else if(fid===4){rect(4+s,7,5+s,7,E);rect(10+s,7,11+s,7,E);rect(4+s,8,5+s,8,BL);rect(10+s,8,11+s,8,BL)}
   else {rect(5+s,7,6+s,7,E);rect(9+s,7,10+s,7,E)}
   set(8+s,8,dk(skin,.13));if(fid===0)rect(7+s,9,8+s,9,mouthC);else if(fid===1){rect(7+s,9,8+s,9,'#c46d6d');set(4+s,8,BL);set(11+s,8,BL)}else if(fid===2)rect(6+s,9,9+s,9,mouthC);else if(fid===3){rect(7+s,9,8+s,9,'#b55a5e');set(7+s,10,'#d98a8a');set(8+s,10,'#d98a8a')}else if(fid===4)set(7+s,9,mouthC);else rect(7+s,9,8+s,9,lt(mouthC,.25));
   if(age>=50){lineIf(3+s,6);lineIf(12+s,6)}if(age>=62){for(let x=6;x<=9;x++)lineIf(x,4);lineIf(5+s,9);lineIf(10+s,9)}
  }
  // front hair
  if(hs.bald){const bz=(x,y)=>set(x,y,(x+y)%2?hcol(x,y):lt(hcol(x,y),.1));const br=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)bz(x,y)};br(5,1,10,1);br(4,2,11,2);br(3,3,12,3);if(back){br(3,4,12,8);br(4,9,11,9)}else{br(3,4,4,4);br(11,4,12,4);bz(3,5);bz(12,5)}}
  else{hrect(5,0,10,0);hrect(3,1,12,1);hrect(2,2,13,3);if(hs.spiky){set(7,0,null);hair(4,0);hair(11,0)}
   if(back)hrect(3,4,12,hs.len>=9?10:8);
   else{switch(hs.b){case'full':hrect(3,4,12,4);[3,4,6,9,11,12].forEach(x=>hair(x,5));break;case'none':hair(3,4);hair(4,4);hrect(7,4,12,4);hair(3,5);hair(11,5);hair(12,5);hair(3,6);hair(12,6);break;case'side':hrect(3,4,9,4);hair(3,5);hair(4,5);hair(12,4);break;case'soft':hrect(3,4,6,4);hair(3,5);hair(11,4);hair(12,4);break;case'messy':[3,4,6,7,9,11,12].forEach(x=>hair(x,4));[3,8,12].forEach(x=>hair(x,5));break;case'short':hrect(4,4,11,4);hair(3,4);hair(12,4);break;case'part':hrect(3,4,6,4);hrect(9,4,12,4);hair(3,5);hair(12,5);break}if(s)for(let y=4;y<=7;y++)hair(3,y)}
   [[5,1],[6,1],[4,2]].forEach(([x,y])=>{const c=get(x,y);if(c)set(x,y,lt(c,.28))});if(hs.tex)[[5,2],[8,2],[11,2],[7,3],[10,3]].forEach(([x,y])=>{const c=get(x,y);if(c)set(x,y,dk(c,.22))})}
  // accessories
  const a=sp.acc;if(a==='cap'){const cc=CAPC[(sp.capc!=null?sp.capc:(sp.pal||0))%3];rect(6,0,9,0,cc);rect(4,1,11,1,cc);rect(3,2,12,3,cc);set(7,0,dk(cc,.35));set(8,0,dk(cc,.35));set(5,1,lt(cc,.3));set(4,2,lt(cc,.2));if(back){rect(7,1,8,3,dk(cc,.15));rect(6,3,9,3,dk(cc,.3));set(7,4,'#e8e0d0');set(8,4,'#e8e0d0')}else{set(7,1,dk(cc,.15));set(7,2,dk(cc,.15));set(7,3,dk(cc,.15));rect(3+s,4,12+s,4,dk(cc,.25));rect(4+s,5,11+s,5,dk(cc,.45));set(3+s,4,dk(cc,.4));set(12+s,4,dk(cc,.4))}}if(a==='scarf')rect(L,11,R,12,'#c96a5a');
  if(!back){const ex=[5+s,10+s],F='#3a3040';if(a==='glasses'){ex.forEach(x=>{rect(x-1,6,x+1,6,F);set(x-1,7,F);set(x+1,7,F)});rect(ex[0]+2,6,ex[1]-2,6,F)}if(a==='earrings'){[2+s,13+s].forEach(x=>{set(x,8,'#d9a02a');set(x,9,'#fff3a0');set(x,10,'#e8b840')})}if(a==='clip'){set(11,4,'#e38f9a');set(12,4,'#e38f9a')}}
 } else {
  // side view (right-facing)
  if(!hs.bald){hrect(3,4,6,hs.len>=9?Math.min(hs.len,11):Math.max(7,hs.len));if(hs.len>11){if(hs.wave){for(let y=12;y<hs.len;y++){const o=WV[(y-5)%6];hrect(3+o,y,5+o,y);set(5+o,y,dk(hcol(5+o,y),.22))}hrect(3,hs.len,6,hs.len);hrect(4,hs.len+1,5,hs.len+1)}else hrect(3,12,5,hs.len)}}
  const tw=4+Math.round(b),a0=8-Math.floor(tw/2),z=a0+tw-1;
  if((OS.bot==='skirt'||OS.bot==='gown')){rect(a0,18,z,18,bot);rect(a0-1,19,z+1,20,bot);rect(a0+1,21,z-1,22,skin)}else{rect(a0,18,z,18,bot);rect(a0+1,19,z-1,22,bot)}rect(a0+1,23,z+1,23,shoeC);
  rect(a0,12,z,17,top);rect(a0,13,a0,17,dk(top,.1));if(OS.top==='cardigan'||OS.top==='shirtOpen')rect(z,12,z,17,acc);if(OS.top==='collar'||OS.top==='blouse')set(z,12,'#f7f3ea');
  const ax=a0+Math.floor(tw/2)-1,sl=OS.top==='tee'?13:OS.top==='blouse'?15:16;rect(ax,12,ax+aw-1,sl,dk(top,.14));if(sl<16)rect(ax,sl+1,ax+aw-1,16,skin);rect(ax,17,ax+aw-1,17,skin);
  HEADS.forEach((r,y)=>{if(r)rect(r[0],y,r[1],y,skin)});if(b>=1.5)set(12,9,skin);set(13,7,skin);rect(7,11,8,11,skD);
  set(10,7,E);if(tall){set(10,6,E);blink.push([10,6])}else blink.push([10,7]);
  if(fid===1){set(11,9,'#c46d6d');set(9,8,BL)}else if(fid===3){set(11,9,'#b55a5e')}else set(11,9,mouthC);if(fid===4)set(9,8,BL);if(fid===2)rect(9,5,11,5,dk(hc0,.1));
  if(age>=50)lineIf(8,6);
  if(hs.bald){hrect(6,1,10,1);hrect(5,2,11,2);hrect(4,3,12,3);hrect(4,4,6,7)}else{hrect(6,0,10,0);hrect(4,1,11,1);hrect(3,2,12,3);hrect(3,4,6,8);hair(7,4);hair(7,5);if(['full','short','messy','side'].includes(hs.b))hrect(8,4,12,4);else hair(12,4);if(hs.spiky){hair(5,0);hair(12,1)}[[6,1],[7,1]].forEach(([x,y])=>{const c=get(x,y);if(c)set(x,y,lt(c,.28))})}
  set(7,7,skD);
  const ac=sp.acc;if(ac==='glasses')rect(9,6,11,6,'#3a3040');if(ac==='cap'){const cc=CAPC[(sp.capc!=null?sp.capc:(sp.pal||0))%3];rect(6,0,9,0,cc);rect(4,1,11,1,cc);rect(3,2,12,3,cc);set(7,0,dk(cc,.35));set(5,1,lt(cc,.3));rect(12,3,15,3,dk(cc,.25));rect(13,4,15,4,dk(cc,.45))}if(ac==='scarf')rect(a0,11,z,12,'#c96a5a');if(ac==='earrings'){set(7,8,'#d9a02a');set(7,9,'#fff3a0');set(7,10,'#e8b840')}if(ac==='clip')set(9,4,'#e38f9a');
 }
 let out=G;if(view==='left'){out=G.map(r=>r.slice().reverse());blink.forEach(pt=>pt[0]=W-1-pt[0])}
 return {G:out,blink,skin};
}
function render(sp,o){o=o||{};const age=o.age||25,view=o.view||'front',p=o.p||3;const {G,blink,skin}=paint(sp,age,view);
 const at=(x,y)=>(y>=0&&y<H&&x>=0&&x<W)?G[y][x]:null;const Wd=W+2,Hd=H+2;const rows=[];
 for(let y=-1;y<=H;y++){const row=[];for(let x=-1;x<=W;x++){let c=at(x,y);if(!c){if(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1))c=OUT}else if(o.mono)c=o.mono;row.push(c)}rows.push(row)}
 let rects='';rows.forEach((row,y)=>{let x=0;while(x<row.length){const c=row[x];if(!c){x++;continue}let e=x;while(e+1<row.length&&row[e+1]===c)e++;rects+='<rect x="'+x+'" y="'+y+'" width="'+(e-x+1)+'" height="1" fill="'+c+'"/>';x=e+1}});
 let bl='';if(o.blink&&!o.mono&&blink.length&&view!=='back'){const d=((sp.seed||1)%37)/10;bl='<g style="opacity:0;animation:csblink 4.6s infinite;animation-delay:-'+d+'s">'+blink.map(([x,y])=>'<rect x="'+(x+1)+'" y="'+(y+1)+'" width="1" height="1" fill="'+skin+'"/>').join('')+'</g>'}
 return '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:0;top:0;display:block" width="'+Wd*p+'" height="'+Hd*p+'" viewBox="0 0 '+Wd+' '+Hd+'" shape-rendering="crispEdges">'+rects+bl+'</svg>'}
const size=p=>({w:(W+2)*p,h:(H+2)*p});
function random(g,rnd){rnd=rnd||Math.random;const pk=a=>a[Math.floor(rnd()*a.length)];const r=rnd();const pool=g==='M'?HAIR_M:HAIR_F;
 const hair=g==='M'?(rnd()<.07?'bald':pk(HAIR_M.slice(0,8))[0]):pk(pool)[0];const dr=()=>pk([-.5,0,0,0,.5,.5]);
 return {v:2,g,body:r<.3?0:r<.75?1:2,skin:pk([0,1,1,2,2,3]),face:Math.floor(rnd()*6),hair,hc:rnd()<.12?pk([3,4,5,6,7]):pk([0,0,0,1,1,2]),outfit:Math.floor(rnd()*4),pal:Math.floor(rnd()*PALS.length),acc:rnd()<.15?pk(['glasses','glasses','earrings','clip','cap','scarf']):null,gray:34+Math.floor(rnd()*18),drift:[dr(),dr(),dr()],seed:1+Math.floor(rnd()*9999)}}
function seeded(n){let a=n>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
root.CS={W,H,render,size,random,seeded,bodyAt,grayAmt,SKINS,HAIRC,FACES,BODIES,HAIR_F,HAIR_M,OUT_F,OUT_M,PALS,ACCS,dk,lt};
})(typeof window!=='undefined'?window:globalThis);
