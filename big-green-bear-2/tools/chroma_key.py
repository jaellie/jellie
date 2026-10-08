#!/usr/bin/env python3
"""Turns a flat-magenta-background image (what Gemini / Grok give you) into a transparent PNG with clean edges.
Why magenta: the cast is green (bear), cream/white (Nini), navy/gray (Edward); pure magenta (#FF00FF) never appears in them.
Usage: python3 tools/chroma_key.py in.png out.png [--key FF00FF]"""
import sys, numpy as np
from PIL import Image
def key(inp, out, hexcol='FF00FF', soft_lo=40.0, soft_hi=110.0):
    im = np.array(Image.open(inp).convert('RGB'), np.float32); k = np.array([int(hexcol[i:i+2], 16) for i in (0, 2, 4)], np.float32)
    d = np.sqrt(((im - k) ** 2).sum(2))                                   # distance to the key colour
    a = np.clip((d - soft_lo) / (soft_hi - soft_lo), 0, 1)                # 0 = background, 1 = subject, soft edge in between
    # despill: where the pixel is partly background, pull the key colour out of the RGB so no pink fringe remains
    spill = np.clip(1 - a, 0, 1)[..., None]
    rgb = np.where(a[..., None] > 0.001, (im - k * spill) / np.maximum(1 - spill, 0.05), im)
    # magenta despill: remove only the part where R and B are BOTH above G (the key's signature); green/cream/navy/pink-ear pixels are untouched
    m = np.clip(np.minimum(rgb[..., 0] - rgb[..., 1], rgb[..., 2] - rgb[..., 1]), 0, None)
    rgb[..., 0] -= m; rgb[..., 2] -= m
    rgb = np.clip(rgb, 0, 255)
    Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA').save(out)
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    hx = next((a.split('=')[1] for a in sys.argv if a.startswith('--key=')), 'FF00FF')
    key(args[0], args[1], hx)
