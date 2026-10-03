# Promo video kit — Doki Doki Destiny Lover

Attach everything in `pack/` (or `promo-pack.zip`) together with the prompt at the bottom.

## Basics
- **App name:** Doki Doki Destiny Lover (Korean: 두근두근, 내 운명의 사람)
- **Studio:** Jellie Studio
- **Tagline ideas:**
  - "Your stars already know who it is."
  - "Saju, astrology and MBTI write one love story: yours."
  - "One life. One fated person. Every choice is yours."
- **Play it:** https://jaellie.github.io/jellie/ (web, works offline, can be installed to the home screen) · Android APK: https://github.com/jaellie/jellie/releases/tag/latest-apk
- **Languages:** English, Korean

## What the game is (true features only)
1. **Create yourself:** name, birth date and time, birthplace, nationality, MBTI, job, family, and a pixel avatar (skin, hair, outfit, colors).
2. **Your fated one:** you can design them or choose "Leave it to fate." Where they live (same neighborhood, another city, another country) changes how you meet.
3. **Destiny engine:** your Korean saju (사주: peach blossom, noble helper…), Western astrology (transits, houses) and MBTI decide when love, career turns and life events happen. Every big moment shows the chart reason behind it, e.g. "Saju: Peach Blossom · Astrology: Jupiter in the 12th house."
4. **A whole life on one road:** you walk a pixel road from behind as the seasons change (spring, summer, autumn, winter, snow) and the years pass ("12 years later…").
5. **Choices in popups:** a fateful meeting at a café, the first date, a 4-part confession, the first kiss and the proposal, all shaped by MBTI.
6. **Real-life twists:** long-distance love across time zones, trips (Paris, Tokyo, the beach), weddings, kids, pets, career ups and downs, saying goodbye to parents, retirement.
7. **Hand-painted pixel scenes:** 79 painted backgrounds (cafés, the Eiffel Tower at night, a cherry-blossom wedding, an amusement park at night…). Your two characters stand inside each painting.
8. **Memory cards:** your life's big moments are saved as cards.

Don't let the video invent features. There is no multiplayer, no matching with real people and no chat with real users.

## Look & feel
- **Style:** cozy pixel art (like Kairosoft or Stardew Valley), soft pastels, dark outlines.
- **Colors:** pink `#FF6F91` (START button, hearts), plum `#2B2233` (top bar) and `#1A1420` (frame), cream `#FFF6E3` (cards), gold `#FFD36B` (money), sky blue `#7FBDEC`.
- **Font:** Galmuri (pixel font). It's on jsDelivr: `https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css`
- **Important:** the paintings are small pixel art (274×186). Scale them up with nearest-neighbor (`image-rendering: pixelated`), never blurry smoothing.

## Files in `pack/`
| File | What it shows | Good for |
|---|---|---|
| screens/01-title | Title: logo, pixel road, START | Opening / ending |
| screens/02-language-pick | English / 한국어 popup | Quick beat |
| screens/03-create-me-name | "What is your name?" | Character creation montage |
| screens/04-birthplace-nationality | Birthplace + nationality | Montage |
| screens/05-mbti | E/I, N/S, F/T, J/P picker | "MBTI" beat |
| screens/06-customize-look | Pixel avatar customizer | Montage |
| screens/07-leave-it-to-fate | "How should your fated one be chosen?" | The hook |
| screens/08-how-you-two-are | Married / dating / talking / haven't met | Montage |
| screens/09-intro-12-years-later | "12 years later, you meet the one you'll spend your life with." | Dramatic beat |
| screens/10-life-road-winter | Walking the road in winter, "32 y/o" card | Time passing |
| screens/11-fateful-meeting-popup | Café painting, two characters, 3 choices, saju/astrology reason | Hero shot |
| paintings/*.png | 12 scenes: spring park, café window, amusement park night, beach sunset, Eiffel night, park proposal, spring wedding, newlywed home, airport, Tokyo night, snowy park, boardwalk night | The "life montage" |
| logo/logo-en.png, logo-ko.png, app-icon.png | Logos (transparent) | Title cards |
| audio/step-by-step.m4a | BGM "Step by Step" (2:46) | Music bed |

The screenshots are iPhone size (1170×2532, portrait).

## Music notes
- "Step by Step" is 2 min 46 s long. For a 30–60 s video, use the first part and fade it out over the last 2 s.
- Short sound effects in JavaScript (Web Audio) work well on top: a soft "pop" when a popup opens, a "ding" on taps, a heartbeat "doki-doki" on the hearts, sparkles on the logo. Keep them quieter than the music.
- Browsers block sound until a click, so ask for a "▶ Play" button first.

## The prompt (filled in)
```
You are a professional videographer and motion designer. Create a high-definition, creative, playful, and joyful promo video (about 45 seconds, vertical 9:16 and also works at 16:9) that introduces my mobile game "Doki Doki Destiny Lover" by Jellie Studio, built as a single HTML page with JavaScript animation.

MUSIC & SOUND
- Use the attached "step-by-step.m4a" as the background music from the start; fade it out over the last 2 seconds.
- Add light sound effects with the Web Audio API synced to the visuals (a soft pop when a popup appears, a tap "ding", a heartbeat "doki-doki" on hearts, a sparkle on the logo). Keep them below the music.
- Start with a "▶ Play" button (browsers need a click before sound).

USE MY IMAGES
- Use as many of the attached screenshots, paintings and logos as you can, so the video feels true to the real app. Show the screenshots inside a phone frame.
- The paintings are small pixel art: always scale them with image-rendering: pixelated (sharp pixels, never blurry).
- Font: Galmuri (https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css). Colors: pink #FF6F91, plum #2B2233, dark frame #1A1420, cream #FFF6E3, gold #FFD36B, sky #7FBDEC.

STORY (suggested beats)
1. Logo drops in with sparkles and floating pixel hearts → "Your stars already know who it is."
2. Create yourself: quick montage of the setup screens (name, birthday, MBTI, pixel avatar).
3. "Leave it to fate?" → the "12 years later, you meet the one you'll spend your life with" card.
4. Hero shot: the fateful café meeting popup, with the line "Saju · Astrology · MBTI decide when love finds you."
5. A life montage across the paintings: spring park, café, amusement park at night, Paris, beach sunset, proposal, spring wedding, newlywed home. Pixel characters, seasons changing.
6. Walking the life road through winter: "One life. One fated person. Every choice is yours."
7. End card: logo + app icon + "Play free in your browser · Android" + "© Jellie Studio".

ABOUT THE GAME (only show what's true)
A cozy pixel-art life & romance sim. You create yourself (birth date and time, birthplace, MBTI, job, family), then meet your fated person. Korean saju, Western astrology and MBTI shape when love, career turns and life events happen, and each big moment shows the chart reason behind it. You live a whole life on one road: dates, a 4-part confession, the first kiss, the proposal, long-distance love across time zones, trips to Paris and Tokyo, a wedding, kids, pets, retirement. There are 79 hand-painted scenes, and your life's big moments become memory cards. English and Korean. No multiplayer and no matching with real people.

You're really creative, so make the best video you can.
```
