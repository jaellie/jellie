#!/usr/bin/env python3
"""Matches fur and scarf colours of every Big Green Bear sprite to the reference (bear_neutral_nomouth),
and recolours the brass bell in bear_hold_bell.png to the GREEN bell. Pixels outside the fur/scarf/bell colour
masks (outlines, eyes, nose, blush, tears) are left untouched.  Usage: python3 tools/harmonize_bear_colors.py [--dry]"""
import glob, os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Assets/Art/Characters/BigGreenBear/')
REF = 'bear_neutral_nomouth.png'

# ---------- colour helpers (sRGB <-> Lab, D65)
M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
WP = np.array([0.95047, 1.0, 1.08883])
def srgb2lab(rgb):
    c = rgb / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = (c @ M.T) / WP; f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
def lab2srgb(lab):
    fy = (lab[..., 0] + 16) / 116; fx = fy + lab[..., 1] / 500; fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1); xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * WP
    c = xyz @ np.linalg.inv(M).T; c = np.clip(c, 0, 1)
    return np.clip(np.where(c > 0.0031308, 1.055 * c ** (1 / 2.4) - 0.055, 12.92 * c) * 255, 0, 255)
def hsv(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-9), mx

def masks(a, exclude=None):
    rgb = a[..., :3]; al = a[..., 3] > 250; h, s, v = hsv(rgb)
    fur = al & (h > 85) & (h < 165) & (s > 0.16) & (v > 0.22)
    scarf = al & (h > 28) & (h < 66) & (s > 0.28) & (v > 0.5)
    if exclude is not None: fur &= ~exclude; scarf &= ~exclude
    return fur, scarf

def stats(lab, m): return lab[m].mean(0), lab[m].std(0) + 1e-6
def soft(m, r=2.5):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255 * m

def transfer(lab, m, ref, strength=1.0):
    mu_s, sd_s = stats(lab, m); mu_r, sd_r = ref
    k = np.clip(sd_r / sd_s, 0.85, 1.2)
    out = (lab - mu_s) * k + mu_r
    w = soft(m)[..., None] * strength
    return lab * (1 - w) + out * w

# ---------- bell: brass -> green (kept shading, dark outline untouched)
BELL_POLY = [(268,90),(300,92),(360,125),(385,160),(430,260),(470,360),(478,410),(450,445),(380,460),(280,468),
             (200,450),(130,425),(105,385),(125,340),(170,260),(205,190),(235,160),(270,130)]   # in the 850,1250 crop of bear_hold_bell
BELL_OFFSET = (850, 1250)
def bell_mask(size):
    im = Image.new('L', size, 0); ImageDraw.Draw(im).polygon([(x + BELL_OFFSET[0], y + BELL_OFFSET[1]) for x, y in BELL_POLY], fill=255)
    return np.asarray(im) > 0
RAMP = np.array([[24, 38, 30], [64, 112, 84], [124, 178, 142], [196, 232, 206]], np.float32)   # dark -> light jade green
def recolor_bell(a, mask):
    rgb = a[..., :3]; lum = (rgb @ np.array([0.299, 0.587, 0.114])) / 255.0
    t = np.clip((lum - 0.08) / 0.8, 0, 1) * (len(RAMP) - 1); i = np.clip(t.astype(int), 0, len(RAMP) - 2); f = (t - i)[..., None]
    green = RAMP[i] * (1 - f) + RAMP[i + 1] * f
    w = soft(mask, 1.5)[..., None]                                   # the dark brass outline becomes dark olive-green too
    a = a.copy(); a[..., :3] = rgb * (1 - w) + green * w
    return a

def main(dry=False, only=None):
    ref = np.array(Image.open(BASE + REF).convert('RGBA'), np.float32)
    rl = srgb2lab(ref[..., :3]); rf, rs = masks(ref); R_FUR, R_SCARF = stats(rl, rf), stats(rl, rs)
    for f in sorted(glob.glob(BASE + '*.png')):
        if only and os.path.basename(f) not in only: continue
        n = os.path.basename(f); a = np.array(Image.open(f).convert('RGBA'), np.float32); bell = None
        if n == 'bear_hold_bell.png':
            bell = bell_mask((a.shape[1], a.shape[0])); a = recolor_bell(a, bell)
        if n != REF:
            fur, scarf = masks(a, bell); lab = srgb2lab(a[..., :3])
            lab = transfer(lab, fur, R_FUR); lab = transfer(lab, scarf, R_SCARF)
            a[..., :3] = lab2srgb(lab)
        if not dry: Image.fromarray(a.round().astype(np.uint8), 'RGBA').save(f, optimize=True)
        print('processed', n)

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    main('--dry' in sys.argv, set(args) or None)
