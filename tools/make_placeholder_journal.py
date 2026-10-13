#!/usr/bin/env python3
"""Draws plain placeholder sprites J1-J6 at the exact sizes in docs/CASE_JOURNAL_ASSET_SPEC.md.
They let the game layout and 9-slice resizing be tested before the real art arrives. Usage: make_placeholder_journal.py OUT_DIR"""
import sys, os
from PIL import Image, ImageDraw
out = sys.argv[1] if len(sys.argv) > 1 else "placeholders"; os.makedirs(out, exist_ok=True)
LEATHER=(90,58,34,255); BRASS=(176,141,87,255); PAPER=(242,232,212,255); CARD=(251,243,216,255); INK=(42,26,18,255)
# J1 cover: 1700x960, 40px border, hollow centre, 30px outer radius
im = Image.new("RGBA",(1700,960),(0,0,0,0)); d = ImageDraw.Draw(im)
d.rounded_rectangle((0,0,1699,959),radius=30,fill=LEATHER)
d.rectangle((40,40,1659,919),fill=(0,0,0,0))
for x in range(60,1640,24): d.line((x,14,x+14,14),fill=(217,195,154,255),width=3); d.line((x,945,x+14,945),fill=(217,195,154,255),width=3)
# brass corners: L-shaped, arms 90 px long, never thicker than the 40 px border (nothing enters the hollow)
d.rectangle((0,0,89,19),fill=BRASS); d.rectangle((0,0,19,89),fill=BRASS)
d.rectangle((1610,0,1699,19),fill=BRASS); d.rectangle((1680,0,1699,89),fill=BRASS)
d.rectangle((0,940,89,959),fill=BRASS); d.rectangle((0,870,19,959),fill=BRASS)
d.rectangle((1610,940,1699,959),fill=BRASS); d.rectangle((1680,870,1699,959),fill=BRASS)
from PIL import ImageChops
m=Image.new("L",im.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,1699,959),radius=30,fill=255); im.putalpha(ImageChops.multiply(im.getchannel("A"),m))
im.save(f"{out}/J1_cover.png")
# J2 pages: 1584x880 (two 780x880 pages, 24px gap)
im = Image.new("RGBA",(1584,880),(0,0,0,0)); d = ImageDraw.Draw(im)
d.rectangle((0,0,779,879),fill=PAPER); d.rectangle((804,0,1583,879),fill=PAPER)
for i in range(12): d.line((i,0,i,879),fill=(225,214,190,255)); d.line((1583-i,0,1583-i,879),fill=(225,214,190,255))
for i in range(70):
    a=int(60*(1-i/70)); layer=Image.new("RGBA",im.size,(0,0,0,0)); ld=ImageDraw.Draw(layer)
    ld.line((779-i,0,779-i,879),fill=(120,90,50,a)); ld.line((804+i,0,804+i,879),fill=(120,90,50,a)); im.alpha_composite(layer)
im.save(f"{out}/J2_pages.png")
# J3 spine: 60x880
im = Image.new("RGBA",(60,880),(0,0,0,0)); d = ImageDraw.Draw(im)
for x in range(60):
    a=int(190*(1-abs(x-30)/30)); d.line((x,0,x,879),fill=(60,35,12,a))
for y in (140,340,540,740):
    d.rectangle((2,y,57,y+23),fill=(110,72,42,255)); d.ellipse((10,y+8,17,y+15),fill=BRASS); d.ellipse((43,y+8,50,y+15),fill=BRASS)
im.save(f"{out}/J3_spine.png")
# J4 bookmarks: 800x200, normal 164x76 (row1) and selected 169x76 (row2)
cols=[(110,42,53,255),(138,106,42,255),(38,54,79,255),(61,90,56,255)]
im = Image.new("RGBA",(800,200),(0,0,0,0)); d = ImageDraw.Draw(im)
for c,col in enumerate(cols):
    for r,w in ((0,164),(1,169)):
        x0,y0=c*200,r*100; k=w
        poly=[(x0,y0),(x0+k-1,y0),(x0+k-1-16,y0+38),(x0+k-1,y0+75),(x0,y0+75)]
        d.polygon(poly,fill=tuple(min(255,v+(20 if r else 0)) for v in col[:3])+(255,))
im.save(f"{out}/J4_bookmarks.png")
# J5 polaroid frames: 472x290; tile 212x240 window (10,10,192,168); large 236x290 at x=236 window (10,10,216,224)
im = Image.new("RGBA",(472,290),(0,0,0,0)); d = ImageDraw.Draw(im)
d.rectangle((0,0,211,239),fill=(251,246,232,255),outline=INK); d.rectangle((10,10,201,177),fill=(0,0,0,0))
d.rectangle((236,0,471,289),fill=(251,246,232,255),outline=INK); d.rectangle((246,10,461,233),fill=(0,0,0,0))
im.save(f"{out}/J5_polaroid.png")
# J6 paper card 300x122, 28px border, flat centre
im = Image.new("RGBA",(300,122),(0,0,0,0)); d = ImageDraw.Draw(im)
d.rounded_rectangle((0,0,299,121),radius=10,fill=CARD,outline=INK,width=2)
d.rounded_rectangle((6,6,293,115),radius=7,outline=BRASS,width=2)
for (x,y) in [(10,10),(289,10),(10,111),(289,111)]: d.ellipse((x-3,y-3,x+3,y+3),fill=BRASS)
im.save(f"{out}/J6_card.png")
print("placeholders written to", out)
