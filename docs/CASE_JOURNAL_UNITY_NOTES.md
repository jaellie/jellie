# Case Journal: Unity 이식 노트

웹 프로토타입(`prototype/bell_village_web/index.html`, `#jrnl`)과 1:1로 맞춘 값이다. 좌표는 모두 **1920×1080 기준 캔버스 픽셀**이고 원점은 좌상단이다.

## 1. 캔버스
- Canvas Scaler: Scale With Screen Size, Reference Resolution 1920×1080, Match 1 (높이 기준). 넓은 화면은 저널을 가운데에 두고 양옆을 채운다 (웹: `left = (STAGE_W-1920)/2`).
- 저널이 열려 있는 동안 HUD(케이스 플레이트, 사이드 패널, 버튼)는 숨긴다.

## 2. 스프라이트와 배치 (Pivot = 좌상단, PPU 100)
| 이름 | 크기 | 위치 | 비고 |
|---|---|---|---|
| journal_pages | 1646×908 | (50,85) | 맨 아래 |
| journal_cover | 1697×1022 | (24,29) | 페이지와 내용 위. 안쪽이 투명 |
| spine (얇은 이음선, A안) | 44×892 | (851,93) | 아트 도착 전에는 웹처럼 그라데이션 + 끈 4개 |
| journal_bookmark_{burgundy,brass,navy,moss}_{normal,selected} | 170×62 | x=1726 (선택 시 +6), y=190+118·i | 인물, 증거, 사건, 추리 순 |
| journal_polaroid_tile | 212×237 | 창 (21,22) 170×155 | 사진은 창 뒤, 틀은 위 |
| journal_polaroid_large | 236×290 | 창 (22,25) 193×194 | |
| journal_card | 404×122 | **9-slice**, Sprite Editor Border L/R/T/B = 26 | 진술 쪽지, 장소 카드 |
| journal_map | 596×576 | 오른쪽 페이지 (969,150) | |
| journal_marker_{normal,selected} | 96×96 | 핀 끝 = (48,84) | Pivot (0.5, 12/96=0.125). 핀 끝 좌표에 그대로 둔다 |
| journal_plaque_{normal,selected,current} | 161×46 / 174×52 / 183×46 | **9-slice**, L/R Border = 22, T/B = 0 | 핀 끝 아래 10px, 가운데 정렬. 가로만 늘어난다 |
| journal_stamp_ring_{ochre,green} | 96×96 | 질문 줄 오른쪽 | −8° 회전, 글자는 TMP |
| journal_stamp_file_burgundy | 200×59 | 오른쪽 페이지 머리 | −4° |
| journal_stamp_exhibit_navy | 150×48 | 증거 전시대 | −3° |

콘텐츠 영역: 왼쪽 페이지 x127–831, 오른쪽 x915–1619, y140–950 (폭 704, 높이 810). 쪽 머리글은 y104.

## 3. 글꼴
- 한글 Pretendard (400/600/700), 영문과 숫자는 Alegreya. TMP Font Asset은 KS X 1001 2,350자 + ASCII로 Static 또는 Dynamic 생성. 웹은 같은 부분집합 woff2를 쓴다.
- 대사에는 쓰지 않던 `—`(엠 대시)는 화면 문구에도 쓰지 않는다. 시각은 아라비아 숫자.

## 4. 빨간 실 (UI Line)
- 선택된 시간 줄 하나에서만 그린다. 시작점은 왼쪽 페이지 오른쪽 끝(x≈827, 줄의 첫 줄 높이 + 28), 오른쪽 페이지 왼쪽 여백 x=940의 통로를 지나 마커 머리 왼쪽(마커 x−22)에서 끝난다.
- 직각 경로 + 반지름 18 모서리. Unity에서는 `UILineRenderer`(Vertices 직접 계산) 또는 Image를 늘려 쓴다. 그림자는 (2,4) 오프셋, 굵기 7, 알파 0.32.
- 플라크나 장소 카드와 겹치면 안 된다. 웹은 y를 0, ±22, ±44, ±66 순으로 시도해 비어 있는 높이를 고른다.
- 장소가 없는 기록은 점선(12/9)으로 x=944까지만 가고 점선 원 + "?"로 끝난다. 장소를 억지로 정하지 않는다.

