# build-layout.py — writes Resources/BGB/Data/layout.json (every place in the game).
# run: python3 tools/build-layout.py   then preview with: node tools/simulate.js <location> [flags...]
import json

def layer(name, sprite, z, width, row, x=0, at="horizon", order=0, when=None):
    d = {"name": name, "sprite": sprite, "z": z, "width": width, "x": x, "anchorRow": row, "anchorAt": at, "order": order}
    if when: d["when"] = when
    return d

def actor(id, x, z=0, face="", when=None):
    d = {"id": id, "x": x, "z": z, "face": face}
    if when: d["when"] = when
    return d

def anchor(id, layer, px, py): return {"id": id, "layer": layer, "px": px, "py": py}
def focus(id, x, y, zoom): return {"id": id, "x": x, "y": y, "zoom": zoom}
def hot(id, anchor=None, radius=1.0): return {"id": id, "anchor": anchor or id, "radius": radius}
def light(id, anchor, radius, intensity, kind="lamp", x=0, y=0): return {"id": id, "anchor": anchor, "radius": radius, "intensity": intensity, "kind": kind, "x": x, "y": y, "z": 0}

# shared outdoor layers
def town_far(): return layer("far", "layer_far", 30, 60, 760, order=-40)
def cobbles(): return [layer("ground", "layer_ground", 0.6, 22, 0, order=-20), layer("ground_wet", "layer_ground_wet", 0.59, 22, 0, order=-19)]

cast = [
    {"id": "bear", "sprites": "bear", "face": "neutral", "height": 2.5, "order": 10},
    {"id": "nini", "sprites": "nini", "face": "happy", "height": 1.35, "order": 11},
    {"id": "lily", "sprites": "lily", "face": "neutral", "height": 2.0, "order": 9},
    {"id": "finch", "sprites": "finch", "face": "neutral", "height": 1.95, "order": 9},
    {"id": "mabel", "sprites": "mabel", "face": "neutral", "height": 2.1, "order": 9},
    {"id": "oliver", "sprites": "oliver", "face": "neutral", "height": 2.25, "order": 9},
    {"id": "hazel", "sprites": "hazel", "face": "neutral", "height": 2.35, "order": 9},
    {"id": "fox", "sprites": "fox", "face": "neutral", "height": 2.25, "order": 9},
    {"id": "moss", "sprites": "moss", "face": "neutral", "height": 1.85, "order": 9},
    {"id": "niniadult", "sprites": "niniadult", "face": "neutral", "height": 2.3, "order": 11},
]

locations = []

