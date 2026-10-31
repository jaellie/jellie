#!/usr/bin/env python3
"""Generates the authoritative Test Town layout.

Outputs (both from the numbers below, so they never drift):
  Assets/DrivingSim/Resources/Layouts/TestTownLayout.json  - read by Unity (greybox, gameplay, tests) and Blender
  Tools/asset-spec/test-town-plan.svg                       - top-down plan for humans

Coordinates are Unity world space: meters, Y up, +Z north, +X east, right-hand traffic.
Polygons are flat [x0, z0, x1, z1, ...] lists. Run: python3 Tools/asset-spec/generate_test_town_layout.py
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(os.path.dirname(HERE))
JSON_OUT = os.path.join(PROJECT, "Assets", "DrivingSim", "Resources", "Layouts", "TestTownLayout.json")
SVG_OUT = os.path.join(HERE, "test-town-plan.svg")

# ---- cross-section constants -------------------------------------------------------------
ROAD_Y = 0.0            # carriageway surface
CURB_H = 0.15           # sidewalk/block surface = ROAD_Y + CURB_H
CURB_W = 0.20           # curb stone width, part of the sidewalk
SIDEWALK_W = 3.0
MARK_W = 0.15           # lane line width
STOP_W = 0.45           # stop line depth (along travel)
STOP_GAP = 2.0          # stop line to crosswalk
CW_DEPTH = 4.0          # crosswalk depth (along travel)
CW_STRIPE, CW_GAP = 0.45, 0.45
CORNER_R = 6.0          # curb return radius at junctions
SIGNAL_HEAD_Y = 4.75    # head center height (bottom >= 4.5 m)

MAIN_HALF = 6.5         # main road: 2+2 lanes x 3.25 m, runs north-south (along Z)
MAIN_LANE = 3.25
CROSS_HALF = 3.0        # cross street and perimeter streets: 1+1 lanes x 3.0 m
CROSS_LANE = 3.0
PERIM_X, PERIM_Z = 100.0, 120.0   # perimeter street centerlines
PERIM_TURN_R = 12.0     # perimeter corner centerline radius (curbs 9 / 15)
WORLD = 160.0           # ground plane half-size

def rect(x0, z0, x1, z1):
    return [x0, z0, x1, z0, x1, z1, x0, z1]

def r2(v):
    return [round(x, 3) for x in v]

layout = {
    "version": 1,
    "name": "TestTown",
    "units": "meters",
    "axes": "Unity world: Y up, +Z north, +X east. Right-hand traffic.",
    "roadSurfaceY": ROAD_Y, "curbHeight": CURB_H, "curbWidth": CURB_W, "sidewalkWidth": SIDEWALK_W,
    "blockGroundY": ROAD_Y + CURB_H, "worldHalfSize": WORLD,
    "roads": [], "corners": [], "intersections": [], "crosswalks": [], "stopLines": [],
    "laneMarkings": [], "signals": [], "signalCycle": [], "keepOut": [], "decorationZones": [], "spawns": [],
}

# ---- roads (carriageway rectangles; curbs at the edges) ----------------------------------
def road(id_, axis, center, a, b, lanes_pos, lanes_neg, lane_w, center_line):
    half = (lanes_pos + lanes_neg) * lane_w / 2
    pts = rect(center - half, a, center + half, b) if axis == "z" else rect(a, center - half, b, center + half)
    layout["roads"].append({"id": id_, "axis": axis, "center": center, "from": a, "to": b,
                            "lanesPositive": lanes_pos, "lanesNegative": lanes_neg, "laneWidth": lane_w,
                            "width": half * 2, "centerLine": center_line, "points": r2(pts)})

road("Main", "z", 0.0, -(PERIM_Z - CROSS_HALF), PERIM_Z - CROSS_HALF, 2, 2, MAIN_LANE, "double_yellow")
road("Cross", "x", 0.0, -(PERIM_X - CROSS_HALF), PERIM_X - CROSS_HALF, 1, 1, CROSS_LANE, "yellow")
for name, axis, c in (("North", "x", PERIM_Z), ("South", "x", -PERIM_Z), ("East", "z", PERIM_X), ("West", "z", -PERIM_X)):
    span = PERIM_X if axis == "x" else PERIM_Z
    road(name, axis, c, -span, span, 1, 1, CROSS_LANE, "yellow")

# ---- junction curb returns ---------------------------------------------------------------
def corner(id_, cx, cz, r, quadrant):
    layout["corners"].append({"id": id_, "center": r2([cx, cz]), "radius": r, "quadrant": quadrant})

# center intersection (main x cross)
for q, sx, sz in (("NE", 1, 1), ("NW", -1, 1), ("SE", 1, -1), ("SW", -1, -1)):
    corner("X0_" + q, sx * (MAIN_HALF + CORNER_R), sz * (CROSS_HALF + CORNER_R), CORNER_R, q)
# T junctions: main meets North/South, cross meets East/West
for sx in (1, -1):
    corner("TN_" + ("E" if sx > 0 else "W"), sx * (MAIN_HALF + CORNER_R), PERIM_Z - CROSS_HALF - CORNER_R, CORNER_R, ("SE" if sx > 0 else "SW"))
    corner("TS_" + ("E" if sx > 0 else "W"), sx * (MAIN_HALF + CORNER_R), -(PERIM_Z - CROSS_HALF - CORNER_R), CORNER_R, ("NE" if sx > 0 else "NW"))
for sz in (1, -1):
    corner("TE_" + ("N" if sz > 0 else "S"), PERIM_X - CROSS_HALF - CORNER_R, sz * (CROSS_HALF + CORNER_R), CORNER_R, ("NW" if sz > 0 else "SW"))
    corner("TW_" + ("N" if sz > 0 else "S"), -(PERIM_X - CROSS_HALF - CORNER_R), sz * (CROSS_HALF + CORNER_R), CORNER_R, ("NE" if sz > 0 else "SE"))
# perimeter bends: inner curb radius = turn radius - half width
for q, sx, sz in (("NE", 1, 1), ("NW", -1, 1), ("SE", 1, -1), ("SW", -1, -1)):
    corner("P_" + q, sx * (PERIM_X - PERIM_TURN_R), sz * (PERIM_Z - PERIM_TURN_R), PERIM_TURN_R - CROSS_HALF, q)

layout["intersections"] = [
    {"id": "X0", "type": "signalized", "center": [0.0, 0.0], "points": r2(rect(-MAIN_HALF, -CROSS_HALF, MAIN_HALF, CROSS_HALF))},
    {"id": "TN", "type": "stop_controlled", "center": [0.0, PERIM_Z], "points": r2(rect(-MAIN_HALF, PERIM_Z - CROSS_HALF, MAIN_HALF, PERIM_Z + CROSS_HALF))},
    {"id": "TS", "type": "stop_controlled", "center": [0.0, -PERIM_Z], "points": r2(rect(-MAIN_HALF, -PERIM_Z - CROSS_HALF, MAIN_HALF, -PERIM_Z + CROSS_HALF))},
    {"id": "TE", "type": "stop_controlled", "center": [PERIM_X, 0.0], "points": r2(rect(PERIM_X - CROSS_HALF, -CROSS_HALF, PERIM_X + CROSS_HALF, CROSS_HALF))},
    {"id": "TW", "type": "stop_controlled", "center": [-PERIM_X, 0.0], "points": r2(rect(-PERIM_X - CROSS_HALF, -CROSS_HALF, -PERIM_X + CROSS_HALF, CROSS_HALF))},
]

# ---- crosswalks and stop lines at X0 -----------------------------------------------------
cw_main_near = CROSS_HALF + CORNER_R + 1.0           # 10.0: 1 m past the end of the curb return
cw_cross_near = MAIN_HALF + CORNER_R + 1.0           # 13.5
def crosswalk(id_, pts, stripe_axis):
    layout["crosswalks"].append({"id": id_, "intersection": "X0", "stripeAxis": stripe_axis,
                                 "stripeWidth": CW_STRIPE, "stripeGap": CW_GAP, "points": r2(pts)})
crosswalk("CW_N", rect(-MAIN_HALF, cw_main_near, MAIN_HALF, cw_main_near + CW_DEPTH), "z")
crosswalk("CW_S", rect(-MAIN_HALF, -cw_main_near - CW_DEPTH, MAIN_HALF, -cw_main_near), "z")
crosswalk("CW_E", rect(cw_cross_near, -CROSS_HALF, cw_cross_near + CW_DEPTH, CROSS_HALF), "x")
crosswalk("CW_W", rect(-cw_cross_near - CW_DEPTH, -CROSS_HALF, -cw_cross_near, CROSS_HALF), "x")

def stop(id_, inter, approach, pts):
    layout["stopLines"].append({"id": id_, "intersection": inter, "approach": approach, "width": STOP_W, "points": r2(pts)})
s_main = cw_main_near + CW_DEPTH + STOP_GAP          # 16.0
s_cross = cw_cross_near + CW_DEPTH + STOP_GAP        # 19.5
# NB drives +Z on x>0; SB drives -Z on x<0; EB drives +X on z<0; WB drives -X on z>0.
stop("SL_X0_NB", "X0", "NB", rect(0.2, -s_main - STOP_W, MAIN_HALF, -s_main))
stop("SL_X0_SB", "X0", "SB", rect(-MAIN_HALF, s_main, -0.2, s_main + STOP_W))
stop("SL_X0_EB", "X0", "EB", rect(-s_cross - STOP_W, -CROSS_HALF, -s_cross, -0.1))
stop("SL_X0_WB", "X0", "WB", rect(s_cross, 0.1, s_cross + STOP_W, CROSS_HALF))
t_main = PERIM_Z - CROSS_HALF - CORNER_R - 1.0       # 110.0
t_cross = PERIM_X - CROSS_HALF - CORNER_R - 1.0      # 90.0
stop("SL_TN_NB", "TN", "NB", rect(0.2, t_main - STOP_W, MAIN_HALF, t_main))
stop("SL_TS_SB", "TS", "SB", rect(-MAIN_HALF, -t_main, -0.2, -t_main + STOP_W))
stop("SL_TE_EB", "TE", "EB", rect(t_cross - STOP_W, -CROSS_HALF, t_cross, -0.1))
stop("SL_TW_WB", "TW", "WB", rect(-t_cross, 0.1, -t_cross + STOP_W, CROSS_HALF))

# ---- lane markings ------------------------------------------------------------------------
def mark(id_, kind, axis, offset, a, b, width=MARK_W, dash=0.0, gap=0.0):
    layout["laneMarkings"].append({"id": id_, "type": kind, "axis": axis, "offset": offset, "from": a, "to": b,
                                   "width": width, "dash": dash, "gap": gap})
SOLID_APPROACH = 30.0   # solid white lane lines before a stop line (no lane changes)
for side, sgn in (("S", -1), ("N", 1)):
    near, far = s_main, t_main if sgn > 0 else t_main
    # yellow double center line, both halves
    lo, hi = (near, PERIM_Z - CROSS_HALF) if sgn > 0 else (-(PERIM_Z - CROSS_HALF), -near)
    mark(f"Main_{side}_CL_L", "yellow_solid", "z", -0.125, lo, hi)
    mark(f"Main_{side}_CL_R", "yellow_solid", "z", 0.125, lo, hi)
    # lane divider in each direction: solid near X0, dashed (3 m / 5 m) elsewhere
    for x in (-MAIN_LANE, MAIN_LANE):
        tag = "E" if x > 0 else "W"
        if sgn > 0:
            mark(f"Main_{side}_{tag}_solid", "white_solid", "z", x, near, near + SOLID_APPROACH)
            mark(f"Main_{side}_{tag}_dash", "white_dashed", "z", x, near + SOLID_APPROACH, t_main - SOLID_APPROACH, dash=3.0, gap=5.0)
            mark(f"Main_{side}_{tag}_solidT", "white_solid", "z", x, t_main - SOLID_APPROACH, t_main)
        else:
            mark(f"Main_{side}_{tag}_solid", "white_solid", "z", x, -near - SOLID_APPROACH, -near)
            mark(f"Main_{side}_{tag}_dash", "white_dashed", "z", x, -t_main + SOLID_APPROACH, -near - SOLID_APPROACH, dash=3.0, gap=5.0)
            mark(f"Main_{side}_{tag}_solidT", "white_solid", "z", x, -t_main, -t_main + SOLID_APPROACH)
for side, lo, hi in (("E", s_cross, PERIM_X - CROSS_HALF), ("W", -(PERIM_X - CROSS_HALF), -s_cross)):
    mark(f"Cross_{side}_CL", "yellow_solid", "x", 0.0, lo, hi)
for name, axis, c, span in (("North", "x", PERIM_Z, PERIM_X - PERIM_TURN_R), ("South", "x", -PERIM_Z, PERIM_X - PERIM_TURN_R),
                            ("East", "z", PERIM_X, PERIM_Z - PERIM_TURN_R), ("West", "z", -PERIM_X, PERIM_Z - PERIM_TURN_R)):
    mark(f"{name}_CL", "yellow_solid", axis, c, -span, span)

# ---- traffic signals at X0 (far side, Korean style) ---------------------------------------
pole_off = MAIN_HALF + 1.5          # 8.0: on the main-road sidewalk, 1.5 m behind the curb face
def signal(id_, approach, kind, pole, head, yaw, arm):
    layout["signals"].append({"id": id_, "intersection": "X0", "approach": approach, "type": kind,
                              "pole": r2([pole[0], ROAD_Y + CURB_H, pole[1]]), "head": r2(head), "yawDeg": yaw,
                              "armLength": round(arm, 3), "lamps": ["red", "yellow", "left_arrow", "green"] if kind == "4lamp" else ["red", "yellow", "green"]})
far_main = cw_main_near + CW_DEPTH + 1.5     # 15.5: just past the far crosswalk
far_cross = cw_cross_near + CW_DEPTH + 1.0   # 18.5
lane_c_main = MAIN_LANE                      # head centered over the lane divider of the approach
signal("SIG_X0_NB", "NB", "4lamp", (pole_off, far_main), (lane_c_main, SIGNAL_HEAD_Y, far_main), 180.0, pole_off - lane_c_main)
signal("SIG_X0_SB", "SB", "4lamp", (-pole_off, -far_main), (-lane_c_main, SIGNAL_HEAD_Y, -far_main), 0.0, pole_off - lane_c_main)
signal("SIG_X0_EB", "EB", "3lamp", (far_cross, -(CROSS_HALF + 1.5)), (far_cross, SIGNAL_HEAD_Y, -CROSS_LANE / 2), 270.0, 1.5 + CROSS_LANE / 2 + 0.0)
signal("SIG_X0_WB", "WB", "3lamp", (-far_cross, CROSS_HALF + 1.5), (-far_cross, SIGNAL_HEAD_Y, CROSS_LANE / 2), 90.0, 1.5 + CROSS_LANE / 2 + 0.0)
# yawDeg: rotation about +Y of the lamp-face normal, 0 = lamps face +Z (seen by southbound drivers), 90 = +X, 180 = -Z, 270 = -X.

layout["signalCycle"] = [
    {"phase": "main_green", "durationS": 20.0, "main": "green", "cross": "red"},
    {"phase": "main_yellow", "durationS": 3.0, "main": "yellow", "cross": "red"},
    {"phase": "all_red_1", "durationS": 2.0, "main": "red", "cross": "red"},
    {"phase": "cross_green", "durationS": 15.0, "main": "red", "cross": "green"},
    {"phase": "cross_yellow", "durationS": 3.0, "main": "red", "cross": "yellow"},
    {"phase": "all_red_2", "durationS": 2.0, "main": "red", "cross": "red"},
]

# ---- keep-out zones -----------------------------------------------------------------------
def keep(id_, kind, pts, max_h, note):
    layout["keepOut"].append({"id": id_, "kind": kind, "maxHeight": max_h, "note": note, "points": r2(pts)})
for r in layout["roads"]:
    keep("KO_" + r["id"], "carriageway", r["points"], 0.0, "Road surface: markings only.")
for i in layout["intersections"]:
    keep("KO_" + i["id"], "carriageway", i["points"], 0.0, "Junction box: markings only.")
for cw in layout["crosswalks"]:
    xs, zs = cw["points"][0::2], cw["points"][1::2]
    x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs)
    if cw["stripeAxis"] == "z":
        pts = rect(x0 - SIDEWALK_W, z0 - 1.0, x1 + SIDEWALK_W, z1 + 1.0)
    else:
        pts = rect(x0 - 1.0, z0 - SIDEWALK_W, x1 + 1.0, z1 + SIDEWALK_W)
    keep("KO_" + cw["id"] + "_landing", "crosswalk_landing", pts, 0.0, "Crosswalk and its sidewalk landings, 1 m margin.")
for q, sx, sz in (("NE", 1, 1), ("NW", -1, 1), ("SE", 1, -1), ("SW", -1, -1)):
    cx, cz, leg = sx * MAIN_HALF, sz * CROSS_HALF, 15.0
    keep("KO_X0_sight_" + q, "sight_triangle", [cx, cz, cx + sx * leg, cz, cx, cz + sz * leg], 0.9,
         "Nothing taller than 0.9 m except signal and street-light poles (<= 0.3 m diameter).")
for s in layout["signals"]:
    px, pz = s["pole"][0], s["pole"][2]
    keep("KO_" + s["id"], "signal_reserve", rect(px - 1.0, pz - 1.0, px + 1.0, pz + 1.0), 0.0, "Reserved for the signal pole.")
spawn = {"id": "Default", "position": [MAIN_LANE * 1.5, ROAD_Y, -80.0], "yawDeg": 0.0, "note": "Northbound outer lane, 64 m before the X0 stop line."}
layout["spawns"].append(spawn)
keep("KO_Spawn", "spawn_clear", rect(spawn["position"][0] - 4, -90.0, spawn["position"][0] + 4, -70.0), 0.0, "Spawn area must stay clear.")

# ---- decoration zones (keep-outs above override these) ------------------------------------
def zone(id_, kind, pts, note):
    layout["decorationZones"].append({"id": id_, "kind": kind, "note": note, "points": r2(pts)})
inner_x0, inner_x1 = MAIN_HALF + SIDEWALK_W, PERIM_X - CROSS_HALF - SIDEWALK_W     # 9.5 .. 94
inner_z0, inner_z1 = CROSS_HALF + SIDEWALK_W, PERIM_Z - CROSS_HALF - SIDEWALK_W    # 6 .. 114
SETBACK = 1.0
for q, sx, sz in (("NE", 1, 1), ("NW", -1, 1), ("SE", 1, -1), ("SW", -1, -1)):
    a, b = sorted((sx * (inner_x0 + SETBACK), sx * (inner_x1 - SETBACK)))
    c, d = sorted((sz * (inner_z0 + SETBACK), sz * (inner_z1 - SETBACK)))
    zone("Block_" + q, "building", rect(a, c, b, d), "Buildings, walls, trees. 1 m setback from the sidewalk already applied.")
outer = PERIM_X + CROSS_HALF + SIDEWALK_W + SETBACK    # 107
outer_z = PERIM_Z + CROSS_HALF + SIDEWALK_W + SETBACK  # 127
zone("Outer_N", "background", rect(-WORLD, outer_z, WORLD, WORLD), "Background buildings, low detail.")
zone("Outer_S", "background", rect(-WORLD, -WORLD, WORLD, -outer_z), "Background buildings, low detail.")
zone("Outer_E", "background", rect(outer, -outer_z, WORLD, outer_z), "Background buildings, low detail.")
zone("Outer_W", "background", rect(-WORLD, -outer_z, -outer, outer_z), "Background buildings, low detail.")
layout["furnitureBand"] = {"fromCurbFace": CURB_W, "toCurbFace": 0.8,
                           "note": "Street lights, signs, bollards and trees go in this band on every sidewalk, outside keep-outs. The rest of the sidewalk is a clear walkway."}

os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
with open(JSON_OUT, "w") as f:
    json.dump(layout, f, indent=1)
    f.write("\n")

# ---- SVG plan --------------------------------------------------------------------------------
S = 4.0  # px per meter
def P(x, z):
    return (round((x + WORLD) * S, 1), round((WORLD - z) * S, 1))
def poly(pts, fill, stroke="none", sw=0, op=1.0):
    p = " ".join("%s,%s" % P(pts[i], pts[i + 1]) for i in range(0, len(pts), 2))
    return f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" opacity="{op}"/>'
W = int(WORLD * 2 * S)
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" width="{W}" height="{W}" font-family="sans-serif">',
       f'<rect width="{W}" height="{W}" fill="#cfd6cc"/>']
for z in layout["decorationZones"]:
    out.append(poly(z["points"], "#b7c4ad" if z["kind"] == "building" else "#c3cbbd"))
for r in layout["roads"]:
    xs, zs = r["points"][0::2], r["points"][1::2]
    w = SIDEWALK_W
    out.append(poly(rect(min(xs) - (w if r["axis"] == "z" else 0), min(zs) - (w if r["axis"] == "x" else 0),
                         max(xs) + (w if r["axis"] == "z" else 0), max(zs) + (w if r["axis"] == "x" else 0)), "#e4e4df"))
for r in layout["roads"]:
    out.append(poly(r["points"], "#555b61"))
for i in layout["intersections"]:
    out.append(poly(i["points"], "#555b61"))
for c in layout["corners"]:
    cx, cz = P(*c["center"])
    out.append(f'<circle cx="{cx}" cy="{cz}" r="{c["radius"] * S}" fill="none" stroke="#8e949a" stroke-width="1.5" stroke-dasharray="4 3"/>')
for m in layout["laneMarkings"]:
    col = "#e5b53f" if m["type"].startswith("yellow") else "#ffffff"
    dash = 'stroke-dasharray="%s %s"' % (m["dash"] * S, m["gap"] * S) if m["dash"] else ""
    if m["axis"] == "z":
        (x0, y0), (x1, y1) = P(m["offset"], m["from"]), P(m["offset"], m["to"])
    else:
        (x0, y0), (x1, y1) = P(m["from"], m["offset"]), P(m["to"], m["offset"])
    out.append(f'<line x1="{x0}" y1="{y0}" x2="{x1}" y2="{y1}" stroke="{col}" stroke-width="{max(1, m["width"] * S)}" {dash}/>')
for cw in layout["crosswalks"]:
    out.append(poly(cw["points"], "#ffffff", op=0.85))
for s in layout["stopLines"]:
    out.append(poly(s["points"], "#ffffff"))
for k in layout["keepOut"]:
    if k["kind"] in ("sight_triangle", "crosswalk_landing", "spawn_clear"):
        out.append(poly(k["points"], "#ff5d55" if k["kind"] != "spawn_clear" else "#45d0b4", "#c0392b", 1, 0.25))
for s in layout["signals"]:
    px, pz = P(s["pole"][0], s["pole"][2]); hx, hz = P(s["head"][0], s["head"][2])
    out.append(f'<line x1="{px}" y1="{pz}" x2="{hx}" y2="{hz}" stroke="#111" stroke-width="3"/><circle cx="{px}" cy="{pz}" r="5" fill="#111"/><rect x="{hx - 6}" y="{hz - 6}" width="12" height="12" fill="#ffb54a"/>')
sx, sz = P(spawn["position"][0], spawn["position"][2])
out.append(f'<path d="M{sx} {sz - 14} l9 22 h-18 z" fill="#1f6feb"/>')
out.append(f'<text x="12" y="28" font-size="22" fill="#222">TestTownLayout v1 · 1 px = 0.25 m · +Z up the page (north) · red = keep-out · green = spawn</text>')
out.append("</svg>")
with open(SVG_OUT, "w") as f:
    f.write("\n".join(out))
print("wrote", os.path.relpath(JSON_OUT, PROJECT), "and", os.path.relpath(SVG_OUT, PROJECT))
print("roads", len(layout["roads"]), "crosswalks", len(layout["crosswalks"]), "stopLines", len(layout["stopLines"]),
      "signals", len(layout["signals"]), "keepOut", len(layout["keepOut"]), "markings", len(layout["laneMarkings"]))
