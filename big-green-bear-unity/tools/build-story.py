# build-story.py — writes Resources/BGB/Data/story.json: the whole game.
#   python3 tools/build-story.py
# Follows big-green-bear/STORY.md. Korean first, English alongside.
#
# Quick reference
#   K(ko, en)                      a line of text
#   N(id, text, speaker, next=..., effects=[...], choices=[...], branches=[...], fx=[...], hold=s)
#   seq(prefix, [ (speaker, K(...), effects, fx), ... ], next)   a chain of lines
#   C(K(...), next, conditions, effects, target)                  a choice (target = clickable thing)
#   E(type, id, value, num)                                       an effect
import json, os, sys

def K(ko, en): return {"en": en, "ko": ko}
EMPTY = K("", "")

def E(type, id=None, value=None, num=None, label=None, title=None):
    e = {"type": type}
    if id is not None: e["id"] = id
    if value is not None: e["value"] = value
    if num is not None: e["num"] = num
    if label is not None: e["label"] = label
    if title is not None: e["title"] = title
    return e

nodes = []
ids = set()
def N(id, text=None, speaker="", next="", effects=None, choices=None, branches=None, fx=None, hold=0):
    if id in ids: raise SystemExit("duplicate node " + id)
    ids.add(id)
    nodes.append({"id": id, "speaker": speaker, "text": text or EMPTY, "next": next, "effects": effects or [],
                  "choices": choices or [], "branches": branches or [], "fx": fx or [], "hold": hold})

def C(text, next, conditions=None, effects=None, target="", group=""):
    return {"text": text, "next": next, "conditions": conditions or [], "effects": effects or [], "target": target, "group": group}

def B(to, *conditions): return {"to": to, "conditions": list(conditions)}

def seq(prefix, lines, next):
    """lines: (speaker, text) or (speaker, text, effects) or (speaker, text, effects, fx) or (speaker, text, effects, fx, hold)"""
    for i, ln in enumerate(lines):
        speaker, text = ln[0], ln[1]
        effects = ln[2] if len(ln) > 2 else []
        fx = ln[3] if len(ln) > 3 else []
        hold = ln[4] if len(ln) > 4 else 0
        nid = prefix if i == 0 else f"{prefix}_{i}"
        nxt = f"{prefix}_{i + 1}" if i + 1 < len(lines) else next
        N(nid, text, speaker, nxt, effects, fx=fx, hold=hold)
    return prefix

def flag(f): return E("setFlag", f)
def unflag(f): return E("setFlag", f, "false")
def face(who, f): return E("face", who, f)
def focus(f): return E("focus", value=f)
def clue(c): return E("clue", c)
def card(label, title, hold=True): return E("card", value="hold" if hold else "", label=label, title=title)
def chapter(title): return E("chapter", title=title)

# ======================================================================
# PLACES. Travel choices are generated so every place links to the others.
# ======================================================================
PLACES = {
    "square": K("벨플라워 광장", "Bellflower Square"),
    "flower": K("릴리의 꽃가게", "Lily's flower shop"),
    "cafe":   K("메이블의 카페", "Mabel's cafe"),
    "park":   K("공원", "the park"),
    "gate":   K("마을 입구", "the town gate"),
}
def travel(here, chapter_tag, mood_out, mood_in_cafe, places=("square", "flower", "cafe", "park", "gate"), extra_effects=None):
    out = []
    for p in places:
        if p == here: continue
        effects = list(extra_effects or [])
        if here == "cafe": effects.append(flag("cafe_changed"))  # next time, the room is remembered differently
        effects += [E("go", id=mood_in_cafe if p == "cafe" else mood_out, value=p)]
        lbl = PLACES[p]
        out.append(C(K("→ " + lbl["ko"], "→ " + lbl["en"]), f"{chapter_tag}_{p}", effects=effects, group="travel"))
    return out

# ======================================================================
# CHAPTER 1 — 벨플라워 겨울밤
# ======================================================================
N("start", effects=[
    card(K("1장", "CHAPTER 1"), K("벨플라워 겨울밤", "Bellflower Winter Night")),
    flag("ch1"), chapter(K("벨플라워 겨울밤", "Bellflower Winter Night")),
    E("go", id="dusk", value="square"), E("clock", value="17:40"), E("memory", num=100),
    E("checkpoint", value="intro"),
], next="intro")

seq("intro", [
    ("", K("벨플라워 마을은 겨울마다 축제를 연다. 종이 등불. 따뜻한 사과주. 광장을 한 바퀴 돌고 나면 끝나는 조그만 퍼레이드.",
           "Every winter, Bellflower Town holds a festival. Paper lanterns. Hot cider. A small parade that goes once around the square and calls it a night."), [focus("wide")]),
    ("", K("그리고 겨울마다, 누군가는 곰이 되어야 한다.", "And every winter, somebody has to be the bear."), [focus("bear")]),
    ("", K("올해는, 빅그린베어다.", "This year, it's Big Green Bear."), [face("bear", "happy")]),
    ("", K("털은 따뜻하고 묵직하다. 광장 건너편에서 아이들이 손을 흔든다.", "The fur is warm and heavy. Children wave from across the square."),
     [face("bear", "neutral"), focus("wide")]),
], "c1_hub")

N("c1_hub", branches=[B("rain_01", "dry>=2"), B("c1_hub_menu")])
N("c1_hub_menu", effects=[focus("wide")], choices=[
    C(K("니니에게 말 걸기", "Talk to Nini"), "nini_01", ["!met_nini"], [E("add", "dry")], "nini"),
    C(K("시청 시계를 본다", "Look at the town hall clock"), "clock_01", ["!clock_seen"], [E("add", "dry")], "clock"),
    C(K("등불을 본다", "Look at the lanterns"), "lights_01", ["!lights_seen"], [E("add", "dry")], "lights"),
    C(K("아이들에게 손을 흔든다", "Wave at the children"), "wave_01", ["!waved"], [E("add", "dry")]),
])

N("nini_01", K("곰! 곰! 진짜 방울 갖고 있어?", "Bear! Bear! Is it true you have bells?"), "nini",
  effects=[focus("nini"), face("nini", "happy"), face("bear", "happy")], next="nini_02")
N("nini_02", choices=[
    C(K("\"너 주려고 하나 남겨 뒀지.\"", "\"I saved one for you.\""), "nini_03"),
    C(K("\"'주세요' 하는 어린이한테만 줘.\"", "\"Only for kids who say please.\""), "nini_please"),
])
N("nini_please", K("주세요오!", "Pleeease!"), "nini", effects=[face("nini", "curious")], next="nini_03")
seq("nini_03", [
    ("", K("작은 초록 방울을 건넨다. 니니가 흔들자 방울이 한 번 울린다. 가늘고 맑은 소리가 광장을 가로지른다.",
           "Bear hands her a small green bell. She shakes it, and it rings once: a thin, bright sound that cuts across the whole square."),
     [E("bell", value="nini"), E("sound", "bell"), face("nini", "happy"), flag("met_nini")]),
    ("nini", K("곰처럼 초록색이다!", "It's green like you!")),
    ("nini", K("엄마한테 보여 줄 거야. 그다음엔 퍼레이드! 곰도 올 거지?", "I'm gonna show Mom. Then the parade. You're coming too, right?"),
     [focus("both"), face("nini", "curious")]),
    ("bear", K("물론이지.", "Of course."), [face("bear", "happy"), face("nini", "happy")]),
], "c1_hub")

seq("clock_01", [
    ("", K("시청 시계는 11시 47분을 가리킨다.", "The town hall clock says 11:47."), [focus("clock"), flag("clock_seen"), clue("c_1147")]),
    ("", K("기억하는 한 저 시계는 늘 11시 47분이었다. 아무도 고치지 않는다. 사람들은 그냥 휴대폰을 본다.",
           "It has said 11:47 for as long as anyone can remember. Nobody fixes it. People just check their phones.")),
], "c1_hub")
seq("lights_01", [
    ("", K("노점의 등불이 빗방울 하나 없이 따뜻하게 흔들린다. 전구 줄은 분수 쪽까지 낮게 이어져 있다.",
           "The stall lanterns sway, warm and dry. Strings of bulbs loop low, all the way to the fountain."), [focus("wide"), flag("lights_seen")]),
    ("", K("분수 너머에 낮은 철문이 있고, 아래로 내려가는 계단이 있다. 누가 그 계단을 쓰는 걸 본 적은 없다.",
           "Past the fountain there's a short iron gate, and steps going down. Nobody ever seems to use them."), [focus("gate")]),
], "c1_hub")
N("wave_01", K("손을 흔든다. 아이 셋이 마주 흔든다. 그중 하나는 온몸으로 흔든다.", "Bear waves. Three children wave back. One of them waves with her whole body."),
  effects=[face("bear", "happy"), focus("bear"), flag("waved")], next="c1_hub")

seq("rain_01", [
    ("", K("뭔가 차가운 게 코끝을 톡 건드린다.", "Something cold taps Bear on the nose."),
     [focus("bear"), face("bear", "neutral"), E("clock", value="18:30"), E("rain", num=0.12)]),
    ("", K("또 하나. 그러더니 광장의 사람들이 다 같이 하늘을 올려다본다. 사람들은 늘 그렇게 한꺼번에 올려다본다.",
           "Then another. Then the whole square looks up at once, the way crowds do."), [E("mood", value="rain"), flag("rain"), focus("wide")]),
], "rain_03")
N("rain_03", branches=[B("rain_met", "met_nini"), B("rain_unmet")])
N("rain_met", K("니니가 빗속에 방울을 흔들며 노점 쪽으로 뛰어간다.", "Nini runs off toward the stalls, ringing her bell at the rain."),
  effects=[E("exit", "nini", num=7)], next="rain_04")
N("rain_unmet", K("노란 우비를 입은 꼬마가 옆을 지나 사람들 속으로 뛰어간다. 마지막 남은 초록 방울은 그 애 몫이었다.\n\n그랬던가? 준 기억은 없다. 그런데 손이 비어 있다.",
                  "A little girl in a yellow raincoat runs past, into the crowd. The last green bell was meant for her.\n\nWasn't it? Bear doesn't remember giving it. But the paw is empty."),
  effects=[E("exit", "nini", num=7), flag("memory_gap"), flag("met_nini")], next="rain_04")
seq("rain_04", [
    ("", K("사람들 사이에서 노란 우비를 찾는다. 작은 초록 방울 소리에 귀를 기울인다.\n\n들리지 않는다.",
           "Bear looks for a yellow raincoat in the crowd. Listens for a small green bell.\n\nNothing."),
     [face("bear", "searching"), E("clock", value="19:05")]),
    ("bear", K("니니?", "Nini?"), [face("bear", "worried"), focus("bear")]),
    ("", K("어느새 퍼레이드가 시작된다. 빗속에서 등불이 둥실둥실 지나간다. 맨 앞에 니니가 없다.",
           "The parade starts without anyone noticing. Lanterns bob past in the rain. Nini isn't at the front."), [focus("wide")]),
], "ch2_start")

