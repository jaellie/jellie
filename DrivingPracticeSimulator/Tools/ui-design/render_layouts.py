"""Static layout illustrations using shipped art, palette and strings, NOT Unity screenshots.
Requires Pillow for development only. Runtime font metrics/layout may differ.
"""
from pathlib import Path
import json, re
from PIL import Image, ImageDraw, ImageFont

project=Path(__file__).resolve().parents[2]
resources=project/'Assets/DrivingSim/Resources'
out=Path(__file__).resolve().parent/'previews';out.mkdir(exist_ok=True)
entries={e['key']:e for e in json.loads((resources/'Localization/strings.json').read_text())['entries']}
font_file=resources/'UI/Fonts/JellieUI-Regular.otf'
C={'bg':'#07111d','panel':'#101e2c','text':'#edf4f8','muted':'#a2b2bf','ice':'#b9ddf4','teal':'#64c5ba','blue':'#295b80','red':'#f2837c','amber':'#f6cc82'}
def f(size):return ImageFont.truetype(str(font_file),size)
def tx(d,r,key,size=28,color='text',center=False,lang='ko',raw=False):
    s=key if raw else entries[key][lang];x,y,w,h=r
    lines=[]
    for paragraph in s.split('\n'):
        line=''
        for ch in paragraph:
            if d.textlength(line+ch,font=f(size))>w and line:
                lines.append(line);line=ch
            else:line+=ch
        lines.append(line)
    step=int(size*1.3);y+=max(0,(h-len(lines)*step)/2) if center else 0
    for line in lines:
        if y+step>r[1]+h+4:break
        tw=d.textlength(line,font=f(size));d.text((x+(w-tw)/2 if center else x,y),line,font=f(size),fill=C.get(color,color));y+=step

def panel(d,r,fill='panel',outline=None):
 x,y,w,h=r;d.rounded_rectangle((x,y,x+w,y+h),16,fill=C.get(fill,fill),outline=outline,width=1)
def button(d,r,key,size=28,primary=False,selected=False,disabled=False,lang='ko'):
 panel(d,r,'ice' if primary else 'blue' if selected else 'panel')
 tx(d,(r[0]+14,r[1]+8,r[2]-28,r[3]-16),key,size,'muted' if disabled else 'bg' if primary else 'text',True,lang)
def art(im,r,texture=None):
 p=texture or resources/'UI/EnvironmentDiagram.png'
 src=Image.open(p).convert('RGB');src.thumbnail((int(r[2]),int(r[3])))
 im.paste(src,(int(r[0]+(r[2]-src.width)/2),int(r[1]+(r[3]-src.height)/2)))
def icon(im,r,name):
 src=Image.open(resources/f'UI/Sprites/{name}.png').convert('RGBA');src.thumbnail((int(r[2]),int(r[3])))
 tint=Image.new('RGBA',src.size,C['text']);tint.putalpha(src.getchannel('A'));im.paste(tint,(int(r[0]),int(r[1])),tint)
def watermark(d,label):
 tx(d,(32,1053,1800,26),'STATIC LAYOUT ILLUSTRATION · NOT UNITY · '+label,14,'muted',raw=True)

def menu(kind,lang):
 im=Image.new('RGB',(1920,1080),C['bg']);d=ImageDraw.Draw(im)
 X,Y=32,40
 panel(d,(X,Y,1856,1000),"bg");d.line((64,41,1856,41),fill=C['teal'],width=3)
 def R(x,y,w,h):return X+x,Y+y,w,h
 tx(d,R(48,32,500,52),'menu.brand',28,'ice',lang=lang)
 button(d,R(1376,32,200,80),'pause.language',24,lang=lang);button(d,R(1592,32,216,80),'menu.settings',26,lang=lang)
 if kind=='home':
  panel(d,R(900,164,908,690),'panel','#243746')
  tx(d,R(64,240,760,180),'menu.tagline',56,lang=lang)
  tx(d,R(64,438,740,130),'menu.intro',30,'muted',lang=lang)
  button(d,R(64,622,680,100),'menu.chooseEnvironment',32,True,lang=lang)
  button(d,R(64,742,680,96),'menu.settings',30,lang=lang)
  art(im,R(924,188,860,490));d=ImageDraw.Draw(im)
  tx(d,R(932,704,820,45),'menu.environments',22,'ice',lang=lang)
  tx(d,R(932,764,820,60),'environments.skills.title',32,lang=lang)
 else:
  panel(d,R(48,250,1104,490),'panel','#243746')
  panel(d,R(1180,250,628,700),'panel','#243746')
  tx(d,R(48,140,1300,80),'environments.title',44,lang=lang);button(d,R(1576,140,232,80),'menu.back',26,lang=lang)
  art(im,R(64,266,1072,360));d=ImageDraw.Draw(im)
  tx(d,R(76,640,1048,72),'environments.skills.details',28,'muted',lang=lang)
  titles=['environments.skills.title','environments.city.title','environments.parking.title','environments.suburban.title']
  for i,key in enumerate(titles):
   button(d,R(48+i*278,764,266,112),key,26,selected=i==0,lang=lang)
   tx(d,R(64+i*278,892,234,44),'environments.planned',22,'muted',lang=lang)
  tx(d,R(1208,274,572,70),'environments.skills.title',34,lang=lang)
  tx(d,R(1208,358,572,100),'environments.skills.description',27,'muted',lang=lang)
  button(d,R(1208,480,278,80),'environments.freeDriving',26,selected=kind=='environments',lang=lang)
  button(d,R(1502,480,278,80),'environments.missions',26,selected=kind=='missions',lang=lang)
  if kind=='environments':tx(d,R(1208,592,572,180),'environments.freeDescription',28,'muted',lang=lang)
  else:
   for i,key in enumerate(['environments.mission.startStop','environments.mission.turns']):
    button(d,R(1208,584+i*128,572,76),key,26,selected=i==0,lang=lang)
    tx(d,R(1224,666+i*128,540,40),'environments.planned',22,'muted',lang=lang)
  button(d,R(1208,836,572,88),'environments.unavailable',28,disabled=True,lang=lang)
 watermark(d,kind.upper()+' · '+lang.upper());return im

