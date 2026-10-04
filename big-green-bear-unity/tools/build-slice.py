# build-slice.py — writes Resources/BGB/Data/slice.json (the story beats).
# Kept as Python so the text stays readable; run: python3 tools/build-slice.py
import json

def T(en, ko): return {"en": en, "ko": ko}
def E(type, id=None, value=None, num=None):
    e = {"type": type}
    if id is not None: e["id"] = id
    if value is not None: e["value"] = value
    if num is not None: e["num"] = num
    return e
nodes = []
def N(id, text=None, speaker="", next=None, effects=None, choices=None, branches=None, fx=None, hold=0):
    n = {"id": id, "speaker": speaker, "text": text or T("", ""), "next": next or "", "effects": effects or [],
         "choices": choices or [], "branches": branches or [], "fx": fx or [], "hold": hold}
    nodes.append(n)
def C(text, next, conditions=None, effects=None):
    return {"text": text, "next": next, "conditions": conditions or [], "effects": effects or []}
def B(to, *conditions): return {"to": to, "conditions": list(conditions)}

# ---------------- opening ----------------
N("intro_01", T("Every winter, Bellflower Town holds a festival. Paper lanterns. Hot cider. A small parade that goes once around the square and calls it a night.",
                "벨플라워 마을은 겨울마다 축제를 연다. 종이 등불. 따뜻한 사과주. 광장을 한 바퀴 돌고 나면 끝나는 조그만 퍼레이드."),
  effects=[E("focus", value="wide")], next="intro_02")
N("intro_02", T("And every winter, somebody has to be the bear.", "그리고 겨울마다, 누군가는 곰이 되어야 한다."),
  effects=[E("focus", value="bear")], next="intro_03")
N("intro_03", T("This year, it's you.", "올해는 너다."), effects=[E("face", "bear", "happy")], next="intro_04")
N("intro_04", T("Your fur is warm and heavy. Children wave at you from across the square.",
                "털은 따뜻하고 묵직하다. 광장 건너편에서 아이들이 손을 흔든다."),
  effects=[E("face", "bear", "neutral"), E("focus", value="wide")], next="hub")

# ---------------- the crossroads ----------------
N("hub", branches=[
    B("end_01", "rain", "bell_found", "gate_seen"),
    B("rain_01", "!rain", "dry>=2"),
    B("hub_rain", "rain"),
    B("hub_dry"),
])
N("hub_dry", effects=[E("focus", value="wide")], choices=[
    C(T("Talk to Nini", "니니에게 말 걸기"), "nini_01", ["!met_nini"], [E("add", "dry")]),
    C(T("Look at the town hall clock", "시청 시계를 본다"), "clock_01", ["!clock_seen"], [E("add", "dry")]),
    C(T("Look at the lights", "전구를 본다"), "lights_01", ["!lights_seen"], [E("add", "dry")]),
    C(T("Wave at the children", "아이들에게 손을 흔든다"), "wave_01", ["!waved"], [E("add", "dry")]),
])

# ---------------- Nini ----------------
N("nini_01", T("Bear! Bear! Is it true you have bells?", "곰! 곰! 진짜 종 갖고 있어?"), "nini",
  effects=[E("focus", value="nini"), E("face", "nini", "happy"), E("face", "bear", "happy")], next="nini_02")
N("nini_02", choices=[
    C(T("\"I saved one for you.\"", "\"너 주려고 하나 남겨 뒀지.\""), "nini_03"),
    C(T("\"Only for kids who say please.\"", "\"'주세요' 하는 어린이한테만 줘.\""), "nini_please"),
])
N("nini_please", T("Pleeease!", "주세요오!"), "nini", effects=[E("face", "nini", "curious")], next="nini_03")
N("nini_03", T("You hand her a small green bell. She shakes it, and it rings once: a thin, bright sound that cuts through the whole square.",
               "작은 초록 종을 건넨다. 니니가 흔들자 종이 한 번 울린다. 가늘고 맑은 소리가 광장을 가로지른다."),
  effects=[E("bell", value="nini"), E("sound", "bell"), E("face", "nini", "happy"), E("setFlag", "met_nini")], next="nini_04")
N("nini_04", T("It's green like you!", "너처럼 초록색이다!"), "nini", next="nini_05")
N("nini_05", T("I'm gonna show Mom. Then the parade. You're coming too, right?", "엄마한테 보여 줄 거야. 그다음엔 퍼레이드! 곰도 올 거지?"), "nini",
  effects=[E("focus", value="both"), E("face", "nini", "curious")], next="nini_06")
N("nini_06", T("Of course.", "물론이지."), "bear", effects=[E("face", "bear", "happy"), E("face", "nini", "happy")], next="hub")

# ---------------- dry-weather looks ----------------
N("clock_01", T("The town hall clock says 11:47.", "시청 시계는 11시 47분을 가리킨다."),
  effects=[E("focus", value="clock"), E("setFlag", "clock_seen")], next="clock_02")
N("clock_02", T("It has said 11:47 for as long as you can remember. Nobody ever fixes it. People just check their phones.",
                "기억하는 한 저 시계는 늘 11시 47분이었다. 아무도 고치지 않는다. 사람들은 그냥 휴대폰을 본다."), next="hub")
