#!/usr/bin/env python3
"""Adds the bear's dark olive outline (outer silhouette) to a character sprite.
Thickness is given for the displayed height so it looks the same as the bear on screen.
Usage: python3 tools/add_outline.py <png> [<png> ...]   (edits in place)"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
COLOR = np.array([46, 44, 32], np.float32)          # measured on bear_smile_closedeyes (darkest quarter of the edge band)
BEAR_OUTLINE_DISPLAY_PX = 1.55                      # ~9 px at 2904 px height, shown at 500 px
BEAR_DISPLAY_RATIO = 500 / 2904
def run(path, display_height):
    im = np.array(Image.open(path).convert('RGBA'), np.float32); H = im.shape[0]
    T = BEAR_OUTLINE_DISPLAY_PX / (display_height / H)
    a = im[..., 3] / 255.0
    solid = a > 0.5
    dist = ndimage.distance_transform_edt(~solid)                      # distance outside the silhouette
    ring = np.clip(T - dist + 0.5, 0, 1)                               # anti-aliased outer ring
    ring = np.maximum(ring, a) if False else ring
    out_a = np.maximum(a, ring)                                        # keep original alpha, add the ring
    # colour: original where it is opaque, outline colour in the ring (blend by original alpha)
    rgb = im[..., :3] * a[..., None] + COLOR * (1 - a[..., None])
    res = np.dstack([rgb, out_a * 255])
    Image.fromarray(np.clip(res, 0, 255).astype(np.uint8), 'RGBA').save(path, optimize=True)
    return T
if __name__ == '__main__':
    for p in sys.argv[1:]:
        H = Image.open(p).size[1]
        print(p, 'outline px', round(run(p, display_height=275 if 'nini' in p.lower() else 500), 1))
