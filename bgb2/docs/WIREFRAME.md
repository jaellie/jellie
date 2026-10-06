# BGB2 — Master Wireframe (1280 × 720, 16:9)

## 0. 액자식 구조 (Frame concept)
화면 전체 = **하나의 물리적인 책/종이 액자**. 게임은 그 안의 shadow-box "무대"에서 진행된다.

```
┌──────────────────────────────────────────────────────────────────────────────┐ 1280
│ ░ BOOK COVER / DESK (#111923) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ┌────────── PAPER FRAME (cream passe-partout, 20px inset) ───────────────┐  │
│  │ CASE No.07 · THE OLD CLOCK TOWER                          ◷ 11:47      │  │ header 48
│  │                                                                        │  │
│ ┌┴─┐ ┌──────────────────────────────────────────────┐  ┌─────────────┐   │  │
│ │PE│ │                                              │  │  MIRROR     │   │  │
│ │OP│ │   STAGE  960 × 540 (shadow box)              │  │  WINDOW     │   │  │
│ │LE│ │   BG · MID · CHAR · FG · LIGHT               │  │  160 × 540  │   │  │
│ ├──┤ │                                              │  │  flipped    │   │  │
│ │EV│ │                                              │  │  clone of   │   │  │
│ │ID│ │                                              │  │  right edge │   │  │
│ ├──┤ │                                              │  │  (lags 0.4s,│   │  │
│ │ST│ │                                              │  │  1 tiny diff│   │  │
│ │AT│ │                                              │  │  per scene) │   │  │
│ ├──┤ │                                              │  └─────────────┘   │  │
│ │TI│ │                                              │                    │  │
│ │ME│ └──────────────────────────────────────────────┘                    │  │
│ ├──┤  ┌──────────────────────────────────────────────────────────────┐   │  │
│ │ID│  │ DIALOGUE / NARRATION STRIP  (portrait · text · questions)    │   │  │ 100
│ └┬─┘  └──────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
 x: tabs 20–130 (stick out of frame) · stage 130–1090 · mirror 1110–1270*
```
\* mirror is inside frame; exact px in `styles.css` (`--stage-x`, `--mirror-x`).

### Mirror = 쌍둥이 복선 (플레이어는 모름)
- UI에서 라벨 없음. 그냥 "유리창 장식"처럼 보임.
- 무대 우측 가장자리를 **좌우반전**해서 비춤 → 오른손잡이 곰이 **왼손잡이처럼** 보임, 매듭도 반대쪽.
- 0.4s 늦게 따라옴 (물리적으로 말이 되는 수준의 약한 지연).
- 씬마다 **딱 1개** 차이 (`mirrorDiff`): 촛불 꺼짐 / 컵 손잡이 / 의자 수 …
- 엔딩 이후에만 의미가 생김. 절대 초자연 연출 금지.

## 1. 화면 흐름 (Screen graph)
```
BOOT → MENU ─┬─ NEW GAME ──► PLAY ◄──────────────┐
             ├─ CONTINUE ──► PLAY                │
             ├─ CASE FILE ─► FOLDER(read-only)   │
             └─ SETTINGS                          │
PLAY ──(Tab / click left tab)──► FOLDER ──(Esc)───┘
PLAY ──(NPC interact)──► DIALOGUE (strip only, stage stays visible)
PLAY ──(final)──► ENDING (case file closes → clock 11:47→11:48 → 2 silhouettes → black)
```

## 2. MENU
```
        ┌─────────────────────────────────────────┐
        │        [ symmetrical clock tower ]      │
        │   🐻 silhouette        silhouette 🐻    │  ← 한 쪽만 살짝 offset
        │                                         │
        │      BIG GREEN BEAR'S ADVENTURE II      │  Cormorant Garamond
        │              THE OTHER BEAR             │
        │                                         │
        │   ┌ CONTINUE ┐ ┌ NEW GAME ┐             │  paper tabs (선택 시 4px shift)
        │   ┌ CASE FILE┐ ┌ SETTINGS ┐             │
        └─────────────────────────────────────────┘
```

## 3. FOLDER (Case File) — 좌측 탭이 폴더 인덱스 탭
```
tabs(left, sticking out)   page (stage 영역을 덮는 다크블루 폴더 + 크림 종이)
 PEOPLE      ┌──────────────────────────────────────────────┐
 EVIDENCE    │  PEOPLE: 1 portrait → 2 identical → IDENTITY │
 STATEMENTS  │  EVIDENCE: card grid (title/where/observe)   │
 TIMELINE    │  STATEMENTS: who said what, when             │
 IDENTITY    │  TIMELINE: 11:10 ─ 11:20 ─ … ─ 11:47 ─ 11:50 │
             │  IDENTITY: [BIG GREEN BEAR] | [GREEN] board  │
             └──────────────────────────────────────────────┘
```
### IDENTITY board
```
 ┌────────────── BIG GREEN BEAR ─────┬────────────────── GREEN ──────────────┐
 │  (drop zone — cards clip on)      │  (drop zone)                           │
 │  📎 Uses right hand               │  📎 Uses left hand        CONFLICT ✎   │
 └───────────────────────────────────┴────────────────────────────────────────┘
 TRAY: [Scarf knot] [Ear scar] [Likes the bell] [Seen at café] [Photo] …
```
- 충돌 = 같은 trait에 다른 value가 한 칼럼에 → 빨간 연필 `CONFLICT` (정답/오답 안 알려줌).

## 4. Stage layers (parallax, back→front)
`BG (walls/sky 0.2x) → MID (architecture 0.5x) → CHAR (1x) → FG (paper edges 1.4x) → LIGHT (multiply/screen)`

## 5. Room graph (같은 공간 반복 방문 = 기억 테스트)
`ENTRANCE ⇄ STAIRS ⇄ ARCHIVE ⇄ BELL ⇄ MECHANISM ⇄ OBSERVATORY`
방문 횟수별 촛불: 1회 왼쪽 1개 → 2회 2개 → 3회 오른쪽 1개 → 4회 없음 (의도적 일부는 노이즈).

## 6. Init 범위 (이번 커밋)
- [x] 액자 프레임 + 1280×720 스케일링
- [x] 좌측 폴더 탭 / 폴더 페이지 5종
- [x] 우측 Mirror window (flip + lag + 1 diff)
- [x] 메뉴 / 씬 렌더러 / 6개 방 / 방문별 변화 / 시계 거동
- [x] Identity board (drag, clip, CONFLICT)
- [ ] 다이얼로그, 신뢰 메모, 엔딩, 사운드(훅만 있음)
