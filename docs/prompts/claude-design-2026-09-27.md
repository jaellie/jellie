# Claude Design에 붙여넣을 프롬프트 (2026-09-27)

```
엔진 파일을 첨부한 새 lovesim-engine.js로 통째로 교체해줘. 그리고 화면을 카이로소프트 게임처럼 바꿔줘.

1. 하단 버튼 전부 삭제
   - "잠자기 / 요리 / 식사 / 나가기" 같은 행동 버튼과 목적지 목록을 모두 없애줘. 하루는 자동으로 흘러가고, 플레이어는 팝업에만 답해.

2. 로그 한 줄은 맨 위로
   - HUD(날짜·나이·돈) 바로 아래에 한 줄 로그: "10:02 시우와 처음으로 제대로 이야기했다." 처럼 시간 + 문장.
   - {kind:"log"} 와 {kind:"enter"} 의 텍스트를 여기에 표시.

3. 문자 알림은 로그 밑에서 "사르르" 내려오기
   - {kind:"toast"} 가 오면 로그 줄 뒤에서 아래로 슬라이드되며 나타나고, 최대 3개까지 쌓이고, 약 4초 뒤 사라지게.
   - 보낸 사람은 toast.from, 내용은 toast.text. (엔진이 "[아빠] …" 같은 말머리를 이미 보낸 사람 이름으로 바꿔서 줘. 이름이 두 번 나오지 않게.)

4. 모든 팝업은 게임 화면 정중앙
   - 이름은 항상 popup.name (결과창은 choose() 결과의 name).
   - popup.big === true 이면 "인생의 큰 사건" 팝업 (고백, 상견례, 결혼식, 부고, 병원에서 온 전화, 이별, 배신, 출산…):
     카이로소프트 "계절 이벤트" 창처럼 → 위에 파란 배너로 popup.title, 가운데 그림 = popup.scene 을 game.scene()과 똑같이 그려서 축소, 그 아래 이름·대사·선택지.

5. 캐릭터 이름표 삭제
   - 캐릭터 아래/위에 이름 표시하지 마.

6. 사람들이 진짜로 걸어다니게 (카이로소프트처럼)
   - game.wander() 를 500ms마다 호출.
   - 각 캐릭터를 이전 spot → 새 spot 으로 480ms 동안 linear 이동.
   - 캐릭터 DOM은 who 기준으로 재사용해줘 (매번 새로 그리지 말고 위치만 바꾸기) — 그래야 부드럽게 걸어가.
   - actor.walking === true 면 걷는 프레임, actor.facing 이 "NW"/"SW" 면 좌우 반전, actor.offscreen === true 면 숨기기 (화면 밖으로 나간 사람, 나중에 다시 들어와).
   - npcType "extra" 는 그냥 지나가는 사람 (길거리/카페를 붐비게 하는 용도).

7. 배경
   - 그리는 순서: ROOMS[scene.bgId] → 없으면 ROOMS[scene.sceneKey] → 없으면 ROOMS[scene.roomKey].
   - scene.standIn === true 면 아직 전용 그림이 없어서 비슷한 배경을 빌려 쓴 거야. 아래 장소들을 새로 그려줘 (위에서부터 중요):
     wedding_venue(웨딩홀), funeral_hall(장례식장), hospital(병원), court(가정법원), airport(공항), airplane(비행기 안),
     family_home(본가), business_hotel(출장 호텔), branch_office(지사 사무실), gym(헬스장), library(도서관), university(캠퍼스),
     cooking_class(요리 교실), beach_cafe(바닷가 카페), boardwalk(해변 산책로), surf_school(서핑 스쿨),
     paris_street / paris_cafe / paris_seine / paris_eiffel_tower / paris_louvre / paris_hotel, tokyo_hotel.
   - 그림 이름은 sceneKey 그대로 ROOMS.funeral_hall 처럼.

8. 시작 화면
   - 기본값: 이름 "제이", 생년월일 1997년 9월 28일 (양력). 태어난 시간은 비워두기.
   - "나의 가족" 입력 추가: 엄마(계심/돌아가심), 아빠(계심/돌아가심), 형제(언니/오빠/누나/형/남동생/여동생 + 이름, 여러 명 가능), 살아 계신 조부모님 수(0~4, 모름).
   - "운명의 상대" 입력 추가: 그 사람과 나는 → (내가 좋아하는 사람 / 이미 연인 / 아직 모르는 사람), 그 사람 생일(선택), MBTI(선택).
   - 넘기는 방법:
     LoveSim.createGame({
       name, gender, likes, birth, mbti, lang: "ko",
       family: { mom: { alive }, dad: { alive }, siblings: [{ rel: "오빠", name: "민수" }, { rel: "여동생" }], grandparents: 2 },
       fated: { name, status: "crush" | "dating" | "stranger", birth: { year, month, day }, mbti, from: "same" },
     })

9. 새 역할(role): sibling(형제), relative(친척), extra(지나가는 사람). 문자 보낸 사람이 형제면 toast.from 이 "오빠"/"언니" 처럼 와.
```
