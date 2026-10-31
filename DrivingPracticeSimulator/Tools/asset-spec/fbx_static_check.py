"""Minimal binary FBX reader: predicts Unity import results for the import-test kit (static, not Unity)."""
import struct, zlib, sys, math

def read(path):
    data = open(path, 'rb').read()
    assert data[:20] == b'Kaydara FBX Binary  ', 'not binary FBX'
    ver = struct.unpack_from('<I', data, 23)[0]
    wide = ver >= 7500
    def prop(o):
        t = chr(data[o]); o += 1
        simple = {'Y': '<h', 'C': '<?', 'I': '<i', 'F': '<f', 'D': '<d', 'L': '<q'}
        if t in simple:
            v = struct.unpack_from(simple[t], data, o)[0]; return v, o + struct.calcsize(simple[t])
        if t in 'fdlib':
            n, enc, clen = struct.unpack_from('<III', data, o); o += 12
            raw = data[o:o + clen]; o += clen
            if enc == 1: raw = zlib.decompress(raw)
            fmt = {'f': 'f', 'd': 'd', 'l': 'q', 'i': 'i', 'b': '?'}[t]
            return list(struct.unpack('<%d%s' % (n, fmt), raw)), o
        if t in 'SR':
            n = struct.unpack_from('<I', data, o)[0]; o += 4
            v = data[o:o + n]; o += n
            return (v.decode('utf-8', 'replace') if t == 'S' else v), o
        raise ValueError('prop type ' + t)
    def node(o):
        if wide: end, nprops, plen = struct.unpack_from('<QQQ', data, o); o += 24
        else: end, nprops, plen = struct.unpack_from('<III', data, o); o += 12
        nlen = data[o]; o += 1
        name = data[o:o + nlen].decode(); o += nlen
        if end == 0: return None, o
        props = []
        for _ in range(nprops):
            v, o = prop(o); props.append(v)
        kids = []
        sentinel = 25 if wide else 13
        while o < end - sentinel or (o < end and data[o:o + sentinel] != b'\0' * sentinel):
            k, o = node(o)
            if k is None: break
            kids.append(k)
        return {'name': name, 'props': props, 'kids': kids}, end
    o, nodes = 27, []
    while o < len(data):
        try: n, o = node(o)
        except Exception: break
        if n is None: break
        nodes.append(n)
    return ver, nodes

def find(n, name): return [k for k in n['kids'] if k['name'] == name]
def p70(n):
    out = {}
    for blk in find(n, 'Properties70'):
        for p in find(blk, 'P'): out[p['props'][0]] = p['props'][4:]
    return out

ver, nodes = read(sys.argv[1])
top = {n['name']: n for n in nodes}
gs = p70(find(top['GlobalSettings'], 'Properties70') and top['GlobalSettings'] or top['GlobalSettings'])
print('FBX version', ver)
for k in ('UpAxis', 'UpAxisSign', 'FrontAxis', 'FrontAxisSign', 'CoordAxis', 'CoordAxisSign', 'UnitScaleFactor', 'OriginalUnitScaleFactor'):
    print(' ', k, gs.get(k))
objs = top['Objects']
models, geoms, mats = {}, {}, {}
for n in objs['kids']:
    uid, nm = n['props'][0], n['props'][1].split('\x00')[0]
    if n['name'] == 'Model': models[uid] = (nm, n['props'][2], p70(n))
    if n['name'] == 'Geometry': geoms[uid] = n
    if n['name'] == 'Material': mats[uid] = nm
parent, geo_of, mats_of = {}, {}, {}
for c in top['Connections']['kids']:
    kind, child, par = c['props'][0], c['props'][1], c['props'][2]
    if kind != 'OO': continue
    if child in models and par in models: parent[child] = par
    if child in geoms and par in models: geo_of[par] = child
    if child in mats and par in models: mats_of.setdefault(par, []).append(mats[child])

def mat_from(P):
    t = P.get('Lcl Translation', [0, 0, 0]); r = P.get('Lcl Rotation', [0, 0, 0]); s = P.get('Lcl Scaling', [1, 1, 1])
    return t, r, s
def apply(pt, t, r, s):  # FBX default rotation order XYZ (applied X, then Y, then Z)
    x, y, z = pt[0] * s[0], pt[1] * s[1], pt[2] * s[2]
    ax, ay, az = [math.radians(v) for v in r]
    y, z = y * math.cos(ax) - z * math.sin(ax), y * math.sin(ax) + z * math.cos(ax)
    x, z = x * math.cos(ay) + z * math.sin(ay), -x * math.sin(ay) + z * math.cos(ay)
    x, y = x * math.cos(az) - y * math.sin(az), x * math.sin(az) + y * math.cos(az)
    return [x + t[0], y + t[1], z + t[2]]