N("lights_01", T("The lights are strung lower than usual this year, looping over the stalls and down toward the fountain.",
                 "올해는 전구 줄이 평소보다 낮게 걸려 있다. 노점 위로 늘어졌다가 분수 쪽까지 이어진다."),
  effects=[E("focus", value="wide"), E("setFlag", "lights_seen")], next="lights_02")
N("lights_02", T("Past the fountain there is a short iron gate, and steps going down. You've never seen anyone use them.",
                 "분수 너머에 낮은 철문이 있고, 아래로 내려가는 계단이 있다. 누가 그 계단을 쓰는 걸 본 적은 없다."),
  effects=[E("focus", value="gate")], next="hub")
N("wave_01", T("You wave. Three children wave back. One of them waves with her whole body.",
               "손을 흔든다. 아이 셋이 마주 흔든다. 그중 하나는 온몸으로 흔든다."),
  effects=[E("face", "bear", "happy"), E("focus", value="bear"), E("setFlag", "waved")], next="hub")

# ---------------- the rain ----------------
N("rain_01", T("Something cold taps you on the nose.", "뭔가 차가운 게 코끝을 톡 건드린다."),
  effects=[E("focus", value="bear"), E("face", "bear", "neutral"), E("clock", value="18:30"), E("rain", num=0.12)], next="rain_02")
N("rain_02", T("Then another. Then the whole square looks up at once, the way crowds do.",
               "또 하나. 그러더니 광장의 사람들이 다 같이 하늘을 올려다본다. 사람들은 늘 그렇게 한꺼번에 올려다본다."),
  effects=[E("mood", value="rain"), E("setFlag", "rain"), E("focus", value="wide")],
  next="rain_03")
N("rain_03", branches=[B("rain_03_met", "met_nini"), B("rain_03_unmet")])
N("rain_03_met", T("Nini runs off toward the stalls, ringing her bell at the rain.", "니니가 빗속에 종을 흔들며 노점 쪽으로 뛰어간다."),
  effects=[E("exit", "nini", num=7)], next="rain_04")
N("rain_03_unmet", T("A little girl in a yellow raincoat runs past you into the crowd. You had saved her the last green bell.\n\nDidn't you? You don't remember giving it to her. But your paw is empty.",
                     "노란 우비를 입은 꼬마가 네 옆을 지나 사람들 속으로 뛰어간다. 마지막 남은 초록 종은 그 애 몫이었다.\n\n그랬던가? 준 기억은 없다. 그런데 손이 비어 있다."),
  effects=[E("exit", "nini", num=7), E("setFlag", "memory_gap")], next="rain_04")
N("rain_04", T("You look for a yellow raincoat in the crowd. You listen for a small green bell.\n\nYou don't hear it.",
               "사람들 사이에서 노란 우비를 찾는다. 작은 초록 종소리에 귀를 기울인다.\n\n들리지 않는다."),
  effects=[E("face", "bear", "searching"), E("clock", value="19:05")], next="rain_05")
N("rain_05", T("Nini?", "니니?"), "bear", effects=[E("face", "bear", "worried"), E("focus", value="bear")], next="rain_06")
N("rain_06", T("The parade starts without you noticing. Lanterns bob past in the rain. She isn't at the front.",
               "어느새 퍼레이드가 시작된다. 빗속에서 등불이 둥실둥실 지나간다. 맨 앞에 니니가 없다."),
  effects=[E("focus", value="wide")], next="hub")

N("hub_rain", effects=[E("focus", value="wide")], choices=[
    C(T("Look at the gate by the fountain", "분수 옆 철문을 본다"), "gate_01", ["!gate_seen"]),
    C(T("Look at the puddle by the steps", "계단 옆 웅덩이를 본다"), "puddle_01", ["!bell_found"]),
    C(T("Look at the town hall clock", "시청 시계를 본다"), "clockr_01", ["!clock_rain"]),
    C(T("Call for Nini", "니니를 부른다"), "call_01", ["!called"]),
])

# ---------------- the gate: the first memory distortion ----------------
N("gate_01", T("An iron sign on the gate: STAFF ONLY. Below it, a newer notice, laminated and beaded with water:\n\nCLOSED 21:15",
               "철문에 걸린 쇠 표지판. '관계자 외 출입 금지'. 그 아래, 물방울이 맺힌 코팅된 새 안내문.\n\n21:15 폐쇄"),
  effects=[E("focus", value="gate"), E("face", "bear", "searching")], next="gate_02")
N("gate_02", T("A quarter past nine.", "아홉 시 십오 분."), next="gate_03")
N("gate_03", T("It isn't nine yet. Is it?", "아직 아홉 시도 안 됐다. 그렇지?"),
  effects=[E("distort", num=1), E("memory", num=94)], fx=["clock1147", "echo", "fluorescent", "beep", "drift"], next="gate_04")