def startup(kind,lang):
 im=Image.new('RGB',(1920,1080),C['bg']);d=ImageDraw.Draw(im)
 if kind=='language':
  panel(d,(360,210,1200,660));d.line((392,211,1528,211),fill=C['teal'],width=3)
  tx(d,(420,280,1080,130),entries['language.title']['ko']+'\n'+entries['language.title']['en'],38,center=True,raw=True)
  button(d,(450,460,490,156),'language.name.ko',42,selected=lang=='ko',lang=lang)
  button(d,(980,460,490,156),'language.name.en',42,selected=lang=='en',lang=lang)
 else:
  panel(d,(360,150,1200,780));d.line((392,151,1528,151),fill=C['teal'],width=3)
  tx(d,(420,218,1080,80),'disclaimer.title',44,center=True,lang=lang)
  tx(d,(420,350,1056,320),'disclaimer.body',34,lang=lang)
  button(d,(650,766,620,100),'disclaimer.accept',34,True,lang=lang)
 watermark(d,kind.upper()+' · '+lang.upper());return im

def hud(lang):
 im=Image.new('RGB',(1920,1080),'#738084');d=ImageDraw.Draw(im)
 d.polygon([(0,1080),(800,430),(1120,430),(1920,1080)],fill='#4e5659')
 for sign in [-1,1]:
  d.line((960+sign*160,430,960+sign*960,1080),fill='#c2c8c3',width=3)
  d.line((960+sign*12,430,960+sign*100,1080),fill='#d2c288',width=3)
 # Positions correspond to the reference layout; values are illustrative, not telemetry.
 panel(d,(24,24,96,96));icon(im,(53,53,38,38),'Pause');d=ImageDraw.Draw(im)
 panel(d,(136,24,350,96));tx(d,(158,40,306,60),entries['nav.parkingArea'][lang]+' · 80 m',28,center=True,raw=True)
 for x,name in [(825,'TurnLeft'),(985,'TurnRight')]:panel(d,(x,24,110,96));icon(im,(x+27,44,56,56),name)
 d=ImageDraw.Draw(im)
 button(d,(1382,24,170,84),'camera.toThirdPerson',24,lang=lang)
 for x,label,w in [(1564,'−',84),(1660,'65°',140),(1812,'+',84)]:panel(d,(x,24,w,84));tx(d,(x,24,w,84),label,28,center=True,raw=True)
 panel(d,(1696,128,200,200));tx(d,(1712,148,168,140),'MINI-MAP',18,'muted',True,raw=True)
 panel(d,(24,662,300,150));tx(d,(48,670,166,92),'24',78,raw=True);tx(d,(50,768,100,30),'km/h',26,'muted',raw=True);tx(d,(232,692,64,100),'D',72,'ice',raw=True)
 panel(d,(24,836,474,124))
 for y,key,color in [(852,'hud.brake','red'),(888,'hud.accelerator','teal')]:
  tx(d,(44,y,110,32),key,22,'muted',lang=lang);d.rounded_rectangle((154,y+12,354,y+26),5,fill='#435360');d.rounded_rectangle((154,y+12,194,y+26),5,fill=C[color])
 tx(d,(44,926,438,28),'hud.source.keyboardTouch',20,'muted',lang=lang)
 for x,w,key,name in [(24,140,'hud.headlights','Headlights'),(176,140,'hud.hazard','Hazard'),(328,170,'hud.wipers','Wipers')]:
  panel(d,(x,960,w,96));icon(im,(x+w/2-15,969,30,30),name);d=ImageDraw.Draw(im);tx(d,(x+8,1006,w-16,44),key,22,center=True,lang=lang)
 for i,g in enumerate('PRND'):
  panel(d,(1788,426+i*94,100,86),'blue' if g=='D' else 'panel');tx(d,(1788,426+i*94,100,86),g,46,center=True,raw=True)
 button(d,(1780,814,116,96),'hud.parkingBrake.released',22,lang=lang)
 for x,y,w,h,key in [(1424,856,180,200,'hud.brake'),(1618,796,150,260,'hud.accelerator')]:panel(d,(x,y,w,h));tx(d,(x+8,y+h-64,w-16,50),key,26,center=True,lang=lang)
 panel(d,(740,966,440,90));tx(d,(764,992,392,52),'0°',26,center=True,raw=True)
 for x,key in [(515,'camera.lookLeft'),(1195,'camera.lookRight')]:button(d,(x,966,210,90),key,26,lang=lang)
 watermark(d,'HUD · ILLUSTRATIVE VALUES · '+lang.upper());return im

for lang in ['ko','en']:
 for kind in ['home','environments','missions']:menu(kind,lang).save(out/f'{kind}-{lang}.png')
 for kind in ['language','notice']:startup(kind,lang).save(out/f'{kind}-{lang}.png')
 hud(lang).save(out/f'hud-{lang}.png')
board=Image.new('RGB',(1920,1080),C['bg'])
for i,kind in enumerate(['hud','home','environments','notice']):
 image=Image.open(out/f'{kind}-ko.png').resize((960,540),Image.Resampling.LANCZOS);board.paste(image,((i%2)*960,(i//2)*540))
board.save(out/'implementation-layouts.png')
print('Static layout illustrations written; not Unity captures.')