def to_world(uid, pt):
    while uid in models:
        t, r, s = mat_from(models[uid][2]); pt = apply(pt, t, r, s); uid = parent.get(uid)
    return pt
unit = (gs.get('UnitScaleFactor') or [1.0])[0] / 100.0
up, front, coord = gs['UpAxis'][0], gs['FrontAxis'][0], gs['CoordAxis'][0]
ups, fs, cs = gs['UpAxisSign'][0], gs['FrontAxisSign'][0], gs['CoordAxisSign'][0]
def to_unity(p):  # file axes -> right-handed (X right, Y up, Z front) -> Unity left-handed (negate X)
    x, y, z = p[coord] * cs, p[up] * ups, p[front] * fs
    return [round(-x * unit, 4), round(y * unit, 4), round(z * unit, 4)]
print('file unit scale -> Unity fileScale', unit)
print()
for uid, (nm, kind, P) in sorted(models.items(), key=lambda kv: kv[1][0]):
    t, r, s = mat_from(P)
    line = f'{nm:22s} {kind:5s} rot={[round(v, 2) for v in r]} scale={[round(v, 4) for v in s]}'
    if uid in geo_of:
        g = geoms[geo_of[uid]]
        vs = find(g, 'Vertices')[0]['props'][0]
        pts = [to_unity(to_world(uid, vs[i:i + 3])) for i in range(0, len(vs), 3)]
        lo = [min(p[i] for p in pts) for i in range(3)]; hi = [max(p[i] for p in pts) for i in range(3)]
        ctr = [round((a + b) / 2, 3) for a, b in zip(lo, hi)]; size = [round(b - a, 3) for a, b in zip(lo, hi)]
        idx = find(g, 'PolygonVertexIndex')[0]['props'][0]
        tris = 0; n = 0
        for i in idx:
            n += 1
            if i < 0: tris += n - 2; n = 0
        has_uv = bool(find(g, 'LayerElementUV')); has_n = bool(find(g, 'LayerElementNormal'))
        line += f' | center={ctr} size={size} tris={tris} uv={has_uv} normals={has_n} mats={mats_of.get(uid)}'
    else:
        line += f' | position={to_unity(to_world(uid, [0, 0, 0]))}'
    print(line)
others = sorted(set(n['name'] for n in objs['kids']))
print('\nObject node types:', others)

print('\n--- textures / videos ---')
for n in objs['kids']:
    if n['name'] in ('Video', 'Texture'):
        content = [k for k in n['kids'] if k['name'] == 'Content']
        clen = len(content[0]['props'][0]) if content and content[0]['props'] and isinstance(content[0]['props'][0], bytes) else 0
        fn = [k['props'][0] for k in n['kids'] if k['name'] in ('RelativeFilename', 'FileName')]
        print(n['name'], n['props'][1].split('\x00')[0], 'embedded bytes =', clen, '| files:', fn)

print('\n--- normals outward check (winding and normals, file space) ---')
for uid, (nm, kind, P) in models.items():
    if uid not in geo_of: continue
    g = geoms[geo_of[uid]]
    vs = find(g, 'Vertices')[0]['props'][0]; idx = find(g, 'PolygonVertexIndex')[0]['props'][0]
    ln = find(g, 'LayerElementNormal')[0]
    mapping = find(ln, 'MappingInformationType')[0]['props'][0]; ref = find(ln, 'ReferenceInformationType')[0]['props'][0]
    nrm = find(ln, 'Normals')[0]['props'][0]
    V = [vs[i:i + 3] for i in range(0, len(vs), 3)]
    c = [sum(v[i] for v in V) / len(V) for i in range(3)]
    polys, cur = [], []
    for i in idx:
        if i < 0: cur.append(~i); polys.append(cur); cur = []
        else: cur.append(i)
    bad_wind = bad_norm = 0; k = 0
    for poly in polys:
        a, b, d = V[poly[0]], V[poly[1]], V[poly[2]]
        u = [b[i] - a[i] for i in range(3)]; w = [d[i] - a[i] for i in range(3)]
        fn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
        fc = [sum(V[j][i] for j in poly) / len(poly) for i in range(3)]
        out = [fc[i] - c[i] for i in range(3)]
        if sum(fn[i] * out[i] for i in range(3)) <= 0: bad_wind += 1
        nidx = find(ln, 'NormalsIndex')[0]['props'][0] if find(ln, 'NormalsIndex') else None
        for j, vi in enumerate(poly):
            key = (k + j) if mapping == 'ByPolygonVertex' else vi
            if ref == 'IndexToDirect' and nidx is not None: key = nidx[key]
            nn = nrm[key * 3:key * 3 + 3]
            if sum(nn[i] * out[i] for i in range(3)) <= 0: bad_norm += 1; break
        k += len(poly)
    print(f'{nm:18s} polys={len(polys):4d} mapping={mapping}/{ref} inward-wound={bad_wind} inward-normals={bad_norm}')
