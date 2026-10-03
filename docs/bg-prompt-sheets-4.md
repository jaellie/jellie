# 배경 프롬프트 — 4장씩 (1400×700 고정, 총 21시트)

## 쓰는 방법
- 이번 버전은 **장면마다 배치(LAYOUT)를 하나하나 정해 둬서** 벽 뚫림, 식물·액자 남발, 가운데 가구 문제가 줄어요.
- 시트 하나 = 메시지 하나. 아래 **시트 1 ~ 21** 블록을 하나씩 통째로 복사해서 보내세요.
- 출력이 항상 1400×700이라 한 시트에 **4칸(2×2)** 으로 했어요. 칸 하나가 16:9 약 580×326이에요. 예전(450px)보다 1.3배 커요.
- 칸 사이는 16px 흰 간격이에요. 사용자가 그림 부분만 잘라 주시면 제가 칸별로 정확히 잘라요. 잘린 칸은 픽셀 격자에 맞춰 정리해서 960×540으로 키워 넣어요.
- 같은 장소의 시간대·날씨 버전은 같은 시트나 이어지는 시트에 있어요. 이어지는 시트는 **같은 대화**에서 보내면 방 구조가 똑같이 나와요.
- 캔버스 **오른쪽 224px 세로 띠**는 흰색 여백이라 Gemini 로고가 그림을 가리지 않아요. 그림 4칸만 잘라서 주시면 돼요.
- 시트 이미지를 그대로 주시면 돼요. 파일 이름은 필요 없고, 맨 아래 표대로 제가 이름을 붙여요.
- 결과가 이상하면 같은 대화에서 한 줄로 고쳐 달라고 하세요:
  - 사람이 나왔을 때: "Remove all people from every tile. Keep everything else the same."
  - 글씨가 나왔을 때: "Remove all labels and writing. Signs show only wavy lines."
  - 색이 너무 쨍할 때: "Make the colors more muted and add a faint warm yellow film tint."
  - 가운데 아래에 가구가 있을 때 (이미 만든 시트에도 쓸 수 있어요): "In every tile, remove every table, chair, box and object from the bottom-center (middle 40% width, bottom 35% height). Leave that floor completely empty. Keep everything else exactly the same."

---

## 시트 1
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A one-room apartment living room by day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen shows only wavy lines); one potted plant in the back-right corner.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: soft white-blue daylight sky in the window, gentle even light, a faint warm yellow tint.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 plant, 1 picture frame, 1 ceiling light. Nothing else.
2. The same living room in early morning. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa. A coffee mug on the side table.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen shows only wavy lines); one potted plant in the back-right corner.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: a golden-pink sunrise sky in the window (peach, rose, amber bands), strong golden light beams streaming through the curtains onto the floor in a few chunky pixel stripes; a coffee mug on the side table.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 plant, 1 picture frame, 1 ceiling light. Nothing else.
3. The same living room in the evening. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen shows only wavy lines); one potted plant in the back-right corner.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: an orange, magenta and violet dusk sky in the window; one warm floor lamp standing at the back of the sofa with a soft glowing halo; the TV screen glows softly.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 plant, 1 picture frame, 1 ceiling light. Nothing else.
- Add exactly one floor lamp (left, behind the sofa). No other additions.
4. The same living room at night. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa. On the side table: one small warm lamp and one phone with a charging cable.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen shows only wavy lines); one potted plant in the back-right corner.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: a deep blue-indigo night sky with a bright moon in the window; cool blue moonlight falls on the floor in a window-shaped patch; one small warm desk lamp glows on the side table with a phone charging next to it; everything else is dim and blue.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 plant, 1 picture frame, 1 ceiling light. Nothing else.
```

## 시트 2
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same living room on a rainy day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa. A steaming mug on the side table.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen shows only wavy lines); one potted plant in the back-right corner.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: a gray-blue, misty sky in the window with rain streaks; cool soft gray-green light, muted colors; a steaming mug on the side table; no lamp is on.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 plant, 1 picture frame, 1 ceiling light. Nothing else.
2. The same living room in winter. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered on the wall with two sheer curtains, the wall below the window is plain; nothing else on this wall.
- Left wall: a 2-seat sofa with two cushions standing flat against the left wall, one small wooden side table at the back end of the sofa; exactly one framed landscape picture hanging above the sofa. A bowl of mandarins on the side table.
- Right wall: a low wooden TV stand against the right wall with a flat TV on it (screen wavy lines) and one small decorated Christmas tree at its far end.
- Floor: warm wooden planks; one flat cream rug lying in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: a pale lilac-white sky with falling snow and snowy rooftops in the window; cold bluish light with a warm glow from a small electric heater standing in the back-left corner next to the window; one small decorated Christmas tree replaces the potted plant in the back-right corner on top of the TV stand's end; a bowl of mandarins on the side table.
- Exact counts: 1 window, 1 sofa, 1 side table, 1 TV, 1 small Christmas tree, 1 heater, 1 picture frame, 1 ceiling light, 0 plants. Nothing else.
3. A small bedroom. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one window centered with curtains; nothing else on this wall.
- Left wall: a tall wooden wardrobe standing flat against the left wall near the back; exactly one framed picture on the wall in front of it.
- Right wall: a single bed with a patterned quilt and one pillow, headboard against the right wall near the back, with one nightstand and a small warm lamp between the bed and the back wall.
- Floor: warm wooden planks; one small flat rug beside the bed; the bottom-center of the floor is completely empty.
- Light and sky: a soft peach-lavender sky in the window, warm gentle golden light, the bedside lamp glowing softly.
- Exact counts: 1 window, 1 wardrobe, 1 bed, 1 nightstand, 1 lamp, 1 picture frame, 1 rug. 0 plants. Nothing else.
4. A newlywed apartment living room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one large window centered with warm cream curtains; nothing else on this wall.
- Left wall: a new 2-seat cream sofa with two cushions flat against the left wall; two unpacked cardboard boxes stacked in the back-left corner.
- Right wall: a low TV stand with a flat TV (wavy lines) against the right wall, a vase of fresh flowers on the stand; exactly one small wall shelf above it holding one wedding photo frame (white dress shape, no faces).
- Floor: light wooden planks; the bottom-center of the floor is completely empty (no coffee table).
- Light and sky: a golden amber afternoon sky in the window, warm golden light beams across the floor, a hopeful happy mood.
- Exact counts: 1 window, 1 sofa, 2 boxes, 1 TV, 1 vase of flowers, 1 shelf, 1 photo frame, 0 plants. Nothing else.
```

