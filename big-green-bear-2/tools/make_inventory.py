#!/usr/bin/env python3
"""Generates docs/ASSET_INVENTORY.md from the PNGs under Assets/Art + the original asset manifest."""
import json, os, sys
from PIL import Image
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
art = os.path.join(root, 'Assets', 'Art')
man = json.load(open(os.path.join(root, 'docs', 'asset_manifest.original.json')))
# old manifest key -> new path (folder renames done in the Unity layout)
RENAME = {'clock/': 'Props/Clock/', 'mirror/': 'Mirror/', 'frame/': 'Frames/', 'textures/': 'Textures/',
          'stamps/': 'UI/Stamps/', 'motifs/': 'UI/Motifs/', 'ui/tabs/': 'UI/Tabs/', 'ui/': 'UI/'}
def newkey(k):
    for a, b in RENAME.items():
        if k.startswith(a): return b + k[len(a):]
    return k
notes = {newkey(k): v for k, v in man.items()}

def kind(p):
    if p.startswith('Characters'): return 'Character sprite'
    if p.startswith('Props/Clock'): return 'Prop / animated clock part'
    if p.startswith('Mirror'): return 'Mirror layer'
    if p.startswith('Frames'): return 'Frame / curtain'
    if p.startswith('UI/Stamps'): return 'UI stamp'
    if p.startswith('UI/Motifs'): return 'UI motif'
    if p.startswith('UI/Tabs'): return 'UI folder tab'
    if p.startswith('Textures'): return 'Texture (overlay / tile)'
    if p.startswith('UI'):
        n = os.path.basename(p)
        if 'card' in n or 'label' in n: return 'UI card (evidence/document/photo/timeline/identity)'
        if 'folder' in n: return 'UI folder'
        return 'UI prop (clip / pin / tape / stamp)'
    return 'Other'

def usage(p, n):
    u = {
        'bear_neutral_nomouth': 'Big Green Bear base. NO mouth: overlay mouth/eye sprites. Scarf tail on viewer-right. Green = this image mirrored.',
        'bear_smile_openeyes': 'Smile with eyes OPEN (= Green\'s tell). Bear needs a closed-eye smile variant (missing).',
        'bear_wave_right': 'Waving with the arm on the RIGHT side of the image = Big Green Bear. No mouth (use overlay).',
        'bear_hold_bell': 'Hand on the RIGHT side of the image holding the GREEN bell (recolored from brass).',
        'bear_frown_blush_walk': 'REVIEW: blush + drawn mouth, bigger scale, not in the matte set look.',
        'bear_wave_right_v2_styledrift': 'REVIEW: thicker outline and glossy scarf = style drift.',
        'bear_wave_left_mixedtell': 'REVIEW: waves with the LEFT-side arm while the scarf tail is on the RIGHT side = contradicts the twin rule.',
        'bear_smile_closedeyes': 'Smile with eyes CLOSED = Big Green Bear\'s tell. (Delivered; fills the gap.)',
        'bear_grief_handsclasp': 'Grief: eyes closed, trembling mouth, hands clasped. Eye distance unreliable (closed eyes).',
        'bear_worried_handsclasp': 'Worried / uneasy, hands clasped.',
        'bear_cry_armsdown': 'Crying with tears, arms down (newer, thicker-outline family).',
        'bear_angry': 'Angry. Note: Green must not look scarier by default; use only for a confrontation beat.',
        'bear_surprised_blush': 'Surprised, small round mouth, light blush.',
        'nini_stand_neutral': 'Nini base with a tiny closed mouth (no separate no-mouth base yet). Dark outline added with tools/add_outline.py to match the bear.',
        'nini_stand_happy_open': 'Nini happy, open mouth.',
        'bear_sad_cry': 'Crying / sorrow. Neutral-safe for either twin when mirrored.',
        'bear_think_handmouth': 'Hand at mouth with the arm on the RIGHT side of the image = Big Green Bear. Flip for Green.',
        'prop_clock_face': 'Clock face. Hands share its canvas centre; 11:47 -> hour -353.5deg, minute -282deg (Unity Z).',
        'prop_clock_hour_hand': 'Hour hand (points to 12 at rot 0, rotate clockwise).',
        'prop_clock_minute_hand': 'Minute hand (points to 12 at rot 0).',
        'prop_clock_second_hand': 'Second hand (can stop / tick / slip back slightly).',
        'prop_clock_gear_large': 'Gear 48T, meshes 1:1 with the small gear. Small spins 48/18 faster, opposite way.',
        'prop_clock_gear_small': 'Gear 18T.',
        'prop_clock_pendulum': 'Pendulum, pivot at suspension pin, swing +/-6deg.',
        'prop_clock_chain': 'Seamless vertical chain tile (pitch 256px) - use SpriteDrawMode.Tiled.',
        'prop_clock_weight': 'Chain weight, pivot at hook.',
        'prop_clock_spring': 'Mechanism spring (decor / Clock Mechanism room).',
        'mirror_shadow': 'Mirror layer 1 (bottom): drop shadow.',
        'mirror_glass': 'Mirror layer 2: glass (oval). Sits UNDER the frame.',
        'mirror_glass_rect': 'Glass for the rectangular mirror.',
        'mirror_reflection_overlay': 'Mirror layer 4: above the dynamic reflection (flipX, alpha .35-.5).',
        'mirror_reflection_overlay_fullcanvas': 'Full-canvas reflection overlay for the rectangular mirror.',
        'mirror_dust': 'Mirror layer 5: dust, pre-masked to the oval glass.',
        'mirror_dust_fullcanvas': 'Dust for the rectangular mirror (unmasked).',
        'mirror_highlight': 'Mirror layer 6: additive/screen glint. Slide slowly.',
        'mirror_frame_oval': 'Mirror layer 7 (top): oval frame.',
        'mirror_frame_rectangular': 'Rectangular mirror frame.',
        'frame_main': 'Main paper frame. Transparent stage opening (380,170)-(3460,2010) @3840x2160.',
        'frame_inner': 'Inner frame lip.',
        'frame_shadow': 'Frame cast shadow (multiply).',
        'stage_shadow': 'Inner stage vignette shadow.',
        'frame_corner': 'Frame corner ornament.',
        'curtain_left': 'Left curtain; right edge at stage opening x=380.',
        'curtain_right': 'Right curtain; left edge at stage opening x=3460.',
    }
    return u.get(n, '')

