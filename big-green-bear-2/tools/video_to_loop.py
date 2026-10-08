#!/usr/bin/env python3
"""Grok (or any) video on a flat magenta background  ->  transparent, seamlessly looping PNG sequence for Unity.

  python3 tools/video_to_loop.py clip.mp4 out_dir [--fps 24] [--min 1.0] [--max 4.0] [--xfade 4] [--key FF00FF]

Quality: seamRatio ~1 means the jump at the loop point is as small as a normal frame step (invisible); >3 = visible pop.
Steps: extract frames -> chroma key each frame (tools/chroma_key.py) -> one shared crop box for every frame (no jitter,
feet stay on the same baseline) -> search the frame pair (i, j) whose last frame best matches the first frame's successor
(= the cleanest loop) -> optional cross-fade of the seam -> write PNGs, a preview GIF and loop.json."""
import sys, os, json, glob, shutil, subprocess, tempfile, argparse
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chroma_key import key as chroma

def run(args):
    tmp = tempfile.mkdtemp(prefix='v2l_'); raw = os.path.join(tmp, 'raw'); os.makedirs(raw)
    subprocess.run(['ffmpeg', '-v', 'error', '-i', args.video, '-vf', f'fps={args.fps}', os.path.join(raw, 'f_%04d.png')], check=True)
    files = sorted(glob.glob(os.path.join(raw, 'f_*.png'))); assert files, 'no frames extracted'
    keyed = []
    for i, f in enumerate(files):
        o = os.path.join(tmp, f'k_{i:04d}.png'); chroma(f, o, args.key); keyed.append(np.array(Image.open(o).convert('RGBA')))
    # shared crop box (union of all alpha), bottom-aligned canvas
    boxes = [Image.fromarray(k[..., 3]).point(lambda v: 255 if v > 24 else 0).getbbox() for k in keyed]
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    frames = [k[y0:y1, x0:x1] for k in keyed]
    # loop search on small premultiplied images
    small = [np.array(Image.fromarray(f).resize((max(8, f.shape[1] // 8), max(8, f.shape[0] // 8)), Image.BILINEAR), np.float32) for f in frames]
    small = [np.dstack([s[..., :3] * (s[..., 3:4] / 255.0), s[..., 3]]) for s in small]
    n = len(frames); lo = int(args.min * args.fps); hi = min(int(args.max * args.fps), n - 2)
    adj = float(np.median([np.abs(small[k + 1] - small[k]).mean() for k in range(n - 1)]))   # normal frame-to-frame change
    best = None
    for i in range(0, n - lo - 1):
        for j in range(i + lo, min(i + hi, n - 2) + 1):
            d = float(np.abs(small[j + 1] - small[i]).mean())            # frame after the last one should look like the first
            # also prefer similar motion direction (velocity) at the seam
            v = float(np.abs((small[j + 1] - small[j]) - (small[i + 1] - small[i])).mean())
            score = d + 0.5 * v
            if best is None or score < best[0]: best = (score, i, j, d)
    score, i, j, d = best
    seq = [f.astype(np.float32) for f in frames[i:j + 1]]
    x = min(args.xfade, len(seq) // 3)
    for k in range(x):                                                    # blend the tail into the head so the seam disappears
        w = (k + 1) / (x + 1)
        tail = frames[j + 1 - x + k] if j + 1 - x + k < n else seq[-1]
        seq[k] = seq[k] * w + tail.astype(np.float32) * (1 - w)
    seq = [np.clip(s, 0, 255).astype(np.uint8) for s in seq]
    os.makedirs(args.out, exist_ok=True); name = os.path.splitext(os.path.basename(args.video))[0]
    for k, s in enumerate(seq): Image.fromarray(s, 'RGBA').save(os.path.join(args.out, f'{name}_{k:03d}.png'))
    gifs = []
    for s in seq:
        bg = Image.new('RGBA', (s.shape[1], s.shape[0]), (27, 42, 64, 255)); bg.alpha_composite(Image.fromarray(s, 'RGBA')); gifs.append(bg.convert('P', palette=Image.ADAPTIVE, colors=128))
    gifs[0].save(os.path.join(args.out, f'{name}_preview.gif'), save_all=True, append_images=gifs[1:], duration=int(1000 / args.fps), loop=0, disposal=2)
    meta = dict(name=name, fps=args.fps, frames=len(seq), seconds=round(len(seq) / args.fps, 3), size=[x1 - x0, y1 - y0],
                pivot=[0.5, 0.0], seamError=round(d, 2), seamRatio=round(d / max(adj, 1e-6), 2), startFrame=i, endFrame=j, crossfade=x)
    json.dump(meta, open(os.path.join(args.out, f'{name}_loop.json'), 'w'), indent=2); shutil.rmtree(tmp)
    print(json.dumps(meta))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('out')
    ap.add_argument('--fps', type=int, default=24); ap.add_argument('--min', type=float, default=1.0); ap.add_argument('--max', type=float, default=4.0)
    ap.add_argument('--xfade', type=int, default=4); ap.add_argument('--key', default='FF00FF'); run(ap.parse_args())
