#!/usr/bin/env python3
"""Paints Mom's / the little girl's skins on top of Kenney's skaterFemaleA skin (CC0) so the
cute Kenney character wears her cardigan, perm hair and light-brown shoes (black rubber shoes only in The Past).
The face is Kenney's original (only the skin tone is adjusted).
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
    SHOE = {'shoes': hexc('#C4A484'), 'girl': hexc('#141414'), 'slippers': hexc('#C9B6E4')}[variant]
    SHOE2 = {'shoes': hexc('#E0C9AD'), 'girl': hexc('#2B2B2E'), 'slippers': hexc('#F2EAF8')}[variant]

    # skin tone everywhere (keeps the shading of the original)
    k = (img.mean(axis=2) / BASE_SKIN.mean())[..., None]
    skin_new = np.clip(FAIR * k, 0, 255)
    out[skin] = skin_new[skin]

    # head: keep Kenney's original face + hair (only skin tone changed above); add perm curls on the hair
    F = (xx < 640) & (yy < 490)
    face_box = (xx > 150) & (xx < 500) & (yy > 150) & (yy < 340)
    # make the face symmetric: the left half (with the eye, brow and freckles) is mirrored onto the right
    CX = 318
    for x in range(CX, 485):
        out[140:345, x] = out[140:345, 2 * CX - x]
    hair_mask = F & dark & ~face_box
    im = Image.fromarray(np.clip(out, 0, 255).astype('uint8'))
    d = ImageDraw.Draw(im, 'RGBA')
    if not child:
        for _ in range(420):
            cx, cy = rnd.randint(0, 639), rnd.randint(0, 489)
            if hair_mask[cy, cx]:
                rr = rnd.randint(8, 16)
                d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(74, 62, 60, 190), width=3)
    out = np.array(im, float)

    # torso + arms: cardigan (or blouse)
    T = (xx < 640) & (yy >= 490)
    out[T & (dark | red | gray | white | teal)] = CARD
    out[T & skin & (yy > 600) & (yy < 830) & (xx > 100) & (xx < 540)] = CARD
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
    low = L & (yy > 880)
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
