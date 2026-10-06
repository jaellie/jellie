#!/usr/bin/env python3
"""Paints Mom's / the little girl's skins on top of Kenney's skaterFemaleA skin (CC0) so the
cute Kenney character wears her cardigan, perm hair and black rubber shoes.
Usage: python3 Tools/make_skins.py <skaterFemaleA.png> <out_dir>"""
import sys, os, random
import numpy as np
from PIL import Image, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
FAIR = np.array([246, 227, 216], float)           # content.js -> mom.skin  #F6E3D8
BASE_SKIN = np.array([245, 146, 113], float)
rnd = random.Random(7)

def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)

def paint(variant):
    img = np.array(Image.open(SRC).convert('RGB'), float)
    H, W, _ = img.shape
    yy, xx = np.mgrid[0:H, 0:W]
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    skin = (r > 200) & (g > 100) & (g < 175) & (b > 70) & (b < 145) & (r - b > 90)
    dark = (r < 110) & (g < 110) & (b < 110)
    red = (r > 140) & (g < 120) & (b < 120) & (r - g > 60)
    gray = (abs(r - g) < 18) & (abs(g - b) < 18) & (r > 90) & (r < 240)
    white = (r > 235) & (g > 235) & (b > 235)
    teal = (g > r + 30) & (g > 110)
    sole = (abs(r - 228) < 14) & (abs(g - 120) < 16) & (abs(b - 62) < 16)
    out = img.copy()

    child = variant == 'girl'
    CARD = hexc('#FFF7EA' if child else '#F4B6C2')   # blouse / cardigan
    CARD2 = hexc('#E4574F' if child else '#EBA4B3')   # bow-red / ribbed hem
    HAIR = hexc('#1E1A19')
    DENIM = hexc('#9C5B4B' if child else '#5B7DA8')
    SHOE = {'shoes': hexc('#141414'), 'girl': hexc('#141414'), 'slippers': hexc('#C9B6E4')}[variant]
    SHOE2 = {'shoes': hexc('#2B2B2E'), 'girl': hexc('#2B2B2E'), 'slippers': hexc('#F2EAF8')}[variant]

    # skin tone everywhere (keeps the shading of the original)
    k = (img.mean(axis=2) / BASE_SKIN.mean())[..., None]
    skin_new = np.clip(FAIR * k, 0, 255)
    out[skin] = skin_new[skin]

    # head: hair colour, then redo the face
    F = (xx < 640) & (yy < 490)
    out[F & (dark | teal)] = HAIR
    face_box = (xx > 205) & (xx < 440) & (yy > 168) & (yy < 335)
    hairline = 200 + 34 * ((xx - 322) / 125.0) ** 2
    below = yy > hairline
    out[face_box & below] = np.clip(FAIR * 0.985, 0, 255)
    out[face_box & ~below] = HAIR
    hair_mask = F & (np.abs(out - HAIR).sum(axis=2) < 12)
    im = Image.fromarray(np.clip(out, 0, 255).astype('uint8'))
    d = ImageDraw.Draw(im, 'RGBA')
    if not child:  # lighter curls to suggest a perm
        for _ in range(420):
            cx, cy = rnd.randint(0, 639), rnd.randint(0, 489)
            if hair_mask[cy, cx]:
                rr = rnd.randint(8, 16)
                d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(74, 62, 60, 190), width=3)
    else:          # girl: straight bangs
        d.rectangle((215, 150, 430, 214), fill=tuple(int(c) for c in HAIR) + (255,))
        for x in range(225, 430, 22): d.line((x, 150, x - 2, 214), fill=(62, 52, 50, 255), width=2)
    dk = (70, 42, 36, 255)                       # closed, smiling eyes + smile + rosy cheeks
    for ex in (282, 362): d.arc((ex - 21, 220, ex + 21, 252), 200, 340, fill=dk, width=7)
    d.arc((322 - 28, 246, 322 + 28, 288), 25, 155, fill=(186, 84, 92, 255), width=6)
    for cx in (252, 392): d.ellipse((cx - 22, 252, cx + 22, 282), fill=(244, 140, 152, 120))
    out = np.array(im, float)

    # torso + arms: cardigan (or blouse)
    T = (xx < 640) & (yy >= 490)
    out[T & (dark | red | gray | white | teal)] = CARD
    hem = T & (yy > 955) & (xx > 150) & (xx < 495)
    out[hem] = CARD2
    cuffs = T & (yy > 640) & (yy < 835) & ((xx < 70) | (xx > 570))
    out[cuffs] = CARD2
    im = Image.fromarray(np.clip(out, 0, 255).astype('uint8')); d = ImageDraw.Draw(im, 'RGBA')
    for x in range(160, 495, 16): d.line((x, 955, x, 1010), fill=(215, 130, 150, 120), width=2)
    for x in list(range(4, 70, 14)) + list(range(575, 640, 14)): d.line((x, 650, x, 825), fill=(215, 130, 150, 120), width=2)
    if not child:
        for y in range(575, 940, 62): d.ellipse((322 - 8, y - 8, 322 + 8, y + 8), fill=(255, 250, 244, 255), outline=(225, 150, 165, 255))
    else:
        d.polygon([(322, 722), (270, 690), (270, 756)], fill=(228, 87, 79, 255)); d.polygon([(322, 722), (374, 690), (374, 756)], fill=(228, 87, 79, 255))
        d.ellipse((322 - 12, 710, 322 + 12, 734), fill=(200, 60, 55, 255))
    out = np.array(im, float)

    # legs: denim (hidden by the 3D skirt) down to the calf, skin below (white socks for the girl)
    L = (xx >= 610) & (yy >= 765)
    out[L & (dark | gray)] = DENIM
    low = L & (yy > 945)
    out[low & (np.abs(out - DENIM).sum(axis=2) < 6)] = hexc('#FFFFFF') if child else FAIR

    # shoes (uppers on the pale-blue panels) and soles
    S = (xx >= 640) & (xx < 830) & (yy >= 135) & (yy < 530)
    out[S & red] = SHOE
    out[S & (white | gray)] = SHOE2
    top = (yy < 135) & (xx >= 640)
    out[top & sole] = hexc('#1C1C1E')
    return Image.fromarray(np.clip(out, 0, 255).astype('uint8'))

for v, name in [('shoes', 'mom_shoes'), ('slippers', 'mom_slippers'), ('girl', 'girl')]:
    paint(v).save(os.path.join(OUT, name + '.png'))
    print('wrote', name)
