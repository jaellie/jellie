# 배경 HD 리메이크 프롬프트 (79장 + 서양 버전 4장)

## 왜 다시 만드나
1. 화질: 지금 그림은 274×186이라 휴대폰에서 뭉개져 보여요.
2. 캐릭터가 배경과 안 어울려요: 게임은 나와 상대를 **항상 그림의 가로 가운데, 아래쪽**에 세워요. 그런데 그 자리가 비행기·영화관의 통로 한가운데이거나 카페 카운터의 턱 위였어요.
   → 이번에는 **캐릭터가 서는 자리를 미리 비워 둔 그림**으로 뽑아요.

## 게임이 캐릭터를 세우는 위치 (코드 기준)
- 가로: 정가운데, 두 명이 나란히 서요. 두 사람을 합친 폭은 그림 폭의 약 26%(가로 37%–63%)예요.
- 발끝: 그림 높이의 약 **88–89%** 지점 (1920×1080이면 y ≈ 955px)
- 키: 그림 높이의 약 **31–35%** (머리 꼭대기 ≈ y 570–620px)
- 그림은 아래쪽 기준으로 꽉 채워 잘려요:
  - 팝업(약 2:1): 위쪽 약 11%가 잘림
  - 시간이 흐르는 화면(약 3:2): 양옆이 조금 잘림
  - → 중요한 건 위쪽 끝이나 좌우 끝에 두지 마세요.

## 쓰는 방법
- 이미지 툴은 메시지 하나에 그림 **한 장**만 만들어요. 그래서 한 번에 한 장면씩 보내세요.
- 아래 **공통 규칙** 블록 맨 끝의 "The place:" 뒤에 장면 설명 **한 줄만** 붙여서 보내세요 (id는 빼고 설명 부분만).
  - 장면 목록 전체를 붙이면 안 돼요.
- 나온 그림에 아래 문제가 있으면 같은 대화에서 고쳐 달라고 하세요:
  - 사람이 그려졌으면: "Remove all people. Keep everything else the same."
  - 글씨가 있으면: "Replace all writing on signs with abstract wavy lines."
  - 가운데 아래 바닥에 물건이 있으면: "Move it to the side and keep the bottom-middle floor empty."
- 픽셀 격자와 위치 맞추기는 그림을 받은 뒤 제가 해요: 선명한 픽셀로 다시 정리하고, 캐릭터가 바닥에 딱 서도록 위치를 맞춰요.
- 오른쪽 아래의 ✦ 워터마크가 있으면 그 부분은 제가 바닥 무늬로 지울게요.
- 같은 장소의 다른 시간대 버전(예: home_morning / home_evening / home_rain / home_winter)은, 첫 장을 뽑은 다음 같은 대화에서 "Same room, same camera and layout, only change: …"로 요청하면 구도가 똑같이 나와요.
- 받은 파일은 이름을 장면 id로 바꿔서 주세요 (예: `cinema.png`). 바로 게임에 넣을게요.

---

## 공통 규칙 (매번 맨 위에 붙여 넣기)

```
A high-resolution pixel art illustration, 16:9 landscape. An EMPTY place, completely deserted: no people, no figures, no animals anywhere in the picture.

Style: emotional, cinematic pixel art like Eastward or Coffee Talk. Crisp square pixels, soft pastel colors, warm glowing light, gentle dithering, cozy small details.

Composition: eye-level camera, straight-on, one-point perspective. The bottom third of the picture is open, empty floor (or ground) right in front of the viewer, flat and clear all the way to the bottom edge in the middle. Furniture, seats and props are placed along the left and right sides and further back, never in the middle of the foreground. A warm pool of light falls on that empty floor in the lower middle.

All signs, screens and posters show only abstract wavy lines, never letters or words in any language. No watermark, no frame, no border, no guide lines, no text.

The place:
```

---

## 장면 목록 (공통 규칙 다음 줄에 하나씩)

> ★ 표시는 지금 캐릭터가 어색하게 서 있던 곳이에요. 서는 자리를 특히 다시 설계했어요.