## 5. 데이터 (그대로 옮김)
- 저장 키와 필드: `S.ev`, `S.notes`, `S.flags`, `S.vis`, `S.qa[q]={v,n,b}`. 증거 ID 55개와 `EV_META`(group/kind/reach/why/holder)는 그대로.
- 장소 핀 좌표 (지도 596×576 기준 문 앞 바닥): cottage (141,136), plaza (292,196), healer (105,272), tower (295,350), archive (478,325), cafe (123,428), mill (380,478). 파일: `docs/CASE_JOURNAL_PLACES.json`.
- 시간 줄: `TL_DATA` (시각, 종류 fact/claim/est, 증거 ID, 문장). 장소는 기록 자체가 장소를 말하는 줄만 `ROW_PLACE`로 연결 (11:40 tower, 11:42 cafe, 11:47 tower).
- 질문: `QS` 6개. 새 단서는 판단을 바꾸지 않는다. 근거 표시와 판단은 별개.
- 그린은 `fin.m1` 전에는 인물 탭에 나오지 않는다.

## 6. 상호작용 요약
- 인물: 폴라로이드 선택 → 오른쪽에 인물 파일(프로필, 진술, 관찰, 회상, 관련 증거).
- 증거: 3×3 묶음(9개씩 쪽 넘김), 묶음 선택 → 오른쪽에 항목 칩, 전시대, 설명, 장소, "질문 N에서 사용".
- 사건: 시간 줄 선택 ↔ 지도 장소. 지도에서 장소를 눌러도 선택. 방문한 장소만 표시.
- 추리: 질문 색인 → 오른쪽에 1) 단서 확인(코르크), 2) 나의 판단.
- 탭 이동은 책갈피. 닫기는 우상단 (1738,40) 78×80.

## 7. 아직 CSS로 대신한 것 (K 배치 스프라이트 도착 시 교체)
얇은 이음선, 증거 묶음 틀(서류/물건 받침), 코르크판, 단서 쪽지, 판단 버튼, 전시대, 칩, 시간 줄 마커, 책갈피 아이콘.

## 8. 증거 묶음 스프라이트 (K 배치 1차, 납품됨)
| 이름 | 크기 | 쓰임 |
|---|---|---|
| journal_stack_doc | 186×238 | 서류형 묶음. 화면에는 124×159로 그림 |
| journal_stack_photo | 207×238 | 사진 묶음. 창 (25,29)–(182,166), 안에 사진 |
| journal_stack_tray | 285×187 | 물건 묶음. 안쪽 붉은 천 위에 아이콘 |
| journal_stack_sheet | 186×238 | 묶음 뒤에 깔리는 종이 (8°, 4° 기울임) |
원본: `art_source/originals/journal_k_stacks_v1.png` (sha256은 MANIFEST). 윤곽의 붉은 잔여 픽셀은 알파 정리로 제거했다.

## 9. K 배치 2차 스프라이트 (납품됨, 게임에 적용)
| 이름 | 크기 | 쓰임 / 9-slice 경계(스프라이트 기준 px) |
|---|---|---|
| journal_cork | 924×414 | 코르크판. 9-slice 46, 화면 테두리 24 |
| journal_cardpin | 400×149 | 단서 쪽지(붉은 핀 포함). 9-slice 50, 화면 18 |
| journal_opt / journal_optsel | 500×96 / 500×97 | 판단 버튼 보통/선택. 9-slice 36, 화면 18 |
| journal_selrow | 700×117 | 시간 줄 선택 배경(반투명 분홍). 9-slice 40, 화면 12 |
| journal_exhibit | 960×395 | 증거 전시대. 9-slice 110, 화면 34 |
| journal_rule | 930×46 | 구역 제목 줄. 9-slice 좌 120 / 우 30, 화면 높이 12 |
| journal_scrolltrack / thumb | 34×330 / 34×204 | 스크롤바 |
| journal_tabicon_{people,evidence,events,notes} | 폭 96 | 책갈피 아이콘(화면 최대 32) |
| journal_tl_line | 46×81 | 시간 줄 점선, 세로 반복(화면 8×15) |
| journal_tl_{fact,claim,unk} / tl_est | 72×72 / 47×180 | 기록, 진술, 미확인 마커 / 추정 구간 마커 |
| journal_scroll | 930×132 | 아직 쓰는 곳 없음 |
원본은 `art_source/originals/journal_k_*_v1.png` (sha256은 MANIFEST). 반투명 내부는 그대로 두고 윤곽 가장자리만 색을 정리했다.