## 시트 3
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Korean family home living room (the parents' house). Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one wide sliding glass balcony door centered with sheer curtains; the wall is otherwise plain; NO kitchen opening and NO doorway anywhere.
- Left wall: a low sofa flat against the left wall; exactly one framed family photo (tiny blurred figures, no faces) above it.
- Right wall: a low wooden cabinet flat against the right wall with a rice cooker and a bowl of fruit on top; the right wall is solid, plain and closed.
- Floor: warm wooden floor; the bottom-center of the floor is completely empty.
- Light and sky: a soft peach-lilac evening sky through the balcony door, warm golden light, a cozy nostalgic mood.
- Exact counts: 1 balcony door, 1 sofa, 1 photo frame, 1 cabinet, 1 rice cooker, 1 fruit bowl, 1 ceiling light, 0 plants. Nothing else.
2. A Western suburban family home living room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a brick fireplace centered on the wall with a glowing fire; exactly one framed family photo (tiny blurred figures, no faces) above the mantel; no windows on this wall.
- Left wall: one window with curtains; one armchair standing against the wall beside the window and a small side table with a warm lamp next to the armchair.
- Right wall: one tall bookshelf flat against the right wall; one armchair in the back-right corner next to the fireplace.
- Floor: warm wooden floor; one large flat patterned rug in the middle distance; the bottom-center of the floor is completely empty.
- Light and sky: a dusky blue-violet evening sky through the window, warm orange firelight glow spilling across the floor.
- Exact counts: 1 fireplace, 1 family photo, 1 window, 2 armchairs, 1 side table, 1 lamp, 1 bookshelf, 0 plants. Nothing else.
3. A bright cooking class room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wide band of windows above a continuous counter; nothing else on this wall.
- Left wall: two aprons hanging on wall hooks; a steel fridge in the back-left corner.
- Right wall: a steel stove with a range hood against the right wall.
- Floor: white tile floor; one long steel prep island in the middle distance (only the middle band), with a cutting board and two pots on it; the foreground floor is completely empty.
- Light and sky: bright minty-white daylight, a clear pale sky in the windows, soft light bloom.
- Exact counts: 2 aprons, 1 fridge, 1 stove with hood, 1 island, 1 hanging pan rack above the island (4 pans). 0 plants. Nothing else.
4. A quiet hospital corridor and waiting area. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a reception desk centered at the far end with one small sign (wavy lines); the end wall is solid.
- Left wall: a row of 4 waiting chairs flat against the left wall; one door further down the left wall.
- Right wall: three windows with pale daylight along the right wall.
- Floor: pale green linoleum with a soft light patch; the bottom-center of the floor is completely empty.
- Light and sky: pale mint-green walls, soft daylight, calm quiet mood; ceiling lights with gentle halos.
- Exact counts: 4 chairs, 1 desk, 1 sign, 3 windows, 1 door, 1 plant (near the desk), 3 ceiling lights. Nothing else.
```

## 시트 4
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A small city street by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the street continues to a far crosswalk and a distant skyline of low buildings under the sky.
- Left side: three shopfronts in a row on the left side: a bakery with a striped awning, a flower shop and a small bookshop (signs show only wavy lines); one street lamp and one small tree on the left pavement.
- Right side: three shopfronts in a row on the right side: a cafe with an awning, a convenience store and a shoe shop (signs wavy lines); one street lamp and one small tree on the right pavement.
- Ground: a gray paved road in the center leading to the crosswalk; pavements on both sides; the bottom-center ground is completely empty road; no cars.
- Light and sky: a soft blue sky with warm peach clouds, gentle golden daylight, soft shadows.
- Exact counts: 6 shopfronts, 2 street lamps, 2 trees, 1 crosswalk. No vehicles, no vending machines. Nothing else.
2. The same street at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the street continues to a far crosswalk and a distant skyline of low buildings under the sky.
- Left side: three shopfronts in a row on the left side: a bakery with a striped awning, a flower shop and a small bookshop (signs show only wavy lines); one street lamp and one small tree on the left pavement.
- Right side: three shopfronts in a row on the right side: a cafe with an awning, a convenience store and a shoe shop (signs wavy lines); one street lamp and one small tree on the right pavement.
- Ground: a gray paved road in the center leading to the crosswalk; pavements on both sides; the bottom-center ground is completely empty road; no cars.
- Light and sky: an orange, magenta and violet sunset sky, long soft shadows, shop windows starting to glow warm yellow.
- Exact counts: 6 shopfronts, 2 street lamps, 2 trees, 1 crosswalk. No vehicles, no vending machines. Nothing else.
3. The same street at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the street continues to a far crosswalk and a distant skyline of low buildings under the sky.
- Left side: three shopfronts in a row on the left side: a bakery with a striped awning, a flower shop and a small bookshop (signs show only wavy lines); one street lamp and one small tree on the left pavement.
- Right side: three shopfronts in a row on the right side: a cafe with an awning, a convenience store and a shoe shop (signs wavy lines); one street lamp and one small tree on the right pavement.
- Ground: a gray paved road in the center leading to the crosswalk; pavements on both sides; the bottom-center ground is completely empty road; no cars.
- Light and sky: a deep indigo sky with a few stars, glowing warm shop windows and signs (wavy lines), street lamps with soft halos on the pavement.
- Exact counts: 6 shopfronts, 2 street lamps, 2 trees, 1 crosswalk. No vehicles, no vending machines. Nothing else.
4. The same street in the rain. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the street continues to a far crosswalk and a distant skyline of low buildings under the sky.
- Left side: three shopfronts in a row on the left side: a bakery with a striped awning, a flower shop and a small bookshop (signs show only wavy lines); one street lamp and one small tree on the left pavement.
- Right side: three shopfronts in a row on the right side: a cafe with an awning, a convenience store and a shoe shop (signs wavy lines); one street lamp and one small tree on the right pavement.
- Ground: a gray paved road in the center leading to the crosswalk; pavements on both sides; the bottom-center ground is completely empty road; no cars.
- Light and sky: a gray-blue misty sky, rain streaks, wet reflective road with puddles reflecting the warm shop lights.
- Exact counts: 6 shopfronts, 2 street lamps, 2 trees, 1 crosswalk. No vehicles, no vending machines. Nothing else.
```

## 시트 5
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same street in snow. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the street continues to a far crosswalk and a distant skyline of low buildings under the sky.
- Left side: three shopfronts in a row on the left side: a bakery with a striped awning, a flower shop and a small bookshop (signs show only wavy lines); one street lamp and one small tree on the left pavement.
- Right side: three shopfronts in a row on the right side: a cafe with an awning, a convenience store and a shoe shop (signs wavy lines); one street lamp and one small tree on the right pavement.
- Ground: a gray paved road in the center leading to the crosswalk; pavements on both sides; the bottom-center ground is completely empty road; no cars.
- Light and sky: a pale lilac-white sky with falling snowflakes, white rooftops and pavements, warm yellow shop lights, one small snowman beside the left lamp.
- Exact counts: 6 shopfronts, 2 street lamps, 2 trees, 1 crosswalk. No vehicles, no vending machines. Nothing else.
2. A seaside boardwalk by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the calm sea to the horizon under a clear sky.
- Left side: a wooden railing along the left edge with the sea beyond; one lamp post.
- Right side: a row of 3 benches along the right edge facing the sea; one lamp post.
- Ground: wooden planks leading to the horizon; the bottom-center is completely empty planks.
- Light and sky: a peach-blue sky with soft clouds, golden sunlight sparkling on the water.
- Exact counts: 2 lamp posts, 3 benches, 1 railing. 0 plants. No people, no birds. Nothing else.
3. The same boardwalk at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a calm moonlit sea under a deep indigo sky with stars and a bright moon.
- Left side: wooden railing on the left with warm string lights hanging along it; one lamp post.
- Right side: 3 benches on the right; one lamp post.
- Ground: wooden planks with warm light pools; the bottom-center is completely empty.
- Light and sky: moonlight shimmer on the water, warm halos around the lamps and string lights.
- Exact counts: 2 lamp posts, 3 benches, 1 railing with string lights. Nothing else.
4. A city park by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: a blue sky with warm peach-white clouds, golden sunlight beams streaming through the thick leaves; the canopies are a deep rich green with lighter yellow-green highlights.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
```

## 시트 6
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same park at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: an orange-pink-violet sunset sky, long tree shadows, the lamp posts starting to glow with soft halos; the huge canopies are rich green with golden-orange rim light.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
2. The same park at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: a deep indigo starry sky with a moon, warm lamp halos on the path, a few glowing fireflies; the huge canopies are deep teal-green with moonlit silver edges.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
3. The same park in spring. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: a soft baby-blue sky with pink-tinted clouds, golden light beams; ALL FOUR trees are full cherry blossom trees with enormous, dense, fluffy canopies covered in thousands of pink and white blossoms (soft pink, rose, white, with lilac shadows), the two foreground trees filling the left and right sides of the tile like a pink tunnel, pink petals drifting in the air and scattered over the path and benches.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
4. The same park in autumn. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: a warm amber-peach sky, low golden light beams; ALL FOUR trees have enormous, dense, full canopies of orange, crimson, amber and gold leaves with rich color variation, the two foreground trees filling the left and right sides of the tile like a golden tunnel, thick piles of fallen leaves under them and along the path edges, leaves drifting in the air.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
```

## 시트 7
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same park in winter. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a gentle green hill with a few small distant trees at the end of the path.
- Left side: one GIANT, extremely lush, full tree in the left foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Right side: one GIANT, extremely lush, full tree in the right foreground (its trunk very thick, its canopy huge, dense and rounded, covering about 30% of the tile width and rising past the top edge of the tile) with one wooden bench under it, plus one large medium-distance tree behind it; one lamp post far back.
- Ground: a wide sandy-beige path in the center winding slightly to the hill; green lawn on both sides; the bottom-center is completely empty path.
- Light and sky: a pale lilac-white sky with soft falling snow; the four trees are huge, thick-trunked and bare, with their many branches heavily covered in snow and frost forming a big lacy canopy, the two foreground trees filling the left and right sides of the tile; the lawn and benches are covered in snow; warm lamp halos.
- Exact counts: 2 giant foreground trees (one per side), 2 medium trees, 2 benches, 2 lamp posts. The trees are the stars of the picture: huge, dense, rich with leaves and detail. No flower beds. Nothing else.
2. A romantic park spot at dusk for a proposal. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: an arch of warm fairy lights spanning the path in the middle distance, a pink-violet dusk sky behind it.
- Left side: three glowing paper lanterns along the left path edge; one GIANT lush tree with a huge dense canopy covering about 30% of the tile width; one picnic blanket with a small basket at the far left, away from the center.
- Right side: three glowing paper lanterns along the right path edge; one GIANT lush tree with a huge dense canopy covering about 30% of the tile width.
- Ground: a sandy path with scattered rose petals along its edges only; the bottom-center is completely empty path.
- Light and sky: a pink, violet and amber dusk sky, warm golden glow from the fairy lights and lanterns with soft halos.
- Exact counts: 1 light arch, 6 lanterns, 2 trees, 1 blanket. Nothing else.
3. A cozy cafe interior by day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a counter centered at the back with an espresso machine and a menu board (wavy lines), two wide windows on either side of the counter; three pendant lamps hang from the ceiling.
- Left wall: two small round wooden tables with two chairs each, placed along the left wall, one behind the other.
- Right wall: two small round wooden tables with two chairs each, placed along the right wall, one behind the other; one potted plant at the end of the counter.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: a soft blue-peach sky in the windows, golden daylight beams across the floor.
- Exact counts: 1 counter, 1 machine, 1 menu board, 2 windows, 3 pendant lamps, 4 tables, 8 chairs, 1 plant. 0 picture frames. Nothing else.
4. The same cafe in the evening. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a counter centered at the back with an espresso machine and a menu board (wavy lines), two wide windows on either side of the counter; three pendant lamps hang from the ceiling.
- Left wall: two small round wooden tables with two chairs each, placed along the left wall, one behind the other.
- Right wall: two small round wooden tables with two chairs each, placed along the right wall, one behind the other; one potted plant at the end of the counter.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: an orange, rose and violet dusk sky in the windows, warm glowing pendant lamps with soft halos.
- Exact counts: 1 counter, 1 machine, 1 menu board, 2 windows, 3 pendant lamps, 4 tables, 8 chairs, 1 plant. 0 picture frames. Nothing else.
```

## 시트 8
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A cafe terrace outdoors. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a cream brick wall with two window boxes of flowers and a glass door in the middle; solid wall otherwise.
- Left side: two small round tables with one umbrella and two chairs each, placed along the left edge, one behind the other.
- Right side: two small round tables with one umbrella and two chairs each, along the right edge.
- Ground: light stone paving; the bottom-center is completely empty.
- Light and sky: a soft peach-blue sky with warm golden light, dappled shadows from the umbrellas.
- Exact counts: 1 wall, 2 window boxes, 1 door, 4 tables, 4 umbrellas, 8 chairs. Nothing else.
2. The same cafe on a rainy day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a counter centered at the back with an espresso machine and a menu board (wavy lines), two wide windows on either side of the counter; three pendant lamps hang from the ceiling.
- Left wall: two small round wooden tables with two chairs each, placed along the left wall, one behind the other.
- Right wall: two small round wooden tables with two chairs each, placed along the right wall, one behind the other; one potted plant at the end of the counter.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: a gray-blue misty sky with rain streaks in the windows, cool light outside, warm lamps inside, steaming cups on two tables.
- Exact counts: 1 counter, 1 machine, 1 menu board, 2 windows, 3 pendant lamps, 4 tables, 8 chairs, 1 plant. 0 picture frames. Nothing else.
3. The same cafe in winter. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a counter centered at the back with an espresso machine and a menu board (wavy lines), two wide windows on either side of the counter; three pendant lamps hang from the ceiling.
- Left wall: two small round wooden tables with two chairs each, placed along the left wall, one behind the other.
- Right wall: two small round wooden tables with two chairs each, placed along the right wall, one behind the other; one potted plant at the end of the counter.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: a pale lilac-white sky with falling snow in the windows, warm golden glow inside, one small wreath on the counter front.
- Exact counts: 1 counter, 1 machine, 1 menu board, 2 windows, 3 pendant lamps, 4 tables, 8 chairs, 1 plant. 0 picture frames. Nothing else.
4. A cafe window seat corner. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one very large window centered on the back wall with a street view; a wooden window sill with one small plant on it.
- Left wall: a bench seat with two cushions along the left wall under a small shelf holding two cups.
- Right wall: one small round table with two cups and two chairs along the right wall.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: a golden peach and lavender late-afternoon sky in the window, long golden light beams across the floor.
- Exact counts: 1 window, 1 plant, 1 bench, 2 cushions, 1 shelf, 1 table, 2 chairs, 4 cups. Nothing else.
```

## 시트 9
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A beachfront cafe. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the sea to the horizon with sand in front of it.
- Left side: a wooden deck with one rattan table and two rattan chairs along the left edge; a string of warm lights.
- Right side: a wooden deck with one rattan table and two rattan chairs along the right edge; a string of warm lights.
- Ground: pale wooden deck planks leading to sand; the bottom-center is completely empty.
- Light and sky: a bright peach-turquoise sky, golden sunlight sparkling on the water.
- Exact counts: 2 tables, 4 chairs, 2 light strings. Nothing else.
2. A casual restaurant interior. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: an open kitchen pass-through window centered on the wall with a counter and hanging pans; the wall is solid otherwise.
- Left wall: three square wooden tables with two chairs each along the left wall, in a row going back.
- Right wall: three square wooden tables with two chairs each along the right wall, in a row going back.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: warm amber evening light, three pendant lamps with soft halos.
- Exact counts: 1 pass-through, 6 tables, 12 chairs, 3 pendant lamps, 1 plant (by the pass-through). Nothing else.
3. An elegant restaurant. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one tall window wall centered with a glittering city night view and deep curtains; a grand piano in the back-left corner.
- Left wall: two tables with white tablecloths, a candle and two chairs each, along the left wall.
- Right wall: two tables with white tablecloths, a candle and two chairs each, along the right wall.
- Floor: dark polished wooden floor with soft reflections; the bottom-center is completely empty.
- Light and sky: a deep indigo-violet night sky with city lights and a golden warm glow from candles and a chandelier.
- Exact counts: 1 window wall, 1 piano, 4 tables, 8 chairs, 4 candles, 1 chandelier. Nothing else.
4. A bright family restaurant. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a salad bar counter centered on the wall with bowls; one sign (wavy lines); solid wall otherwise.
- Left wall: three booth seats with tables along the left wall, one behind the other.
- Right wall: three booth seats with tables along the right wall, one behind the other.
- Floor: light tile floor; the bottom-center is completely empty.
- Light and sky: bright warm golden light, cheerful pendant lamps with soft halos.
- Exact counts: 1 salad bar, 6 booth seats (3 per side), 3 tables per side, 3 pendant lamps. Nothing else.
```

## 시트 10
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Korean-style neighborhood eatery. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a counter centered on the back wall with big steaming pots and a menu board (wavy lines); solid wall otherwise.
- Left wall: two metal tables with two plastic stools each along the left wall.
- Right wall: two metal tables with two plastic stools each along the right wall.
- Floor: simple tiled floor; the bottom-center is completely empty.
- Light and sky: warm yellow light, rising steam with soft halos around the ceiling lamps.
- Exact counts: 1 counter, 3 pots, 1 menu board, 4 tables, 8 stools. Nothing else.
2. A Western American diner. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a pie display case on the back wall counter and a wall clock; solid wall otherwise.
- Left wall: a long counter with five red stools along the left wall.
- Right wall: three red vinyl booths with tables along the right wall; a jukebox in the back-right corner.
- Floor: black-and-white checkerboard floor; the bottom-center is completely empty.
- Light and sky: warm neon-pink and golden light, a soft glow from the jukebox, a nostalgic mood.
- Exact counts: 1 pie case, 1 clock, 1 counter, 5 stools, 3 booths, 1 jukebox. Nothing else.
3. A sunny beach. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a wide sea to the horizon with gentle waves breaking on the shore.
- Left side: one beach umbrella with a towel far back near the water; a few small dune grass tufts.
- Right side: a low dune with grass on the right and one small wooden sign post (wavy lines).
- Ground: soft sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: a bright turquoise-to-peach sky with soft white clouds, golden sparkles on the water.
- Exact counts: 1 umbrella, 1 towel, 1 sign post. No people, no birds, no boats. Nothing else.
4. The same beach on a cloudy day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a wide sea to the horizon with gentle waves breaking on the shore.
- Left side: one beach umbrella with a towel far back near the water; a few small dune grass tufts.
- Right side: a low dune with grass on the right and one small wooden sign post (wavy lines).
- Ground: soft sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: a soft gray-lilac cloudy sky, calm gray-green sea, gentle diffuse light.
- Exact counts: 1 umbrella, 1 towel, 1 sign post. No people, no birds, no boats. Nothing else.
```

## 시트 11
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same beach at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a wide sea to the horizon with gentle waves breaking on the shore.
- Left side: one beach umbrella with a towel far back near the water; a few small dune grass tufts.
- Right side: a low dune with grass on the right and one small wooden sign post (wavy lines).
- Ground: soft sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: an orange, magenta and violet sunset sky with the sun low on the horizon, golden-pink reflections on the water and wet sand.
- Exact counts: 1 umbrella, 1 towel, 1 sign post. No people, no birds, no boats. Nothing else.
2. The same beach at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a wide sea to the horizon with gentle waves breaking on the shore.
- Left side: one beach umbrella with a towel far back near the water; a few small dune grass tufts.
- Right side: a low dune with grass on the right and one small wooden sign post (wavy lines).
- Ground: soft sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: a deep indigo starry sky with a bright moon, silver-blue moonlight on the water; one tiny bonfire glow far to the right.
- Exact counts: 1 umbrella, 1 towel, 1 sign post. No people, no birds, no boats. Nothing else.
3. The same beach in winter. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a wide sea to the horizon with gentle waves breaking on the shore.
- Left side: one piece of driftwood and a few snow-dusted dune grass tufts.
- Right side: a low dune with grass on the right and one small wooden sign post (wavy lines).
- Ground: soft sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: a pale lilac-white sky, cold blue sea, a little snow on the dunes, one piece of driftwood; no umbrella.
- Exact counts: 1 driftwood, 1 sign post. No umbrella. Nothing else.
4. A surf school on the beach. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the sea behind with small waves and a bright sky.
- Left side: one wooden rack holding 4 colorful surfboards on the left.
- Right side: a small wooden hut with a striped roof and one sign (wavy lines) on the right.
- Ground: sand in the foreground; the bottom-center is completely empty sand.
- Light and sky: a bright turquoise-peach sky, golden sunlight.
- Exact counts: 4 surfboards, 1 rack, 1 hut, 1 sign. Nothing else.
```

## 시트 12
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. An amusement park by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a Ferris wheel at the back-left and a carousel at the back-right, a bright sky.
- Left side: one balloon stall and two trees along the left edge.
- Right side: one snack stall and two trees along the right edge.
- Ground: a wide plaza with a checkered path; the bottom-center is completely empty.
- Light and sky: a bright blue-peach sky with puffy clouds, golden light.
- Exact counts: 1 Ferris wheel, 1 carousel, 2 stalls, 4 trees. Signs wavy lines only. Nothing else.
2. The same amusement park at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a glowing Ferris wheel at the back-left and a glowing carousel at the back-right under a deep indigo sky with stars.
- Left side: one balloon stall and two trees along the left edge, string lights.
- Right side: one snack stall and two trees along the right edge, string lights.
- Ground: the plaza with warm light pools; the bottom-center is completely empty.
- Light and sky: magenta, violet and amber glows with soft halos, sparkling lights.
- Exact counts: 1 Ferris wheel, 1 carousel, 2 stalls, 4 trees. Nothing else.
3. A cinema lobby. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wide wall with a door to the theater and three abstract movie posters (colorful shapes, no text); a plain wall otherwise.
- Left wall: a snack counter with a popcorn machine along the left wall.
- Right wall: a bench seat along the right wall and one poster; a ticket kiosk (wavy lines) in the back-right corner.
- Floor: dark patterned carpet; the bottom-center is completely empty.
- Light and sky: warm amber and magenta light, soft halos around ceiling lamps, cozy mood.
- Exact counts: 1 door, 4 posters, 1 counter, 1 popcorn machine, 1 bench, 1 kiosk. Nothing else.
4. A university campus by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a red-brick main building with a small clock tower at the center, tall windows, under a bright sky.
- Left side: a green lawn with one GIANT lush tree (huge dense canopy, about 30% of the tile width) and one medium tree, and one bicycle rack with 3 bicycles on the left.
- Right side: a green lawn with one GIANT lush tree (huge dense canopy, about 30% of the tile width) and one medium tree, and one bench on the right.
- Ground: a paved path leading to the building entrance; the bottom-center is completely empty path.
- Light and sky: a blue-peach sky with soft clouds and golden sunlight.
- Exact counts: 1 building, 1 clock tower, 4 trees, 1 bike rack, 3 bicycles, 1 bench. Nothing else.
```

## 시트 13
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same campus at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the red-brick main building with a clock tower glowing in golden light, windows lit warm.
- Left side: a lawn with one GIANT lush tree (huge dense canopy, about 30% of the tile width) and one medium tree, and the bike rack with 3 bicycles on the left, long shadows.
- Right side: a lawn with one GIANT lush tree (huge dense canopy, about 30% of the tile width) and one medium tree, and one bench on the right, long shadows.
- Ground: a paved path to the entrance; the bottom-center is completely empty.
- Light and sky: an orange, rose and lavender sunset sky with warm golden light beams.
- Exact counts: 1 building, 1 clock tower, 4 trees, 1 bike rack, 3 bicycles, 1 bench. Nothing else.
2. A classroom. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a green blackboard centered on the wall (no writing) with a teacher's desk in the back-right corner.
- Left wall: three student desks with chairs in a column along the left wall; three tall windows with curtains in the wall behind them.
- Right wall: three student desks with chairs in a column along the right wall.
- Floor: light wooden floor; a wide empty aisle in the center; the bottom-center is completely empty.
- Light and sky: warm golden afternoon light beams from the windows, peach-blue sky outside.
- Exact counts: 1 blackboard, 1 teacher desk, 6 student desks, 6 chairs, 3 windows. 0 plants, 0 picture frames. Nothing else.
3. A library. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a big arched window centered with a lavender-peach sky; a tall bookshelf on either side of the window.
- Left wall: a tall bookshelf flat against the left wall full of colorful books; one reading table with a green lamp near the back-left.
- Right wall: a tall bookshelf flat against the right wall; one reading table with a green lamp near the back-right.
- Floor: warm wooden floor; the bottom-center is completely empty.
- Light and sky: golden light beams from the arched window, a soft dusty glow.
- Exact counts: 1 window, 4 bookshelves, 2 tables, 2 lamps, 2 chairs. 0 plants. Nothing else.
4. A modern office by day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a row of large windows along the wall with blinds.
- Left wall: three desks with monitors (wavy lines) and chairs in a row along the left wall.
- Right wall: three desks with monitors (wavy lines) and chairs in a row along the right wall; one potted plant in the back-right corner.
- Floor: gray carpet; the bottom-center is completely empty aisle.
- Light and sky: a blue-peach sky in the windows and bright soft golden light.
- Exact counts: 6 desks, 6 monitors, 6 chairs, 1 plant, 3 ceiling lights. Nothing else.
```

## 시트 14
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The same office at night. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a row of large windows showing a city night skyline with lit buildings under a deep indigo sky.
- Left wall: three desks with monitors in a row along the left wall; only the middle desk lamp is on.
- Right wall: three desks with monitors in a row along the right wall; one potted plant in the back-right corner.
- Floor: gray carpet; the bottom-center is completely empty.
- Light and sky: cool blue-violet room with one warm desk lamp pool and a soft glow from the monitors.
- Exact counts: 6 desks, 6 monitors, 6 chairs, 1 plant, 1 lit lamp. Nothing else.
2. The office on a last day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a row of large windows with a warm sunset sky.
- Left wall: one empty desk with a cardboard box holding a few items, and a small bouquet of flowers on the desk; the other two desks are tidy and empty.
- Right wall: three tidy empty desks in a row along the right wall.
- Floor: gray carpet; the bottom-center is completely empty.
- Light and sky: an orange-rose-lavender sunset sky and long warm golden light beams across the floor, a bittersweet mood.
- Exact counts: 4 desks, 1 box, 1 bouquet, 4 chairs. 0 plants. Nothing else.
3. A meeting room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wide presentation screen centered on the wall with wavy-line charts; solid wall otherwise.
- Left wall: a wide window with blinds along the left wall.
- Right wall: a wide window with blinds along the right wall.
- Floor: gray carpet; one long table with 6 chairs in the middle distance only; the bottom-center is completely empty.
- Light and sky: soft cool daylight and warm ceiling light with halos.
- Exact counts: 1 screen, 1 table, 6 chairs, 2 windows. 0 plants. Nothing else.
4. A branch office in another city. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one window centered showing an unfamiliar city skyline; a world map on the wall beside it.
- Left wall: two desks with monitors and chairs along the left wall.
- Right wall: one desk with a monitor and chair along the right wall; one filing cabinet in the back-right corner.
- Floor: gray carpet; the bottom-center is completely empty.
- Light and sky: a soft amber-lavender sky in the window and warm golden light.
- Exact counts: 1 window, 1 map, 3 desks, 3 monitors, 3 chairs, 1 cabinet. Nothing else.
```

## 시트 15
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A courthouse hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a raised wooden judge's bench centered with a flag on each side; solid wall otherwise.
- Left wall: four rows of wooden benches along the left wall; two tall windows on the left wall.
- Right wall: four rows of wooden benches along the right wall; two tall windows on the right wall.
- Floor: polished wooden floor with a wide empty aisle in the center; the bottom-center is completely empty.
- Light and sky: golden light beams falling from the tall windows, solemn quiet mood.
- Exact counts: 1 bench, 2 flags, 8 pews, 4 windows. Nothing else.
2. A gym by day. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wall-wide mirror with two large windows.
- Left wall: three treadmills in a row along the left wall.
- Right wall: a weight rack and one bench along the right wall.
- Floor: dark rubber floor; the bottom-center is completely empty.
- Light and sky: a bright peach-blue sky in the windows, golden daylight beams.
- Exact counts: 3 treadmills, 1 rack, 1 bench, 1 mirror, 2 windows. Nothing else.
3. The same gym in the evening. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wall-wide mirror with two large windows.
- Left wall: three treadmills in a row along the left wall.
- Right wall: a weight rack and one bench along the right wall.
- Floor: dark rubber floor; the bottom-center is completely empty.
- Light and sky: an orange-rose sunset sky in the windows, warm golden light beams.
- Exact counts: 3 treadmills, 1 rack, 1 bench, 1 mirror, 2 windows. Nothing else.
4. The same gym at night. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a wall-wide mirror with two large windows.
- Left wall: three treadmills in a row along the left wall with small blue glows.
- Right wall: a weight rack and one bench along the right wall.
- Floor: dark rubber floor; the bottom-center is completely empty.
- Light and sky: a deep indigo night sky in the windows; cool blue-teal light and a glowing vending machine in the back-right corner.
- Exact counts: 3 treadmills, 1 rack, 1 bench, 1 vending machine, 1 mirror. Nothing else.
```

## 시트 16
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Korean-style wedding hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a stage with a flower arch and a small podium centered on the wall.
- Left wall: five rows of white chairs along the left, flower stands along the aisle edge.
- Right wall: five rows of white chairs along the right, flower stands along the aisle edge.
- Floor: a long red carpet aisle in the center edged with flowers; the bottom-center is the empty carpet aisle.
- Light and sky: bright soft white-gold light, rose and peach glow from the flowers, a joyful mood.
- Exact counts: 1 stage, 1 arch, 1 podium, 10 chairs per side max 5 rows, 6 flower stands. Nothing else.
2. A Western church wedding. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a stained-glass window and an altar with flowers centered on the wall.
- Left wall: five wooden pews along the left, a flower bouquet on the end of each of the first two pews.
- Right wall: five wooden pews along the right, a flower bouquet on the end of each of the first two pews.
- Floor: a long aisle with a white runner in the center; the bottom-center is the empty aisle.
- Light and sky: colored light beams (rose, gold, blue) falling from the stained glass across the floor, a warm joyful glow.
- Exact counts: 1 window, 1 altar, 10 pews, 4 bouquets. Nothing else.
3. A wedding reception hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a small stage with a floral backdrop and fairy lights centered on the wall.
- Left wall: three round tables with white cloths and flower centerpieces along the left, going back.
- Right wall: three round tables with white cloths and flower centerpieces along the right, going back.
- Floor: polished floor; the bottom-center is completely empty.
- Light and sky: warm golden and rose light, strings of fairy lights with soft halos.
- Exact counts: 1 stage, 6 tables, 6 centerpieces, 2 light strings. Nothing else.
4. A spring outdoor wedding. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a flower arch in the middle distance with cherry blossom trees behind it under a soft pink-blue sky.
- Left side: five white chairs in a row along the left of the aisle; one GIANT cherry blossom tree with an enormous, dense canopy covered in pink and white blossoms (about 35% of the tile width, rising past the top edge), petals falling.
- Right side: five white chairs in a row along the right of the aisle; one GIANT cherry blossom tree with an enormous, dense canopy covered in pink and white blossoms (about 35% of the tile width, rising past the top edge), petals falling.
- Ground: a green lawn with a petal-strewn aisle in the center; the bottom-center is completely empty.
- Light and sky: a pink-peach-baby-blue sky, golden light beams, drifting petals.
- Exact counts: 1 arch, 10 chairs, 2 trees. Nothing else.
```

## 시트 17
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Korean funeral hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a memorial altar centered on the wall: a framed portrait (blank dark frame, no face) surrounded by white chrysanthemums, with two candles; solid wall otherwise.
- Left wall: three tall standing flower wreaths along the left wall; two low tables with floor cushions.
- Right wall: three tall standing flower wreaths along the right wall; two low tables with floor cushions.
- Floor: gray-beige floor; the bottom-center is completely empty.
- Light and sky: soft muted gray-lilac light with a gentle golden glow from the candles, a quiet solemn mood.
- Exact counts: 1 altar, 1 portrait frame, 2 candles, 6 wreaths, 4 low tables. Nothing else.
2. A Western funeral chapel. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a closed wooden casket with a flower spray and a framed photo (blank, no face) on a stand centered on the wall; a stained-glass window above.
- Left wall: four wooden pews along the left wall; one flower stand.
- Right wall: four wooden pews along the right wall; one flower stand.
- Floor: a long aisle with a dark runner; the bottom-center is completely empty aisle.
- Light and sky: soft muted blue-lilac light through the stained glass, a gentle golden glow from two candles, a quiet solemn mood.
- Exact counts: 1 casket, 1 photo frame, 1 window, 8 pews, 2 flower stands, 2 candles. Nothing else.
3. An airport departure hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a large departure board (wavy lines) centered high on the wall; solid wall otherwise.
- Left wall: four check-in counters in a row along the left wall.
- Right wall: rows of seats along the right wall; a floor-to-ceiling window wall with a parked airplane outside.
- Floor: polished light floor; the bottom-center is completely empty.
- Light and sky: a pale peach-blue sky outside the windows and bright soft golden light.
- Exact counts: 1 board, 4 counters, 3 rows of seats, 1 window wall, 1 airplane. 0 plants. Nothing else.
4. An airport arrival hall. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: two glass sliding doors centered on the wall with a bright pale sky beyond.
- Left wall: one baggage carousel along the left wall with three suitcases.
- Right wall: a barrier rail with a few balloons along the right wall.
- Floor: polished light floor; the bottom-center is completely empty.
- Light and sky: bright warm white-gold light with soft halos from ceiling lamps.
- Exact counts: 1 pair of doors, 1 carousel, 3 suitcases, 1 rail, 3 balloons. Nothing else.
```

## 시트 18
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. An airplane cabin. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: the end of the cabin with a curtained galley; solid.
- Left wall: three rows of seats along the left with oval windows showing clouds and a peach sky.
- Right wall: three rows of seats along the right with oval windows showing clouds.
- Floor: a narrow carpeted aisle in the center; the bottom-center is completely empty aisle.
- Light and sky: soft golden cabin light with a peach-pink sky and clouds outside the windows.
- Exact counts: 6 rows of seats (3 per side), 6 windows. No people. Nothing else.
2. A business hotel room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: one window with a city view and curtains centered; a small desk with a lamp under it.
- Left wall: a neat bed with white sheets, headboard against the left wall, one nightstand.
- Right wall: a wardrobe against the right wall; one suitcase beside it.
- Floor: gray carpet; the bottom-center is completely empty.
- Light and sky: a soft lavender-amber evening sky with city lights in the window and warm lamp light.
- Exact counts: 1 window, 1 desk, 1 lamp, 1 bed, 1 nightstand, 1 wardrobe, 1 suitcase. 0 plants. Nothing else.
3. A Parisian street. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the Eiffel Tower peeking above the rooftops at the end of the street.
- Left side: a row of cream stone buildings with iron balconies and a cafe with small tables on the left; one street lamp.
- Right side: a row of cream stone buildings with iron balconies and a bakery on the right; one street lamp.
- Ground: gray cobblestones; the bottom-center is completely empty.
- Light and sky: a soft peach-blue sky, golden sunlight, warm cream stone glow.
- Exact counts: 2 building rows, 1 cafe with 2 tables, 2 lamps, 1 tower. No cars. Nothing else.
4. The same Paris street in the rain. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the Eiffel Tower peeking above the rooftops at the end of the street.
- Left side: a row of cream stone buildings with iron balconies and a cafe with small tables on the left; one street lamp.
- Right side: a row of cream stone buildings with iron balconies and a bakery on the right; one street lamp.
- Ground: wet cobblestones with reflections
- Light and sky: a gray-gold misty sky, rain streaks, warm lit windows reflected in puddles.
- Exact counts: 2 building rows, 1 cafe with 2 tables, 2 lamps, 1 tower. No cars. Nothing else.
```

## 시트 19
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Parisian cafe interior. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a zinc counter and a mirror centered on the wall; solid wall otherwise.
- Left wall: three small marble tables with bentwood chairs along the left wall under tall arched windows.
- Right wall: three small marble tables with bentwood chairs along the right wall.
- Floor: black-and-white tile floor; the bottom-center is completely empty.
- Light and sky: a warm peach and lilac sky in the arched windows, golden light beams.
- Exact counts: 1 counter, 1 mirror, 6 tables, 12 chairs, 3 arched windows. Nothing else.
2. A Paris hotel room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: tall French windows opening to a balcony with a wrought-iron rail, the Eiffel Tower in the distance, sheer curtains.
- Left wall: a soft bed with a headboard against the left wall; one nightstand with a lamp.
- Right wall: one armchair and a small round table against the right wall.
- Floor: polished herringbone wooden floor; the bottom-center is completely empty.
- Light and sky: a pink-peach-lavender twilight sky and golden light beams.
- Exact counts: 1 window, 1 balcony, 1 tower, 1 bed, 1 nightstand, 1 lamp, 1 armchair, 1 table. 0 plants. Nothing else.
3. The Eiffel Tower by day from a park lawn. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the Eiffel Tower centered in the distance.
- Left side: one GIANT lush tree with a huge dense canopy in the left foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Right side: one GIANT lush tree with a huge dense canopy in the right foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Ground: a green lawn with a wide pale path in the center leading to the tower; the bottom-center is completely empty path.
- Light and sky: a blue-peach sky with soft white clouds, golden sunlight.
- Exact counts: 1 tower, 6 trees, 2 benches, 2 lamp posts. Nothing else.
4. The Eiffel Tower at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the Eiffel Tower centered in the distance.
- Left side: one GIANT lush tree with a huge dense canopy in the left foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Right side: one GIANT lush tree with a huge dense canopy in the right foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Ground: a green lawn with a wide pale path in the center leading to the tower; the bottom-center is completely empty path.
- Light and sky: a pink-orange-violet sunset sky behind the tower, long shadows, lamps starting to glow.
- Exact counts: 1 tower, 6 trees, 2 benches, 2 lamp posts. Nothing else.
```

## 시트 20
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. The Eiffel Tower at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the Eiffel Tower centered in the distance.
- Left side: one GIANT lush tree with a huge dense canopy in the left foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Right side: one GIANT lush tree with a huge dense canopy in the right foreground (about 30% of the tile width) plus a row of trimmed trees behind it, and one bench.
- Ground: a green lawn with a wide pale path in the center leading to the tower; the bottom-center is completely empty path.
- Light and sky: a deep indigo starry sky, the tower sparkling with golden lights, warm lamp halos.
- Exact counts: 1 tower, 6 trees, 2 benches, 2 lamp posts. Nothing else.
2. The Louvre courtyard. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: the glass pyramid centered in the middle distance with grand stone buildings behind.
- Left side: a stone wing of the museum with arched windows on the left.
- Right side: a stone wing of the museum with arched windows on the right.
- Ground: pale stone paving; the bottom-center is completely empty.
- Light and sky: a soft peach-lilac sky and golden light reflecting off the pyramid.
- Exact counts: 1 pyramid, 2 wings, 1 small fountain far back. No people. Nothing else.
3. A Seine riverbank by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a stone bridge crossing the river in the distance.
- Left side: a stone quay wall with two trees on the left.
- Right side: calm river water with one moored boat on the right.
- Ground: a stone quay path; the bottom-center is completely empty.
- Light and sky: a soft blue-peach sky with golden reflections on the water.
- Exact counts: 1 bridge, 2 trees, 1 boat. Nothing else.
4. The Seine at sunset. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a stone bridge with warm lights turning on in the distance.
- Left side: a stone quay wall with two trees on the left.
- Right side: calm river water with one moored boat on the right, golden reflections.
- Ground: a stone quay path; the bottom-center is completely empty.
- Light and sky: a pink, orange and violet sunset sky with golden-pink reflections on the water.
- Exact counts: 1 bridge, 2 trees, 1 boat. Nothing else.
```

## 시트 21
```
One single image, EXACTLY 1400×700 pixels. A 2×2 grid of 4 equal tiles, each tile exactly 16:9 (580×326), separated by solid white gaps exactly 16 pixels wide, placed in the LEFT part of the canvas starting 8 pixels from the left and top edges. The right 224 pixels of the canvas (the full-height strip on the right side) must stay completely plain white and empty: nothing may be drawn there. Fill the 4 tiles in reading order (left to right, top to bottom). Every tile must be completely filled edge to edge (nothing cut off or faded at tile borders). No labels, no captions, no titles, no numbers.

STYLE (every tile): very low-resolution retro pixel art, like a 160×90-pixel SNES / Game Boy Advance game screen blown up, with BIG CHUNKY square pixels clearly visible, flat color areas, simple dithering, and soft dark outlines (outlines may be gentle or slightly blurred by light, that is fine). Cute, cozy and detailed like Kairosoft or Stardew Valley. NOT photo-realistic. WIDE-ANGLE view: show the whole place from corner to corner, with the ceiling edge, both side walls and the floor visible, and only the props listed in each tile's layout.

COLOR (the most important part): extremely emotional, cinematic and nostalgic color, as if a warm golden-yellow film filter and a soft vintage color grade were laid over the whole image. Rich, deep and harmonious, not pop and not neon: warm amber highlights, creamy yellows, dusty roses, deep teal-violet and indigo shadows, slightly faded blacks. Use a wide variety of beautiful, moody sky and window colors that fit the time and weather (peach, rose, lavender, teal, amber, indigo, pale mint, misty gray-blue), with smooth, rich, multi-color gradients (dithering is fine too). Make light feel alive: beams of light through windows or between trees, glowing halos around lamps and the sun, light spilling over the floor, glowing and softly blooming into the surroundings with smooth, dreamy gradients and gentle light bleed; soft glows and blur around lights are welcome.

TREES (very important): wherever a tile has trees, make them the stars of the picture: very large, extremely lush, dense and full of leaves or blossoms, richly detailed with several shades of color, with thick trunks, big canopies that fill much of the tile and rise past the top edge.

LAYOUT RULES (very important): every tile has its own LAYOUT list. Place each listed object exactly where stated and in exactly the stated number, and add NOTHING that is not listed (no extra plants, no extra picture frames, no extra furniture, no extra shelves, no extra windows). Indoor rooms are completely closed boxes: the walls are solid and continuous, with NO doorways, arches, openings, pass-throughs, hallways or holes in any wall unless the layout explicitly lists one. Keep the walls clean and calm with generous empty space. Keep the same room layout identical across tiles that say "the same" room: only the light, sky, weather and listed small items change.

EVERY TILE: an empty place with absolutely no people, no figures and no animals. Eye-level, straight-on view. STRICT: the bottom-center of each tile (the middle 40% of the width and the bottom 35% of the height) must be completely empty floor/ground, with NO coffee table, NO table, NO chair, NO box, NO plant and NO object of any kind there (a flat rug lying on the floor is allowed). Furniture, trees and props stand only along the left and right sides or far back against the wall. All signs and screens show only wavy lines, never letters.



TILES:
1. A Tokyo side street by day. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a small red torii-like gate at the far end of the street.
- Left side: small wooden shopfronts with paper lanterns on the left; one vending machine; overhead power lines.
- Right side: small shopfronts with noren curtains on the right; one bicycle parked; overhead power lines.
- Ground: a narrow asphalt street; the bottom-center is completely empty.
- Light and sky: a soft blue-peach sky and warm golden light.
- Exact counts: 2 shop rows, 1 vending machine, 1 bicycle, 1 gate, 4 lanterns. Signs wavy lines only. Nothing else.
2. The same Tokyo street at night. Outdoor, one-point perspective, camera at eye level in the middle of the scene.
LAYOUT:
- Background: a small red torii-like gate at the far end of the street.
- Left side: small wooden shopfronts with paper lanterns on the left; one vending machine; overhead power lines.
- Right side: small shopfronts with noren curtains on the right; one bicycle parked; overhead power lines.
- Ground: wet asphalt reflecting colorful lights; the bottom-center is completely empty.
- Light and sky: a deep indigo sky, glowing paper lanterns and neon signs (wavy lines only) in magenta, amber and teal, with soft halos.
- Exact counts: 2 shop rows, 1 vending machine, 1 bicycle, 1 gate, 4 lanterns. Signs wavy lines only. Nothing else.
3. A Tokyo hotel room. Interior, one-point perspective, camera at the center of the room at eye level, the room is a closed box with solid continuous walls.
LAYOUT:
- Back wall: a window with sliding paper screens and a city-lights view centered.
- Left wall: a low bed with a duvet against the left wall.
- Right wall: a low table with a small tea set and two floor cushions against the right wall.
- Floor: tatami and wooden floor; the bottom-center is completely empty.
- Light and sky: a soft lavender-magenta night sky with city lights and warm paper-lantern glow.
- Exact counts: 1 window, 1 bed, 1 table, 1 tea set, 2 cushions. 0 plants, 0 picture frames. Nothing else.
(Tiles 4-4 stay plain white and empty.)
```

## 칸 → 파일 이름 (제가 자를 때 쓰는 표)

| 시트 | 1 (왼쪽 위) | 2 (오른쪽 위) | 3 (왼쪽 아래) | 4 (오른쪽 아래) |
|---|---|---|---|---|
| 1 | `home_living_room` | `home_morning` | `home_evening` | `home_night` |
| 2 | `home_rain` | `home_winter` | `home_bedroom` | `home_newlywed` |
| 3 | `family_home` | `family_home_west` | `kitchen_classroom` | `hospital` |
| 4 | `street_day` | `street_evening` | `street_night` | `street_rain` |
| 5 | `street_snow` | `boardwalk` | `boardwalk_night` | `park_day` |
| 6 | `park_evening` | `park_night` | `park_spring` | `park_autumn` |
| 7 | `park_snow` | `park_proposal` | `cafe_day` | `cafe_evening` |
| 8 | `cafe_outdoor` | `cafe_rain` | `cafe_snow` | `cafe_window` |
| 9 | `beach_cafe` | `restaurant` | `restaurant_formal` | `family_restaurant` |
| 10 | `diner` | `diner_west` | `beach_day` | `beach_cloudy` |
| 11 | `beach_sunset` | `beach_night` | `beach_winter` | `surf_school` |
| 12 | `amusement_park` | `amusement_park_night` | `cinema` | `campus` |
| 13 | `campus_evening` | `classroom` | `library` | `office` |
| 14 | `office_night` | `office_farewell` | `meeting_room` | `branch_office` |
| 15 | `court_hall` | `gym_day` | `gym_evening` | `gym_night` |
| 16 | `wedding_ceremony` | `wedding_ceremony_west` | `wedding_reception` | `wedding_spring` |
| 17 | `funeral_hall` | `funeral_hall_west` | `airport_departure` | `airport_arrival` |
| 18 | `airplane_cabin` | `business_hotel_room` | `paris_street` | `paris_street_rain` |
| 19 | `paris_cafe` | `paris_hotel` | `eiffel_day` | `eiffel_evening` |
| 20 | `eiffel_night` | `louvre` | `seine_day` | `seine_evening` |
| 21 | `tokyo_street` | `tokyo_street_night` | `tokyo_hotel` | — |