# ======================================================================
# CHAPTER 2 — 니니를 찾아서
# ======================================================================
N("ch2_start", effects=[
    card(K("2장", "CHAPTER 2"), K("니니를 찾아서", "Looking for Nini")),
    flag("ch2"), flag("nini_gone"), flag("finch_square"), flag("fox_square"),
    chapter(K("니니를 찾아서", "Looking for Nini")),
    E("go", id="rain", value="square"), E("clock", value="19:10"), E("memory", num=90),
], next="ch2_intro")
seq("ch2_intro", [
    ("", K("비가 조금 굵어졌다. 퍼레이드는 끝났는데, 니니는 어디에도 없다.", "The rain has thickened. The parade is over, and Nini is nowhere."), [face("bear", "worried")]),
    ("bear", K("누군가는 봤을 거야.", "Someone must have seen her.")),
    ("", K("마을 사람들에게 물어보자. 꽃가게, 카페, 공원, 마을 입구. 그리고 이 광장.",
           "Ask around. The flower shop, the cafe, the park, the town gate. And this square."), [clue("c_mission")]),
], "c2_square")

# ---- shared "what now?" nudges (so nobody gets stuck) ----
N("c2_think", branches=[
    B("c2_think_ready", "clue_c_lily", "clue_c_mabel", "clue_c_oliver", "clue_c_moss", "clue_c_bell", "clue_c_notice"),
    B("c2_think_bell", "!clue_c_bell"),
    B("c2_think_people"),
])
N("c2_think_bell", K("니니가 마지막으로 어디로 갔는지부터. 광장 분수 쪽, 계단 근처를 살펴봐야 할 것 같다.",
                     "First, where she went last. The fountain, near the steps. Worth a look."), next="c2_square_hub")
N("c2_think_people", K("아직 물어보지 못한 사람이 있다. 꽃가게의 릴리, 카페의 메이블, 공원의 올리버, 마을 입구의 모스 씨. 철문 안내문도 다시 볼 것.",
                       "There are people still to ask. Lily at the flower shop, Mabel at the cafe, Oliver in the park, Mr. Moss at the town gate. And read that gate notice."),
  next="c2_square_hub")
N("c2_think_ready", K("이야기가 다 모였다. 그런데 서로 맞지가 않는다. 광장에서 생각을 정리해 보자.",
                      "All the stories are in. And they don't fit together. Think it through, here in the square."), next="c2_square_hub")

# ---- square (ch2) ----
N("c2_square", effects=[E("checkpoint", value="c2_square_hub")], next="c2_square_hub")
N("c2_square_hub", effects=[focus("wide")], choices=[
    C(K("생각을 정리한다", "Think it through"), "c2_deduce", ["clue_c_lily", "clue_c_mabel", "clue_c_oliver", "clue_c_moss", "clue_c_bell", "clue_c_notice"]),
    C(K("핀치 씨에게 말 걸기", "Talk to Mr. Finch"), "finch2", [], [], "finch"),
    C(K("폭스에게 말 걸기", "Talk to Fox"), "fox2", [], [], "fox"),
    C(K("분수 옆 철문을 본다", "Look at the gate by the fountain"), "gate2", ["!gate2_seen"], [], "gate"),
    C(K("계단 옆 웅덩이를 본다", "Look at the puddle by the steps"), "puddle2", ["!clue_c_bell"], [], "puddle"),
    C(K("시청 시계를 본다", "Look at the town hall clock"), "c2_clock", [], [], "clock"),
    *travel("square", "c2", "rain", "cafe"),
    C(K("어떻게 해야 하지?", "What should I do?"), "c2_think"),
])
N("c2_clock", K("11시 47분. 비가 와도, 퍼레이드가 끝나도, 저 시계는 꿈쩍도 않는다.", "11:47. Rain or parade, that clock doesn't budge."),
  effects=[focus("clock")], next="c2_square_hub")

N("finch2", branches=[B("finch2_again", "finch2_done"), B("finch2_first")])
seq("finch2_first", [
    ("finch", K("곰! 퍼레이드 좋았죠? 비 좀 오는 거 가지고! 금방 그쳐요.", "Bear! Lovely parade, wasn't it? A little rain! It'll pass."), [focus("finch")]),
    ("bear", K("니니 못 봤어요? 노란 우비 입은 꼬마요.", "Have you seen Nini? Little one, yellow raincoat.")),
    ("finch", K("니니? 퍼레이드 내내 엄마랑 무대 앞에 있었는데. 방울을 계속 흔들면서. 아주 귀여웠죠.",
                "Nini? She was at the stage the whole parade, with her mother. Ringing a little bell the entire time. Lovely.")),
    ("bear", K("비가 이렇게 오는데, 축제를 계속해요?", "In this rain, you're keeping the festival going?")),
    ("finch", K("41년이에요, 곰. 벨플라워 겨울밤은 단 한 번도 취소된 적이 없어요. 눈이 와도, 독감이 돌아도.",
                "Forty-one years, Bear. Bellflower Winter Night has never once been cancelled. Not for snow, not for flu."), [clue("c_finch")]),
    ("finch", K("아, 모스 씨가 아까 펌프 얘기를 하던데. 모스 씨는 늘 걱정이 많아요. 축제 끝나고 보자고 했죠.",
                "Oh, Mr. Moss was going on about a pump earlier. Moss always worries. I told him we'd look at it after the festival."),
     [flag("finch2_done")]),
], "c2_square_hub")
N("finch2_again", K("비 좀 오는 거 가지고! 다들 여기까지 와 줬는데.", "A little rain! The families have come all this way."), "finch",
  effects=[focus("finch")], fx=["echo"], next="c2_square_hub")

N("fox2", branches=[B("fox2_again", "fox2_done"), B("fox2_first")])
seq("fox2_first", [
    ("fox", K("아, 곰이군요. 실례지만 하나만 물어봐도 될까요?", "Ah, the bear. Sorry, may I ask you one thing?"), [focus("fox")]),
    ("fox", K("기사를 쓰고 있어요. 내일 아침 기사. 그 아이 이름이… 니니, 맞죠?", "I'm writing a piece. For tomorrow morning. The little girl's name was… Nini. Right?")),
    ("bear", K("…'였죠'라뇨?", "…'Was'?")),
    ("fox", K("말이 헛나왔네요. 신경 쓰지 마세요. 비 때문에 메모가 다 번져서.", "Slip of the tongue. Don't mind me. The rain's smudged all my notes."), [face("fox", "worried")]),
    ("", K("폭스의 수첩이 펼쳐져 있다. 번진 숫자들. '00:05 … 00:42 … 1:17'.", "Fox's notebook lies open. Smudged numbers. '00:05 … 00:42 … 1:17'."),
     [clue("c_fox"), flag("fox2_done")], ["beep"]),
], "c2_square_hub")
N("fox2_again", K("천천히 하세요. 시간은… 있어요. 아마도.", "Take your time. There's time. Probably."), "fox", effects=[focus("fox")], next="c2_square_hub")

seq("gate2", [
    ("", K("철문에 걸린 쇠 표지판. '관계자 외 출입 금지'. 그 아래, 물방울이 맺힌 코팅된 새 안내문.\n\n'21:15 폐쇄'",
           "An iron sign on the gate: STAFF ONLY. Below it, a newer notice, laminated and beaded with rain.\n\n'CLOSED 21:15'"),
     [focus("gate"), face("bear", "searching")]),
    ("", K("아홉 시 십오 분.", "A quarter past nine.")),
    ("", K("아직 아홉 시도 안 됐다. 그렇지?", "It isn't nine yet. Is it?"),
     [E("distort", num=1), E("memory", num=86)], ["clock1147", "echo", "fluorescent", "beep", "drift"]),
    ("", K("안내문을 다시 읽는다. 여전히 21:15다. 물이 발밑을 스쳐 계단을 타고 어둠 속으로 흘러내린다.",
           "Bear reads it again. Still 21:15. Water slides past and down the steps, into the dark."),
     [E("distort", num=0), E("stuck", num=0), clue("c_notice"), flag("gate2_seen")]),
], "c2_square_hub")

seq("puddle2", [
    ("", K("계단 맨 위 웅덩이에서 작고 초록색인 무언가가 반짝인다.", "Something small and green glints in the puddle at the top of the steps."),
     [E("bell", value="puddle"), focus("puddle")]),
    ("", K("주워 든다. 아주 작게, 한 번 울린다.", "Bear picks it up. It rings once, very softly."), [E("sound", "bell"), E("bell", value="bear"), focus("bear")]),
    ("bear", K("니니의 방울.", "Nini's bell."), [face("bear", "worried")]),
    ("", K("젖어 있고, 빗물보다 차갑다. 아주 오랫동안 물속에 잠겨 있었던 것처럼.", "It's wet, and colder than the rain. Cold, like it has been under water for a long time."),
     [clue("c_bell")]),
], "c2_square_hub")

# ---- flower shop (ch2) ----
N("c2_flower", effects=[E("checkpoint", value="c2_flower_hub")], next="c2_flower_hub")
N("c2_flower_hub", effects=[focus("wide")], choices=[
    C(K("릴리에게 말 걸기", "Talk to Lily"), "lily2", [], [], "lily"),
    C(K("가게 안 벽시계를 본다", "Look at the clock inside the shop"), "shopclock2", ["!shopclock2_seen"], [], "shopclock"),
    C(K("문 위의 꽃장식을 본다", "Look at the garland over the door"), "garland2", ["!garland2_seen"], [], "garland"),
    *travel("flower", "c2", "rain", "cafe"),
])
N("lily2", branches=[B("lily2_again", "clue_c_lily"), B("lily2_first")])
seq("lily2_first", [
    ("lily", K("곰! 홀딱 젖었네요. 이 꽃들 좀 봐요, 빗물 먹고 고개를 다 숙였어.", "Bear! You're soaked. Look at my flowers, all bowing their heads in the rain."), [focus("lily")]),
    ("bear", K("니니 못 봤어요? 노란 우비요.", "Have you seen Nini? Yellow raincoat.")),
    ("lily", K("니니요? 봤어요! 분수 쪽으로 뛰어가던데요. 방울 못 봤냐고 다들 붙잡고 물어보면서.",
               "Nini? Yes! She ran toward the fountain. Stopping everyone, asking if they'd seen a little bell.")),
    ("lily", K("기억나요. 젖은 꽃을 정리하던 중이었거든요.", "I remember, because I was packing up the wet flowers."), [clue("c_lily")]),
    ("bear", K("방울은… 지금 내가 갖고 있는데.", "The bell… I have it now."), [face("bear", "searching")]),
    ("lily", K("그래요? 그럼 잘됐네요. 곧 찾으러 오겠죠.", "Do you? Well, good. She'll come looking for it soon.")),
], "c2_flower_hub")
N("lily2_again", K("분수 쪽이요. 방울 찾으면서. 꽃 정리하던 중이었어요. 그건 확실해요.", "The fountain. Looking for her bell. I was packing up the flowers. That much I'm sure of."),
  "lily", effects=[focus("lily")], next="c2_flower_hub")
