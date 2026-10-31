"""Generate ASSET_SPEC v1 diagnostic textures. Developer-only: Python, Pillow, NumPy.
Run from any directory: python generate_textures.py [--font /path/to/DejaVuSans-Bold.ttf]
The default project root is inferred from this file; outputs only inside Art/ImportTest.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parents[1]
OUT=PROJECT/'Assets/DrivingSim/Art/ImportTest'
SIZE=1024

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--font',type=Path,default=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    args=parser.parse_args()
    if not args.font.is_file():raise FileNotFoundError('Supply a Unicode arrow-capable TTF using --font')
    OUT.mkdir(parents=True,exist_ok=True)
    font=lambda n:ImageFont.truetype(str(args.font),n)
    image=Image.new('RGB',(SIZE,SIZE));draw=ImageDraw.Draw(image)
    relief=Image.new('L',(SIZE,SIZE),0);rd=ImageDraw.Draw(relief)
    for row in range(8):
        for col in range(8):
            x,y=col*128,row*128
            light=(row+col)%2==0
            draw.rectangle((x,y,x+127,y+127),fill=(222,230,234) if light else (39,56,70))
            draw.text((x+64,y+64),f'{col+1},{8-row}',font=font(25),fill=(48,66,78) if light else (178,200,211),anchor='mm')
    # Full-face UVs: +U right, +V up, origin lower-left. Asymmetric corners expose mirroring.
    draw.rounded_rectangle((210,16,814,126),radius=12,fill=(16,36,45))
    draw.text((512,70),'+V ↑',font=font(66),fill=(86,232,194),anchor='mm')
    rd.text((512,70),'+V ↑',font=font(66),fill=230,anchor='mm')
    draw.rounded_rectangle((260,872,764,996),radius=12,fill=(16,36,45))
    draw.text((512,930),'+U →',font=font(66),fill=(148,211,255),anchor='mm')
    rd.text((512,930),'+U →',font=font(66),fill=230,anchor='mm')
    draw.rounded_rectangle((252,420,772,600),radius=12,fill=(235,241,241))
    draw.text((512,470),'UV CHECK',font=font(47),fill=(15,37,48),anchor='mm')
    draw.text((512,548),'1 m / FACE',font=font(36),fill=(15,37,48),anchor='mm')
    rd.text((512,470),'UV CHECK',font=font(47),fill=180,anchor='mm')
    rd.text((512,548),'1 m / FACE',font=font(36),fill=180,anchor='mm')
    for x,y,text,color in [(20,954,'(0,0)',(231,96,63)),(864,24,'(1,1)',(236,193,66))]:
        draw.rounded_rectangle((x,y,x+140,y+50),radius=8,fill=color)
        draw.text((x+70,y+25),text,font=font(28),fill=(15,25,35),anchor='mm')
    # Small raised border/direction letters yield a valid +Y tangent-space normal map,
    # rather than painting arbitrary white lettering into normal RGB channels.
    rd.rectangle((8,8,1015,1015),outline=130,width=5)
    height=np.asarray(relief.filter(ImageFilter.GaussianBlur(2)),dtype=np.float32)/255.0*0.0015
    dy,dx=np.gradient(height,1/SIZE,1/SIZE)
    # PNG rows increase downward, whereas texture V increases upward.
    normal=np.stack((-dx,dy,np.ones_like(height)),axis=-1)
    normal/=np.linalg.norm(normal,axis=-1,keepdims=True)
    rgb=np.clip(np.rint((normal*0.5+0.5)*255),0,255).astype(np.uint8)
    # Packed material diagnostics: R metallic, G AO, B unused=0, A smoothness.
    yy,xx=np.indices((SIZE,SIZE));checker=((xx//128+yy//128)%2).astype(np.uint8)
    mask=np.zeros((SIZE,SIZE,4),dtype=np.uint8)
    mask[...,0]=np.where(checker==0,0,64)
    mask[...,1]=np.where(checker==0,255,230)
    mask[...,2]=0
    mask[...,3]=np.where(checker==0,64,180)
    # Directional relief appears in smoothness as well, while channel meanings stay valid.
    letters=np.asarray(relief)>160
    mask[...,3][letters]=245
    image.save(OUT/'T_IT_Checker_BaseMap.png',optimize=True)
    Image.fromarray(rgb).save(OUT/'T_IT_Checker_Normal.png',optimize=True)
    Image.fromarray(mask).save(OUT/'T_IT_Checker_Mask.png',optimize=True)
    manifest={'materials':[
        {'name':'M_IT_Checker','shader':'lit','surface':'opaque','baseMap':'ImportTest/T_IT_Checker_BaseMap.png',
         'normalMap':'ImportTest/T_IT_Checker_Normal.png','maskMap':'ImportTest/T_IT_Checker_Mask.png',
         'smoothness':1.0,'metallic':1.0,'baseColor':[1,1,1,1],'emissionMap':'','emissionColor':[0,0,0],'doubleSided':False},
        {'name':'M_IT_Marker','shader':'unlit','surface':'opaque','baseMap':'','normalMap':'','maskMap':'',
         'smoothness':0.0,'metallic':0.0,'baseColor':[1,0.16,0.025,1],'emissionMap':'','emissionColor':[0,0,0],'doubleSided':False}
    ]}
    folder=PROJECT/'Assets/DrivingSim/Art/Materials';folder.mkdir(parents=True,exist_ok=True)
    (folder/'materials.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Generated three 1024x1024 PNG diagnostic maps and two manifest entries.')
    print('Raster font:',args.font.name,'SHA256:',hashlib.sha256(args.font.read_bytes()).hexdigest())

if __name__=='__main__':main()
