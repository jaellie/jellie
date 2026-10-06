#!/usr/bin/env python3
"""Copies the chosen Kenney (CC0, www.kenney.nl) assets into Assets/Resources/Kenney and writes
Assets/Scripts/Core/KenneyCatalog.cs (sizes, material order, flat colors, palette textures).
Usage: python3 Tools/import_kenney.py /path/to/folder-with-unzipped-kenney-packs"""
import os, re, shutil, sys, glob
import trimesh

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/claude-0/kenney'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'Assets', 'Resources', 'Kenney')
CAT = os.path.join(ROOT, 'Assets', 'Scripts', 'Core', 'KenneyCatalog.cs')

ROADS = '034 058 129 104 105 106 160 162 163 036 019 020 159 001 272 174 175 190 013 016 022 168 144 146 145 283 098 099 085 107 140 151 152 189 012 028 029 037 039 040 041 042 187 188 233 234'.split()
PACKS = [  # key prefix, source folder, obj subdir, dest dir, name filter
    ('furn',  'kenney_furniture-kit', 'Models/OBJ format', 'Furniture', None),
    ('food',  'kenney_food-kit', 'Models/OBJ format', 'Food', None),
    ('mart',  'kenney_mini-market', 'Models/OBJ format', 'Market', None),
    ('shop',  'kenney_city-kit-commercial_2.1', 'Models/OBJ format', 'Commercial', None),
    ('sub',   'kenney_city-kit-suburban_20', 'Models/OBJ format', 'Suburban', None),
    ('boat',  'kenney_watercraft-pack', 'Models/OBJ format', 'Watercraft', None),
    ('bld',   'kenney_modular-buildings', 'Models/OBJ format', 'Buildings', lambda n: n.startswith('building-sample-')),
    ('road',  'kenney_3d-road-tiles', 'Models', 'Roads', lambda n: n.replace('roadTile_', '') in ROADS),
]

def parse_mtl(path):
    mats, cur = {}, None
    for line in open(path, encoding='utf-8', errors='ignore'):
        t = line.strip().split()
        if not t: continue
        if t[0] == 'newmtl': cur = t[1]; mats[cur] = {'kd': (0.8, 0.8, 0.8), 'tex': None}
        elif t[0] == 'Kd' and cur: mats[cur]['kd'] = tuple(float(x) for x in t[1:4])
        elif t[0] == 'map_Kd' and cur: mats[cur]['tex'] = t[1]
    return mats

def hexc(kd):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(c * 255))) for c in kd)

def usemtl_order(obj):
    order = []
    for line in open(obj, encoding='utf-8', errors='ignore'):
        if line.startswith('usemtl '):
            m = line.split()[1]
            if m not in order: order.append(m)
    return order

entries = []
shutil.rmtree(RES, ignore_errors=True)
for prefix, folder, sub, dest, flt in PACKS:
    src_dir = os.path.join(SRC, folder, sub)
    dst_dir = os.path.join(RES, dest)
    os.makedirs(dst_dir, exist_ok=True)
    n_ok = 0
    for obj in sorted(glob.glob(os.path.join(src_dir, '*.obj'))):
        name = os.path.splitext(os.path.basename(obj))[0]
        if flt and not flt(name): continue
        mtl = obj[:-4] + '.mtl'
        shutil.copy(obj, dst_dir)
        if os.path.exists(mtl): shutil.copy(mtl, dst_dir)
        m = trimesh.load(obj, force='mesh')
        size = m.bounds[1] - m.bounds[0]
        mats = parse_mtl(mtl) if os.path.exists(mtl) else {}
        order = usemtl_order(obj) or list(mats.keys())
        tex = None
        for k in order:
            if mats.get(k, {}).get('tex'): tex = 'Kenney/%s/%s' % (dest, os.path.splitext(mats[k]['tex'])[0])
        parts = ','.join('%s:%s' % (k, hexc(mats.get(k, {'kd': (0.8, 0.8, 0.8)})['kd'])) for k in order)
        entries.append((prefix + '/' + name, 'Kenney/%s/%s' % (dest, name), size, parts, tex))
        n_ok += 1
    # palette textures (shared by every model of the pack)
    tdir = os.path.join(src_dir, 'Textures')
    if not os.path.isdir(tdir): tdir = os.path.join(SRC, folder, 'Models', 'Textures')
    if os.path.isdir(tdir):
        os.makedirs(os.path.join(dst_dir, 'Textures'), exist_ok=True)
        for f in os.listdir(tdir):
            if f.lower().endswith('.png'): shutil.copy(os.path.join(tdir, f), os.path.join(dst_dir, 'Textures', f))
    print(dest, n_ok, 'models')

