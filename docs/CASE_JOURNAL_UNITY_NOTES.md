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