seq("shopclock2", [
    ("", K("진열창 너머, 작은 벽시계. 11시 47분.", "Through the window, a small wall clock. 11:47."), [focus("shopclock"), flag("shopclock2_seen")], ["clock1147"]),
    ("lily", K("아, 그거요? 원래 좀 느려요. 신경 쓰지 마세요.", "Oh, that one? It runs slow. Don't mind it.")),
    ("", K("시청 시계도 11시 47분이었다.", "The town hall clock said 11:47 too."), [E("stuck", num=0)]),
], "c2_flower_hub")
seq("garland2", [
    ("lily", K("예쁘죠? 올해는 핀치 씨가 두 배로 주문했어요. 난간에도, 가로등에도. 분수 옆 빗물받이에도 하나 둘렀어요. 너무 휑해 보여서.",
               "Pretty, isn't it? Mr. Finch ordered twice as many this year. On the railings, the lamps. I even wrapped one round the drain by the fountain. It looked so bare."),
     [focus("garland"), flag("garland2_seen"), clue("c_garland")]),
], "c2_flower_hub")

# ---- cafe (ch2) — the room changes the second time ----
N("c2_cafe", branches=[B("c2_cafe_changed", "cafe_changed", "!cafe_changed_seen"), B("c2_cafe_enter")])
N("c2_cafe_enter", effects=[E("checkpoint", value="c2_cafe_hub")], next="c2_cafe_hub")
seq("c2_cafe_changed", [
    ("", K("카페 문을 연다. 따뜻한 공기. 커피 냄새.", "The cafe door. Warm air. Coffee."), [focus("wide")]),
    ("", K("…창문이 원래 저쪽에 있었나?", "…Was the window always on that side?"), [focus("window"), flag("cafe_changed_seen")], ["echo"]),
    ("", K("테이블이 하나 줄었다. 그리고 벽에, 아까는 없던 시계.", "There's one table fewer. And on the wall, a clock that wasn't there before."), [focus("cafeclock"), clue("c_room")]),
], "c2_cafe_enter")
N("c2_cafe_hub", effects=[focus("wide")], choices=[
    C(K("메이블에게 말 걸기", "Talk to Mabel"), "mabel2", [], [], "mabel"),
    C(K("바닥에 귀를 기울인다", "Listen to the floor"), "floor2", ["!clue_c_noise"], [], "floor"),
    C(K("창밖을 본다", "Look out of the window"), "window2", [], [], "window"),
    C(K("벽시계를 본다", "Look at the wall clock"), "cafeclock2", ["cafe_changed"], [], "cafeclock"),
    *travel("cafe", "c2", "rain", "cafe"),
])
N("mabel2", branches=[B("mabel2_again", "clue_c_mabel"), B("mabel2_first")])
seq("mabel2_first", [
    ("mabel", K("어서 와요, 곰. 오늘은 다들 비 피하러만 들어오네.", "Evening, Bear. Everyone's only coming in to get out of the rain tonight."), [focus("mabel")]),
    ("bear", K("니니 못 봤어요?", "Have you seen Nini?")),
    ("mabel", K("니니? 엄마랑 진작 집에 갔어요. 저 창문으로 봤어요. 우산 하나에 둘이 꼭 붙어서.",
                "Nini? She went home with her mum ages ago. I saw them through that window. Two of them under one umbrella."), [clue("c_mabel")]),
    ("bear", K("집에…? 릴리는 분수 쪽으로 뛰어갔다던데.", "Home…? Lily said she ran to the fountain."), [face("bear", "searching")]),
    ("mabel", K("그럼 둘 중 하나가 잘못 봤겠죠. 난 봤어요. 집에 갔어요.", "Then one of us saw wrong. I saw what I saw. She went home.")),
], "c2_cafe_hub")
N("mabel2_again", K("집에 갔어요. 우산 하나에 둘이서. 창문으로 봤다니까요.", "She went home. Two under one umbrella. I saw it through the window."),
  "mabel", effects=[focus("mabel")], next="c2_cafe_hub")
seq("floor2", [
    ("", K("바닥 밑에서, 쿵. 그리고 꾸르륵.", "Under the floor: a thud. Then a gurgle."), [focus("floor")]),
    ("mabel", K("아까부터 그래요. 지하에서 북 치는 소리가. 축제 밴드겠죠.", "It's been doing that all evening. Drums, from under there. The festival band, I suppose.")),
    ("", K("쿵. 꾸르륵. 그리고 아주 작게, 일정한 간격으로, 삑—", "Thud. Gurgle. And very faintly, at regular intervals: beep—"), [clue("c_noise")], ["beep"]),
], "c2_cafe_hub")
N("window2", K("창밖으로 축제 등불이 번져 보인다. 빗줄기가 유리를 타고 흐른다. 노란 우비는 보이지 않는다.",
               "Through the glass, festival lights smear in the rain. Water runs down the pane. No yellow raincoat."),
  effects=[focus("window")], next="c2_cafe_hub")
N("cafeclock2", K("11시 47분.", "11:47."), effects=[focus("cafeclock")], fx=["clock1147", "echo"], next="cafeclock2_1")
N("cafeclock2_1", K("메이블은 저 시계가 언제부터 있었는지 모른다고 한다.", "Mabel says she can't remember when that clock went up."), "",
  effects=[E("stuck", num=0)], next="c2_cafe_hub")

# ---- park (ch2) ----
N("c2_park", effects=[E("checkpoint", value="c2_park_hub")], next="c2_park_hub")
N("c2_park_hub", effects=[focus("wide")], choices=[
    C(K("올리버에게 말 걸기", "Talk to Oliver"), "oliver2", [], [], "oliver"),
    C(K("게시판을 본다", "Read the notice board"), "notice2", ["!clue_c_choir"], [], "notice"),
    C(K("벤치를 본다", "Look at the bench"), "bench2", ["!bench2_seen"], [], "bench"),
    *travel("park", "c2", "rain", "cafe"),
])
N("oliver2", branches=[B("oliver2_again", "clue_c_oliver"), B("oliver2_first")])
seq("oliver2_first", [
    ("oliver", K("…네, 본부. 교차로 접촉 사고 하나, 소음 신고 둘. 네. 네.", "…Yes, control. One fender-bender at the junction, two noise complaints. Yes. Yes."), [focus("oliver")]),
    ("bear", K("경찰관님, 아이를 찾고 있어요. 니니요. 노란 우비.", "Officer, I'm looking for a child. Nini. Yellow raincoat.")),
    ("oliver", K("실종 아동? 아, 그거. 그 신고는 00시 05분에 들어왔어요.", "Missing child? Ah, that one. That call came in at 00:05."), [clue("c_oliver")], ["beep"]),
    ("bear", K("…지금 저녁 일곱 시인데요?", "…It's seven in the evening."), [face("bear", "searching")]),
    ("oliver", K("…그랬나? 오늘 밤은 시간이 이상하네요. 무전기가 자꾸 지직거려서.", "…Is it? Time's strange tonight. This radio keeps crackling."), [face("oliver", "worried")]),
], "c2_park_hub")
N("oliver2_again", K("00시 05분. 기록에 그렇게 돼 있어요. …아직 안 왔는데, 기록이 있네.", "00:05. That's what the log says. …It hasn't happened yet, and there's a log."),
  "oliver", effects=[focus("oliver")], next="c2_park_hub")
seq("notice2", [
    ("", K("게시판 포스터. '종소리 합창 — 오후 9:00. 와 주셔서 감사합니다!' 그 위에 빨간 도장. '종료'.",
           "A poster on the board. 'BELL CHOIR — 9:00 PM. THANK YOU FOR COMING!' Stamped across it, in red: 'ENDED'."), [focus("notice")]),
    ("", K("합창은 아홉 시다. 아직 시작도 안 했다.", "The choir is at nine. It hasn't started yet."), [clue("c_choir")], ["echo"]),
], "c2_park_hub")
N("bench2", K("젖은 벤치. 작은 장갑 한 짝이 놓여 있다. 노란색.", "A wet bench. A single small glove left on it. Yellow."),
  effects=[focus("bench"), flag("bench2_seen")], next="c2_park_hub")

# ---- town gate (ch2) ----
N("c2_gate", effects=[E("checkpoint", value="c2_gate_hub")], next="c2_gate_hub")
N("c2_gate_hub", effects=[focus("wide")], choices=[
    C(K("모스 씨에게 말 걸기", "Talk to Mr. Moss"), "moss2", [], [], "moss"),
    C(K("펌프장 문에 귀를 댄다", "Listen at the pump house door"), "pump2", ["!clue_c_beep"], [], "pump"),
    C(K("붙어 있는 쪽지를 본다", "Read the note on the wall"), "repair2", ["!repair2_seen"], [], "repair"),
    *travel("gate", "c2", "rain", "cafe"),
])
N("moss2", branches=[B("moss2_again", "clue_c_moss"), B("moss2_first")])
seq("moss2_first", [
    ("moss", K("곰이구먼. 이 날씨에 뭘 그렇게 뛰어다녀.", "The bear. What're you running around for, in this?"), [focus("moss")]),
    ("bear", K("아이를 찾아요. 니니.", "I'm looking for a child. Nini.")),
    ("moss", K("애는 못 봤어. 난 펌프만 보고 있었으니까. 저놈이 영 시원찮아.", "Haven't seen a kid. I've been watching the pump. That thing's not right.")),
    ("moss", K("수리 일정은 잡혀 있었지. '축제 끝나고.' 두 번째로 미룬 거야. 예산이 어쩌고 하면서.",
               "Repair was booked. 'After the festival.' Second time it got pushed. Something about the budget."), [clue("c_moss")]),
    ("moss", K("물이 차면 통로부터 넘쳐. 그래서 아홉 시 십오 분에 철문 잠갔어. 안은… 안 봤어. 거기 누가 있겠어.",
               "When water rises, the passage floods first. So I locked the gate at quarter past nine. Inside? Didn't look. Who'd be down there."), [clue("c_lock")]),
    ("bear", K("아홉 시 십오 분이요? 지금은 일곱 시 조금 넘었는데.", "Quarter past nine? It's only just gone seven."), [face("bear", "searching")]),
    ("moss", K("…그래? 그럼 이따 잠그겠지. 내가.", "…Is it? Then I'll lock it later. Me."), [face("moss", "worried")]),
], "c2_gate_hub")
N("moss2_again", K("두 번 미뤘어. 축제 끝나고 하자고. 다들 그랬어.", "Pushed back twice. 'After the festival.' Everybody said so."), "moss",
  effects=[focus("moss")], next="c2_gate_hub")
seq("pump2", [
    ("", K("철문 너머, 기계가 웅웅 돈다. 덜컥. 다시 웅웅.", "Behind the door, machinery hums. A clunk. Humming again."), [focus("pump")]),
    ("", K("그리고 그 아래로, 일정한 간격의 소리. 삑— … 삑— …", "And underneath it, a sound at steady intervals. Beep— … beep— …"), [clue("c_beep")], ["beep"]),
    ("", K("펌프 경보음치고는 너무 차분하다.", "Too calm for a pump alarm.")),
], "c2_gate_hub")
N("repair2", K("손글씨 쪽지. '2번 펌프장 — 수리: 축제 끝나고.' 날짜를 두 번 고친 자국.", "A handwritten note. 'PUMP STN. 2 — REPAIR: AFTER FESTIVAL.' The date has been crossed out twice."),
  effects=[focus("pump"), flag("repair2_seen")], next="c2_gate_hub")