rows = []
for dp, _, fs in sorted(os.walk(art)):
    for f in sorted(fs):
        if not f.lower().endswith('.png'): continue
        full = os.path.join(dp, f); rel = os.path.relpath(full, art).replace(os.sep, '/')
        im = Image.open(full).convert('RGBA'); w, h = im.size
        a = im.getchannel('A'); lo, hi = a.getextrema()
        trans = 'yes (clean alpha)' if lo < 250 else 'opaque'
        mb = os.path.getsize(full) / 1e6
        n = f[:-4]
        nt = notes.get(rel, {})
        piv = nt.get('pivot') or ([0.5, 0] if rel.startswith('Characters/') else None)
        extra = ('; ' + nt['note']) if nt.get('note') else ''
        rows.append((rel, kind(rel), f'{w}x{h}', trans, f'{mb:.2f}', piv, (usage(rel, n) or '') + extra))

with open(os.path.join(root, 'docs', 'ASSET_INVENTORY.md'), 'w') as o:
    o.write('# Asset Inventory (Batch 1)\n\nGenerated by `tools/make_inventory.py`. Paths are relative to `Assets/Art/`.\n\n')
    o.write(f'**{len(rows)} PNGs, {sum(float(r[4]) for r in rows):.1f} MB.** Import rules: `Assets/Editor/AssetImportRules.cs` (applied automatically on import).\n\n')
    cur = None
    for r in rows:
        sec = r[0].split('/')[0] if not r[0].startswith(('Props/', 'UI/')) else '/'.join(r[0].split('/')[:2])
        if sec != cur:
            cur = sec; o.write(f'\n## {sec}\n\n| Asset | Type | Resolution | Transparency | MB | Pivot | Usage |\n|---|---|---|---|---|---|---|\n')
        o.write(f'| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5] if r[5] else "0.5, 0.5"} | {r[6]} |\n')
print(len(rows), 'rows')