### 집
- `home_living_room` — A cozy one-room apartment living room by day: sofa against the left wall, TV stand on the right, window in the back wall with sheer curtains, plants, a low table pushed to the left. The middle foreground is open wooden floor; a soft rug lies further back.
- `home_morning` — Same room, early morning: yellow sunrise beams from the back window falling across the open floor in the center, a coffee mug on the side table.
- `home_evening` — Same room, evening: warm lamp light, orange-purple dusk in the window, the TV glowing softly on the right, a blanket on the sofa.
- `home_night` — Same room, night: dark blue moonlight from the window, one small warm desk lamp, a phone charging on the side table; quiet and a little lonely.
- `home_rain` — Same room, rainy day: gray light, raindrops streaking the window, a small lamp on, tea on the side table.
- `home_winter` — Same room, winter: snow falling outside the window, a small heater glowing at the right, mandarins on the table, a tiny Christmas tree in the back corner.
- `home_bedroom` — A small bedroom: bed against the RIGHT wall (not in the center), nightstand with lamp, window with curtains in the back wall, wardrobe on the left. Open floor in the center.
- `home_newlywed` — A newlywed couple's brighter, slightly bigger apartment: new two-seat sofa on the left, wedding photo frame (no faces, just a white-dress shape) on the back wall shelf, fresh flowers, open floor in the center.
- `family_home` — Parents' older Korean apartment living room: low wooden cabinet, framed family photos (no faces visible), floor cushions pushed to the sides, a warm ceiling light. Open floor in the center.

### 도시·거리
- `street_day` — A neighborhood street by day: small shops on both sides, a crosswalk far in the back, the sidewalk-wide pedestrian lane in the center leading into the distance; the foreground is wide, flat pavement with no curb.
- `street_evening` — Same street at sunset: pink-orange sky, street lamps just turning on, long shadows.
- `street_night` — Same street at night: shop windows glowing, neon squiggles, lamp light pooling on the pavement in the center.
- `street_rain` — Same street in the rain: wet shiny pavement with reflections, umbrellas leaning by a shop door, soft gray light.
- `street_snow` — Same street in snow: snow on roofs and the pavement edges, footprints, warm shop light.

### 카페·식당
- `cafe_day` ★ — A cozy café interior by day. The counter with an espresso machine is set far back against the back wall. Wooden tables and chairs on the left and right sides. The middle foreground is open, flat wooden floor with no step or ledge.
- `cafe_evening` — Same café in the evening: warm pendant lights, dusk outside the side windows.
- `cafe_rain` — Same café on a rainy day: big side window streaked with rain, dim warm lights.
- `cafe_snow` — Same café in winter: snow outside the window, a wreath on the wall, steaming mugs on the counter.
- `cafe_window` ★ — A café corner with a big street-facing window in the BACK wall; the window bar table and two stools are pushed to the LEFT side. Open floor in the middle foreground in front of the window, a quiet street visible through it.
- `cafe_outdoor` — A sunny café terrace in summer: striped parasols and round tables at the left and right, flower pots; the open paved terrace in the center.
- `beach_cafe` — A beach café's wooden deck: rattan chairs and small tables at the sides, the sea and sky behind; open deck boards in the center.
- `paris_cafe` — A Paris sidewalk café: red awning, small bistro tables along both sides, cream Haussmann buildings behind; open cobbled pavement in the center.
- `restaurant` ★ — A warm, casual restaurant: tables along the left and right walls, a kitchen pass far in the back. The center is the open floor of the entrance aisle — like being led to a table.
- `restaurant_formal` ★ — An elegant restaurant at night: white tablecloths and candles on tables at the sides, a big window with city lights in the back; an open carpeted area in the center.
- `family_restaurant` ★ — A family restaurant: booth seats along both side walls, a dessert display far back; open floor in the center.
- `diner` ★ — A tiny Korean snack restaurant (bunsik): a counter with tteokbokki pots along the RIGHT side, a few small tables on the LEFT, a drink fridge in the back; open tiled floor in the center by the entrance.