# ---- chapter 2 deduction: who is lying? ----
seq("c2_deduce", [
    ("", K("수첩을 펼친다. 니니에 대해 들은 말들.", "Bear opens the notebook. Everything people said about Nini."), [focus("bear")]),
    ("", K("핀치 씨: 퍼레이드 내내 무대 앞에.\n릴리: 방울을 찾으며 분수 쪽으로.\n메이블: 엄마랑 진작 집에.\n올리버: 신고는 00시 05분에.",
           "Mr. Finch: at the stage all through the parade.\nLily: running to the fountain, looking for her bell.\nMabel: went home with her mum, ages ago.\nOliver: the call came in at 00:05.")),
], "c2_q")
N("c2_q", K("누가 거짓말을 하고 있지?", "Who is lying?"), choices=[
    C(K("핀치 씨", "Mr. Finch"), "c2_q_finch"),
    C(K("릴리", "Lily"), "c2_q_lily"),
    C(K("메이블", "Mabel"), "c2_q_mabel"),
    C(K("올리버", "Oliver"), "c2_q_oliver"),
    C(K("아무도 거짓말하지 않는다", "Nobody is lying"), "c2_q_right"),
])
N("c2_q_finch", K("핀치 씨는 일곱 시 퍼레이드를 말했다. 퍼레이드는 정말 일곱 시였다.", "Mr. Finch talked about the seven o'clock parade. The parade really was at seven."), next="c2_q")
N("c2_q_lily", K("릴리는 '젖은 꽃을 정리하던 중'이라고 했다. 비가 이 정도라면, 릴리는 아직 정리를 시작하지도 않았을 텐데.",
                  "Lily said she was 'packing up the wet flowers'. In rain this light, she wouldn't have started packing yet."), next="c2_q")
N("c2_q_mabel", K("메이블은 '진작' 집에 갔다고 했다. 언제가 '진작'이었는지는 말하지 않았다.", "Mabel said Nini went home 'ages ago'. She never said when 'ages ago' was."), next="c2_q")
N("c2_q_oliver", K("올리버의 시간은 아직 오지 않은 시간이다. 거짓말이라기엔, 너무 정확하다.", "Oliver's time hasn't happened yet. Too exact to be a lie."), next="c2_q")
seq("c2_q_right", [
    ("", K("아무도 거짓말을 하지 않았다.", "Nobody lied.")),
    ("", K("다들 같은 밤을 말하고 있다. 다만, 서로 다른 시간을.", "They're all describing the same night. Just different hours of it."), [clue("c_times")], ["echo"]),
    ("", K("그런데 이상하다. 지금이 몇 시든, 그 시간들은 아직 오지 않았어야 한다.", "But that's the strange part. Whatever time it is now, those hours shouldn't have happened yet."),
     [E("stuck", num=1)], ["clock1147"]),
], "ch3_start")

# ======================================================================
# CHAPTER 3 — 11:47
# ======================================================================
N("ch3_start", effects=[
    card(K("3장", "CHAPTER 3"), K("11:47", "11:47")),
    E("stuck", num=0), unflag("ch2"), flag("ch3"), unflag("finch_square"), unflag("fox_square"),
    chapter(K("11:47", "11:47")),
    E("go", id="heavy", value="square"), E("clock", value="22:30"), E("memory", num=70), E("crowd", num=0),
], next="ch3_intro")
seq("ch3_intro", [
    ("", K("어느새 밤이 깊었다. 노점은 대부분 불이 꺼졌다. 비는 이제 신경 쓰이는 정도가 아니라, 그 안에 들어와 있는 무언가가 되었다.",
           "Somehow it's late. Most of the stalls are dark. The rain isn't something you notice anymore; it's something you're inside."), [focus("wide")]),
    ("", K("털이 빗물을 빨아들인다. 한 걸음 한 걸음이 무겁다.", "The fur drinks the rain. Every step is heavier."), [face("bear", "worried")]),
    ("bear", K("시간을 다시 맞춰 봐야 해. 다들, 언제의 니니를 본 거지?", "I need to put the times back in order. When was it, that each of them saw her?"), [clue("c_mission3")]),
], "c3_square")

N("c3_think", branches=[
    B("c3_think_ready", "clue_c_lily2", "clue_c_mabel2", "clue_c_oliver2"),
    B("c3_think_people"),
])
N("c3_think_people", K("다시 물어보자. 릴리에게는 '언제', 메이블에게는 '그다음', 올리버에게는 '누가'.",
                       "Ask again. Lily: 'when'. Mabel: 'what happened next'. Oliver: 'who'."), next="c3_square_hub")
N("c3_think_ready", K("시간이 거의 맞춰졌다. 광장에서 순서를 정리하자.", "The times are almost in order. Lay them out, here in the square."), next="c3_square_hub")

N("c3_square", effects=[E("checkpoint", value="c3_square_hub")], next="c3_square_hub")
N("c3_square_hub", effects=[focus("wide")], choices=[
    C(K("시간 순서를 맞춘다", "Put the night in order"), "c3_order", ["clue_c_lily2", "clue_c_mabel2", "clue_c_oliver2"]),
    C(K("시청 시계를 본다", "Look at the town hall clock"), "c3_clock", [], [], "clock"),
    C(K("철문을 본다", "Look at the gate"), "c3_gatelook", ["!c3_gatelook_seen"], [], "gate"),
    *travel("square", "c3", "heavy", "cafe_late"),
    C(K("어떻게 해야 하지?", "What should I do?"), "c3_think"),
])
seq("c3_clock", [
    ("", K("11시 47분.", "11:47."), [focus("clock")], ["clock1147"]),
    ("", K("저녁 내내 처음으로, 저 시각이 틀려 보이지 않는다.", "For the first time all night, it doesn't look wrong."), [E("stuck", num=0)]),
], "c3_square_hub")
seq("c3_gatelook", [
    ("", K("철문에 쇠사슬이 감겨 있다. 새 자물쇠. 물이 계단을 타고 쏟아져 내려간다.", "The gate is chained now. A new padlock. Water pours down the steps."), [focus("gate"), flag("c3_gatelook_seen")]),
    ("", K("철창 사이는 좁다. 곰은 못 지나간다. 하지만 아주 작은 아이라면.", "The bars are close together. Too close for a bear. But a very small child might squeeze through."), [], ["echo"]),
], "c3_square_hub")

# flower (ch3)
N("c3_flower", effects=[E("checkpoint", value="c3_flower_hub")], next="c3_flower_hub")
N("c3_flower_hub", effects=[focus("wide")], choices=[
    C(K("릴리에게 말 걸기", "Talk to Lily"), "lily3", [], [], "lily"),
    *travel("flower", "c3", "heavy", "cafe_late"),
])
N("lily3", branches=[B("lily3_again", "clue_c_lily2"), B("lily3_first")])
seq("lily3_first", [
    ("lily", K("곰, 아직도 밖에 있었어요? 난 이제야 정리해요. 버틸 만큼 버텼는데, 열 시 넘으니까 그냥 쏟아지더라고요.",
               "Bear, still out? I'm only packing up now. Held out as long as I could, but after ten it just came down."), [focus("lily"), face("lily", "worried")]),
    ("bear", K("아까 니니를 본 게… 정리하던 중이었다고 했죠.", "You said you saw Nini… while you were packing up.")),
    ("lily", K("네. 그러니까… 열 시 반은 넘었겠네요. 열한 시쯤? 퍼레이드 때가 아니었어요.", "Yes. So… after half past ten. Around eleven? Not during the parade at all."), [clue("c_lily2")]),
    ("lily", K("방울을 잃어버렸다면서 울상이었어요. 누가 '분수 옆 계단 쪽에서 반짝이는 거 봤다'고 했대요.",
               "She'd lost her bell and she was close to tears. Someone told her they'd seen something shiny by the steps near the fountain.")),
], "c3_flower_hub")
N("lily3_again", K("열한 시쯤이요. 분수 옆 계단 쪽. 누가 그쪽에서 반짝이는 걸 봤대요.", "Around eleven. The steps by the fountain. Someone said they'd seen something shiny there."),
  "lily", effects=[focus("lily")], next="c3_flower_hub")

# cafe (ch3) — Mabel repeats herself, then corrects
N("c3_cafe", effects=[E("checkpoint", value="c3_cafe_hub")], next="c3_cafe_hub")
N("c3_cafe_hub", effects=[focus("wide")], choices=[
    C(K("메이블에게 말 걸기", "Talk to Mabel"), "mabel3", [], [], "mabel"),
    C(K("바닥에 귀를 기울인다", "Listen to the floor"), "floor3", ["!floor3_seen"], [], "floor"),
    *travel("cafe", "c3", "heavy", "cafe_late"),
])
N("mabel3", branches=[B("mabel3_again", "clue_c_mabel2"), B("mabel3_first")])
seq("mabel3_first", [
    ("mabel", K("니니? 엄마랑 진작 집에 갔어요.", "Nini? She went home with her mum ages ago."), [focus("mabel")], ["echo"]),
    ("mabel", K("…갔어요.", "…ages ago."), [], ["echo", "drift"]),
    ("mabel", K("아, 아니다. 그건 열 시 반쯤이었어요. 우산 하나에 둘이서.", "No. Wait. That was about half ten. Two under one umbrella."), [face("mabel", "worried")]),
    ("mabel", K("그런데 열한 시 넘어서… 노란 우비가 혼자 창밖으로 뛰어갔어요. 광장 쪽으로. 그 애였던 것 같아요.",
                "But after eleven… a yellow raincoat ran past the window. Alone. Toward the square. I think it was her."), [clue("c_mabel2")]),
    ("bear", K("집에 갔다가… 다시 나온 거구나. 방울이 없어진 걸 알고.", "She went home… and came back out. When she noticed the bell was gone."), [face("bear", "worried")]),
], "c3_cafe_hub")
N("mabel3_again", K("열한 시 넘어서. 혼자. 광장 쪽으로. 붙잡을 걸 그랬어요.", "After eleven. Alone. Toward the square. I should have stopped her."),
  "mabel", effects=[focus("mabel"), face("mabel", "worried")], next="c3_cafe_hub")
seq("floor3", [
    ("", K("바닥 밑에서 이제는 북소리가 아니라, 물소리가 난다. 아주 가까이서.", "Under the floor, it isn't drums anymore. It's water. Very close."), [focus("floor"), flag("floor3_seen")]),
    ("", K("카페 뒷문 쪽, 바닥의 작은 점검구. 통로로 이어지는 구멍.", "By the back door, a small hatch in the floor. A way down into the passage."), [clue("c_hatch")]),
], "c3_cafe_hub")