# ---------- Bellflower Square ----------
locations.append({
    "id": "square",
    "layers": [town_far(), layer("mid", "layer_mid", 8, 30, 930, x=-4.0, order=-30), *cobbles(),
               layer("fg", "layer_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("bear", -0.9), actor("nini", 0.85, -0.3, "happy", ["!nini_gone"]),
               actor("finch", 2.6, 0.6, "", ["finch_square"]), actor("fox", -3.4, 0.4, "", ["fox_square"])],
    "anchors": [anchor("clock", "far", 1024, 380), anchor("gate", "mid", 1950, 800), anchor("lights", "mid", 1394, 800),
                anchor("puddle", "ground_wet", 1560, 150), anchor("lamp", "fg", 177, 250), anchor("stringC", "mid", 1024, 440),
                anchor("stall", "mid", 240, 760)],
    "focus": [focus("wide", 0, 0, 0), focus("title", 1.5, 0.45, -0.6), focus("bear", -0.6, -0.2, 2.2), focus("nini", 0.5, -0.35, 2.6),
              focus("both", 0, -0.2, 1.6), focus("clock", 0, 1.1, 1.2), focus("gate", 3.4, -0.1, 2.8), focus("puddle", 5.0, -0.95, 4.2),
              focus("finch", 1.9, -0.2, 2.4), focus("fox", -2.6, -0.2, 2.4)],
    "hotspots": [hot("nini", radius=0.9), hot("bear", radius=1.2), hot("clock", radius=2.8), hot("lights", radius=1.6),
                 hot("gate", radius=1.5), hot("puddle", radius=1.0), hot("finch", radius=1.0), hot("fox", radius=1.0)],
    "lights": [light("lamp", "lamp", 3.2, 1.15), light("stringC", "stringC", 7, 0.55, "string"), light("stall", "stall", 4, 0.5),
               light("hospital", "gate", 5, 0, "fluorescent", y=1.6)],
})

# ---------- Lily's flower shop ----------
locations.append({
    "id": "flower",
    "layers": [town_far(), layer("mid", "flower_mid", 8, 20, 930, x=0, order=-30), *cobbles()],
    "actors": [actor("bear", -2.2), actor("lily", 1.4, 0.3, "", ["!lily_gone"])],
    "anchors": [anchor("shopclock", "mid", 1460, 712), anchor("garland", "mid", 600, 660), anchor("buckets", "mid", 1050, 860),
                anchor("window", "mid", 1160, 760), anchor("lamp", "mid", 1708, 390)],
    "focus": [focus("wide", 0, 0, 0), focus("lily", 0.9, -0.2, 2.4), focus("bear", -1.8, -0.2, 2.4),
              focus("shopclock", 2.4, 0.4, 3.2), focus("garland", -1.8, 0.4, 2.8)],
    "hotspots": [hot("lily", radius=1.0), hot("shopclock", radius=0.9), hot("garland", radius=1.2), hot("buckets", radius=1.6)],
    "lights": [light("window", "window", 7, 0.9), light("lamp", "lamp", 4, 0.9), light("hospital", "window", 5, 0, "fluorescent")],
})

# ---------- Mabel's cafe (two versions of the same room) ----------
locations.append({
    "id": "cafe",
    "layers": [layer("far", "cafe_far", 14, 30, 1000, order=-40),
               layer("mid_a", "cafe_mid_a", 8, 22, 930, order=-30, when=["!cafe_changed"]),
               layer("mid_b", "cafe_mid_b", 8, 22, 930, order=-30, when=["cafe_changed"]),
               layer("ground", "cafe_floor", 0.6, 22, 0, order=-20),
               layer("fg", "cafe_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("bear", -2.0), actor("mabel", 2.2, 0.3, "", ["!mabel_gone"])],
    "anchors": [anchor("window_a", "mid_a", 410, 500), anchor("window_b", "mid_b", 1630, 500), anchor("cafeclock", "mid_b", 1024, 230),
                anchor("floor", "ground", 1024, 120), anchor("pendant", "far", 1024, 200), anchor("counter_a", "mid_a", 1340, 640),
                anchor("counter_b", "mid_b", 620, 640)],
    "focus": [focus("wide", 0, 0, 0), focus("mabel", 1.6, -0.2, 2.4), focus("bear", -1.6, -0.2, 2.4),
              focus("window", -2.0, 0.6, 2.0), focus("cafeclock", 0, 1.0, 2.0), focus("floor", 0, -1.0, 2.6)],
    "hotspots": [hot("mabel", radius=1.0), hot("window", "window_a", 1.8), hot("window", "window_b", 1.8), hot("cafeclock", radius=1.0),
                 hot("floor", radius=1.4)],
    "lights": [light("pendant", "pendant", 9, 0.9), light("counter", "counter_a", 5, 0.6), light("counter_b", "counter_b", 5, 0.6),
               light("hospital", "pendant", 6, 0, "fluorescent")],
})

# ---------- the park ----------
locations.append({
    "id": "park",
    "layers": [layer("far", "park_far", 30, 60, 760, order=-40), layer("mid", "park_mid", 8, 30, 930, x=-2.0, order=-30),
               layer("ground", "park_ground", 0.6, 22, 0, order=-20), layer("fg", "park_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("bear", -2.4), actor("oliver", 1.4, 0.3, "", ["!oliver_gone"])],
    "anchors": [anchor("notice", "mid", 1500, 700), anchor("bench", "mid", 800, 800), anchor("lamp", "mid", 1158, 430)],
    "focus": [focus("wide", 0, 0, 0), focus("oliver", 1.0, -0.2, 2.4), focus("notice", 2.6, 0.2, 3.0), focus("bench", -1.6, -0.3, 2.4)],
    "hotspots": [hot("oliver", radius=1.0), hot("notice", radius=1.4), hot("bench", radius=1.4)],
    "lights": [light("lamp", "lamp", 6, 1.0), light("hospital", "notice", 5, 0, "fluorescent", y=1.0)],
})

# ---------- the town gate and the pump house ----------
locations.append({
    "id": "gate",
    "layers": [layer("far", "gate_far", 30, 60, 760, order=-40), layer("mid", "gate_mid", 8, 20, 930, x=-1.0, order=-30),
               layer("ground", "road_ground", 0.6, 22, 0, order=-20), layer("ground_wet", "layer_ground_wet", 0.59, 22, 0, order=-19),
               layer("fg", "gate_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("bear", -2.6), actor("moss", 1.6, 0.3, "", ["!moss_gone"])],
    "anchors": [anchor("pump", "mid", 1580, 780), anchor("repair", "mid", 1765, 880), anchor("arch", "mid", 1025, 340),
                anchor("alarm", "mid", 1880, 640), anchor("lamp", "mid", 428, 430), anchor("pumpwin", "mid", 1760, 720)],
    "focus": [focus("wide", 0, 0, 0), focus("moss", 1.0, -0.2, 2.4), focus("pump", 3.2, 0.0, 3.0), focus("arch", 0, 0.8, 1.6)],
    "hotspots": [hot("moss", radius=0.9), hot("pump", radius=1.2), hot("repair", radius=0.9), hot("arch", radius=1.8)],
    "lights": [light("lamp", "lamp", 6, 1.0), light("pumpwin", "pumpwin", 4, 0.7), light("hospital", "pump", 5, 0, "fluorescent", y=1.0)],
})

# ---------- under the square ----------
locations.append({
    "id": "passage",
    "layers": [layer("far", "passage_far", 20, 50, 1000, order=-40), layer("mid", "passage_mid", 8, 22, 930, x=-1.0, order=-30),
               layer("ground", "passage_water", 0.6, 22, 0, order=-20), layer("fg", "passage_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("bear", -1.4, 0, "worried"), actor("nini", 1.4, -0.3, "worried", ["nini_in_passage"])],
    "anchors": [anchor("hatch", "mid", 1625, 475), anchor("crates", "mid", 1580, 780), anchor("water", "ground", 1024, 200),
                anchor("deep", "far", 1024, 720), anchor("bulb1", "mid", 420, 352), anchor("bulb2", "mid", 1100, 352)],
    "focus": [focus("wide", 0, 0, 0), focus("hatch", 3.4, 0.6, 3.0), focus("nini", 1.0, -0.3, 2.6), focus("both", 0, -0.2, 1.8),
              focus("deep", 0, 0.4, 3.0), focus("bear", -1.0, -0.2, 2.6)],
    "hotspots": [hot("hatch", radius=1.4), hot("crates", radius=1.6), hot("water", radius=1.6), hot("deep", radius=2.0), hot("nini", radius=0.9)],
    "lights": [light("bulb1", "bulb1", 5, 0.8, "cold"), light("bulb2", "bulb2", 5, 0.7, "cold"), light("hatch", "hatch", 6, 1.0),
               light("hospital", "deep", 6, 0, "fluorescent")],
})

# ---------- a bright room ----------
locations.append({
    "id": "hospital",
    "layers": [layer("far", "hospital_far", 14, 30, 1000, order=-40), layer("mid", "hospital_mid", 8, 22, 930, order=-30),
               layer("ground", "hospital_floor", 0.6, 22, 0, order=-20), layer("fg", "hospital_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("hazel", 2.4, 0.4)],
    "anchors": [anchor("monitor", "mid", 1660, 500), anchor("flowers", "mid", 1215, 600), anchor("chair", "mid", 860, 580), anchor("window", "far", 1510, 400),
                anchor("ceiling", "far", 380, 160)],
    "focus": [focus("wide", 0, 0, 0), focus("flowers", 0.6, 0.2, 3.0), focus("ceiling", -1.2, 1.4, 1.6), focus("monitor", 2.6, 0.6, 3.0), focus("hazel", 1.8, -0.2, 2.4)],
    "hotspots": [hot("monitor", radius=1.2), hot("flowers", radius=1.0), hot("chair", radius=1.0), hot("hazel", radius=1.0)],
    "lights": [light("ceiling", "ceiling", 14, 1.0, "cold"), light("hospital", "monitor", 4, 0, "fluorescent")],
})

# ---------- years later ----------
locations.append({
    "id": "attic",
    "layers": [layer("far", "attic_far", 14, 30, 1000, order=-40), layer("mid", "attic_mid", 8, 22, 930, order=-30),
               layer("ground", "attic_floor", 0.6, 22, 0, order=-20), layer("fg", "attic_fg", -4, 9, 0, at="viewTop", order=40)],
    "actors": [actor("niniadult", -0.4, 0)],
    "anchors": [anchor("box", "mid", 1475, 740), anchor("window", "far", 1024, 420)],
    "focus": [focus("wide", 0, 0, 0), focus("box", 1.8, -0.2, 3.4), focus("nini", -0.3, -0.1, 2.4), focus("window", 0, 1.2, 1.8)],
    "hotspots": [hot("box", radius=1.0), hot("window", radius=2.0)],
    "lights": [light("window", "window", 14, 1.0, "day"), light("hospital", "box", 4, 0, "fluorescent")],
})

layout = {"camera": {"fov": 36, "y": 1.35, "z": -10, "parallax": 0.25}, "horizon": {"y": 1.0, "z": 0.6},
          "cast": cast, "locations": locations}
out = "Assets/BigGreenBear/Resources/BGB/Data/layout.json"
json.dump(layout, open(out, "w"), indent=1)
print("wrote", out, "with", len(locations), "locations")
