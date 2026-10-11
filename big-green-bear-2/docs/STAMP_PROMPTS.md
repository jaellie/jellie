# Stamp and Korean Text Prompts: Big Green Bear's Adventure II

Prompts for the ink stamps, with an English and a Korean version of each. Korean (Hangul) text is the hardest thing for image AI to draw, so read section 1 first.

## 1. Read this first: Korean text in AI images
- Image AIs often misspell Hangul (extra strokes, wrong vowels). **Always check every character** against the exact string given in the prompt.
- **Safest method (recommended): generate the stamp BLANK** (`stamp_blank_*`, section 3) and let the game draw the Korean or English word on top in-engine with a font. Then you can switch language and fix typos without regenerating.
- **If you want the text baked in** (section 4 to 6), generate 4 variants per stamp and keep the one with perfect spelling. GPT and Gemini handle Hangul better than Grok. Keep the text short.
- Free fonts for in-engine text: **Noto Serif KR** (stamp look), **Noto Sans KR Bold** (UI), both OFL licensed.

## 2. STAMP STYLE LOCK (paste first, every time)
```
STAMP STYLE LOCK. A rubber ink stamp impression for a vintage detective's archive file. Isolated on a flat magenta #FF00FF background (no shadow, no paper). Ink color: red-brown stamp ink #A8483F with slightly lighter faded spots (#C06A5E) and a few tiny ink gaps, as if pressed on paper. The impression has an uneven pressure edge: slightly heavier on one side, a crisp but imperfect outline, no digital perfection, no glow, no gradient, no glossy effect. Border: a double rectangle (outer line 6 px, inner line 3 px, gap 8 px), square corners with a very slight rounding. The whole stamp is rotated between -4 and +4 degrees. Size 1200 x 520 px. Text is centered, all capital letters for English, bold slab-serif letterforms, with letter-spacing of about 6% of the letter height. NO other words, NO numbers, NO watermark, NO logo.
```

## 3. Blank stamps (recommended base, no text)
```
[STAMP STYLE LOCK]
ELEMENT: the same stamp impression as the style lock but with NO text at all inside the double border. Leave the inside completely empty, with only a few faint ink-speckle marks. Create 3 versions: stamp_blank_rect (double rectangle, 1200x520), stamp_blank_ring (a double circle ring, 700x700), stamp_blank_wide (a double rectangle, 1600x360).
```

## 4. Game stamps: English and Korean
Paste the STAMP STYLE LOCK first, then one block below. For Korean add the sentence: "The text is Korean Hangul, written exactly as given, in a heavy bold serif or gothic brush-cut style, each syllable block clear and fully spelled, no extra strokes, no mixed-up vowels."

| ID | English text | Korean text |
|---|---|---|
| `stamp_archived` | ARCHIVED | 보관됨 |
| `stamp_confidential` | CONFIDENTIAL | 기밀 |
| `stamp_reviewed` | REVIEWED | 검토 완료 |
| `stamp_evidence` | EVIDENCE | 증거물 |
| `stamp_unknown` | UNKNOWN | 미확인 |
| `stamp_missing_record` | MISSING RECORD | 기록 없음 |
| `stamp_contradiction` | CONTRADICTION | 모순 |
| `stamp_verified` | VERIFIED | 확인됨 |
| `stamp_case_open` (ring) | THE CASE DOES NOT CLOSE | 사건은 닫히지 않았다 |

### How the prompt is built
The page joins the pieces for you: press **EN** or **KO** on a stamp row to copy `STAMP STYLE LOCK` + `ELEMENT: <id>. The stamp contains exactly one line of text: "<TEXT>". Nothing else inside the border.` (for Korean it also adds the Hangul rules: exact syllables, heavy bold serif or gothic brush-cut style, no extra strokes). The ring stamp has its own wording below.

### Ring stamp (for `stamp_case_open`)
```
[STAMP STYLE LOCK]
ELEMENT: stamp_case_open_ko. A double circle ring stamp 900x900 px (outer ring 6 px, inner ring 3 px, gap 8 px). The Korean text "사건은 닫히지 않았다" curves along the inside of the ring in two short arcs, "사건은" on the upper arc and "닫히지 않았다" on the lower arc, with a small five-point star in the center. Exact Hangul, bold, fully spelled, no extra strokes, no other words.
```

## 5. When each stamp is used (proposal, change anything)
I do not have notes on how your first asset pack used these six, so this is my proposed use in the case-file UI.
| Stamp | Situation |
|---|---|
| ARCHIVED 보관됨 | A case thread is finished (chapter ends) or you open Edward's old archive files. The stamp thumps onto the folder page. |
| CONFIDENTIAL 기밀 | The first time you open protected records (the family record book, the flood records). A hint that someone hid them. |
| REVIEWED 검토 완료 | A witness statement in the STATEMENTS tab once you have read all of it and compared it with evidence. |
| EVIDENCE 증거물 | When you pick up an item (key, pocket watch, photo). It slides into the folder with this stamp. |
| UNKNOWN 미확인 | A person or object you cannot identify yet: the two silhouettes on the identity board, the child in the old photo. |
| MISSING RECORD 기록 없음 | A timeline slot with no record: BGB's gap after 11:52, the power log before the blackout. |
| CONTRADICTION 모순 | Two statements or clues clash (for example Nini's "two Bears" vs the guard's "one Bear"). |
| VERIFIED 확인됨 | A clue is confirmed by a second source (for example the stopped pocket watch plus a sound witness for 11:52). |
| THE CASE DOES NOT CLOSE 사건은 닫히지 않았다 | A wrong final deduction: no game over, the case reopens. |

## 6. Korean UI text set (for in-engine labels or baked tabs)
| Place | English | Korean |
|---|---|---|
| Menu | CONTINUE | 이어하기 |
| Menu | NEW GAME | 새 게임 |
| Menu | SETTINGS | 설정 |
| Menu | CASE FILE | 사건 파일 |
| Folder tab | PEOPLE | 인물 |
| Folder tab | EVIDENCE | 증거 |
| Folder tab | STATEMENTS | 증언 |
| Folder tab | TIMELINE | 시간표 |
| Folder tab | IDENTITY | 신원 |
| Deduction | WHO / HOW / WHEN / WHY | 누가 / 어떻게 / 언제 / 왜 |
| Deduction | COMPARE | 비교하기 |
| Time | 11:47 (clock stopped) | 11시 47분 |

### Korean labelled tab prompt (optional, only if baking text)
```
[UI STYLE LOCK]
ELEMENT: folder_tab_<id>_ko, a paper folder tab that sticks out of a navy folder edge, 360x96 px, aged cream paper with a brass hairline frame. A single short Korean label handwritten in dark graphite-ink brush pen, centered: "<KOREAN>". Exact Hangul, clear and fully spelled, no extra strokes, no other words, no numbers.
```

## 7. Checklist (reject the stamp if any item fails)
- [ ] Every Hangul block is spelled exactly like the given string (check each syllable)
- [ ] Only the requested text, no extra words, no numbers, no logo
- [ ] Ink #A8483F, faded spots and tiny gaps, slightly uneven pressure
- [ ] Double border, rotated about -4 to +4 degrees
- [ ] Magenta background keys cleanly (`python3 tools/chroma_key.py in.png out.png`), no pink fringe
- [ ] Same size across a set (1200x520, ring 900x900)
