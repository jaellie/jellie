# Background Asset Manifest

Generated from `data/world/backgrounds.json`. This is the art to-do list.

- **procedural**: the Claude Design prototype already draws this with a `ROOMS.*` painter.
- **planned**: a bitmap is still needed. Until it exists, the engine uses the base background and adds time/weather overlays, so the game works without it.

## Art direction

- 360×740 frame. The scene is a **full-screen portrait stage, 360×642** (everything under the HUD and the log line), or 180×321 drawn at 2×. It is scaled to *cover* taller/wider phones, so keep important details away from the outermost ~20 px.
- Kairosoft layout (the engine's `scene.stage`): the far corner of the room is at the top middle (x 180, y 110); the two back walls rise from the "V" running from there down to the left and right edges at y 200, up to the top edge. The floor fills everything below the V down to the bottom edge, as iso diamond tiles 72×36 with a tile corner at the far corner. Windows, shelves and posters go on the walls; counters, tables and plants stand on the floor lines.
- Keep the floor open — people walk everywhere on it (the lower ~⅔ of the screen), so props go along the walls and edges, not in the middle.
- Pixel art: pastel colors, the `#2b2233` outline color, Galmuri bitmap type, chunky decorative borders.
- Characters are separate sprites, about 2.5 heads tall and about 1/10 of the stage height (≈ 64 px of 642: e.g. 16×32 at 2×, or the 16×24 sprites at ~2.5×). Never bake characters into backgrounds.
- Avoid 3D, photorealism, glassmorphism and heavy gradients.
- Variants (morning/evening/night, rain/snow, seasons) should reuse the base composition, with the palette and lighting changed and small details added or removed.
- Props that characters interact with (treadmills, counters) belong in `interactive` layers, so one prop sheet serves every time variant.

## Priority (MVP)

Draw one strong base per location first. Variants come second, because overlays cover them in the meantime.

| Location | Background id | Depicts | Asset path | Status |
|---|---|---|---|---|
| Home | `home_living_room` | base | `assets/bg/home/home_living_room.png` | procedural (ROOMS.home) |
| Home | `home_bedroom` | activity: sleep | `assets/bg/home/home_bedroom.png` | planned |
| Home | `home_morning` | MORNING | `assets/bg/home/home_morning.png` | planned |
| Home | `home_evening` | EVENING | `assets/bg/home/home_evening.png` | planned |
| Home | `home_night` | NIGHT | `assets/bg/home/home_night.png` | planned |
| Home | `home_rain` | RAIN | `assets/bg/home/home_rain.png` | planned |
| Home | `home_winter` | WINTER | `assets/bg/home/home_winter.png` | planned |
| Family Home | `family_home` | base | `assets/bg/family_home/family_home.png` | planned |
| Family Home | `family_restaurant` | activity: eat | `assets/bg/family_home/family_restaurant.png` | planned |
| Street | `street_day` | base | `assets/bg/street/street_day.png` | procedural (ROOMS.street) |
| Street | `street_evening` | EVENING | `assets/bg/street/street_evening.png` | planned |
| Street | `street_night` | NIGHT | `assets/bg/street/street_night.png` | planned |
| Street | `street_rain` | RAIN | `assets/bg/street/street_rain.png` | planned |
| Street | `street_snow` | SNOW | `assets/bg/street/street_snow.png` | planned |
| Café | `cafe_day` | base | `assets/bg/cafe/cafe_day.png` | procedural (ROOMS.cafe) |
| Café | `cafe_evening` | EVENING | `assets/bg/cafe/cafe_evening.png` | planned |
| Café | `cafe_rain` | RAIN | `assets/bg/cafe/cafe_rain.png` | planned |
| Café | `cafe_snow` | SNOW | `assets/bg/cafe/cafe_snow.png` | planned |
| Café | `cafe_window` | activity: sit_alone/read | `assets/bg/cafe/cafe_window.png` | planned |
| Café | `cafe_outdoor` | CLEAR, SUMMER | `assets/bg/cafe/cafe_outdoor.png` | planned |
| Gym | `gym_day` | base | `assets/bg/gym/gym_day.png` | planned |
| Gym | `gym_evening` | EVENING | `assets/bg/gym/gym_evening.png` | planned |
| Gym | `gym_night` | NIGHT | `assets/bg/gym/gym_night.png` | planned |
| Cooking Class | `kitchen_classroom` | base | `assets/bg/cooking_class/kitchen_classroom.png` | planned |
| Park | `park_day` | base | `assets/bg/park/park_day.png` | procedural (ROOMS.park) |
| Park | `park_evening` | EVENING | `assets/bg/park/park_evening.png` | planned |
| Park | `park_spring` | SPRING | `assets/bg/park/park_spring.png` | planned |
| Park | `park_autumn` | AUTUMN | `assets/bg/park/park_autumn.png` | planned |
| Park | `park_snow` | SNOW | `assets/bg/park/park_snow.png` | planned |
| Library | `library` | base | `assets/bg/library/library.png` | planned |
| Campus | `campus` | base | `assets/bg/university/campus.png` | planned |
| Campus | `classroom` | activity: attend_lecture | `assets/bg/university/classroom.png` | planned |
| Campus | `campus_evening` | EVENING | `assets/bg/university/campus_evening.png` | planned |
| Office | `office` | base | `assets/bg/office/office.png` | procedural (ROOMS.office) |
| Office | `meeting_room` | activity: meeting | `assets/bg/office/meeting_room.png` | planned |
| Office | `office_night` | NIGHT | `assets/bg/office/office_night.png` | planned |
| Restaurant | `restaurant` | base | `assets/bg/restaurant/restaurant.png` | procedural (ROOMS.restaurant) |
| Snack Bar | `diner` | base | `assets/bg/diner/diner.png` | procedural (ROOMS.diner) |
| Cinema | `cinema` | base | `assets/bg/cinema/cinema.png` | procedural (ROOMS.cinema) |
| Amusement Park | `amusement_park` | base | `assets/bg/amusement_park/amusement_park.png` | procedural (ROOMS.amuse) |
| Amusement Park | `amusement_park_night` | NIGHT | `assets/bg/amusement_park/amusement_park_night.png` | planned |
| Beach | `beach_day` | base | `assets/bg/beach/beach_day.png` | procedural (ROOMS.beach) |
| Beach | `beach_sunset` | EVENING | `assets/bg/beach/beach_sunset.png` | planned |
| Beach | `beach_night` | NIGHT | `assets/bg/beach/beach_night.png` | planned |
| Beach | `beach_cloudy` | CLOUDY | `assets/bg/beach/beach_cloudy.png` | planned |
| Beach | `beach_winter` | WINTER | `assets/bg/beach/beach_winter.png` | planned |
| Surf School | `surf_school` | base | `assets/bg/surf_school/surf_school.png` | planned |
| Boardwalk | `boardwalk` | base | `assets/bg/boardwalk/boardwalk.png` | planned |
| Boardwalk | `boardwalk_night` | NIGHT | `assets/bg/boardwalk/boardwalk_night.png` | planned |
| Beach Café | `beach_cafe` | base | `assets/bg/beach_cafe/beach_cafe.png` | planned |
| Airport | `airport_departure` | base | `assets/bg/airport/airport_departure.png` | planned |
| Airport | `airport_arrival` | activity: arrive | `assets/bg/airport/airport_arrival.png` | planned |
| Paris Hotel | `paris_hotel` | base | `assets/bg/travel/hotel_room.png` | planned |
| Tokyo Hotel | `tokyo_hotel` | base | `assets/bg/travel/hotel_room.png` | planned |
| Eiffel Tower | `eiffel_day` | base | `assets/bg/paris_eiffel_tower/eiffel_day.png` | planned |
| Eiffel Tower | `eiffel_evening` | EVENING | `assets/bg/paris_eiffel_tower/eiffel_evening.png` | planned |
| Eiffel Tower | `eiffel_night` | NIGHT | `assets/bg/paris_eiffel_tower/eiffel_night.png` | planned |
| The Louvre | `louvre` | base | `assets/bg/paris_louvre/louvre.png` | planned |
| Paris Café | `paris_cafe` | base | `assets/bg/paris_cafe/paris_cafe.png` | planned |
| Seine Riverside | `seine_day` | base | `assets/bg/paris_seine/seine_day.png` | planned |
| Seine Riverside | `seine_evening` | EVENING | `assets/bg/paris_seine/seine_evening.png` | planned |
| Paris Neighborhood | `paris_street` | base | `assets/bg/paris_street/paris_street.png` | planned |
| Paris Neighborhood | `paris_street_rain` | RAIN | `assets/bg/paris_street/paris_street_rain.png` | planned |
| Tokyo Street | `tokyo_street` | base | `assets/bg/tokyo_street/tokyo_street.png` | procedural (ROOMS.tokyo) |
| Tokyo Street | `tokyo_street_night` | NIGHT | `assets/bg/tokyo_street/tokyo_street_night.png` | planned |
| Language Exchange App | `language_exchange_app_screen` | base | `assets/bg/online/phone_screen.png` | planned |
| Instagram | `instagram_screen` | base | `assets/bg/online/phone_screen.png` | planned |
| Dating App | `dating_app_screen` | base | `assets/bg/online/phone_screen.png` | planned |
| Online Community | `online_community_screen` | base | `assets/bg/online/phone_screen.png` | planned |
| Wedding Venue | `wedding_ceremony` | base | `assets/bg/wedding_venue/wedding_ceremony.png` | planned |
| Wedding Venue | `wedding_reception` | activity: reception | `assets/bg/wedding_venue/wedding_reception.png` | planned |
| Hospital | `hospital` | base | `assets/bg/hospital/hospital.png` | planned |
