# 이벤트 팝업 배경 이미지 목록

이벤트 팝업(큰 순간)과 추억 카드의 사진 배경을 직접 그린 이미지로 교체하기 위한 목록.

## 파일 규격

- **비율 16:9 (가로)** — 권장 크기 **1280×720** (픽셀아트라면 320×180 또는 640×360로 그리고 정수배 확대)
- **PNG**, 파일 이름 = 아래 표의 `파일 이름` + `.png` (예: `park_proposal.png`)
- **사람은 그리지 말 것** — 캐릭터는 게임이 그 위에 그려 줌
- 사람이 서는 바닥이 **아래쪽 40~45%** 에 오게 (캐릭터가 거기에 섬)
- 중요한 건 가운데에. 휴대폰 화면에 따라 좌우가 조금 잘릴 수 있음

## 없으면 어떻게 되나

게임은 `bg/{파일 이름}.png` → 없으면 표의 "없을 때 대신" 그림 → 그것도 없으면 지금처럼 코드로 그린 그림 순서로 찾아.
그래서 **1순위 22장만 있어도 거의 모든 팝업이 바뀜.** 2순위(시간·날씨 버전)는 없으면 기본 장소 그림이 대신 나와.

## 1순위 — 큰 순간 (먼저 그려 주면 좋은 것)

| 파일 이름 | 장소 | 어떤 팝업에 나오나 |
|---|---|---|
| `park_proposal` | 프러포즈 장소 (밤 공원, 조명·꽃) | 프러포즈 4장 (어떤 예감 → 사랑의 서약) |
| `wedding_ceremony` | 결혼식장 (본식, 버진로드·꽃 아치) | 결혼식 |
| `wedding_reception` | 결혼식 피로연장 | 결혼식 이후, 친구 결혼식 |
| `funeral_hall` | 장례식장 (영정·흰 국화) | 부고, 부모님 장례 |
| `hospital` | 병원 병실 | 진단, 투병, 출산, 마지막 밤 |
| `restaurant_formal` | 고급 레스토랑 / 한정식 룸 | 상견례, 청첩장 |
| `restaurant` | 레스토랑 | 첫 데이트, 친구들에게 소개, 기념일 |
| `cafe_day` | 카페 (낮) | 고백, 운명적인 만남 |
| `park_day` | 공원 (낮) | 첫 키스 4장 |
| `street_day` | 거리 (낮) | 이별 시퀀스, 기념일 |
| `street_rain` | 비 오는 거리 | 이별 (멀어지는 마음 → 안녕) |
| `home_bedroom` | 내 방 | 장거리 연애, 첫 싸움, 큰 기회 |
| `home_living_room` | 거실 | 거리두기, 집에서의 일 |
| `home_newlywed` | 신혼집 (벽에 웨딩 사진) | 결혼 후 집 (새 생명, 위기, n주년) |
| `family_home` | 본가 (부모님 집) | 가족 이야기, 늦은 고백 |
| `office` | 회사 사무실 | 회사 일, 인생의 갈림길 |
| `court_hall` | 법원 | 이혼, 소송 |
| `airport_departure` | 공항 출국장 | 만나러 가는 길, 이민, 해외 발령 |
| `airplane_cabin` | 비행기 안 | 비행 |
| `campus` | 대학 캠퍼스 | 학생일 때 |
| `beach_day` | 바닷가 (낮) | 바다 데이트 |
| `office_farewell` | 송별회 하는 사무실 | 정년퇴직 |

## 2순위 — 시간·날씨·계절 버전 (없으면 기본 장소 그림으로)

| 파일 이름 | 장소 | 없을 때 대신 |
|---|---|---|
| `home_morning` / `home_evening` / `home_night` / `home_rain` / `home_winter` | 집 아침 / 저녁 / 밤 / 비 / 겨울 | `home_living_room` |
| `street_evening` / `street_night` / `street_snow` | 거리 저녁 / 밤 / 눈 | `street_day` |
| `cafe_evening` / `cafe_rain` / `cafe_snow` / `cafe_window` / `cafe_outdoor` | 카페 저녁 / 비 / 눈 / 창가 자리 / 테라스 | `cafe_day` |
| `park_evening` / `park_spring` / `park_autumn` / `park_snow` | 공원 저녁 / 벚꽃 / 단풍 / 눈 | `park_day` |
| `beach_sunset` / `beach_night` / `beach_cloudy` / `beach_winter` | 바다 노을 / 밤 / 흐림 / 겨울 | `beach_day` |
| `gym_evening` / `gym_night` | 헬스장 저녁 / 밤 | `gym_day` |
| `office_night` / `meeting_room` | 야근 사무실 / 회의실 | `office` |
| `campus_evening` / `classroom` | 저녁 캠퍼스 / 강의실 | `campus` |
| `amusement_park_night` | 밤 놀이공원 | `amusement_park` |
| `boardwalk_night` | 밤 해변 산책로 | `boardwalk` |
| `family_restaurant` | 가족 식사 자리 (식당) | `family_home` |
| `airport_arrival` | 공항 입국장 | `airport_departure` |

## 3순위 — 가끔 나오는 장소

| 파일 이름 | 장소 |
|---|---|
| `gym_day` | 헬스장 |
| `library` | 도서관 |
| `kitchen_classroom` | 요리 교실 |
| `diner` | 분식집 / 식당 |
| `cinema` | 영화관 |
| `amusement_park` | 놀이공원 |
| `surf_school` | 서핑 스쿨 |
| `boardwalk` | 해변 산책로 |
| `beach_cafe` | 바닷가 카페 |
| `business_hotel_room` | 출장 호텔 방 |
| `branch_office` | 해외 지사 |
| `paris_street` / `paris_street_rain` / `paris_cafe` / `paris_hotel` | 파리 거리 / 비 오는 파리 / 파리 카페 / 파리 호텔 |
| `eiffel_day` / `eiffel_evening` / `eiffel_night` | 에펠탑 낮 / 저녁 / 밤 |
| `seine_day` / `seine_evening` / `louvre` | 센 강 낮 / 저녁 / 루브르 |
| `tokyo_street` / `tokyo_street_night` / `tokyo_hotel` | 도쿄 거리 / 밤 / 도쿄 호텔 |
| `language_exchange_app_screen` / `dating_app_screen` / `instagram_screen` / `online_community_screen` | 앱 화면 (언어교환 / 소개팅 앱 / 인스타 / 커뮤니티) — 휴대폰 화면 느낌 |

총 81장. 1순위 22장부터 주면 그것부터 넣을게.
