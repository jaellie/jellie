# playtest.py — plays story.json with the same rules as SliceDirector.cs (no Unity needed).
# Checks: every run reaches the ending, no menu is ever empty, and estimates play time.
#   python3 tools/playtest.py
import json, random, sys

S = json.load(open("Assets/BigGreenBear/Resources/BGB/Data/story.json", encoding="utf-8"))
nodes = {n["id"]: n for n in S["nodes"]}

def check(conds, flags):
    for c in conds or []:
        c = c.strip()
        if not c: continue
        if ">=" in c:
            k, v = c.split(">="); ok = flags.get(k, 0) >= float(v)
        elif "<" in c:
            k, v = c.split("<"); ok = flags.get(k, 0) < float(v)
        elif c.startswith("!"): ok = flags.get(c[1:], 0) == 0
        else: ok = flags.get(c, 0) != 0
        if not ok: return False
    return True

def play(policy, seed, lang="ko", max_steps=20000):
    rnd = random.Random(seed)
    flags, seconds, picked, steps, lines = {}, 0.0, {}, 0, 0
    nid = S["start"]
    while nid and steps < max_steps:
        steps += 1
        n = nodes[nid]
        if n["branches"]:
            to = next((b["to"] for b in n["branches"] if check(b["conditions"], flags)), None)
            if to: nid = to; continue
        for e in n["effects"]:
            t = e["type"]
            if t == "setFlag": flags[e["id"]] = 0 if e.get("value") == "false" else 1
            elif t == "add": flags[e["id"]] = flags.get(e["id"], 0) + (e.get("num") or 1)
            elif t == "clue": flags["clue_" + e["id"]] = 1
            elif t == "go": seconds += 2.0
            elif t == "card": seconds += 7.0
            elif t == "wait": seconds += e.get("num", 0)
            elif t == "end": return True, seconds, steps, lines
        seconds += n.get("hold", 0)
        text = n["text"][lang]
        if text:
            lines += 1
            seconds += len(text) / 9.0 + 1.2   # reading + the click
        choices = [c for c in n["choices"] if check(c["conditions"], flags)]
        if n["choices"] and not choices:
            raise SystemExit(f"EMPTY MENU at {nid} with flags {sorted(k for k,v in flags.items() if v)}")
        if choices:
            seconds += 2.5
            if policy == "explorer":   # tries what it hasn't tried yet, like a curious player
                fresh = [c for c in choices if picked.get((nid, c["next"]), 0) == 0]
                c = rnd.choice(fresh or choices)
            else:
                c = rnd.choice(choices)
            picked[(nid, c["next"])] = picked.get((nid, c["next"]), 0) + 1
            for e in c["effects"]:
                t = e["type"]
                if t == "setFlag": flags[e["id"]] = 0 if e.get("value") == "false" else 1
                elif t == "add": flags[e["id"]] = flags.get(e["id"], 0) + (e.get("num") or 1)
                elif t == "go": seconds += 2.0
            nid = c["next"]
            continue
        nid = n["next"]
        if not nid: raise SystemExit(f"DEAD END after {n['id']}")
    return False, seconds, steps, lines

for policy in ("explorer", "random"):
    times, fails = [], 0
    for seed in range(300):
        ok, sec, steps, lines = play(policy, seed)
        if not ok: fails += 1
        else: times.append(sec)
    times.sort()
    print(f"{policy:9s}: {300 - fails}/300 reached the ending; "
          f"play time min {times[0]/60:.0f}m, median {times[len(times)//2]/60:.0f}m, max {times[-1]/60:.0f}m")
    if fails: sys.exit(1)

# reachability: which nodes are never visited by any explorer run? (dead content)
seen = set()
for seed in range(200):
    rnd = random.Random(seed)
# simple static reachability from start
reach, stack = set(), [S["start"]]
while stack:
    x = stack.pop()
    if x in reach or not x: continue
    reach.add(x)
    n = nodes[x]
    stack += [n["next"]] + [b["to"] for b in n["branches"]] + [c["next"] for c in n["choices"]]
unreach = [i for i in nodes if i not in reach]
print("unreachable nodes:", unreach or "none")