### 일·학교
- `office` ★ — An open-plan office by day: rows of desks with monitors on the LEFT and RIGHT, windows in the back; the open carpet walkway in the center.
- `office_night` — Same office at night: most lights off, a few monitors and desk lamps glowing, city lights through the windows.
- `office_farewell` ★ — Same office, a farewell gathering: a cake and a bouquet on a desk at the side, paper decorations (no text), cups; open floor in the middle foreground.
- `meeting_room` ★ — A meeting room: the long table runs along the LEFT side, a whiteboard with abstract squiggles and a big window in the back; open floor in the center by the window.
- `branch_office` — A modern glass-walled office in a foreign city: open-plan desks on both sides, skyscrapers through the window, a reception counter far back with an abstract logo shape; open floor in the center.
- `classroom` ★ — A classroom seen from the side of the teacher's area: a blackboard with abstract chalk squiggles in the back, rows of desks pushed toward the LEFT and RIGHT edges; the open floor in front of the blackboard in the center.
- `campus` — A university campus: red-brick buildings with a clock tower, trees, lamp posts; the wide stone path in the center.
- `campus_evening` — Same campus at sunset: pink-orange sky, lamps lit.
- `library` — A quiet library: tall bookshelves on both sides receding into the distance, warm reading lamps; the open aisle between the shelves in the middle, leading into the distance.
- `kitchen_classroom` ★ — A cooking class kitchen: cooking stations along the LEFT and RIGHT, a long counter with pots far back against the wall; open tiled floor in the center.
- `gym_day` — A gym by day: treadmills along the window on the LEFT, a weight rack on the RIGHT, a mirror wall far back; open rubber floor mat in the center.
- `gym_evening` — Same gym, orange dusk light through the windows.
- `gym_night` — Same gym at night: city lights outside, only a few ceiling lights on.
- `court_hall` ★ — A courtroom: the judge's bench far back and raised, wooden benches on the LEFT and RIGHT; the open floor in the middle of the courtroom in the center.

### 공항·비행기·호텔·여행
- `airport_departure` — An airport departure hall: big windows with a plane far outside, check-in counters at the sides, departure boards with abstract squiggles; open shiny terminal floor in the center.
- `airport_arrival` — An airport arrivals hall: sliding doors far back, a waiting rail and flowers at the sides; open floor in the center (the reunion spot).
- `airplane_cabin` ★ — Inside a plane, seen from the front galley / boarding-door area looking back into the cabin: the rows of seats start further back on the LEFT and RIGHT of the aisle. The foreground is the wide, open galley floor, not the narrow aisle. Soft window light from the small oval windows.
- `business_hotel_room` ★ — A neat business hotel room: bed against the RIGHT wall, a desk with a lamp on the LEFT, a big window with city lights in the back; open carpet in the center.
- `tokyo_hotel` ★ — A Tokyo hotel room: bed on the RIGHT, a small sofa on the LEFT, a big window with Tokyo night skyline and a tower; open floor in the center.
- `paris_hotel` ★ — A Paris hotel room: tall French window with a small balcony in the back showing rooftops, a bed on the RIGHT, a vintage armchair on the LEFT; open parquet floor in the center.
- `tokyo_street` — A Tokyo shopping street by day: shops with abstract-squiggle signs, lanterns, power lines; the open pedestrian street in the center.
- `tokyo_street_night` — Same street at night: neon glow, wet reflections, lanterns lit.
- `paris_street` — A Paris street: cream Haussmann buildings with iron balconies, flower boxes, a café awning; the open cobbled street in the center.
- `paris_street_rain` — Same street in the rain: wet cobblestones reflecting lamp light.
- `eiffel_day` — The Eiffel Tower behind, seen from the Trocadéro plaza: open stone plaza in the center, trees and lamp posts at the sides, blue sky.
- `eiffel_evening` — Same view at sunset: pink-gold sky, the tower glowing.
- `eiffel_night` — Same view at night: the tower sparkling with lights, deep navy sky with stars.
- `louvre` — The Louvre glass pyramid behind: the open courtyard stone floor in the center, fountains at the sides.
- `seine_day` — A riverside promenade along the Seine: stone embankment and a bridge in the back, green bookstall boxes at the side; open walkway in the center.
- `seine_evening` — Same riverside at sunset with warm lamps and reflections on the water.

