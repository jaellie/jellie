# Claude Design에 붙여넣을 프롬프트 (2026-10-01 · 10차)

새 lovesim-engine.js + bg-pack.zip 안의 PNG 21장(bg 폴더)을 같이 첨부하세요. (i 다음에 이것)

```
엔진 파일을 첨부한 새 lovesim-engine.js로 통째로 교체해줘. (지난 프롬프트 내용은 그대로 유지하고, 아래만 추가/수정)

━━ 이벤트 팝업 사진 = 그려 둔 배경 그림 ━━
- 첨부한 PNG 21장을 프로젝트의 bg/ 폴더에 넣어줘 (파일 이름 그대로: park_proposal.png, wedding_ceremony.png, funeral_hall.png …).
- popup.scene.photo (그리고 card.scene.photo) 가 있으면, 그 사진 칸에는 방을 코드로 그리지 말고 그 그림을 배경으로 써:
  · background: url(<photo>) center bottom / cover no-repeat  (photo 값 예: "bg/park_proposal.png")
  · 그림이 사진 칸을 꽉 채우게 (비율이 달라도 잘라서 채우기, 아래쪽 기준)
  · decor(소품), 바닥 타일, 벽은 그리지 않기 — 그림에 이미 다 있어.
- 사람은 그림 위에 올리되, scene.actors 의 원래 x,y 좌표는 쓰지 말고 "바닥"에 나란히 세워줘:
  · 발끝 위치 = 사진 칸 높이의 88% 지점 (한 줄)
  · 나(me)와 상대(partner/fated)는 가운데에 나란히, 둘 사이 간격은 캐릭터 폭의 10% 정도
  · 다른 사람들(가족, 손님 등)은 그 양옆으로 캐릭터 폭만큼씩 떨어져서, 최대 6명까지 (나머지는 생략)
  · 캐릭터 크기 = 사진 칸 높이의 약 35%
  · 머리가 사진 칸 위로 잘리거나 칸 밖으로 나가는 일이 없게.
- photo 가 없으면 지금처럼 코드로 그린 방 그대로 (영화관, 도서관 등은 아직 그림이 없어).
```
