#!/usr/bin/env python3
"""Measures eye distance of every bear sprite and writes Assets/Data/Characters/bear_scale_normalization.json
(scaleToNeutral = factor that makes the head the same size as bear_neutral_nomouth)."""
import numpy as np, json, glob, os
from PIL import Image
from scipy import ndimage
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base = os.path.join(root, 'Assets/Art/Characters/BigGreenBear/')
res = {}
for f in sorted(glob.glob(base + '*.png')) + sorted(glob.glob(base + '_review/*.png')):
    key = os.path.relpath(f, base)[:-4]
    im = np.array(Image.open(f).convert('RGBA')).astype(int); H, W = im.shape[:2]
    lum = im[..., :3].sum(2) / 3; mask = (im[..., 3] > 240) & (lum < 70)
    y0, y1, x0, x1 = int(H * .12), int(H * .45), int(W * .15), int(W * .85)
    sub = np.zeros_like(mask); sub[y0:y1, x0:x1] = mask[y0:y1, x0:x1]
    lab, n = ndimage.label(sub); cs = []
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k); a = len(ys); w = xs.max() - xs.min(); h = ys.max() - ys.min()
        if 800 < a < 30000 and 0.6 < w / max(h, 1) < 1.7: cs.append((int(xs.mean()), int(ys.mean()), a))
    best = None
    for i in range(len(cs)):
        for j in range(i + 1, len(cs)):
            a, b = cs[i], cs[j]
            if abs(a[1] - b[1]) < H * .03 and abs(a[0] - b[0]) > W * .1 and .6 < a[2] / b[2] < 1.6:
                if best is None or a[1] < best[0][1]: best = (a, b)
    r = {'size': [W, H]}
    if best:
        (ax, ay, _), (bx, by, _) = sorted(best); r.update(eyeDist=bx - ax, eyeL=[ax, ay], eyeR=[bx, by])
    res[key] = r
ref = res['bear_neutral_nomouth']['eyeDist']
for k, r in res.items():
    if 'eyeDist' in r: r['scaleToNeutral'] = round(ref / r['eyeDist'], 3); r['normalizedHeightPx'] = round(r['size'][1] * ref / r['eyeDist'])
json.dump(res, open(os.path.join(root, 'Assets/Data/Characters/bear_scale_normalization.json'), 'w'), indent=2)
for k, r in res.items(): print('%-34s %-12s eye %-4s scale %-6s h %s' % (k, r['size'], r.get('eyeDist'), r.get('scaleToNeutral'), r.get('normalizedHeightPx')))