N("gate_04", T("You read the notice again. It still says 21:15. Water slides past your feet and down the steps, into the dark.",
               "안내문을 다시 읽는다. 여전히 21:15다. 물이 발밑을 스쳐 계단을 타고 어둠 속으로 흘러내린다."),
  effects=[E("distort", num=0), E("stuck", num=0), E("setFlag", "gate_seen")], next="hub")

# ---------------- the bell ----------------
N("puddle_01", T("Something small and green glints in the puddle at the top of the steps.", "계단 맨 위 웅덩이에서 작고 초록색인 무언가가 반짝인다."),
  effects=[E("bell", value="puddle"), E("focus", value="puddle")], next="puddle_02")
N("puddle_02", T("You pick it up. It rings once, very softly.", "주워 든다. 아주 작게, 한 번 울린다."),
  effects=[E("sound", "bell"), E("bell", value="bear"), E("focus", value="bear")], next="puddle_03")
N("puddle_03", T("Nini's bell.", "니니의 종."), "bear", effects=[E("face", "bear", "worried")], next="puddle_04")
N("puddle_04", T("It's wet, and colder than the rain. Cold, like it has been lying in water for a long time.",
                 "젖어 있고, 빗물보다 차갑다. 아주 오랫동안 물속에 잠겨 있었던 것처럼."),
  effects=[E("setFlag", "bell_found")], next="hub")

N("clockr_01", T("The town hall clock says 11:47.", "시청 시계는 11시 47분을 가리킨다."),
  effects=[E("focus", value="clock"), E("setFlag", "clock_rain")], next="clockr_02")
N("clockr_02", T("Everything in the square has changed since the rain started. Except that.", "비가 오고 나서 광장의 모든 게 달라졌다. 저것만 빼고."), next="hub")
N("call_01", T("Nini!", "니니!"), "bear", effects=[E("face", "bear", "searching"), E("focus", value="bear"), E("setFlag", "called")], next="call_02")
N("call_02", T("The rain swallows it. Somewhere, a band is still playing.", "빗소리가 그 이름을 삼킨다. 어딘가에서 아직 밴드가 연주하고 있다."), next="hub")

# ---------------- end of the slice ----------------
N("end_01", T("The rain doesn't stop.", "비는 그치지 않는다."),
  effects=[E("mood", value="heavy"), E("focus", value="wide"), E("clock", value="22:30")], next="end_02")
N("end_02", T("Below the square, in the dark of the passage, water is running.", "광장 아래, 통로의 어둠 속에서 물이 흐르고 있다."),
  effects=[E("focus", value="gate")], hold=1.2, next="end_03")
N("end_03", T("The town hall clock says 11:47.", "시청 시계는 11시 47분을 가리킨다."),
  effects=[E("focus", value="clock"), E("stuck", num=1)], fx=["clock1147"], next="end_04")
N("end_04", T("For the first time tonight, you think it might be right.", "오늘 밤 처음으로, 저 시계가 맞을지도 모른다는 생각이 든다."),
  effects=[E("distort", num=0.35), E("memory", num=88)], next="end_05")
N("end_05", effects=[E("end")])

script = {
    "start": "intro_01",
    "startClock": "17:40",
    "ui": {
        "title": T("BIG GREEN BEAR'S ADVENTURE", "큰초록곰의 모험"),
        "subtitle": T("A small mystery in Bellflower Town", "벨플라워 마을의 작은 미스터리"),
        "pressStart": T("Press Enter or click to begin", "Enter를 누르거나 클릭해서 시작"),
        "chapterLabel": T("CHAPTER 1", "1장"),
        "chapterTitle": T("Bellflower Winter Night", "벨플라워 겨울밤"),
        "prompt": T("What do you do?", "무엇을 할까?"),
        "toBeContinued": T("To be continued.", "계속."),
        "controls": T("Enter / click: continue   ·   1-4: choose   ·   L: 한국어   ·   Esc: quit", "Enter / 클릭: 계속   ·   1-4: 선택   ·   L: English   ·   Esc: 종료"),
        "motionOn": T("M: reduced motion ON", "M: 움직임 줄이기 켜짐"),
        "motionOff": T("M: reduce motion", "M: 움직임 줄이기"),
    },
    "speakers": [
        {"id": "bear", "name": T("Big Green Bear", "큰초록곰")},
        {"id": "nini", "name": T("Nini", "니니")},
    ],
    "nodes": nodes,
}

# --- validation: every jump must land on a real node ---
ids = {n["id"] for n in nodes}
problems = []
for n in nodes:
    targets = [n["next"]] + [b["to"] for b in n["branches"]] + [c["next"] for c in n["choices"]]
    for t in targets:
        if t and t not in ids: problems.append(f"{n['id']} -> {t}")
    if not n["text"]["en"] and not n["choices"] and not n["branches"] and not n["next"] and not n["effects"]:
        problems.append(f"{n['id']} does nothing")
    for k in ("en", "ko"):
        if bool(n["text"]["en"]) != bool(n["text"][k]): problems.append(f"{n['id']} missing {k}")
if problems:
    raise SystemExit("slice.json problems:\n" + "\n".join(problems))
out = "Assets/BigGreenBear/Resources/BGB/Data/slice.json"
json.dump(script, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"wrote {out}: {len(nodes)} nodes")