# park (ch3)
N("c3_park", effects=[E("checkpoint", value="c3_park_hub")], next="c3_park_hub")
N("c3_park_hub", effects=[focus("wide")], choices=[
    C(K("올리버에게 말 걸기", "Talk to Oliver"), "oliver3", [], [], "oliver"),
    *travel("park", "c3", "heavy", "cafe_late"),
])
N("oliver3", branches=[B("oliver3_again", "clue_c_oliver2"), B("oliver3_first")])
seq("oliver3_first", [
    ("oliver", K("…아이 하나 찾는다는 얘기는 들었어요. 열한 시 오십 분쯤. 축제 본부 쪽에서요.", "…I did hear something about a missing kid. Around ten to midnight. From the festival office."), [focus("oliver"), face("oliver", "worried")]),
    ("bear", K("그런데요?", "And?")),
    ("oliver", K("축제엔 축제 직원들이 있잖아요. 그쪽에서 알아서 하겠지 했어요. 나는 사고 처리 중이었고.",
                 "The festival has its own staff. I figured they had it. I was dealing with the accident."), [clue("c_oliver2")]),
    ("oliver", K("정식 신고는 00시 05분에야 들어왔어요. 다들, 누가 신고했겠지 했던 거죠.", "The actual call didn't come in until 00:05. Everyone thought someone else had called.")),
], "c3_park_hub")
N("oliver3_again", K("누가 신고했겠지. 다들 그렇게 생각했어요. 나도.", "Someone must have called. Everyone thought that. Me too."), "oliver",
  effects=[focus("oliver")], next="c3_park_hub")

# gate (ch3)
N("c3_gate", effects=[E("checkpoint", value="c3_gate_hub")], next="c3_gate_hub")
N("c3_gate_hub", effects=[focus("wide")], choices=[
    C(K("모스 씨에게 말 걸기", "Talk to Mr. Moss"), "moss3", [], [], "moss"),
    *travel("gate", "c3", "heavy", "cafe_late"),
])
seq("moss3", [
    ("moss", K("아홉 시에 멈췄어. 펌프. 이제 물이 갈 데가 없어.", "It stopped at nine. The pump. The water's got nowhere to go now."), [focus("moss"), face("moss", "worried")]),
    ("moss", K("통로는 잠갔어. 광장 쪽은. 카페 쪽 출구는… 축제 상자를 거기 쌓아 놨다던데. 핀치네가.",
               "I locked the passage. The square side. The cafe side… they've stacked festival crates in front of that exit, I heard. Finch's lot."), [clue("c_crates")]),
], "c3_gate_hub")

# ---- chapter 3: put the night in order ----
N("c3_order", K("수첩을 펼친다. 이번엔 시간 순서대로.", "The notebook again. This time, in order."), effects=[focus("bear")], next="c3_q1")
N("c3_q1", K("니니는 언제 방울을 잃어버렸을까?", "When did Nini lose her bell?"), choices=[
    C(K("퍼레이드 때 (오후 7시)", "During the parade (7 PM)"), "c3_q1_no1"),
    C(K("엄마랑 집에 가던 길 (밤 10시 반)", "Walking home with her mum (10:30 PM)"), "c3_q1_no2"),
    C(K("집에 간 뒤에 알아챘다 (밤 11시 넘어서)", "She noticed after getting home (after 11 PM)"), "c3_q1_yes"),
])
N("c3_q1_no1", K("핀치 씨는 퍼레이드 내내 방울 소리를 들었다고 했다.", "Mr. Finch heard her bell all through the parade."), next="c3_q1")
N("c3_q1_no2", K("메이블은 집에 가는 니니를 봤다. 그리고 열한 시 넘어, 혼자 다시 뛰어나오는 니니를 봤다.", "Mabel saw her walk home. And after eleven, saw her run back out, alone."), next="c3_q1")
N("c3_q1_yes", K("집에서야 알았다. 방울이 없다는 걸. 그래서 혼자 다시 나왔다.", "She only noticed at home. The bell was gone. So she came back out, alone."),
  effects=[clue("c_lost"), E("clock", value="23:20")], next="c3_q2")
N("c3_q2", K("그리고 니니는 어디로 갔을까?", "And where did Nini go?"), choices=[
    C(K("공원", "The park"), "c3_q2_no"),
    C(K("다시 집으로", "Back home"), "c3_q2_no"),
    C(K("분수 옆 계단, 지하 통로", "The steps by the fountain, into the passage"), "c3_q2_yes"),
])
N("c3_q2_no", K("릴리는 니니가 분수 쪽으로 뛰어가는 걸 봤다. 누군가 계단 쪽에서 반짝이는 걸 봤다고 했다.", "Lily saw her run to the fountain. Someone had told her about something shiny by the steps."), next="c3_q2")
N("c3_q2_yes", K("철창 사이로. 아주 작은 아이라면 지나갈 수 있다. 방울을 찾으러, 물이 차오르는 통로로.",
                 "Between the bars. A very small child could fit. Down into the passage, after her bell, where the water was rising."),
  effects=[clue("c_where"), E("clock", value="23:35")], next="c3_q3")
N("c3_q3", K("그럼… 나는 언제 니니를 찾기 시작했지?", "Then… when did I start looking for her?"), choices=[
    C(K("저녁 일곱 시, 퍼레이드 때", "Seven in the evening, at the parade"), "c3_q3_no"),
    C(K("밤 11시 40분쯤", "Around 11:40 at night"), "c3_q3_yes"),
])
N("c3_q3_no", K("일곱 시의 니니는 엄마 옆에서 방울을 흔들고 있었다. 사라진 적이 없다.", "At seven, Nini was beside her mum, ringing her bell. She hadn't gone anywhere."), next="c3_q3")
seq("c3_q3_yes", [
    ("", K("일곱 시가 아니었다.", "It wasn't seven."), [E("clock", value="23:40")], ["echo"]),
    ("", K("저녁이 밤을 반으로 접어 버린 것이다. 비 오기 시작한 순간과, 니니가 사라진 순간을 한데 붙여서.",
           "The evening folded the night in half. It pressed the moment the rain began against the moment Nini disappeared."), [clue("c_fold"), E("memory", num=60)]),
    ("bear", K("광장 쪽 철문은 잠겨 있었어. 그래서… 카페로 갔지. 바닥의 구멍으로.", "The square-side gate was locked. So… the cafe. The hatch in the floor."), [face("bear", "worried")]),
], "c3_passage_go")

# ---- the passage, 23:40 – 23:48 ----
N("c3_passage_go", effects=[flag("nini_in_passage"), E("go", id="passage", value="passage"), E("water", num=0.22),
                            E("crowd", num=0), E("music", num=0.25)], next="pass_01")
seq("pass_01", [
    ("", K("상자 위 점검구로 내려온다. 물이 무릎까지 찬다. 차갑다. 털이 금방 무거워진다.",
           "Down through the hatch above the crates. The water is knee-high. Cold. The fur gets heavy at once."), [focus("bear")]),
    ("bear", K("니니!", "Nini!"), [face("bear", "searching")]),
    ("", K("어둠 속에서, 훌쩍이는 소리.", "In the dark, a small sniffle."), [focus("nini")]),
    ("nini", K("곰…? 방울… 방울 잃어버렸어.", "Bear…? My bell… I lost my bell."), [face("nini", "worried")]),
    ("bear", K("여기 있어. 찾았어.", "It's right here. I found it."), [E("bell", value="bear"), face("bear", "neutral")]),
    ("", K("곰이 니니의 작은 손에 방울을 쥐여 준다. 아주 작게, 한 번 울린다.", "Bear closes Nini's small hand around the bell. It rings once, very softly."),
     [E("bell", value="nini"), E("sound", "bell"), focus("nini")]),
    ("bear", K("꼭 쥐고 있어. 이제 나가자.", "Hold on to it tight. Now let's get out."), [focus("both")]),
    ("", K("물이 허리까지 차오른다. 곰은 니니를 번쩍 들어 올린다. 상자 위, 따뜻한 불빛이 새어 나오는 점검구 쪽으로.",
           "The water climbs to the waist. Bear lifts Nini high, up over the crates, toward the hatch and the warm light leaking through it."),
     [E("water", num=0.36), focus("hatch")]),
    ("", K("니니의 장화가 상자를 찬다. 상자가 기우뚱한다.", "Nini's boots kick the crates. They shift."), [E("sound", "chime")]),
    ("nini", K("같이 가?", "Are you coming?"), [focus("both")]),
    ("bear", K("가.", "Go.")),
    ("", K("", ""), [], [], 1.4),
    ("nini", K("근데 곰도 오는 거지?", "But you're coming too, right?")),
    ("bear", K("물론이지.", "Of course."), [face("bear", "happy")]),
    ("", K("니니가 점검구 밖으로 빠져나간다. 노란 장화가 마지막으로 보이고, 사라진다.", "Nini wriggles up through the hatch. The yellow boots are the last thing to go."),
     [E("exit", "nini", num=2, value="wait"), E("clock", value="23:47")]),
    ("", K("11시 47분.", "11:47."), [E("stuck", num=1), E("distort", num=1), focus("deep")], ["clock1147", "echo"], 0.6),
    ("", K("상자들이 물속으로 미끄러진다. 점검구가, 닿지 않을 만큼 높아진다.", "The crates slide into the water. The hatch is suddenly too high to reach."),
     [E("water", num=0.62), E("memory", num=40), focus("hatch")]),
    ("", K("털이 무겁다. 아주 무겁다.", "The fur is heavy. So heavy."), [face("bear", "worried"), E("music", num=0.1)], ["drift"]),
    ("", K("광장 쪽은 잠겨 있다. 카페 쪽은 막혀 있다.", "The square side is locked. The cafe side is blocked."), [], ["echo"]),
    ("", K("물이 차갑다.", "The water is cold."), [E("water", num=0.85)], ["drift"], 0.8),
    ("", K("…", "…"), [E("beep", num=3)], ["fluorescent"], 1.0),
], "ch4_start")