# palette textures: the mtl asks for Textures/colormap.png; some packs only ship variation-a.png
for _, _, _, dest, _ in PACKS:
    t = os.path.join(RES, dest, 'Textures')
    if os.path.isdir(t) and not os.path.exists(os.path.join(t, 'colormap.png')) and os.path.exists(os.path.join(t, 'variation-a.png')):
        shutil.copy(os.path.join(t, 'variation-a.png'), os.path.join(t, 'colormap.png'))

# characters (FBX with skeleton + animations)
cdir = os.path.join(RES, 'Characters'); os.makedirs(cdir, exist_ok=True)
for rel in ['Model/characterMedium.fbx', 'Animations/idle.fbx', 'Animations/run.fbx', 'Animations/jump.fbx']:
    shutil.copy(os.path.join(SRC, 'kenney_animated-characters-protagonists', rel), cdir)

# GUI (2x sprites) + emotes (vector style 1)
udir = os.path.join(RES, 'UI'); os.makedirs(udir, exist_ok=True)
for f in glob.glob(os.path.join(SRC, 'kenney_ui-pack-adventure', 'PNG', 'Double', '*.png')): shutil.copy(f, udir)
edir = os.path.join(RES, 'Emotes'); os.makedirs(edir, exist_ok=True)
for f in glob.glob(os.path.join(SRC, 'kenney_emotes-pack', 'PNG', 'Vector', 'Style 1', '*.png')): shutil.copy(f, edir)

# licenses (all CC0; credit is optional but kind)
ldir = os.path.join(ROOT, 'Assets', 'Kenney_Licenses'); os.makedirs(ldir, exist_ok=True)
for lic in glob.glob(os.path.join(SRC, 'kenney_*', 'License.txt')):
    shutil.copy(lic, os.path.join(ldir, os.path.basename(os.path.dirname(lic)) + '_License.txt'))

with open(CAT, 'w', encoding='utf-8') as f:
    f.write('// GENERATED by Tools/import_kenney.py. Sizes are in the models\' native units; mats are in the\n')
    f.write('// order Unity creates sub-meshes (first use in the OBJ); tex = shared palette texture (or null).\n')
    f.write('using System.Collections.Generic;\nusing UnityEngine;\n\npublic static class KenneyCatalog\n{\n')
    f.write('    public class Entry { public string res, tex; public Vector3 size; public string[] matNames, matHex; }\n')
    f.write('    static Entry E(string res, float x, float y, float z, string mats, string tex)\n    {\n')
    f.write('        var parts = mats.Length > 0 ? mats.Split(\',\') : new string[0];\n')
    f.write('        var e = new Entry { res = res, tex = tex, size = new Vector3(x, y, z), matNames = new string[parts.Length], matHex = new string[parts.Length] };\n')
    f.write('        for (int i = 0; i < parts.Length; i++) { var kv = parts[i].Split(\':\'); e.matNames[i] = kv[0]; e.matHex[i] = kv[1]; }\n        return e;\n    }\n\n')
    f.write('    public static readonly Dictionary<string, Entry> All = new Dictionary<string, Entry>\n    {\n')
    for key, res, size, parts, tex in entries:
        f.write('        { "%s", E("%s", %.3ff, %.3ff, %.3ff, "%s", %s) },\n' % (key, res, size[0], size[1], size[2], parts, ('"%s"' % tex) if tex else 'null'))
    f.write('    };\n}\n')
print('catalog entries:', len(entries))