### 공원·바다·놀이공원
- `park_day` — A city park: trees, benches at the LEFT and RIGHT edges, flower beds; the open dirt path in the center leading to a small hill.
- `park_spring` — Same park in spring: cherry blossoms, petals falling.
- `park_autumn` — Same park in autumn: red and yellow leaves, leaves on the path.
- `park_snow` — Same park in snow: snow-covered trees and benches, soft footprints on the path.
- `park_evening` — Same park at sunset: golden-pink sky, lamp posts turning on.
- `park_night` — Same park at night: lamp posts pooling warm light on the path, stars.
- `park_proposal` — Same park at night, decorated for a proposal: fairy lights strung in an arch over the path in the middle distance, candles and rose petals along both edges of the path, a small bouquet on a bench at the side.
- `beach_day` — A sunny beach: sand in the center, gentle waves behind, beach umbrellas at the sides.
- `beach_sunset` — Same beach at sunset: orange-pink sky, sun touching the sea, golden reflections.
- `beach_night` — Same beach at night: full moon, a moonlight path on the sea, folded umbrellas, a distant lighthouse.
- `beach_cloudy` — Same beach on a cloudy day: gray sky, muted sea with small whitecaps, empty lounge chairs at the sides.
- `beach_winter` — Same beach in winter: pale sky, a little snow on the sand, a wooden fence, frosty dune grass.
- `boardwalk` — A seaside wooden boardwalk by day running into the distance, lamp posts and the sea beside it; open planks in the center.
- `boardwalk_night` — Same boardwalk at night: warm lamps, moonlight on the waves.
- `surf_school` — A surf school on the beach: surfboards standing in racks at the LEFT and RIGHT, a little hut with a striped awning far back; open sand in the center.
- `amusement_park` — An amusement park plaza by day: Ferris wheel and roller coaster behind, colorful stalls at the sides; open plaza in the center.
- `amusement_park_night` — Same plaza at night: everything lit with colorful lights, starry sky.
- `cinema` ★ — Inside a movie theater, seen from the front with the camera's back to the screen: tiers of red seats rise behind, a soft projector beam glowing from the back wall. The foreground is the wide, open floor between the screen and the first row. Dim, warm glow from the screen lighting the floor.

### 큰 날
- `wedding_ceremony` — A Korean wedding hall (예식장): a raised white runway with glowing floor lights, crystal chandeliers, white flower arch at the altar in the middle distance, rows of decorated chairs on the LEFT and RIGHT, a flower-lined aisle leading to it; the foreground is the open floor at the altar end of the aisle.
- `wedding_spring` — An outdoor spring wedding chapel garden: cherry blossom trees, a white wooden arch with flowers in the middle distance, white chairs on both sides, petals falling.
- `wedding_reception` — A wedding reception hall: round tables with candles at the sides, a long head table with flowers far back, string lights; the open dance floor in the center.
- `hospital` ★ — A hospital room: the bed on the RIGHT with soft sheets, an IV stand and monitor beside it, a window with soft light in the back, a visitor chair on the LEFT; open floor in the center.
- `funeral_hall` ★ — A Korean funeral hall: an altar with white chrysanthemums and a framed portrait (no face shown, just soft light on the frame) far back, incense smoke; the open floor in front of the altar in the center. Quiet, gentle, not scary.

### 한국/영어 2가지 버전 (영어 게임에서는 _west 그림이 나와요)
> 한국에서는 자연스럽지만 해외에서는 어색한 장소예요. 위의 한국 버전과 아래의 서양 버전을 **둘 다** 만들어 주세요. 영어 버전으로 플레이하면 게임이 자동으로 `_west` 그림을 써요.
- `funeral_hall_west` — A Western funeral chapel: wooden pews on the LEFT and RIGHT, a closed wooden casket with a white lily spray far back under soft stained-glass light, candles and flower stands; the open aisle floor in the middle foreground. Quiet, gentle, not scary.
- `family_home_west` — Parents' cozy suburban house living room: a fireplace with framed family photos (no faces visible) on the mantel, an armchair on the LEFT, a sofa on the RIGHT, warm lamp light; open wooden floor in the middle foreground.
- `diner_west` — A classic American diner: a long counter with red stools along the RIGHT side, booths along the LEFT window, a pie display far back, checkered floor; open floor in the middle foreground by the entrance.
- `wedding_ceremony_west` — A small church wedding: wooden pews with white flowers and ribbons on the LEFT and RIGHT, an altar with candles and a stained-glass window far back, a white aisle runner; the open floor at the altar end of the aisle in the middle foreground.

---

## 받은 뒤
- 그림을 `<id>.png` 이름으로 주시면(zip으로 한꺼번에 줘도 돼요) 바로 게임에 넣어서 캐릭터가 서는 자리를 확인한 다음 배포할게요.
- 한 번에 다 하기 어려우면 ★ 장면부터 하세요. 지금 가장 어색한 곳들이라 효과가 제일 커요.