# ======================================================================
# CHAPTER 4 — 이미 일어난 일
# ======================================================================
N("ch4_start", effects=[
    card(K("4장", "CHAPTER 4"), K("이미 일어난 일", "It Already Happened")),
    unflag("ch3"), flag("ch4"), unflag("nini_in_passage"), flag("finch_square"), flag("fox_square"),
    chapter(K("이미 일어난 일", "It Already Happened")),
    E("water", num=0.12), E("distort", num=0.3), E("music", num=0.2), E("crowd", num=0),
    E("go", id="void", value="square"), E("memory", num=30), E("beepLoop", num=1.4),
], next="ch4_intro")
seq("ch4_intro", [
    ("", K("광장. 등불은 켜져 있는데, 아무도 움직이지 않는다. 축제가 사진처럼 멈춰 있다.", "The square. The lanterns are lit, but nothing moves. The festival has stopped, like a photograph."), [focus("wide"), face("bear", "worried")]),
    ("bear", K("니니를… 찾아야 해.", "Have to… find Nini.")),
    ("fox", K("이미 찾았잖아요.", "You already found her."), [focus("fox"), face("fox", "worried")]),
    ("fox", K("기사 나왔어요. 내일 아침 신문. 아니, 오늘 아침인가.", "The piece is out. Tomorrow morning's paper. Or is it this morning.")),
    ("", K("젖은 신문. 굵은 제목.\n\n'벨플라워 겨울밤 폭우 사고 — 통로에 고립된 아이, 무사히 구조. 아이를 구한 축제 마스코트는…'\n\n그다음은 번져서 읽을 수 없다.",
           "A wet newspaper. A heavy headline.\n\n'Bellflower Winter Night flood — child trapped in passage rescued safely. The festival mascot who saved her…'\n\nThe rest has run, unreadable."),
     [clue("c_article")], ["beep"]),
    ("", K("잠깐.", "Wait."), [focus("bear")], [], 0.8),
    ("bear", K("내가 지금 조사하고 있는 사건은… 이미 일어난 일이잖아.", "The thing I'm investigating… it's already happened."), [], ["echo"]),
], "ch4_recap")
seq("ch4_recap", [
    ("", K("아직 아홉 시도 안 됐는데 '21:15 폐쇄'가 붙어 있던 이유.\n— 그 안내문을 읽은 건 밤 열한 시 사십 분이었다.",
           "Why a notice said 'CLOSED 21:15' before nine o'clock.\n— Bear read it at twenty to midnight."), [focus("gate")]),
    ("", K("끝나지도 않은 합창에 '종료' 도장이 찍혀 있던 이유.\n— 공원을 지난 건 합창이 끝난 뒤였다.",
           "Why a choir that hadn't sung yet was stamped 'ENDED'.\n— Bear passed the park after it had finished.")),
    ("", K("올리버가 아직 오지 않은 '00시 05분'을 알고 있던 이유.\n— 신고는 정말 그때 들어왔다. 곰은 그때 이미 물속에 있었다.",
           "Why Oliver knew about '00:05' before it came.\n— The call really did come then. Bear was already in the water.")),
    ("", K("메이블과 릴리의 말이 맞지 않았던 이유.\n— 둘 다 맞았다. 서로 다른 시간이었을 뿐.",
           "Why Mabel and Lily didn't agree.\n— Both were right. About different hours.")),
    ("", K("카페의 창문이 옮겨 가 있던 이유.\n— 방이 바뀐 게 아니었다. 기억이 바뀐 거였다.",
           "Why the cafe window had moved.\n— The room didn't change. The memory of it did.")),
    ("", K("축제장에서 들리던 일정한 기계음.\n— 그건 축제 소리가 아니었다.",
           "The steady beeping, under the festival.\n— That was never part of the festival."), [], ["beep"]),
    ("", K("그리고 11시 47분.\n— 니니가 밖으로 나간 시각. 또렷하게 기억나는 마지막 순간.",
           "And 11:47.\n— The moment Nini got out. The last moment remembered clearly."), [focus("clock")], ["clock1147"]),
    ("", K("모두 하나의 이유였다.", "It was all one reason."), [E("stuck", num=0), focus("wide")], [], 0.8),
    ("", K("빅그린베어는 마을을 돌아다니고 있는 게 아니었다. 그날 밤을, 처음부터 다시 기억하고 있었다.",
           "Big Green Bear wasn't walking through the town. He was remembering that night, from the beginning, again."), [clue("c_memory")]),
    ("fox", K("그럼 이제 마지막 질문이네요. 제 기사에도 못 쓴 거.", "Then there's one question left. The one I couldn't put in my piece."), [focus("fox")]),
    ("fox", K("누가 빅그린베어를 죽였는가.", "Who killed Big Green Bear."), [], ["echo"]),
], "c4_square")

N("c4_think", branches=[
    B("c4_think_ready", "clue_cs_moss", "clue_cs_lily", "clue_cs_finch", "clue_cs_mabel", "clue_cs_oliver"),
    B("c4_think_people"),
])
N("c4_think_people", K("다들 그날 밤 무언가를 했다. 아니면, 하지 않았다. 한 명씩 다시 찾아가 보자. 핀치 씨, 릴리, 메이블, 올리버, 모스 씨.",
                       "Everyone did something that night. Or didn't. Go to each of them again. Mr. Finch, Lily, Mabel, Oliver, Mr. Moss."), next="c4_square_hub")
N("c4_think_ready", K("다 들었다. 이제 대답할 차례다.", "Everyone has spoken. Time to answer."), next="c4_square_hub")

N("c4_square", effects=[E("checkpoint", value="c4_square_hub")], next="c4_square_hub")
N("c4_square_hub", effects=[focus("wide")], choices=[
    C(K("대답한다: 누가 빅그린베어를 죽였는가", "Answer: who killed Big Green Bear"), "c4_final", ["clue_cs_moss", "clue_cs_lily", "clue_cs_finch", "clue_cs_mabel", "clue_cs_oliver"]),
    C(K("핀치 씨에게 말 걸기", "Talk to Mr. Finch"), "finch4", [], [], "finch"),
    C(K("폭스에게 말 걸기", "Talk to Fox"), "fox4", [], [], "fox"),
    *travel("square", "c4", "void", "cafe_late"),
    C(K("어떻게 해야 하지?", "What should I do?"), "c4_think"),
])
N("finch4", branches=[B("finch4_again", "clue_cs_finch"), B("finch4_first")])
seq("finch4_first", [
    ("finch", K("41년이었어요. 비 좀 온다고 취소하면… 다들 실망할 거라고 생각했어요.", "Forty-one years. I thought if we cancelled for a bit of rain… everyone would be so disappointed."), [focus("finch"), face("finch", "worried")]),
    ("finch", K("일곱 시 반에, 계속하자고 했어요. 모스 씨 말은 축제 끝나고 듣자고.", "At half past seven I said we'd carry on. That we'd listen to Moss after the festival.")),
    ("finch", K("그리고 상자들. 창고가 모자라서… 통로 카페 쪽 출구 앞에 잠깐만 쌓아 두라고 했어요. 잠깐만.",
                "And the crates. We were short of storage… I told them to stack them in front of the cafe-side exit for a while. Just for a while."), [clue("cs_finch")]),
    ("finch", K("괜찮을 줄 알았어요.", "I thought it would be fine.")),
], "c4_square_hub")
N("finch4_again", K("잠깐만이었어요. 정말로.", "It was only meant to be for a while. Truly."), "finch", effects=[focus("finch")], next="c4_square_hub")
seq("fox4", [
    ("fox", K("기사 제목을 '누구의 잘못인가'로 하려고 했어요. 근데 못 쓰겠더라고요.", "I wanted to call the piece 'Whose Fault Was It'. I couldn't write it."), [focus("fox")]),
    ("fox", K("다들 자기 차례만 기억하거든요. 아주 작은, 자기 차례만.", "Everyone only remembers their own turn. Their own small turn.")),
], "c4_square_hub")

N("c4_flower", effects=[E("checkpoint", value="c4_flower_hub")], next="c4_flower_hub")
N("c4_flower_hub", effects=[focus("wide")], choices=[
    C(K("릴리에게 말 걸기", "Talk to Lily"), "lily4", [], [], "lily"),
    *travel("flower", "c4", "void", "cafe_late"),
])
N("lily4", branches=[B("lily4_again", "clue_cs_lily"), B("lily4_first")])
seq("lily4_first", [
    ("lily", K("봤어요. 일곱 시 십 분쯤. 내 꽃장식이 분수 옆 빗물받이를 덮고 있는 거.", "I saw it. About ten past seven. My garland, lying over the drain by the fountain."), [focus("lily"), face("lily", "worried")]),
    ("lily", K("꽃잎을 몇 개 걷어 내고… 그냥 갔어요. 손님이 기다리고 있었거든요.", "I scooped out a few petals and… went back. I had customers waiting.")),
    ("lily", K("누가 치우겠지 했어요.", "I thought somebody would clear it."), [clue("cs_lily")]),
], "c4_flower_hub")
N("lily4_again", K("누가 치우겠지. 그게 다였어요.", "Somebody will clear it. That was all."), "lily", effects=[focus("lily")], next="c4_flower_hub")

N("c4_cafe", effects=[E("checkpoint", value="c4_cafe_hub")], next="c4_cafe_hub")
N("c4_cafe_hub", effects=[focus("wide")], choices=[
    C(K("메이블에게 말 걸기", "Talk to Mabel"), "mabel4", [], [], "mabel"),
    *travel("cafe", "c4", "void", "cafe_late"),
])
N("mabel4", branches=[B("mabel4_again", "clue_cs_mabel"), B("mabel4_first")])
seq("mabel4_first", [
    ("mabel", K("여덟 시 십오 분. 바닥 밑에서 소리가 났어요. 처음엔 쿵, 그다음엔 꾸르륵.", "Quarter past eight. A sound under the floor. First a thud. Then a gurgle."), [focus("mabel"), face("mabel", "worried")]),
    ("mabel", K("북소리인 줄 알았어요. 전화할까 하다가… 손님이 많았어요.", "I thought it was drums. I thought about calling someone, and… it was busy.")),
    ("mabel", K("그게 물이었으면, 누군가는 알았겠지 했어요.", "If it was water, I thought, someone would know."), [clue("cs_mabel")]),
], "c4_cafe_hub")
N("mabel4_again", K("누군가는 알았겠지. 그렇게 생각했어요.", "Someone would know. That's what I thought."), "mabel", effects=[focus("mabel")], next="c4_cafe_hub")

N("c4_park", effects=[E("checkpoint", value="c4_park_hub")], next="c4_park_hub")
N("c4_park_hub", effects=[focus("wide")], choices=[
    C(K("올리버에게 말 걸기", "Talk to Oliver"), "oliver4", [], [], "oliver"),
    *travel("park", "c4", "void", "cafe_late"),
])
N("oliver4", branches=[B("oliver4_again", "clue_cs_oliver"), B("oliver4_first")])
seq("oliver4_first", [
    ("oliver", K("열한 시 오십 분. 아이를 찾는다는 말을 들었어요. 축제 직원들이 하겠지 했어요.", "Ten to midnight. I heard a child was missing. I thought the festival staff had it."), [focus("oliver"), face("oliver", "worried")]),
    ("oliver", K("본부에 한 줄만 보고했으면 됐어요. 한 줄.", "One line to control. That's all it needed.")),
    ("oliver", K("신고는 00시 05분. 구조대 도착은 00시 30분. 15분이요. 그 15분이.", "The call came at 00:05. Rescue arrived at 00:30. Fifteen minutes. Those fifteen minutes."), [clue("cs_oliver")]),
], "c4_park_hub")
N("oliver4_again", K("누가 하겠지. 다들 그랬어요.", "Somebody will. That's what everyone thought."), "oliver", effects=[focus("oliver")], next="c4_park_hub")

N("c4_gate", effects=[E("checkpoint", value="c4_gate_hub")], next="c4_gate_hub")
N("c4_gate_hub", effects=[focus("wide")], choices=[
    C(K("모스 씨에게 말 걸기", "Talk to Mr. Moss"), "moss4", [], [], "moss"),
    *travel("gate", "c4", "void", "cafe_late"),
])
N("moss4", branches=[B("moss4_again", "clue_cs_moss"), B("moss4_first")])
seq("moss4_first", [
    ("moss", K("수리는 다음 주에 하면 될 줄 알았어. 두 번이나 그렇게 생각했지.", "I thought the repair could wait till next week. Thought that twice."), [focus("moss"), face("moss", "worried")]),
    ("moss", K("아홉 시에 펌프가 멈췄어. 아홉 시 십오 분에 철문을 잠갔어.", "Nine o'clock, the pump quit. Quarter past nine, I locked the gate.")),
    ("moss", K("안은 안 봤어. 누가 거기 있겠냐고. 그게… 그게 잘한 일인 줄 알았어.", "Didn't look inside. Who'd be down there, I said. I thought… I thought I was doing the right thing."), [clue("cs_moss")]),
], "c4_gate_hub")
N("moss4_again", K("안은 안 봤어. 안 봤다고.", "Didn't look inside. I didn't look."), "moss", effects=[focus("moss")], next="c4_gate_hub")