## 10. 아이콘 세트와 태그 (K 배치 3차, 게임에 적용)
- 칩, 작은 버튼은 `journal_plaque_normal/current`(9-slice 좌우 22)를 **높이 46 고정**으로 쓴다. 세로로 늘리면 모서리 황동 장식이 찌그러지므로 높이는 늘리지 않는다.
- 그룹 아이콘 `journal_gi_{clock,tower,history,letter,photo,hiding,trace,medical,cafe,patrol,plaza,scene,document}` (긴 변 224). 묶음 틀 안에 84px로 그린다.
- 항목 아이콘 `journal_ei_*` (긴 변 224). 증거 ID 연결(코드 `EI`): clock, mech, hatch2→hatch, pwatch/watch→pwatch, bellinc→bell, oldrep, mreq, noledger, draft/letters→draft, mnote, notebook, tdoc/torn_page→tornpage, thread/wool→thread, button, hidden/glove→hidden, notice, tod, receipt, tab_pm→tabpm, pit, hide→frame. 짝을 정하지 못해 아직 연결하지 않은 것: photomill, photolantern.
- `journal_tag` 540×186: 전시대 라벨. 늘리지 않고 300×104로 그린다(밧줄 구멍 오른쪽에 글자).
원본: `journal_k_icons_groups_v1`, `journal_k_icons_items_v1`, `journal_k_icons_items2_v1`, `journal_k_tag_v1`.

## 11. 단서 쪽지 핀 분리
`journal_cardpin`의 붉은 핀은 9-slice 윗변 가운데에 박혀 있어 늘어나면 찌그러진다. 핀을 지운 `journal_cardplain`(400×149, 9-slice 50, 화면 18)과 따로 쓰는 `journal_pin`(80×80, 화면 26)으로 나눴다. 핀은 쪽지 윗변 가운데에 얹는 별도 Image로 둔다 (늘리지 않는다).

## 12. 탭 이름 변경
세 번째 탭 이름: 한국어 "사건 재구성" → **"지도"**, 영어 "Events" → **"Map"**. (탭 순서와 내용은 그대로: 인물, 증거, 지도, 추리 노트 / People, Evidence, Map, Deduction.) 쪽 머리글은 한국어 "사건 지도", 영어 "CASE MAP"이다.

## 13. 에드워드와 헤이즐 초상
`por_edward_{neutral,worried,surprised,thinking}`, `por_hazel_{...}` (높이 420, 폭 약 380~430). 대사창에서는 줄마다 표정을 고르고, 인물 폴라로이드에서는 neutral을 쓴다.

## 14. 탐험, 대화 화면 정리 (Loki 승인, 배치만 변경)
- **선택지 패널:** 대화창 바로 위, 이름 리본 왼쪽 끝(대화창 x+262)부터 시작해 위로 자란다. 아래 끝은 대화창 위 346px. 버튼은 한 폭으로 맞추고(가장 긴 줄 기준), 간격 8, 높이 80 이상. 질문 메뉴(끝내기 선택지가 있는 NPC 노드)에만 머리글 "○○에게 묻기" / "Ask ○○"가 붙는다. 이미 들은 답은 불투명도 0.62와 체크 표시로 흐리게만 하고 누를 수 있다. 길면 패널 안에서 세로 스크롤(최대 높이 640).
- **들은 답의 기준:** 그 답이 켜는 이야기 플래그가 있거나, 이번 접속 중 한 번 고른 답. 새 저장 필드는 없다.
- **왼쪽 메뉴:** 평소에는 책 아이콘 버튼(26,122, 76×78) 하나. 누르면 4탭 목록(12,208)이 펼쳐지고, 탭을 고르거나 바깥을 누르면 접힌다. 대화, 일시정지, 모달, 저널이 열려 있는 동안(`mode !== "play"`) 둘 다 숨고 접힌다. 숨김은 매 프레임 모드를 보고 정하므로 ESC, 장면 전환, 저장 불러오기에서도 어긋나지 않는다.
- **장소 라벨:** 사각 패널을 폭 약 180px로 줄였다(9-slice 배율 0.7, 장 15px / 제목 27px / 장소 16px).
- **초상화:** 표정 초상(por_*)은 232px로 20% 가까이 키우고 같은 액자 창 안에서 잘린다(-16, -4 오프셋). 창 밖으로 나가지 않는다.

## 15. 대화 선택지: 양피지 포스트잇 5종
`dlg_note_1..5` (가운데 늘어나는 구간을 줄인 압축본, 폭 272, 높이 112~135, 2배 해상도). 질문 순서대로 1~5 모양을 돌려 쓴다(찢김, 접힌 모서리, 테이프, 제비꼬리, 물결). 9-slice 좌우 62px(이미지 124px). 테이프 모양은 위로 11px 튀어나온다. 선택됨은 밝기와 채도를 올리고 글자색 버건디와 약한 기울기(-0.6°), 들은 질문은 회색조로 처리한다(그림 없음). 번호는 색깔 숫자(동그라미 없음). 원본: `art_source/originals/dlg_choice_notes_v1.png`.
