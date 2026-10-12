#!/usr/bin/env python3
"""Acceptance check for the Case Journal sprites (docs/CASE_JOURNAL_ASSET_SPEC.md).
Usage: check_journal_sprite.py J1|J2|J3|J4|J5|J6 FILE [--sheet OUT.png]   (J6 can write a 9-slice resize contact sheet)
Exit code 0 = pass, 1 = fail. It cannot see text or drawing quality; the eye check is still needed."""
import sys
from PIL import Image
import numpy as np
SPEC = {"J1":(1700,960),"J2":(1584,880),"J3":(60,880),"J4":(800,200),"J5":(472,290),"J6":(300,122)}
fails=[]; notes=[]
def chk(ok,msg): (notes if ok else fails).append(("ok   " if ok else "FAIL ")+msg)
def A(a,box): x0,y0,x1,y1=box; return a[y0:y1,x0:x1,3]
def fringe(a,box=None):
    al=a[...,3] if box is None else A(a,box); nz=al>0
    return float(((al>0)&(al<255)).sum())/max(1,nz.sum())
def bbox(al):
    ys,xs=np.where(al>8); return (xs.min(),ys.min(),xs.max()+1,ys.max()+1) if len(xs) else None
def main():
    if len(sys.argv)<3: print(__doc__); return 2
    key,path=sys.argv[1].upper(),sys.argv[2]
    im=Image.open(path); chk(im.mode in ("RGBA","LA","P") and "A" in im.mode or im.mode=="RGBA","has an alpha channel (mode %s)"%im.mode)
    im=im.convert("RGBA"); a=np.array(im).astype(int); W,H=im.size
    chk((W,H)==SPEC[key],"exact size %dx%d (got %dx%d)"%(SPEC[key]+(W,H)))
    if (W,H)!=SPEC[key]: return report()
    if key=="J1":
        chk(A(a,(40,40,1660,920)).max()==0,"hollow centre 1620x880 is fully transparent")
        chk(a[0,0,3]==0 and a[959,1699,3]==0,"outer corners are transparent (rounded)")
        chk(a[480,20,3]==255 and a[20,850,3]==255 and a[480,1680,3]==255 and a[940,850,3]==255,"40 px border is opaque on all four sides")
        chk(fringe(a)<0.02,"soft-edge pixels are rare (%.2f%% of painted pixels)"%(100*fringe(a)))
    if key=="J2":
        chk(A(a,(780,0,804,880)).max()==0,"24 px gap between the two pages is transparent")
        for nm,x0 in (("left",0),("right",804)):
            c=a[60:820,x0+70:x0+710]; lum=(0.3*c[...,0]+0.59*c[...,1]+0.11*c[...,2])
            chk(lum.std()<8,"%s page centre is calm (luminance std %.1f < 8)"%(nm,lum.std()))
            m=c[...,:3].reshape(-1,3).mean(0); chk(abs(m-np.array([242,232,212])).max()<22,"%s page colour near parchment (%s)"%(nm,m.round().astype(int).tolist()))
        chk(A(a,(0,0,780,880)).min()>200 and A(a,(804,0,1584,880)).min()>200,"both pages are fully opaque 780x880")
    if key=="J3":
        chk(a[:,0,3].max()<12 and a[:,59,3].max()<12,"strip fades to transparent at both side edges")
        chk(a[:,30,3].mean()>100,"centre of the valley is solid enough")
        for y in (140,340,540,740): chk(a[y+12,30,3]>200,"strap at y=%d is present"%y)
    if key=="J4":
        for c in range(4):
            for r,w in ((0,164),(1,169)):
                cell=a[r*100:r*100+100,c*200:c*200+200,3]; b=bbox(cell)
                chk(b is not None and b[0]<=1 and b[1]<=1 and abs(b[2]-w)<=2 and abs(b[3]-76)<=2,"%s ribbon %d is %dx76 at the cell's top-left (bbox %s)"%("normal" if r==0 else "selected",c+1,w,b))
                if r==0: chk(cell[38,w-3]<10 and cell[38,5]>200,"ribbon %d: swallowtail notch on the right, flat on the left"%(c+1))
    if key=="J5":
        for nm,(x0,w,h,wx,wy,ww,wh) in {"tile":(0,212,240,10,10,192,168),"large":(236,236,290,10,10,216,224)}.items():
            b=bbox(a[:,x0:x0+w+24,3][:, :]) if nm=="tile" else bbox(a[:,x0:,3])
            chk(a[h//2,x0+3,3]==255 and a[h-3,x0+w//2,3]==255,"%s frame paper is opaque at its edges"%nm)
            chk(A(a,(x0+wx,wy,x0+wx+ww,wy+wh)).max()==0,"%s window %dx%d at (%d,%d) is fully transparent"%(nm,ww,wh,wx,wy))
        chk(A(a,(212,0,236,290)).max()==0,"24 px gap between the two frames is transparent")
    if key=="J6":
        c=a[28:94,28:272]; chk(c[...,3].min()==255,"centre 244x66 is opaque")
        chk(c[...,:3].reshape(-1,3).std(0).max()<4,"centre is one flat colour (std %.1f < 4)"%c[...,:3].reshape(-1,3).std(0).max())
        chk(a[0,0,3]==0,"outer corner pixel is transparent (rounded)")
        top=a[2:26,40:260,:3].astype(float); chk(top.std(axis=1).max()<12,"top edge strip has no horizontal pattern (stretch-safe)")
        side=a[40:82,2:26,:3].astype(float); chk(side.std(axis=0).max()<12,"left edge strip has no vertical pattern (stretch-safe)")
        if "--sheet" in sys.argv:
            out=sys.argv[sys.argv.index("--sheet")+1]; s=28; sizes=[(220,100),(300,122),(420,180),(700,134)]
            sheet=Image.new("RGBA",(760,sum(h+16 for _,h in sizes)+16),(60,60,70,255)); y=8
            for (tw,th) in sizes:
                parts=lambda box: im.crop(box)
                canvas=Image.new("RGBA",(tw,th),(0,0,0,0))
                xs=[(0,s,0,s),(s,300-s,s,tw-s),(300-s,300,tw-s,tw)]; ys=[(0,s,0,s),(s,122-s,s,th-s),(122-s,122,th-s,th)]
                for (sx0,sx1,dx0,dx1) in xs:
                    for (sy0,sy1,dy0,dy1) in ys:
                        canvas.paste(im.crop((sx0,sy0,sx1,sy1)).resize((max(1,dx1-dx0),max(1,dy1-dy0)),Image.NEAREST if False else Image.BICUBIC),(dx0,dy0))
                sheet.alpha_composite(canvas,(8,y)); y+=th+16
            sheet.save(out); notes.append("ok   9-slice contact sheet written to %s (look for seams and stretched corner dots)"%out)
    return report()
def report():
    print("\n".join(notes+fails)); print("RESULT:", "FAIL (%d)"%len(fails) if fails else "PASS"); return 1 if fails else 0
sys.exit(main())