# ---- the final question ----
seq("c4_final", [
    ("", K("모두 다시 광장에 서 있다. 아무도 움직이지 않는다.", "They are all in the square again. Nobody moves."), [focus("wide"), E("beepLoop", num=1.2)]),
], "c4_q")
N("c4_q", K("누가 빅그린베어를 죽였는가?", "Who killed Big Green Bear?"), choices=[
    C(K("모스 씨", "Mr. Moss"), "c4_pick_moss", ["!pick_moss"], [flag("pick_moss"), E("add", "picks")]),
    C(K("릴리", "Lily"), "c4_pick_lily", ["!pick_lily"], [flag("pick_lily"), E("add", "picks")]),
    C(K("핀치 씨", "Mr. Finch"), "c4_pick_finch", ["!pick_finch"], [flag("pick_finch"), E("add", "picks")]),
    C(K("메이블", "Mabel"), "c4_pick_mabel", ["!pick_mabel"], [flag("pick_mabel"), E("add", "picks")]),
    C(K("올리버", "Oliver"), "c4_pick_oliver", ["!pick_oliver"], [flag("pick_oliver"), E("add", "picks")]),
    C(K("아무도 아니다", "Nobody"), "c4_pick_nobody", ["!pick_nobody"], [flag("pick_nobody")]),
    C(K("모두가. 조금씩.", "All of them. A little each."), "c4_all", ["picks>=2"]),
])
N("c4_pick_moss", K("모스 씨는 수리를 미뤘다. 그리고 안을 보지 않고 철문을 잠갔다.\n\n…그것만이 아니었다.", "Mr. Moss put off the repair. And locked the gate without looking inside.\n\n…But that wasn't all of it."),
  effects=[focus("wide")], next="c4_q")
N("c4_pick_lily", K("릴리는 막힌 빗물받이를 보고도 지나쳤다.\n\n…그것만이 아니었다.", "Lily saw the blocked drain and walked on.\n\n…But that wasn't all of it."), next="c4_q")
N("c4_pick_finch", K("핀치 씨는 축제를 멈추지 않았다. 그리고 비상 출구 앞에 상자를 쌓게 했다.\n\n…그것만이 아니었다.", "Mr. Finch didn't stop the festival. And had crates stacked in front of the emergency exit.\n\n…But that wasn't all of it."), next="c4_q")
N("c4_pick_mabel", K("메이블은 바닥 밑의 물소리를 북소리라고 믿었다.\n\n…그것만이 아니었다.", "Mabel decided the water under the floor was drums.\n\n…But that wasn't all of it."), next="c4_q")
N("c4_pick_oliver", K("올리버는 누군가 신고했을 거라고 생각했다.\n\n…그것만이 아니었다.", "Oliver assumed someone else had called.\n\n…But that wasn't all of it."), next="c4_q")
seq("c4_pick_nobody", [
    ("", K("아무도 죽이려 하지 않았다.", "Nobody meant to kill anyone.")),
    ("", K("…하지만 아무도 아니라고 할 수는 없다.", "…But it can't be nobody."), [], ["echo"]),
], "c4_q")

# ---- all of them, a little each ----
seq("c4_all", [
    ("", K("모두가. 조금씩.", "All of them. A little each."), [E("beepLoop", num=0), E("music", num=0), focus("wide")], [], 0.6),
    ("lily", K("19:10 — 꽃잎 몇 개만 걷어 냈어요. 괜찮겠지 했어요.", "19:10 — I only scooped out a few petals. I thought it would be fine."), [E("clock", value="19:10"), face("lily", "worried")]),
    ("finch", K("19:30 — 계속하자고 했어요. 괜찮겠지 했어요.", "19:30 — I said we'd carry on. I thought it would be fine."), [E("clock", value="19:30"), face("finch", "worried")]),
    ("mabel", K("20:15 — 북소리겠지. 괜찮겠지 했어요.", "20:15 — Drums, surely. I thought it would be fine."), [E("clock", value="20:15")]),
    ("moss", K("21:00 — 수리는 다음 주에. 괜찮겠지 했어.", "21:00 — Repair next week. I thought it'd be fine."), [E("clock", value="21:00")]),
    ("moss", K("21:15 — 안은 안 봤어. 괜찮겠지 했어.", "21:15 — Didn't look inside. I thought it'd be fine."), [E("clock", value="21:15")]),
    ("finch", K("22:00 — 출구 앞에 잠깐만. 괜찮겠지 했어요.", "22:00 — In front of the exit, just for a while. I thought it would be fine."), [E("clock", value="22:00")]),
    ("oliver", K("23:50 — 누가 신고했겠지. 괜찮겠지 했어요.", "23:50 — Someone must have called. I thought it would be fine."), [E("clock", value="23:50")]),
    ("", K("23:47 — 니니가 초록 방울을 꼭 쥐고 밖으로 나왔다.", "23:47 — Nini climbed out, holding the small green bell tight."), [E("clock", value="23:47")]),
    ("", K("23:48 — 그리고 빅그린베어는 갇혔다.", "23:48 — And Big Green Bear was trapped."), [E("clock", value="23:48"), E("water", num=0.5)], ["echo"]),
    ("", K("00:05 — 신고.", "00:05 — The call."), [E("clock", value="00:05")]),
    ("", K("00:30 — 구조대 도착.", "00:30 — The rescue team arrives."), [E("clock", value="00:30")]),
    ("", K("00:42 — 구조.", "00:42 — Pulled out."), [E("clock", value="00:42"), E("water", num=0.2)]),
    ("", K("01:00 — 병원.", "01:00 — The hospital."), [E("clock", value="01:00")]),
    ("", K("아무도 자신이 살인을 했다고 생각하지 않았다.", "Not one of them thought they had killed anyone."), [], [], 1.2),
    ("", K("하지만 그 모든 '괜찮겠지'가 모여, 한 사람이 죽었다.", "But every 'it'll be fine', added together, killed a man."), [], ["echo"]),
], "ch5_start")

# ======================================================================
# CHAPTER 5 — 마지막 기억 (the hospital)
# ======================================================================
N("ch5_start", effects=[
    card(K("", ""), K("환한 방", "A Bright Room")),
    unflag("ch4"), flag("ch5"), chapter(K("환한 방", "A Bright Room")),
    E("water", num=0), E("distort", num=0), E("stuck", num=0), E("music", num=0),
    E("go", id="hospital", value="hospital"), E("memory", num=15), E("clock", value="01:05"), E("beepLoop", num=1.1),
    E("checkpoint", value="h_01"),
], next="h_01")
seq("h_01", [
    ("", K("환한 방. 모든 게 멀리 있다.", "A bright room. Everything far away."), [focus("wide")]),
    ("hazel", K("…20분만 빨랐어도.", "…If we'd had twenty more minutes."), [focus("hazel"), face("hazel", "worried")]),
    ("", K("빈 손. 방울은 이제 여기 없다. 그래도 괜찮다. 있어야 할 곳에 있으니까.", "An empty paw. The bell isn't here any more. That's all right. It's where it belongs."), [focus("ceiling")]),
    ("hazel", K("그 아이는 무사해요.", "She's safe."), [face("hazel", "neutral")]),
    ("bear", K("니니는… 집에 갔나요?", "Nini… did she get home?"), [focus("ceiling")]),
    ("hazel", K("네.", "Yes."), [focus("hazel")]),
    ("", K("", ""), [], [], 2.6),
    ("bear", K("다행이다.", "Good."), [focus("ceiling"), E("beepLoop", num=1.8)]),
    ("bear", K("그럼… 됐어요.", "Then… that's enough.")),
    ("", K("", ""), [E("beepLoop", num=0), E("sound", "flatline"), E("clock", value="01:17")], [], 4.5),
], "epi_start")

# ======================================================================
# EPILOGUE — years later
# ======================================================================
N("epi_start", effects=[
    card(K("", ""), K("시간이 흐른다", "Time passes")),
    unflag("ch5"), flag("epilogue"), E("hud", num=0),
    E("go", id="home", value="attic"), E("memory", num=100), E("music", num=0.35),
], next="epi_01")
seq("epi_01", [
    ("", K("다락방. 둥근 창으로 오후 햇살이 들어온다.", "An attic. Afternoon light through a round window."), [focus("wide")]),
    ("", K("어른이 된 니니가 작은 상자를 연다.", "Nini, grown up, opens a small box."), [focus("box")]),
    ("", K("그 안에, 초록색 방울.", "Inside: a small green bell."), [E("bell", value="box")]),
    ("", K("니니가 방울을 한 번 흔든다.", "She rings it, once."), [focus("nini"), E("face", "niniadult", "blink")]),
    ("", K("딸랑.", "Ting."), [E("sound", "bell")], [], 1.0),
    ("", K("", ""), [E("music", num=0)], [], 3.5),
], "the_end")
N("the_end", effects=[E("end")])

