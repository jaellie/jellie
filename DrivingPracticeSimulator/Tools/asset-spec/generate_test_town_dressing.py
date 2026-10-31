#!/usr/bin/env python3
"""Generates Test Town street dressing (signs and parked vehicles) on top of the road layout.

Reads  Assets/DrivingSim/Resources/Layouts/TestTownLayout.json   (authoritative, NOT modified)
Writes Assets/DrivingSim/Resources/Layouts/TestTownDressing.json

Every item is checked against the layout: nothing on a carriageway (except the stopped bus, explicitly marked
onRoad and placed in the southbound outer lane away from junctions), nothing in crosswalk landings, signal
reserves or the spawn zone, parked cars only inside building blocks.
Coordinates: Unity world meters (Y up, +Z north, +X east). yawDeg = direction the sign face / vehicle front points
(0 = +Z, 90 = +X, 180 = -Z, 270 = -X).
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(os.path.dirname(HERE))
LAYOUT = os.path.join(PROJECT, "Assets", "DrivingSim", "Resources", "Layouts", "TestTownLayout.json")
OUT = os.path.join(PROJECT, "Assets", "DrivingSim", "Resources", "Layouts", "TestTownDressing.json")

L = json.load(open(LAYOUT))
top = L["blockGroundY"]
main_half = next(r for r in L["roads"] if r["id"] == "Main")["width"] / 2      # 6.5
cross_half = next(r for r in L["roads"] if r["id"] == "Cross")["width"] / 2    # 3.0
band = main_half + 0.9      # sign poles 0.9 m behind the curb face (inside the 0.2-0.8 m furniture band + pole radius)
cband = cross_half + 0.9

signs, props = [], []
def sign(id_, kind, x, z, yaw, value="", lines=None, face_h=2.2, size=(0.6, 0.6), prefab=""):
    signs.append({"id": id_, "type": kind, "value": value, "lines": lines or [], "position": [round(x, 3), top, round(z, 3)],
                  "yawDeg": yaw, "faceHeight": face_h, "size": list(size), "prefab": prefab})
def prop(id_, kind, x, y, z, yaw, prefab, on_road=False):
    props.append({"id": id_, "kind": kind, "position": [round(x, 3), y, round(z, 3)], "yawDeg": yaw, "prefab": prefab, "onRoad": on_road})

# Speed limits: main road 50, cross street 30, on the right-hand side facing approaching drivers.
sign("SL50_NB", "speed_limit", band, -50, 180, "50", prefab="SM_Signal_Sign_SpeedLimit")
sign("SL50_SB", "speed_limit", -band, 50, 0, "50", prefab="SM_Signal_Sign_SpeedLimit")
sign("SL30_EB", "speed_limit", -45, -cband, 270, "30", prefab="SM_Signal_Sign_SpeedLimit")
sign("SL30_WB", "speed_limit", 45, cband, 90, "30", prefab="SM_Signal_Sign_SpeedLimit")
# Crosswalk ahead (blue square), just outside each crosswalk landing, before the stop line.
sign("CW_NB", "crosswalk", band, -17.2, 180, prefab="SM_Signal_Sign_Crosswalk")
sign("CW_SB", "crosswalk", -band, 17.2, 0, prefab="SM_Signal_Sign_Crosswalk")
sign("CW_EB", "crosswalk", -20.8, -cband, 270, prefab="SM_Signal_Sign_Crosswalk")
sign("CW_WB", "crosswalk", 20.8, cband, 90, prefab="SM_Signal_Sign_Crosswalk")
# Blue direction signs (fictional destinations), ground-mounted on wide posts.
sign("DIR_NB", "direction", band + 0.4, -42, 180, lines=["↑ 시청 City Hall", "→ 중앙로 Jungang-ro", "← 항구 Harbor"],
     face_h=3.2, size=(2.6, 1.4), prefab="SM_Signal_Sign_Direction")
sign("DIR_SB", "direction", -(band + 0.4), 42, 0, lines=["↑ 역 Station", "← 중앙로 Jungang-ro", "→ 항구 Harbor"],
     face_h=3.2, size=(2.6, 1.4), prefab="SM_Signal_Sign_Direction")
# No parking along the main road.
sign("NP_E", "no_parking", band, 30, 180, prefab="SM_Signal_Sign_NoParking")
sign("NP_W", "no_parking", -band, -30, 0, prefab="SM_Signal_Sign_NoParking")

# Bus stop on the southbound side, 70 m north of the junction; the bus waits in the outer lane.
props.append({"id": "BusShelter_SB", "kind": "bus_shelter", "position": [-(main_half + 1.9), top, 70.0], "yawDeg": 90.0,
              "prefab": "SM_Prop_BusShelter", "onRoad": False})
prop("Bus_SB", "city_bus", -(main_half - 1.625), 0.0, 70.0, 180.0, "SM_Prop_Bus_City", on_road=True)
sign("BUS_SB", "bus_stop", -(main_half + 0.9), 64.5, 0, prefab="SM_Signal_Sign_BusStop")

# Parked cars in two small surface lots inside the NE and SW blocks (behind the street-front buildings).
kinds = [("parked_car", "SM_Prop_Car_Sedan"), ("parked_suv", "SM_Prop_Car_SUV"), ("parked_car", "SM_Prop_Car_Hatch")]
for lot, (sx, sz) in (("NE", (1, 1)), ("SW", (-1, -1))):
    for i in range(5):
        kind, prefab = kinds[(i + (0 if lot == "NE" else 1)) % len(kinds)]
        prop(f"Car_{lot}_{i}", kind, sx * (29.0 + i * 2.7), top, sz * 30.0, 0.0 if sz > 0 else 180.0, prefab)

# ---------------- validation against the layout ----------------
def inside(poly, x, z):
    n, c = len(poly) // 2, False
    j = n - 1
    for i in range(n):
        xi, zi, xj, zj = poly[2*i], poly[2*i+1], poly[2*j], poly[2*j+1]
        if (zi > z) != (zj > z) and x < (xj - xi) * (z - zi) / (zj - zi + 1e-9) + xi:
            c = not c
        j = i
    return c
blocking = [k for k in L["keepOut"] if k["kind"] in ("carriageway", "crosswalk_landing", "signal_reserve", "spawn_clear")]
for s in signs:
    x, z = s["position"][0], s["position"][2]
    hits = [k["id"] for k in blocking if inside(k["points"], x, z)]
    assert not hits, f"sign {s['id']} in {hits}"
for p in props:
    x, z = p["position"][0], p["position"][2]
    if p["onRoad"]:
        for sl in L["stopLines"] + L["crosswalks"]:
            xs, zs = sl["points"][0::2], sl["points"][1::2]
            cx, cz = sum(xs) / len(xs), sum(zs) / len(zs)
            assert ((cx - x) ** 2 + (cz - z) ** 2) ** 0.5 > 30, f"{p['id']} too close to {sl['id']}"
        assert x < 0, f"{p['id']} must not block the northbound lanes"
        continue
    hits = [k["id"] for k in blocking if inside(k["points"], x, z)]
    assert not hits, f"prop {p['id']} in {hits}"
    if p["kind"].startswith("parked"):
        assert any(z_["kind"] == "building" and inside(z_["points"], x, z) for z_ in L["decorationZones"]), f"{p['id']} not in a block"

out = {"version": 1, "layoutVersion": L["version"], "note": "Street dressing on top of TestTownLayout.json. Generated; do not edit by hand.",
       "signs": signs, "props": props}
with open(OUT, "w") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote", os.path.relpath(OUT, PROJECT), "signs", len(signs), "props", len(props))
