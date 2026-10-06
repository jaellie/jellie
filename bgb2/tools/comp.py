from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import sys
S=sys.argv[1]; A='bgb2/assets/'
W,H=1920,1080
def load(p,w=None,h=None):
    im=Image.open(p).convert('RGBA'); im=im.crop(im.getbbox())
    if h: im=im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
    return im
def grade(im,dark=.78,blue=(0.92,0.97,1.08)):
    r,g,b,a=im.split()
    r=r.point(lambda v:int(v*dark*blue[0])); g=g.point(lambda v:int(v*dark*blue[1])); b=b.point(lambda v:min(255,int(v*dark*blue[2])))
    return Image.merge('RGBA',(r,g,b,a))
def bg(n): return Image.open(A+'backgrounds/%s.png'%n).convert('RGBA').resize((W,1080))
canvas=Image.new('RGBA',(W,H),(14,20,40,255))
far=grade(bg('layer_far'),.72); canvas.alpha_composite(far)
def put(im,x,feet,shadow=True):
    if shadow:
        sh=Image.new('RGBA',im.size,(0,0,0,0)); sh.paste((8,12,28,150),mask=im.split()[3]); sh=sh.filter(ImageFilter.GaussianBlur(6))
        canvas.alpha_composite(sh,(x+8,feet-im.height+10))
    canvas.alpha_composite(im,(x,feet-im.height))
GY=640
sp=lambda n,t: A+'sprites/%s_%s.png'%(n,t)
# far forest line (behind ground)
for n,x,h in [('Tree_4_A',40,430),('Tree_4_A',190,330),('Tree_4_A',300,260),('Tree_4_A',1500,300),('Tree_4_A',1650,400),('Tree_4_A',1780,330)]:
    put(load(sp(n,'far'),h=h),x,GY+30,False)
# ground (Game 1)
g=grade(Image.open(A+'backgrounds/layer_ground.png').convert('RGBA'),.8); g=g.resize((W,int(g.height*W/g.width)))
canvas.alpha_composite(g,(0,H-g.height))
# mid trees
for n,x,h in [('Tree_1_A',-40,420),('Tree_3_A',1560,360),('Bush_1_A',380,90),('Bush_4_A',1330,80),('Rock_1_A',60,80)]:
    put(load(sp(n,'mid'),h=h),x,GY+70 if h>200 else GY+90)
# characters (Game 1 PNGs)
bear=load(A+'characters/bear_happy.png',h=470); nini=load(A+'characters/nini_happy.png',h=250)
put(nini,1130,GY+150); put(bear,1330,GY+190)
# near foreground
for n,x,h in [('Tree_Bare_2_A',-10,820),('Tree_Bare_1_A',1840,700),('Bush_4_A',130,150),('Bush_1_A',1700,150)]:
    put(load(sp(n,'near'),h=h),x,H-10 if h>500 else H-30,False)
# vignette
v=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(v)
for i in range(60): d.rectangle([i,i,W-i,H-i],outline=(6,10,24,int(2.4*(60-i))))
canvas.alpha_composite(v)
canvas.convert('RGB').resize((1280,720),Image.LANCZOS).save(S+'/comp.png')