# ======================================================================
# CLUES (the notebook)
# ======================================================================
def CL(id, title, text): return {"id": id, "title": title, "text": text}
clues = [
    CL("c_1147", K("11:47", "11:47"), K("시청 시계는 늘 11시 47분이다. 아무도 고치지 않는다.", "The town hall clock always says 11:47. Nobody fixes it.")),
    CL("c_mission", K("니니를 찾는다", "Find Nini"), K("꽃가게, 카페, 공원, 마을 입구, 그리고 광장. 다들 무언가 봤을 것이다.", "The flower shop, the cafe, the park, the town gate, the square. Someone saw something.")),
    CL("c_finch", K("핀치 씨: 41년", "Mr. Finch: forty-one years"), K("니니는 퍼레이드 내내 무대 앞에서 방울을 흔들었다. 축제는 한 번도 취소된 적이 없다.", "Nini rang her bell at the stage all through the parade. The festival has never been cancelled.")),
    CL("c_fox", K("폭스의 수첩", "Fox's notebook"), K("번진 숫자들: '00:05 … 00:42 … 1:17'. 내일 아침 기사라고 했다.", "Smudged numbers: '00:05 … 00:42 … 1:17'. For tomorrow morning's paper, he said.")),
    CL("c_notice", K("21:15 폐쇄", "Closed 21:15"), K("통로 철문의 안내문. 읽은 건 아홉 시도 되기 전이었다. 그 순간 시계가 11:47을 가리켰다.", "The notice on the passage gate. Read before nine o'clock. In that moment the clock showed 11:47.")),
    CL("c_bell", K("초록 방울", "The green bell"), K("니니의 방울. 계단 위 웅덩이에서 찾았다. 물속에 오래 있었던 것처럼 차갑다.", "Nini's bell. Found in the puddle by the steps. Cold, as if it had been under water a long time.")),
    CL("c_lily", K("릴리: 분수 쪽으로", "Lily: toward the fountain"), K("니니는 방울을 찾으며 분수 쪽으로 뛰어갔다. 릴리는 젖은 꽃을 정리하던 중이었다.", "Nini ran to the fountain, asking about her bell. Lily was packing up her wet flowers.")),
    CL("c_garland", K("빗물받이의 꽃장식", "The garland on the drain"), K("릴리가 분수 옆 빗물받이에 꽃장식을 둘렀다. 휑해 보여서.", "Lily wrapped a garland round the drain by the fountain. It looked bare.")),
    CL("c_mabel", K("메이블: 이미 집에", "Mabel: already home"), K("니니는 엄마랑 진작 집에 갔다. 창문으로 봤다.", "Nini went home with her mum ages ago. Mabel saw it through the window.")),
    CL("c_noise", K("바닥 밑의 소리", "Sounds under the floor"), K("쿵. 꾸르륵. 축제 북소리라고 했다. 그리고 그 아래, 삑— 하는 소리.", "Thud. Gurgle. 'The festival band', Mabel said. And under it, a beep.")),
    CL("c_room", K("바뀐 방", "The room that changed"), K("카페 창문이 반대쪽에 있다. 테이블이 하나 줄었다. 없던 시계가 생겼다. 11:47.", "The cafe window is on the other side. A table is missing. A clock that wasn't there: 11:47.")),
    CL("c_oliver", K("올리버: 00시 05분", "Oliver: 00:05"), K("실종 신고는 00시 05분에 들어왔다고 했다. 지금은 저녁 일곱 시인데.", "The missing-child call came in at 00:05, he said. It's seven in the evening.")),
    CL("c_choir", K("끝난 합창", "The choir that had ended"), K("'종소리 합창 오후 9:00 — 종료.' 아직 아홉 시도 안 됐다.", "'Bell Choir 9:00 PM — ENDED.' It isn't nine yet.")),
    CL("c_moss", K("모스 씨: 펌프 수리", "Mr. Moss: the pump"), K("펌프가 위태로웠다. 수리는 '축제 끝나고'. 두 번째로 미뤄졌다.", "The pump was failing. Repair: 'after the festival'. Pushed back for the second time.")),
    CL("c_lock", K("모스 씨: 21:15 잠금", "Mr. Moss: locked at 21:15"), K("물이 들어와서 통로 철문을 잠갔다. 안은 확인하지 않았다.", "Water was getting in, so he locked the passage gate. He didn't look inside.")),
    CL("c_beep", K("펌프장의 기계음", "The beeping at the pump house"), K("펌프 소리 아래로, 일정한 간격의 삑— 소리. 경보음치고는 너무 차분하다.", "Under the pump's hum, a steady beep. Too calm for an alarm.")),
    CL("c_times", K("아무도 거짓말하지 않았다", "Nobody lied"), K("다들 같은 밤의, 서로 다른 시간을 말하고 있다.", "They are all describing the same night. Different hours of it.")),
    CL("c_mission3", K("시간을 맞춘다", "Put the times in order"), K("각자 '언제의' 니니를 봤는지 다시 묻는다.", "Ask again: when exactly did each of them see her?")),
    CL("c_lily2", K("릴리: 열한 시쯤", "Lily: around eleven"), K("릴리가 꽃을 정리한 건 열 시 넘어서였다. 니니를 본 건 열한 시쯤.", "Lily packed up after ten. She saw Nini around eleven.")),
    CL("c_mabel2", K("메이블: 다시 나온 니니", "Mabel: Nini came back out"), K("열 시 반, 엄마랑 집에 갔다. 열한 시 넘어, 혼자 다시 광장 쪽으로 뛰어갔다.", "At half ten she went home with her mum. After eleven she ran back toward the square, alone.")),
    CL("c_hatch", K("카페의 점검구", "The cafe hatch"), K("카페 뒷문 쪽 바닥에 통로로 내려가는 작은 구멍이 있다.", "By the cafe's back door, a small hatch leads down into the passage.")),
    CL("c_oliver2", K("올리버: 누가 하겠지", "Oliver: someone else will"), K("열한 시 오십 분에 아이 얘기를 들었다. 축제 직원들이 하겠지 했다. 신고는 00:05.", "He heard about the child at 23:50. Assumed the festival staff had it. The call came at 00:05.")),
    CL("c_crates", K("카페 쪽 출구의 상자", "Crates at the cafe-side exit"), K("통로 카페 쪽 비상 출구 앞에 축제 상자가 쌓여 있다고 했다.", "Festival crates were stacked in front of the passage's cafe-side exit.")),
    CL("c_lost", K("방울을 잃어버린 시각", "When the bell was lost"), K("니니는 집에 가서야 방울이 없다는 걸 알았다. 밤 11시 넘어서.", "Nini only noticed the bell was gone once she was home. After eleven.")),
    CL("c_where", K("니니가 간 곳", "Where Nini went"), K("철창 사이로, 방울을 찾으러, 물이 차오르는 통로로.", "Between the bars, after her bell, into the flooding passage.")),
    CL("c_fold", K("반으로 접힌 밤", "The night, folded in half"), K("일곱 시가 아니었다. 니니를 찾기 시작한 건 밤 11시 40분이었다.", "It wasn't seven. The search began at 11:40 at night.")),
    CL("c_article", K("폭스의 기사", "Fox's article"), K("'통로에 고립된 아이, 무사히 구조. 아이를 구한 축제 마스코트는…' 그다음은 번졌다.", "'Child trapped in passage rescued safely. The festival mascot who saved her…' The rest has run.")),
    CL("c_memory", K("이미 일어난 일", "It already happened"), K("마을을 돌아다닌 게 아니었다. 그날 밤을 다시 기억하고 있었다.", "Not walking through the town. Remembering that night, again.")),
    CL("cs_finch", K("핀치 씨의 차례", "Mr. Finch's turn"), K("19:30 축제를 계속했다. 22:00 비상 출구 앞에 상자를 쌓게 했다. '잠깐만.'", "19:30: kept the festival going. 22:00: had crates stacked at the emergency exit. 'Just for a while.'")),
    CL("cs_lily", K("릴리의 차례", "Lily's turn"), K("19:10 막힌 빗물받이를 보고, 꽃잎 몇 개만 걷어 냈다. '누가 치우겠지.'", "19:10: saw the blocked drain, scooped out a few petals. 'Somebody will clear it.'")),
    CL("cs_mabel", K("메이블의 차례", "Mabel's turn"), K("20:15 바닥 밑 물소리를 북소리라 여겼다. '누군가는 알겠지.'", "20:15: took the water under the floor for drums. 'Someone would know.'")),
    CL("cs_oliver", K("올리버의 차례", "Oliver's turn"), K("23:50 아이 얘기를 듣고도 보고하지 않았다. '누가 신고했겠지.'", "23:50: heard about the child, reported nothing. 'Someone must have called.'")),
    CL("cs_moss", K("모스 씨의 차례", "Mr. Moss's turn"), K("수리를 두 번 미뤘다. 21:15 안을 보지 않고 철문을 잠갔다.", "Put off the repair twice. 21:15: locked the gate without looking inside.")),
]

# ======================================================================
script = {
    "start": "start",
    "startClock": "17:40",
    "ui": {
        "title": K("빅그린베어의 모험", "BIG GREEN BEAR'S ADVENTURE"),
        "subtitle": K("벨플라워 마을의 작은 미스터리", "A small mystery in Bellflower Town"),
        "pressStart": K("", ""),
        "chapterLabel": K("", ""), "chapterTitle": K("", ""),
        "prompt": K("무엇을 할까?", "What do you do?"),
        "toBeContinued": K("", ""),
        "controls": K("Enter / 클릭: 계속   ·   1-9 또는 장면 클릭: 선택   ·   N: 수첩   ·   L: English   ·   Esc: 종료",
                      "Enter / click: continue   ·   1-9 or click the scene: choose   ·   N: notebook   ·   L: 한국어   ·   Esc: quit"),
        "motionOn": K("M: 움직임 줄이기 켜짐", "M: reduced motion ON"),
        "motionOff": K("M: 움직임 줄이기", "M: reduce motion"),
        "newGame": K("처음부터", "New game"),
        "continueGame": K("이어하기", "Continue"),
        "notebook": K("수첩", "Notebook"),
        "notebookEmpty": K("아직 적은 게 없다.", "Nothing written yet."),
        "clueAdded": K("수첩에 적었다:", "Noted:"),
        "theEnd": K("끝", "The End"),
    },
    "speakers": [
        {"id": "bear", "name": K("빅그린베어", "Big Green Bear"), "color": "#8FD18A"},
        {"id": "nini", "name": K("니니", "Nini"), "color": "#F2D16B"},
        {"id": "niniadult", "name": K("니니", "Nini"), "color": "#F2D16B"},
        {"id": "lily", "name": K("릴리", "Lily"), "color": "#F2A0B5"},
        {"id": "finch", "name": K("핀치 씨", "Mr. Finch"), "color": "#E9A15B"},
        {"id": "mabel", "name": K("메이블", "Mabel"), "color": "#D9B38C"},
        {"id": "oliver", "name": K("올리버", "Oliver"), "color": "#8EC5E8"},
        {"id": "hazel", "name": K("헤이즐 선생님", "Dr. Hazel"), "color": "#C9E4E0"},
        {"id": "fox", "name": K("폭스", "Fox"), "color": "#F08A5D"},
        {"id": "moss", "name": K("모스 씨", "Mr. Moss"), "color": "#B7A6E0"},
    ],
    "clues": clues,
    "nodes": nodes,
}

# ---------------- validation ----------------
problems = []
layout = json.load(open("Assets/BigGreenBear/Resources/BGB/Data/layout.json"))
locs = {l["id"]: l for l in layout["locations"]}
clue_ids = {c["id"] for c in clues}
speakers = {s["id"] for s in script["speakers"]}
for n in nodes:
    targets = [n["next"]] + [b["to"] for b in n["branches"]] + [c["next"] for c in n["choices"]]
    for t in targets:
        if t and t not in ids: problems.append(f"{n['id']} -> missing node {t}")
    if n["speaker"] and n["speaker"] not in speakers: problems.append(f"{n['id']}: unknown speaker {n['speaker']}")
    if not n["text"]["en"] and not n["choices"] and not n["branches"] and not n["next"] and not n["effects"] and not n["hold"]:
        problems.append(f"{n['id']} does nothing")
    if bool(n["text"]["en"]) != bool(n["text"]["ko"]): problems.append(f"{n['id']} missing a language")
    for e in n["effects"] + [e for c in n["choices"] for e in c["effects"]]:
        if e["type"] == "go" and e["value"] not in locs: problems.append(f"{n['id']}: unknown location {e['value']}")
        if e["type"] == "clue" and e["id"] not in clue_ids: problems.append(f"{n['id']}: unknown clue {e['id']}")
for n in nodes:
    for c in n["choices"]:
        for cond in c["conditions"]:
            name = cond.lstrip("!").split(">=")[0].split("<")[0]
            if name.startswith("clue_") and name[5:] not in clue_ids: problems.append(f"{n['id']}: condition on unknown clue {name}")
if problems:
    raise SystemExit("story.json problems:\n" + "\n".join(problems))

out = "Assets/BigGreenBear/Resources/BGB/Data/story.json"
json.dump(script, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"wrote {out}: {len(nodes)} nodes, {len(clues)} clues")
