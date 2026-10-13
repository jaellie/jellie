#!/usr/bin/env python3
"""Checks the Case Journal map art (596x610) against docs/CASE_JOURNAL_PLACES.json.
Usage: check_journal_map.py MAP.png [--overlay OUT.png]
Automatic: size, transparent outside the torn edge, and how busy each name-plaque zone is.
By eye: the overlay draws each pin position, building footprint and plaque zone on top of the map; every landmark's door must sit on its pin."""
import sys, json
from PIL import Image, ImageDraw
import numpy as np
W,H=596,576
places=json.load(open(__file__.replace("tools/check_journal_map.py","docs/CASE_JOURNAL_PLACES.json")))["places"]
im=Image.open(sys.argv[1]).convert("RGBA"); a=np.array(im).astype(float)
fails=[]
def chk(ok,msg): print(("ok   " if ok else "FAIL ")+msg); (not ok) and fails.append(msg)
chk(im.size==(W,H),"exact size %dx%d (got %dx%d)"%(W,H,*im.size))
if im.size==(W,H):
    chk(a[0,0,3]==0 and a[0,W-1,3]==0 and a[H-1,0,3]==0 and a[H-1,W-1,3]==0,"all four image corners are transparent (torn edge, nothing outside it)")
    chk(a[H//2,W//2,3]==255,"map centre is opaque")
    lum=0.3*a[...,0]+0.59*a[...,1]+0.11*a[...,2]; gy,gx=np.gradient(lum); busy=np.hypot(gx,gy)
    ref=busy[a[...,3]==255].mean()
    for k,p in places.items():
        x,y=p["x"],p["y"]; z=busy[y+10:y+54,x-75:x+75]; v=z.mean()/max(ref,1e-6)
        chk(v<1.35,"%-8s name-plaque zone is calm (detail %.2fx the map average, limit 1.35x)"%(k,v))
    if "--overlay" in sys.argv:
        o=Image.new("RGBA",im.size,(60,60,70,255)); o.alpha_composite(im); d=ImageDraw.Draw(o)
        for k,p in places.items():
            x,y,h=p["x"],p["y"],p["footprint_h"]
            d.rectangle((x-48,y-h,x+48,y),outline=(40,90,255,255),width=2); d.rectangle((x-75,y+10,x+75,y+54),outline=(255,60,60,255),width=2); d.ellipse((x-6,y-6,x+6,y+6),fill=(255,40,40,255))
        o.save(sys.argv[sys.argv.index("--overlay")+1]); print("overlay written (look: each door on its pin)")
print("RESULT:","FAIL (%d)"%len(fails) if fails else "PASS (still check the overlay by eye)"); sys.exit(1 if fails else 0)
