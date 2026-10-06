# 길 화면 소품 PNG (나무 · 집 · 빌딩 · 가로등 · 구름 · 해 · 달)

지금 길 화면의 나무, 집, 빌딩, 구름, 해, 달은 코드로 그린 네모예요. 이걸 직접 만든 픽셀 그림으로 바꿔요.
게임에는 고해상도 이미지를 그리는 층이 이미 있어서, PNG가 흐려지지 않고 선명하게 들어가요.

## 기본 규칙
- **형식:** PNG.
- **배경:** 이미지 툴은 투명 배경을 잘 못 만들어요. 그래서 **순수한 마젠타(#FF00FF) 단색 배경**으로 뽑아 주세요. 배경은 제가 지워서 투명하게 만들어요.
  - 소품 그림 안에는 마젠타·분홍 계열 색을 쓰지 않게 해 주세요 (벚꽃은 연분홍 OK, 진한 마젠타만 피하기).
- **시점:** 정면. 길가에 서 있는 모습을 길 쪽에서 본 느낌. 오른쪽에 둘 땐 제가 좌우를 뒤집어요.
- **스타일:** 지금 배경 그림과 같은, 큼직한 픽셀이 보이는 알록달록한 픽셀아트(SNES·Kairosoft 느낌). 진한 외곽선.
- **그림자:** 소품 자체의 명암은 OK. 바닥에 떨어지는 그림자는 넣지 말기 (그림자는 게임이 그려요).
- **시트로 뽑기:** 아래 시트 3장을 메시지 하나씩 보내세요. 칸 사이를 넓게 띄우면 자르기 쉬워요.

## 사양표

| 파일 이름 | 내용 | 그릴 때 비율(가로×세로) |
|---|---|---|
| tree_spring.png | 벚꽃 나무 | 3 × 4 |
| tree_summer.png | 짙은 초록 둥근 나무 | 3 × 4 |
| tree_autumn.png | 주황·빨강 단풍 나무 | 3 × 4 |
| tree_winter.png | 잎 없는 나무, 가지에 눈 | 3 × 4 |
| tree_pine.png | 사계절 소나무 | 2 × 4 |
| bush.png | 낮고 둥근 덤불 | 2 × 1 |
| building_office.png | 유리창 많은 오피스 빌딩 | 3 × 5 |
| building_apartment.png | 한국식 아파트 동 | 3 × 5 |
| building_shop.png | 1층에 가게(차양)가 있는 3층 건물 | 3 × 4 |
| building_brick.png | 붉은 벽돌 건물 | 3 × 4 |
| house_cottage.png | 지붕 있는 작은 단독주택 | 4 × 3 |
| house_villa.png | 2층 빌라 | 4 × 3 |
| house_seaside.png | 하얀 벽, 파란 지붕의 바닷가 집 | 4 × 3 |
| lamp.png | 가로등 (불 켜진 모습) | 1 × 5 |
| cloud_1.png ~ cloud_3.png | 몽글몽글 구름 3종 | 5 × 2 |
| cloud_overcast.png | 길고 납작한 회색 구름 | 8 × 2 |
| sun.png | 해 (부드러운 빛 테두리) | 1 × 1 |
| moon_full.png | 보름달 | 1 × 1 |
| moon_crescent.png | 초승달 | 1 × 1 |

- 크기는 정확할 필요 없어요. 비율만 비슷하면 제가 맞춰요.
- 받은 시트를 그대로 주시면 제가 잘라서 위 이름을 붙이고 배경을 지운 다음 게임에 넣어요.

---

## 시트 A: 나무 (6칸)
```
One image: a 3×2 grid of 6 separate pixel-art sprites on a solid, flat, pure magenta (#FF00FF) background, with wide empty magenta space between them. No labels, no text, no ground, no cast shadows.

STYLE: chunky retro pixel art like a SNES / Kairosoft game, big visible square pixels, bright cheerful colors, about 24 colors, dark pixel outlines, flat shading with simple dithering. Front view, standing upright. Do not use magenta or hot pink anywhere in the sprites.

SPRITES (reading order):
1. A cherry blossom tree in full bloom, pale pink petals, brown trunk. Taller than wide (about 3:4).
2. A round summer tree with deep green leaves. About 3:4.
3. An autumn tree with orange and red leaves. About 3:4.
4. A bare winter tree with snow resting on the branches. About 3:4.
5. A green pine tree. About 2:4.
6. A low, round green bush. About 2:1.
```

## 시트 B: 건물 · 집 · 가로등 (8칸)
```
One image: a 4×2 grid of 8 separate pixel-art sprites on a solid, flat, pure magenta (#FF00FF) background, with wide empty magenta space between them. No labels, no readable text (signs show only wavy lines), no ground, no cast shadows.

STYLE: chunky retro pixel art like a SNES / Kairosoft game, big visible square pixels, bright pastel colors, about 24 colors, dark pixel outlines, flat shading with simple dithering. Front view. Do not use magenta or hot pink anywhere in the sprites.

SPRITES (reading order):
1. A modern office building with many glass windows. About 3:5.
2. A Korean apartment block with balconies. About 3:5.
3. A three-story building with a small shop and striped awning on the ground floor. About 3:4.
4. A red-brick building with arched windows. About 3:4.
5. A small cottage house with a pitched roof. About 4:3.
6. A two-story villa house. About 4:3.
7. A seaside house with white walls and a blue roof. About 4:3.
8. A street lamp with a warm glowing light. Very tall and thin, about 1:5.
```

## 시트 C: 하늘 (7칸)
```
One image: a 4×2 grid of 7 separate pixel-art sprites on a solid, flat, pure magenta (#FF00FF) background, with wide empty magenta space between them. The 8th cell stays empty magenta. No labels, no text.

STYLE: chunky retro pixel art like a SNES / Kairosoft game, big visible square pixels, soft cheerful colors, dark pixel outlines only where needed, flat shading with simple dithering. Do not use magenta or hot pink anywhere in the sprites.

SPRITES (reading order):
1. A fluffy white cloud, wide and puffy. About 5:2.
2. A second fluffy white cloud, a different shape. About 5:2.
3. A small fluffy white cloud. About 5:2.
4. A long, flat gray overcast cloud. About 8:2.
5. A warm yellow sun with a soft pixel glow ring.
6. A full moon in cream color with a soft glow.
7. A thin crescent moon in cream color.
```

---

## 받은 뒤
- 시트 그림을 그대로 주시면 잘라서 배경을 지우고 이름을 붙여 넣을게요.
- 계절, 시간, 날씨에 맞게 자동으로 바뀌어요: 봄엔 벚꽃 나무, 밤엔 달, 흐린 날엔 회색 구름.
