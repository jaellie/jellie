#!/usr/bin/env python3
"""Non-destructive sprite-sheet slicer with quality checks.

Never modifies the source. Never resamples: every output pixel is a copy of a source pixel.
Neighbour remnants inside a crop are made transparent (alpha=0) so crops do not carry parts of
adjacent sprites. Each output gets QA flags in manifest.json; nothing here is "production ready"
until a human reviews the contact sheet.

Modes
  bands       split into horizontal bands (for stacked background strips)
  components  connected components of the alpha mask
  single      one tight crop of the whole image
Usage examples
  python3 tools/slice_sheet.py --mode bands --input SHEET.png --out OUT --names far,ground,foreground
  python3 tools/slice_sheet.py --mode components --input UI.webp --out OUT --prefix ui --min-area 400
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ALPHA_THR_DEFAULT = 24


def load(path):
    return Image.open(path).convert("RGBA")


def tight_bbox(mask, pad, shape):
    ys, xs = np.where(mask)
    if len(ys) == 0:
        return None
    h, w = shape
    return (max(int(xs.min()) - pad, 0), max(int(ys.min()) - pad, 0),
            min(int(xs.max()) + 1 + pad, w), min(int(ys.max()) + 1 + pad, h))


def qa(arr, edge_thr=24):
    """Quality flags for one RGBA crop (numpy HxWx4 uint8)."""
    a = arr[..., 3]
    h, w = a.shape
    flags = []
    solid = a > 200
    semi = (a > 0) & (a <= 200)
    opaque_ratio = float(solid.mean())
    if opaque_ratio < 0.05:
        flags.append("nearly_empty")
    border = np.concatenate([a[0, :], a[-1, :], a[:, 0], a[:, -1]])
    if (border > edge_thr).any():
        flags.append("touches_edge")  # art cut by the crop or by the sheet
    semi_ratio = float(semi.sum() / max(1, (a > 0).sum()))
    if semi_ratio > 0.25:
        flags.append("heavy_semi_alpha")  # baked haze or soft halo
    if semi.any():
        fr = arr[semi][:, :3].astype(float).mean(0)
        if fr.mean() < 70 and arr[solid][:, :3].astype(float).mean() > 110:
            flags.append("dark_fringe")
    if min(h, w) < 48:
        flags.append("tiny")
    return flags, round(opaque_ratio, 3), round(semi_ratio, 3)


def save(arr, path):
    Image.fromarray(arr, "RGBA").save(path, optimize=False)


def mode_single(img, out, name, pad, thr):
    arr = np.array(img)
    bb = tight_bbox(arr[..., 3] > thr, pad, arr.shape[:2])
    crop = arr[bb[1]:bb[3], bb[0]:bb[2]].copy()
    p = os.path.join(out, name + ".png")
    save(crop, p)
    return [dict(name=name, file=os.path.basename(p), src_bbox=list(bb), size=[crop.shape[1], crop.shape[0]], qa=qa(crop)[0])]


def mode_bands(img, out, names, pad, thr, gap):
    arr = np.array(img)
    rows = np.where((arr[..., 3] > thr).any(1))[0]
    bands, s, p = [], rows[0], rows[0]
    for y in rows[1:]:
        if y - p > gap:
            bands.append((s, p)); s = y
        p = y
    bands.append((s, p))
    if names and len(names) != len(bands):
        sys.exit(f"found {len(bands)} bands, got {len(names)} names")
    res = []
    for i, (y0, y1) in enumerate(bands):
        ya, yb = max(int(y0) - pad, 0), min(int(y1) + 1 + pad, arr.shape[0])
        sub = arr[ya:yb]  # padding comes from real (transparent) gap rows, not clipped to the band
        bb = tight_bbox(sub[..., 3] > thr, pad, sub.shape[:2])
        crop = sub[bb[1]:bb[3], bb[0]:bb[2]].copy()
        n = names[i] if names else f"band_{i:02d}"
        pth = os.path.join(out, n + ".png")
        save(crop, pth)
        f, o, s_ = qa(crop)
        res.append(dict(name=n, file=os.path.basename(pth), src_bbox=[bb[0], ya + bb[1], bb[2], ya + bb[3]],
                        size=[crop.shape[1], crop.shape[0]], opaque_ratio=o, semi_ratio=s_, qa=f))
    return res


def mode_components(img, out, prefix, pad, thr, dilate, min_area, x_min, names):
    arr = np.array(img)
    mask = arr[..., 3] > thr
    if x_min:
        mask[:, :x_min] = False
    lab, n = ndi.label(ndi.binary_dilation(mask, iterations=dilate) if dilate else mask)
    objs = ndi.find_objects(lab)
    items = []
    for i, sl in enumerate(objs, start=1):
        comp = (lab[sl] == i) & mask[sl]
        if comp.sum() < min_area:
            continue
        items.append((sl[0].start, sl[1].start, i, sl))
    # reading order: bucket by row (y // 60) then x
    items.sort(key=lambda t: (t[0] // 60, t[1]))
    res = []
    for k, (_, _, i, sl) in enumerate(items):
        region = ndi.binary_dilation(lab[sl] == i, iterations=dilate + pad) if (dilate + pad) else (lab[sl] == i)
        y0 = max(sl[0].start - pad, 0); x0 = max(sl[1].start - pad, 0)
        y1 = min(sl[0].stop + pad, arr.shape[0]); x1 = min(sl[1].stop + pad, arr.shape[1])
        crop = arr[y0:y1, x0:x1].copy()
        # make neighbour remnants transparent: keep only this component's (dilated) footprint
        own = np.zeros(crop.shape[:2], bool)
        sub_lab = lab[y0:y1, x0:x1]
        own = ndi.binary_dilation(sub_lab == i, iterations=pad) if pad else (sub_lab == i)
        own &= (sub_lab == 0) | (sub_lab == i)  # never keep pixels that belong to a neighbouring sprite
        crop[~own, 3] = 0
        n_ = names[k] if names and k < len(names) else f"{prefix}_{k:03d}"
        pth = os.path.join(out, n_ + ".png")
        save(crop, pth)
        f, o, s_ = qa(crop)
        res.append(dict(name=n_, file=os.path.basename(pth), src_bbox=[int(x0), int(y0), int(x1), int(y1)],
                        size=[int(x1 - x0), int(y1 - y0)], opaque_ratio=o, semi_ratio=s_, qa=f))
    return res


def contact_sheet(out, items, cell=160, cols=10, bg=(70, 72, 84)):
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * cell), bg)
    for k, it in enumerate(items):
        im = Image.open(os.path.join(out, it["file"])).convert("RGBA")
        im.thumbnail((cell - 8, cell - 8))
        sheet.paste(im, ((k % cols) * cell + 4, (k // cols) * cell + 4), im)
    sheet.save(os.path.join(out, "_contact_sheet.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["bands", "components", "single"], required=True)
    ap.add_argument("--input", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--prefix", default="sprite")
    ap.add_argument("--names", default="")
    ap.add_argument("--pad", type=int, default=6)
    ap.add_argument("--alpha-thr", type=int, default=ALPHA_THR_DEFAULT)
    ap.add_argument("--dilate", type=int, default=2)
    ap.add_argument("--min-area", type=int, default=300)
    ap.add_argument("--band-gap", type=int, default=8)
    ap.add_argument("--manifest", default="manifest.json")
    ap.add_argument("--x-min", type=int, default=0, help="ignore everything left of this x (e.g. baked text labels)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    img = load(a.input)
    names = [s for s in a.names.split(",") if s]
    if a.mode == "single":
        items = mode_single(img, a.out, names[0] if names else a.prefix, a.pad, a.alpha_thr)
    elif a.mode == "bands":
        items = mode_bands(img, a.out, names, a.pad, a.alpha_thr, a.band_gap)
    else:
        items = mode_components(img, a.out, a.prefix, a.pad, a.alpha_thr, a.dilate, a.min_area, a.x_min, names)
    man = dict(source=os.path.basename(a.input), source_size=list(img.size), resampled=False,
               note="Automatic crops are CANDIDATES. Review _contact_sheet.png before use.", sprites=items)
    json.dump(man, open(os.path.join(a.out, a.manifest), "w"), indent=1)
    if a.mode != "bands" and len(items) > 1:
        contact_sheet(a.out, items)
    flagged = sum(1 for i in items if i["qa"])
    print(f"{len(items)} sprites -> {a.out} ({flagged} with QA flags)")


if __name__ == "__main__":
    main()
