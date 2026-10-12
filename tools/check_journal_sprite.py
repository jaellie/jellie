#!/usr/bin/env python3
"""Acceptance check for the Case Journal sprites (docs/CASE_JOURNAL_ASSET_SPEC.md).
Usage: check_journal_sprite.py J1|J2|J3|J4|J5T|J5L|J6 FILE [--sheet OUT.png]   (J6 can write a 9-slice resize contact sheet)
Exit code 0 = pass, 1 = fail. It cannot see text or drawing quality; the eye check is still needed."""
import sys
from PIL import Image
import numpy as np
# rev2: sizes of the delivered and processed sprites (see docs/CASE_JOURNAL_ASSET_SPEC.md section 9)
SPEC = {"J1":(1697,1022),"J2":(1646,908),"J3":(111,892),"J4":(800,200),"J5T":(212,237),"J5L":(236,290),"J6":(404,122)}
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
        hx0,hy0,hx1,hy1=63,64,1635,956
        chk(A(a,(hx0+6,hy0+6,hx1-6,hy1-6)).max()==0,"hollow centre %dx%d is fully transparent"%(hx1-hx0,hy1-hy0))
        chk(a[0,0,3]==0 and a[0,W-1,3]==0 and a[H-1,0,3]==0 and a[H-1,W-1,3]==0,"all four image corners are transparent (rounded)")
        chk(a[H//2,25,3]>240 and a[25,W//2,3]>240 and a[H//2,W-25,3]>240 and a[H-25,W//2,3]>240,"border is opaque on all four sides")
        chk(fringe(a)<0.12,"soft-edge pixels are limited (%.1f%% of painted pixels, limit 12%%)"%(100*fringe(a)))
    if key=="J2":
        chk(A(a,(823-3,40,823+3,H-40)).mean()<40,"page gap at the centre is (nearly) transparent")
        for nm,(x0,x1) in (("left",(150,700)),("right",(950,1500))):
            c=a[120:H-120,x0:x1]; lum=(0.3*c[...,0]+0.59*c[...,1]+0.11*c[...,2])
            chk(lum.std()<14,"%s page centre is calm (luminance std %.1f < 14)"%(nm,lum.std()))
            m=c[...,:3].reshape(-1,3).mean(0); chk(abs(m-np.array([240,222,184])).max()<45,"%s page colour is warm parchment (%s)"%(nm,m.round().astype(int).tolist()))
            chk(c[...,3].min()>250,"%s page centre is opaque"%nm)
    if key=="J3":
        chk(a[:,0,3].mean()<60 and a[:,W-1,3].mean()<60,"strip edges are mostly transparent (mean alpha %.0f / %.0f)"%(a[:,0,3].mean(),a[:,W-1,3].mean()))
        chk(a[H//2,W//2,3]>240,"centre is opaque")
        chk(a[:30,W//2,3].max()>200 and a[-30:,W//2,3].max()>200,"strip reaches near the top and bottom")
    if key=="J4":
        for c in range(4):
            for r in (0,1):
                cell=a[r*100:r*100+100,c*200:c*200+200,3]; b=bbox(cell)
                chk(b is not None and b[0]<=1 and b[1]<=1 and abs(b[2]-170)<=2 and abs(b[3]-62)<=2,"%s ribbon %d is 170x62 at the cell's top-left (bbox %s)"%("normal" if r==0 else "selected",c+1,tuple(int(v) for v in b) if b else None))
                chk(cell[31,165]<10 and cell[31,5]>200,"%s ribbon %d: notch on the right, flat on the left"%("normal" if r==0 else "selected",c+1))
    if key in ("J5T","J5L"):
        win={"J5T":(21,22,170,155),"J5L":(22,25,193,194)}[key]
        chk(A(a,(win[0]+3,win[1]+3,win[0]+win[2]-3,win[1]+win[3]-3)).max()==0,"window %dx%d at (%d,%d) is fully transparent"%(win[2],win[3],win[0],win[1]))
        chk(a[H//2,6,3]>240 and a[H-6,W//2,3]>240,"frame paper is opaque at its edges")
        chk(a[0,0,3]<255,"corner is cut (frame is not a plain rectangle)")
    if key=="J6":
        c=a[40:H-40,60:W-60]; chk(c[...,3].min()>250,"centre is opaque")
        lum=0.3*c[...,0]+0.59*c[...,1]+0.11*c[...,2]; chk(lum.std()<10,"centre is calm (luminance std %.1f < 10)"%lum.std())
        chk(a[0,0,3]<255,"outer corner is cut (rounded)")
        if "--sheet" in sys.argv:
            out=sys.argv[sys.argv.index("--sheet")+1]; s=26; sizes=[(220,100),(300,122),(404,122),(520,150),(640,110)]
            sheet=Image.new("RGBA",(680,sum(h+16 for _,h in sizes)+16),(60,60,70,255)); y=8
            for (tw,th) in sizes:
                canvas=Image.new("RGBA",(tw,th),(0,0,0,0))
                xs=[(0,s,0,s),(s,404-s,s,tw-s),(404-s,404,tw-s,tw)]; ys=[(0,s,0,s),(s,122-s,s,th-s),(122-s,122,th-s,th)]
                for (sx0,sx1,dx0,dx1) in xs:
                    for (sy0,sy1,dy0,dy1) in ys:
                        canvas.paste(im.crop((sx0,sy0,sx1,sy1)).resize((max(1,dx1-dx0),max(1,dy1-dy0)),Image.BICUBIC),(dx0,dy0))
                sheet.alpha_composite(canvas,(8,y)); y+=th+16
            sheet.save(out); notes.append("ok   9-slice contact sheet written to %s (slice 26 px; look for seams and stretched rivets)"%out)
    return report()
def report():
    print("\n".join(notes+fails)); print("RESULT:", "FAIL (%d)"%len(fails) if fails else "PASS"); return 1 if fails else 0
sys.exit(main())
