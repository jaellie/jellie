# STORY BIBLE — Big Green Bear's Adventure 2: *The Other Side of the Truth*

**Version:** 0.5 (approvals: Q2, R13 to R16 and the fair-play chain recorded; adds clarification C1: BGB's responsibility; decisions through Q1–Q8 recorded · **not final**: see `STORY_AUDIT.md` R1–R12 awaiting approval) · **Village name:** Bell Village (벨 마을) — official, use everywhere.
**Theme question:** *Can protecting someone you love make you complicit in their wrongdoing?*
**Series-2 refrain:** *"Who are you really protecting?"* (너는 정말 누구를 지키고 있는가?)

---

## 0. How to read this document

| Tag | Meaning |
|---|---|
| 🔒 **CANON** | You told me this. Do not change without your say-so. |
| 🟡 **PROPOSED** | My draft to make the mystery work. **Not approved.** Every 🟡 item is listed in §14 for yes/no. |
| ⬜ **TBD** | Deliberately undecided. Do not invent in code or art. |

Rules for anyone (human or Claude Code) implementing from this file:
1. Only 🔒 and approved 🟡 content may be built. ⬜ stays a placeholder.
2. If a script line contradicts §3 (Ground Truth) or §12 (Hard Rules), the bible wins.
3. Story content lives in data (ScriptableObjects / dialogue files), never hardcoded in controllers.

### 0.1 Locked decisions log (v0.3)

| ID | Decision | Status |
|---|---|---|
| **D13** | Keep the **scarf-knot clue.** Tails on **opposite shoulders** (BGB = his left, Green = his right), anatomically consistent in **all six views**, drawn per view, **never mirrored.** **Both** BGB and Green need per-view redraws. | 🔒 |
| **Scar** | Green's ear scar: **faded pinkish-grey, old, healed.** Not fresh. Green must not look more sinister than BGB. | 🔒 |
| **Tower clock** | Stops at **11:47** from **mechanical damage during the fall.** | 🔒 |
| **Pocket watch** | The earlier lock ("stops at 11:52 from a second impact") is **withdrawn.** There is **no second impact.** Whether the watch stops at all is **open** (recommendation: it keeps running; see `STORY_AUDIT.md` §3, R4). | ⬜ |
| **Central moral** | *Green caused Edward to fall, but BGB had an opportunity to help him and chose to protect his brother first.* | 🔒 |
| **C1: BGB's responsibility** | Established by **what BGB does**, not by a claim that his delay caused the death. **11:47** Green causes the fall and flees **believing Edward dead.** **11:50** BGB finds Edward alive and **knows he needs help now.** **Instead of calling, BGB first conceals evidence connecting Green.** He delays the alarm **11:50 to 11:55.** Edward deteriorates (injuries, blood loss, freezing cold) and dies about **12:08.** After the death BGB **conceals his own actions and Green's involvement.** **Green is responsible for the fall. BGB is responsible for deliberately delaying help and concealing evidence.** The Healer **cannot say** whether immediate help would have saved Edward, and **the game never claims the delay medically caused his death.** | 🔒 |
| **Reveal order** | The player **first** discovers Green's involvement and believes the mystery is nearly solved. **Only afterward** do they reconstruct BGB's five missing minutes: **the game's most emotionally significant revelation.** The final question shifts from *"Who caused Edward's death?"* to *"Who had the opportunity to do the right thing, but chose not to?"* | 🔒 |
| **Q2 (final)** | **Willful ignorance, approved.** BGB takes Green's glove and Edward's letter **without reading the letter or investigating what happened.** He suspects Green and **deliberately avoids confirming it.** **His ignorance never excuses him:** he **knows** Edward is alive, **knows** Edward needs immediate help, and **knows** he is hiding potentially important evidence. **The concealment is a conscious choice, even though he does not know the whole truth.** | 🔒 |
| **R13** | **All four elements approved:** the hiding place behind the photograph, the chute bolt, the Night Guard's log detail, and the Prologue clue. Each must have a **clear causal purpose** and be **discoverable or logically connectable.** The hiding place must be **physically plausible.** The Prologue clue must be **subtle** and must not reveal the twist. (Specified in §5.1.) | 🔒 |
| **R14** | Edward first says **"Cold… please…"**, then the ambiguous words. It establishes that BGB clearly understood Edward needed help **before** he chose to conceal evidence. **Not overly explicit or melodramatic.** | 🔒 |
| **R15** | The central question changes in Part C, with a **Responsibility Board.** The investigation **first** asks **who caused Edward's fall.** After the player identifies Green, the Board adds **separate** questions about BGB's actions: **physical responsibility for the fall, responsibility for delaying assistance, responsibility for concealing the truth.** It never implies BGB medically caused the death. (§13.1.) | 🔒 |
| **R16** | **No flashback and no cutscene of 11:50 to 11:55.** The player reconstructs the five minutes from **evidence, contradictions, witness testimony and the Case File.** The final deduction must feel **earned, not explained.** | 🔒 |
| **Fair-play chain** | Every essential conclusion about BGB's concealment and delay is supported by evidence the player holds **before the final accusation**, and **none depends solely on BGB's confession.** The player can establish six conclusions (§7.1). The final reveal also exposes **what the player overlooked while trusting BGB.** | 🔒 |
| **Edward's injury and death** | Survives the fall at 11:47, seriously injured, cannot get himself to safety. **Cold, exposure and blood loss** worsen his condition. | 🔒 |
| **D1 / Q3** | BGB **knows** the identities were swapped and **knowingly helped preserve the false identity into adulthood.** He has **previously concealed evidence or withheld testimony.** He does **not** know the full history of the falsified records, nor that Green confronted Edward, before he finds Edward. He did **not** cause the fall. | 🔒 |
| **Q2** | BGB finds **Green's glove** and hears **ambiguous words** from Edward. He suspects Green and **deliberately avoids confirming it** (willful ignorance, not innocence). | 🔒 |
| **Q4** | Healer: the fall was **potentially survivable**; **earlier help might have improved his chances**; survival never certain; cannot say what worsened his injuries. Time-of-death estimate **11:55 PM – 12:15 AM.** | 🔒 |
| **Q5** | Most residents believe Green was sent away as a child; many arrived later. Older residents' knowledge and silence must be consistent. | 🔒 (consistency ⬜ R9) |
| **Q6** | Narration never lies. BGB may be silent/evasive, never falsely surprised. Twins' relationship revealed in **Ch.3**; moral revelation later. | 🔒 |
| **Q7** | Second flashback: **adults deliberately decide** to protect one child by sacrificing the other's identity and future; a compassionate choice becomes institutional injustice. **< 2 min, non-playable, consequences over exposition.** | 🔒 |
| **Q8** | The **Clockkeeper syncs Edward's watch to the tower clock every morning**, established early. | 🔒 |
| **D10** | Removed (no repeated 11:47 on flood night). | 🔒 |
| **Structure** | Present → playable Past (**player controls young Green**, identity not revealed at first) → Present, plus a **short non-playable** second flashback. | 🔒 |
| **Art** | Faded scar, corrected scarves and the **pre-flood photograph** are **missing production assets.** No mirrored sprites as finals. | 🔒 |

**Still open:** D2–D8, D11, D12, patches **R1–R12** in `STORY_AUDIT.md` (except where C1 already integrates them), and the two small new proposals **R17, R18** (§14.3). Do not treat them as decided.
**⚠ markers** flag text that conflicts with a decision or is waiting on an R-item.

---

## 1. Canon at a glance (🔒)

- **Big Green Bear (BGB)** is the playable protagonist. Soft sage-green, mustard knitted scarf. **Left-handed.**
- **Green** is his twin brother and the **primary suspect** in Edward's death. **Right-handed.**
- The twins' **identities were switched in childhood.** The player must not learn this until late (Ch.6).
- Structure: **Present → playable Past → Present**, plus **one short, non-playable Past scene at the very end.**
- Playable flashback: **23 years earlier**, Bell Village. The player controls an **unnamed young bear**; they assume it is young BGB. It is actually **the present-day Green.**
- The past **cannot be changed.** Choices that contradict it trigger the **sepia rewind**.
- **11:47** = Edward's fall and the clock's mechanical failure. **Not** automatically the time of death.
- **Epilogue: "The Final Record", 11:48.**
- BGB found Edward and **delayed rescue**; Green is responsible for the **fall**. Neither fact clears the other.
- **BGB knows about the swap** (he does not know the full story). Scarf tails: **BGB left shoulder, Green right shoulder.** Green's scar: **faded pinkish-grey, healed.**
- The tower clock stopped at **11:47** (mechanical damage in the fall). Edward **survived the fall**; 11:47 is not the time of death. **Cold, wet and blood loss** worsened his condition. Healer's window: **11:55 PM – 12:15 AM.**
- **C1 (🔒):** Green caused the fall and fled believing Edward dead. BGB found Edward alive at 11:50, **hid evidence connecting Green first,** and rang the alarm at 11:55. The game **never says the delay killed Edward.**
- The 11:40 sighting: Clockkeeper saw **a bear climbing the stairs, carrying something in the right hand.**
- Photograph transition into the flashback; caption **"23 YEARS EARLIER · BELL VILLAGE"**; BGB later says **"He always looked out for me."**
- Chapter list: Prologue The Photograph · 1 The Clock That Stopped · 2 Four Witnesses · 3 The Other Bear · 4 The Name That Was Stolen · 5 A Good Person · 6 Five Missing Minutes · 7 The Truth We Choose · Epilogue The Final Record.
- Chapters 4–5 are the past; Ch.1–3 and 6–7 are the present (from your chapter-placement table).
- Clue set for telling the twins apart: **handedness, scarf, ear scar, photographs, witness testimony** (+ movement speed, expression, object use). **No single clue may solve it.**
- Nini: small fluffy white lamb, yellow raincoat, brown boots, ~55% of BGB's height.
- Clockkeeper: cat with brass goggles, brown apron (mockup + character sheet). Name ⬜.
- Character sheet (locked designs): **Edward** = hedgehog with round glasses, vest, red tie, pocket watch; **Café Owner** = golden spaniel in red apron; **Night Guard** = owl in blue cap and cape; **Mara** = badger in red shawl; **Green** = same as BGB plus torn marks on the left ear.

---

## 2. Cast and identities

### 2.1 The twins — naming convention (read this twice)

Because names were swapped, **we never say "BGB" or "Green" about the past without saying which kind of name.**

| Term | Meaning |
|---|---|
| **BGB** / **Green** | The **present-day** bears, as everyone in Bell Village knows them. |
| **Elder twin** / **Younger twin** | The two bodies. Born minutes apart. Stable across time. |
| **Birth name** | Elder = *Big Green Bear*. Younger = *Green*. 🟡 ("Big" = big brother.) |
| **Swap** | After the flood, the records and the village's belief assigned the **elder's name to the younger and vice-versa.** 🟡 |

| | **Elder twin** | **Younger twin** |
|---|---|---|
| Birth name 🟡 | Big Green Bear | Green |
| **Today called** 🔒 | **Green** (outcast, suspect) | **Big Green Bear** (beloved, playable) |
| Handedness 🔒/🟡 | **Right** | **Left** |
| Scarf 🔒 | Knot and tails on his **right** shoulder | Knot and tails on his **left** shoulder |
| Ear scar 🔒 | **Left ear:** faded **pinkish-grey healed scar** (flood night, Ch.5). Subtle; not sinister. | None |
| Resting expression 🟡 | Guarded: brows low, mouth set | Open: soft, slow smile |
| Movement 🟡 | Quicker, longer stride, light step | Slower, deliberate, "soft and slightly heavy" |
| Role in flood 🟡 | Rescued his brother | Caused the failure, was rescued |
| Role now 🟡 | Lives alone at the Old Mill; the village distrusts him | Village hero; asked to "look into" Edward's death |

> **Why this works:** the village *already* trusts the younger twin (hero) and distrusts the elder (blamed). That makes "Green is the suspect" feel natural, and makes the swap a *moral* wound, not just a trick.

### 2.2 Others

| Character | Status | Notes |
|---|---|---|
| **Edward** | 🔒 victim · 🔒 design | **Hedgehog** with round glasses, brown vest, red tie and a **pocket watch** (character sheet). 🟡 Village **Archivist** and the twins' **guardian** (uncle/foster, ⬜). Universally called "a good person". |
| **Nini** | 🔒 design · 🟡 role | 🟡 Edward's young archive assistant; keeps notes; innocent; grieving. First NPC. Your asset poses (reading/writing/sleeping) fit this. |
| **Clockkeeper** | 🔒 witness | Cat with goggles. 🟡 Works the night shift in the winding room. Honest but only saw the stairs, not faces. Name ⬜. |
| **Café Owner** (카페 주인) | 🔒 design · 🟡 role | Dog (golden spaniel) in a red apron. Witness #3. Hosts BGB's alibi. Name ⬜. |
| **Night Guard** (야간 경비원) | 🔒 design · 🟡 role | Owl in a blue guard cap and cape. Witness #4. Walks the bridge route; keeps a patrol log. Name ⬜. |
| **Mara** (마라) | 🔒 design · 🟡 role | Old **badger** in a red embroidered shawl and floral apron. 🟡 Remembers the flood; first to voice the village's blame of Green; later the one who says the hero cub was right-handed (Testimonial clue, Ch.6). ⬜ confirm role. |
| **Village Healer** | 🟡 | Gives the medical estimate in Ch.6. ⬜ |
| **Constable** | ⬜ | Needed only to explain why BGB investigates. 🟡 Snowed in on the far road (never appears). |
| **Flood casualty** | ⬜ | Someone was lost in the flood so the blame has weight. Decision D4. |

---

## 3. GROUND TRUTH (the actual events) — 🟡 all of §3 needs approval

> Everything the player discovers must be derivable from this. Chapters only *reveal* it; they never contradict it.

### 3.1 Backstory — "The Thaw Flood", 23 years ago

| Time | Event |
|---|---|
| Afternoon | Edward ties each twin's scarf by hand with a **different knot side** so he can tell them apart: elder = right, younger = left. |
| Evening | The twins (age ~7) sneak into the Clocktower to see the gears. The **younger** twin tinkers with the **warning-bell escapement** and jams it. He doesn't understand what it is. |
| Night | Meltwater surge. **No warning bell rings.** The lower village floods. |
| Night | The younger twin is trapped in the flooding tower stairwell. The **elder twin** goes in and **saves him**, tearing his left ear on debris (the scar). Nobody sees the rescue. |
| Dawn | Villagers find the **younger** twin, wrapped and carried by Edward. The elder is left behind, cold, unseen. |
| Dawn+ | A villager (⬜ D4) died. The village demands to know why the bell failed. |
| Days later | ⚠ **The adults decide (Q7, 🔒 adults; details 🟡 R11, R12).** A small group (**Edward leads; Mara and others**) meets over the register. The family of the dead villager demands that the child who tampered with the bell be sent away. The adults know the **younger** twin did it. They **protect him** and **give the blame to the elder** by **swapping the names** (hero = "Big Green Bear", culprit = "Green"). A compassionate, deliberate choice that becomes the village's official record. |
| After | The elder twin leaves the village for the Old Mill. The younger twin grows up as Bell Village's Big Green Bear, knowing what was done. |

**Motive 🟡:** The adults loved the younger twin and could not bear to see a seven-year-old destroyed. They chose one child's future over the other's name. **Edward is not a villain: a good person who did a terrible thing out of love**, shared with others (⚠ modifies D2: a group decision, with Edward as the one who writes the entry). (Mirror of BGB's choice, §3.3.)

### 3.2 The night of Edward's death (present) — timeline "T3" 🟡 (pending R1–R12)

Conditions: snowing; outside ≈ **−9 °C**; unheated stone tower ≈ **−4 °C**, wind through the louvres. All times real. Full reasoning: `STORY_AUDIT.md`.

| Real time | Event | Who knows |
|---|---|---|
| 18:00 | Edward's **letter** reaches BGB's mailbox: *come to the tower at midnight.* (Green's letter was delivered by hand earlier. Nini saw Edward seal two.) | BGB |
| 22:00 | Clockkeeper winds the clock and leaves the **gear hatch unlatched** (weak latch). | Clockkeeper |
| 23:15 | BGB sits in the café, hesitating. | Café Owner |
| 23:35 | Green hurries across Lantern Bridge. | Night Guard |
| 23:38 | Green enters the tower's main room. | — |
| **23:40** | **Clockkeeper sees a bear climbing the stairs, something in his right hand** (Edward's letter to Green; he sees the back only). | Clockkeeper |
| 23:41 | ⚠ **R1:** Edward sends the Clockkeeper to the chapel store for the ceremonial bell-rope ("take your time, I'm expecting company"). | Clockkeeper |
| 23:42 | Clockkeeper leaves (≈ 15 min round trip). **BGB leaves the café.** | Clockkeeper; Café Owner |
| 23:43–23:46 | On the gallery beside the open hatch, Edward tells Green he will **read the true record at midnight.** Green demands it; Edward refuses. | Green, Edward |
| **23:47** | Struggle. **Edward falls ≈ 3.5 m through the hatch** onto the going-train platform, **striking the pendulum rod and crutch.** **The tower clock stops at 11:47.** | Green, Edward |
| 23:47 | Green looks down, sees Edward motionless, **believes him dead** (⚠ R7). He flees by the **maintenance chute**, dropping his **right glove** and the **crumpled letter.** | Green |
| 23:47–23:55 | Edward is **conscious**, soaked by meltwater in the pit, cannot move hip/legs, calls out; unheard. | Edward |
| **23:48** | **BGB arrives.** He does **not** know Green was there (🔒 D1). | BGB |
| 23:49 | BGB sees the open hatch and Green's **glove** and the **crumpled letter** on the gallery floor; hears Edward below; climbs down the fixed ladder. | BGB |
| **23:50** | BGB reaches Edward: alive, conscious, shivering. Edward says, hoarsely, **"Cold… please…"** (🔒 R14) and, a moment later, **"…Green… the clock…"** (ambiguous). Nothing more, no speech. A strand of BGB's scarf ends up **caught in Edward's fist** (R17). **BGB understands Edward needs help now** and **suspects Green** (🔒 Q2). | BGB, Edward |
| 23:51 | The **Night Guard,** on the plaza, hears faint calling from the tower, takes it for wind, and logs it (R17). | Night Guard |
| **23:51** | **BGB leaves Edward,** climbs to the gallery and **takes the glove and the letter without reading or examining them** (willful ignorance in action), buttoning them into his coat. | BGB |
| **23:53** | ⚠ **R13:** BGB **bolts the maintenance chute from the inside** (hiding Green's escape route). | BGB |
| **23:50–23:55** | **The five missing minutes.** BGB does **not** call for help; he conceals evidence first. Edward lies alone below for about five minutes. | BGB |
| **23:55** | BGB rings the **handbell.** Clockkeeper hears it on his way back. | BGB, Clockkeeper |
| 23:56 | BGB goes back down to Edward. | BGB |
| 23:58 | Clockkeeper arrives; finds BGB kneeling by Edward, **coat buttoned wrong over something,** bell rope still swinging. BGB says he "came as fast as he could." They cover Edward; they do not move him. Night Guard is sent for the Healer. A strand of mustard wool is **caught in Edward's clenched fist** (R17). | Clockkeeper, Night Guard |
| ~00:03 | Edward loses consciousness. | BGB, Clockkeeper |
| **~00:08** | **Edward dies.** | BGB, Clockkeeper |
| 00:14 | **Healer arrives.** Edward's **voice is hoarse: he had been calling out for some time** (R17). Estimate **11:55 PM – 12:15 AM** (wide: the cold makes body-temperature estimates unreliable). | Healer |
| After | BGB **hides the glove and the letter at home, behind the photograph's backing.** He tells no one about 11:48, Edward's words, the glove, or Green. | BGB |

**Medical fairness (🔒 Q4, C1):** the Healer says the fall was **potentially survivable**, that **earlier help might have improved his chances**, and that **cold, wet clothing and blood loss made him worse.** He **cannot** say Edward would have lived, and **no one can say whether help at 11:50 would have saved him.** **The story never claims the five-minute delay caused the death.** BGB's responsibility rests on **what he chose to do** (hide evidence, then call), not on a medical outcome. **Hypothermia is a contributing factor, not the sole cause** (see `STORY_AUDIT.md` §4, R3).

**Edward's hidden Final Record 🟡:** corrected register + confession, hidden in the **pendulum case.** Found only by deduction (Ch.7).

### 3.3 The great symmetry 🔒/🟡

| | Past (Edward) | Present (BGB) |
|---|---|---|
| Who is protected | The younger twin | Green (the elder) |
| Who is sacrificed | The elder twin's name | Edward's life |
| Justified as | "He's only a child." | "I have to protect him first." |
| Result | A name stolen | Evidence hidden, help delayed |

And the **mirror to the Ch.5 rescue:** the elder saved the younger in the flood; the younger now shelters the elder at Edward's expense. And **Green** protects BGB too: he fought Edward to stop the truth coming out. **Everyone is protecting someone. Nobody asks who is paying.**

---

## 4. The reveals ladder (what the player knows, and when)

| Stage | Player believes | Truth revealed |
|---|---|---|
| Prologue–Ch.1 | Edward fell at 11:47; a bear was on the stairs at 11:40. | Question: was it BGB? (He knows it wasn't.) |
| Ch.2 | Witnesses contradict each other. | Question: two places at once? |
| Ch.3 | **A second bear exists** (Green), likely the 11:40 bear. | Green is suspect #1. |
| Ch.4 | "I'm playing young BGB." | Misdirection holds. |
| Ch.5 | "I just saved my brother, he's a hero." | The rescuer ends the night **alone and unseen.** |
| Ch.6 | "The young bear I played was **Green.**" | The names were swapped. BGB found Edward alive at 11:48. |
| Ch.7 | "Edward did this to protect us." | Everyone's protection has victims. |
| Epilogue | — | The short flashback: the pen, the register, the line. |

**Narrator Rule 🟡:** Game narration, Notes-tab text, and system messages **never state a falsehood.** BGB's *spoken* lines may be evasive, but never a lie the player can't later see as an omission. The unreliable part of BGB is what he **doesn't say**, never what the game **tells** the player. (This is what keeps the twist fair.)

---

## 5. Chapter-by-chapter

Each chapter lists: **Setting · Playable · Goal · Beats · Evidence · Deductions · Reveals · Withheld · Closing question.**
`EV-xx` = evidence, `DD-xx` = deduction (defined in §7–8).

### PROLOGUE — The Photograph 🟡
- **Setting:** BGB's cottage at dawn → snowy Bell Village → foot of the Clocktower. · **Playable:** Yes (tutorial: walk, interact, parallax).
- **Beats:**
  1. ⚠ **R2:** BGB sits awake at dawn beside a worn framed **photograph of two cubs.** His thumb rests over one cub's ear, as if out of habit. (Faces readable; scarf knots and ear faintly visible but unremarked.) 🔒 **R13 plant (kept subtle):** the frame is an old, **deep keepsake frame** (Edward's gift) that **leans** on the shelf instead of hanging, a little thicker than a photograph needs. If the player examines it, BGB reads the front and **does not turn it over:** *"Leave it."* To a first-time player this reads as grief, the same as the thumb on the ear. It is **silence, never a lie.**
  2. **Nini** knocks, shaken. ⚠ BGB already knows Edward is dead (he was there); the village is gathering because the **Clockkeeper saw a scarf-wearing bear on the stairs at 11:40, before BGB's official arrival.** BGB's true café alibi clears him. (A false surprise here would break 🔒 Q6.)
  3. Walk through the village (cozy but muted: shutters closed, no bell). Short talk with Nini on the way (first dialogue choice, §9).
  4. BGB looks up at the **tower clock: 11:47.** Nobody wants to go in.
  5. First **Case File** opening: the village asks BGB, cleared by his alibi and trusted, to look into it because the Constable is snowed in.
- **Evidence:** EV-01 Photograph (home copy), EV-02 Edward's letter to BGB (BGB *does not mention it*; see Hard Rule 5).
- **Withheld:** BGB's own whereabouts after the café.
- **Closing question:** *Who killed Edward?*

> **Note on EV-02 🟡:** BGB owns Edward's letter to **him** but doesn't show it. It is in his coat in Ch.6. The **glove** and the letter **to Green** (EV-14, EV-27) are behind the photograph's backing (EV-31).

### CHAPTER 1 — The Clock That Stopped 🟡
- **Setting:** Clocktower interior (your mockup room: stairs, gears, red rope barrier, **hatch in the floor**, telescope, Clockkeeper). · **Playable:** Yes.
- **Goal:** Establish what happened in the tower.
- **Beats:** Meet **Clockkeeper**; investigate hotspots (stairs, hatch, gears, clock face, workbench). The Clockkeeper mentions in passing that **he sets Edward's pocket watch to the tower clock every morning** (🔒 Q8, planted here so the running watch is a trusted time base later). Clockkeeper's testimony (🔒 from your mockup): *"Last night, around 11:40. I saw a bear climbing these stairs. He was carrying something in his right hand."*
- **Evidence:** EV-03 Stopped clock (11:47). EV-04 Gear hatch (weak latch, left unlatched after the 22:00 winding). EV-06 Snow footprints on the stairs (one set up, wide-spaced). EV-07 Emergency handbell. **EV-28 The maintenance chute door is bolted from the inside,** although wide-stride footprints lead away from it outside (EV-15). The gallery floor holds **no glove and no letter.**
- **Deductions:** DD-01 *The clock stopped at 11:47 — that is not necessarily when Edward died* (starts as an open question; completed in Ch.6).
- **Reveals:** Edward fell *inside* the tower, not outside. There is exactly one bear on the stairs before BGB.
- **Withheld:** Nobody mentions two scarves.
- **Closing question:** *Who was the bear on the stairs?*

### CHAPTER 2 — Four Witnesses 🟡
- **Setting:** Café, Lantern Bridge, Archive steps, Clocktower. · **Playable:** Yes.
- **Goal:** Collect four statements and spot why they can't all be true.
- **The four 🟡:**
  1. **Clockkeeper** — 11:40, a bear, scarf, right hand.
  2. **Café Owner** — BGB was in the café until "a little before quarter to"; *looked like he was waiting for someone.*
  3. **Night Guard** — saw "Big Green Bear" cross **Lantern Bridge at 11:35**, hurrying.
  4. **Nini** — last saw Edward at 21:00; he sealed **two** letters.
- **Contradictions (player-discoverable):**
  - **C1:** Lantern Bridge 11:35 vs Café till ~11:42 — the same bear in two places.
  - **C2:** Clockkeeper's *right hand* vs the player's own observation that BGB uses his **left** (shown in animations and prompt icons, never stated).
  - **C3:** Nini's *two letters* vs only one known recipient.
- **Red herrings:** Café Owner owed Edward money. The Night Guard resents the tower's late-night noise. Nini's notebook has a torn page.
- **Evidence:** EV-08 Café tab (arrival time), EV-09 Night Guard's patrol log, EV-10 Nini's notebook (torn page, "red ledger moved?"), EV-11 Statements (4).
- **Deductions:** DD-02 *Two bears can't be one* (needs C1 + C2).
- **Withheld:** Why BGB looked "like he was waiting".
- **Closing question:** *Is there another bear?*

### CHAPTER 3 — The Other Bear 🟡
- **Setting:** Archive (record room, locked), the village's quiet edge, **Old Mill** (Green). · **Playable:** Yes.
- **Goal:** Find and confront the second bear.
- **Beats:**
  1. Villagers go quiet at a name (**Mara**, the old badger who lived through the flood, is the first to speak, bitterly): *"We don't talk about Green."* Several (Café Owner, **Mara**) give a **biased** account: the bear who "let the bell fail."
  2. Nini gives BGB the **archive key.** In the record room: the **flood-year register** (EV-12). Edward's drawer: a **second photograph** (EV-13): the same two cubs, different pose.
  3. Walk to the **Old Mill.** First meeting with **Green:** guarded; the **ear scar** is plainly visible in daylight (witnesses at night, at a distance, could not have seen it); scarf knot on the **right** (⬜ see art note). He is **right-handed** (lifts the kettle with his right). He denies being at the tower. He says: *"Ask yourself what you remember."* (Truth; the player will misread it as a taunt.)
  4. Back at the archive, BGB reaches for the photograph to compare…
- **Evidence:** EV-12 Flood-year register (ink of two ages, unread yet), EV-13 Second photograph, EV-15 Rear-tower footprints (wide stride; Old Mill).
- **Note:** Green's **right hand is bare** in the freezing cold. A link, not proof (the glove itself is hidden at BGB's home, EV-14/EV-31).
- **Deductions:** DD-03 *The bear on the stairs was right-handed, wore a mustard scarf, and was not BGB.* (Probable, not proven.)
- **Reveals:** A second bear. Green is the obvious suspect.
- **Withheld:** The swap. The ink. The scar's origin.
- **Transition:** Player clicks the photograph. **→ Flashback (§10).**
- **Closing question:** *Is Green guilty — or did the village decide that long ago?*

### CHAPTER 4 — The Name That Was Stolen 🟡 *(PAST, playable)*
- **Caption:** `23 YEARS EARLIER · BELL VILLAGE`
- **Setting:** Bell Village, warm and bustling; Archive; Clocktower. · **Playable:** Yes, as an **unnamed young bear.**
- **Rules for this chapter:**
  - **No one says either twin's name.** NPCs say "kiddo", "you two", "the twins", "little one." Edward says "Big brother" to the controlled child — consistent with the player's assumption (*Big Green Bear*) — and it is *literally true* (elder).
  - The player's **younger brother follows** as a companion (cannot be controlled).
  - **Hand cues (Hard Rule 4):** the controlled child picks things up, opens doors and pulls ropes **with his right hand.** Never emphasized, never narrated.
  - **Scarf cue:** Edward ties the child's scarf — **knot on the right.** Ties the brother's — **left.** A tiny, warm, believable scene.
- **Beats:** Morning errands with Edward; the village; the twins sneak into the tower; the **younger brother fiddles with the warning mechanism** (the player sees; may **try to stop him** — the sepia rewind fires: *"That's not how it happened."*); rain begins; dusk.
- **Past discoveries (persist as "Memories" in the Case File):** M-01 Edward ties the knots. M-02 The child's right-hand habit. M-03 The younger brother jams the bell. M-04 Edward's line: *"I can't tell you two apart without these."*
- **Reveals (to the player, unspoken):** Edward knew how to tell them apart — by scarf and hand.
- **End:** The bell **doesn't ring.** Water rising.

### CHAPTER 5 — A Good Person 🟡 *(PAST, playable)*
- **Setting:** The flooding village, tower stairwell, dawn aftermath. · **Playable:** Yes.
- **Beats:**
  1. **The rescue (set piece).** Wade through the flooded stairwell; the younger brother is trapped. Light puzzle-traversal (no combat). The elder tears his **left ear** on a beam (the scar; shown, not explained).
  2. Carry the brother out. Edward and villagers arrive. A villager (⬜) is lost to the water.
  3. Dawn. The village gathers; Edward, covered in mud, **carries the younger brother** while a crowd murmurs. **No one looks at the elder child.** He stands in the cold. A villager says, *"Edward's a good person. Thank goodness for Edward."*
  4. The elder watches Edward walk into the Archive. The door shuts. Fade.
- **Memories:** M-05 The ear is torn. M-06 The child is left alone. M-07 The crowd praises "the brave one" without knowing which child.
- **Player-facing (sepia rewind):** Choices that leave the brother (*"Go back for Edward"*) trigger the rewind.
- **Withheld (deliberately):** Names are never spoken. The swap itself (Edward at the register) is **held for the Epilogue flashback.**
- **Closing question:** *Who did Edward carry out?*

### CHAPTER 6 — Five Missing Minutes 🟡
- **Setting:** Archive → the Old Mill → Clocktower → BGB's own cottage → Healer's house. · **Playable:** Yes.
- **Opening:** BGB holds the photograph. He says, quietly: **"He always looked out for me."** (🔒) The player now has the **Memories.**
- **Part A — Who is who (Identity Board).** The player compares the twins using **Memories + present clues.** **No single clue unlocks DD-04;** three independent categories are required (§8). Result: DD-04 *The names were swapped.* The kid the player controlled in Ch.4–5 was **the present-day Green.**
- **Part B — Green (the case looks solved).** 🔒 reveal order, R15
  - The Investigate tab asks one question: **"Who caused Edward's fall?"** The **Responsibility Board** shows **one** column: *The fall.*
  - The player holds, **without the hidden items:** stair footprints (EV-06), chute footprints (EV-15), pendulum damage (EV-25), the Clockkeeper's 11:40 bear, the Night Guard's log (both hands gloved, a paper in the right hand at 23:35), Green's bare right hand (Ch.3).
  - At the Old Mill Green admits he was there, the struggle at the open hatch, Edward's fall, and that he **fled believing Edward dead** (EV-21). **DD-06 *Green caused the fall.*** The *Fall* column takes Green's name. The Case File stamps **SUSPECT IDENTIFIED.** **The player should feel the mystery is nearly solved.**
  - **The turn:** the player tells Green what the Healer found: Edward was **alive** after the fall. Green: *"Alive? Then who was with him?"*
- **Part C — The five missing minutes (the central revelation).** 🔒 R15, R16
  - **Two new columns appear on the Board,** both with an empty name slot: ***Delayed help*** and ***Hid the truth.*** The Investigate question becomes **"Who was with Edward before the Clockkeeper?"**
  - **No cutscene.** The player works through six conclusions, each tied to evidence (§7.1): **(1)** BGB found Edward alive, **(2)** Edward asked for help, **(3)** BGB saw the urgency, **(4)** BGB concealed the glove and letter, **(5)** BGB delayed the alarm, **(6)** BGB then concealed his own involvement.
  - **Where the clues sit:** the Café Owner and a **player-timed 6-minute walk** (arrival 11:48); the Night Guard's log (the **slow bear** at 11:46, **calling heard at 11:51**, **gloves and paper** at 23:35); the Clockkeeper's second statement; the **melt trail** to the chute; the **chute bolted from inside**; the **absent glove and letter**; the **mustard wool in Edward's fist**; the Healer's **hoarse-voice** finding.
  - **The turn inward:** the player is led to **BGB's own cottage** and the **photograph's backing** (EV-31): the glove and Edward's letter to "G." **The player has been steering the one who hid them.**
  - **"What I overlooked."** The **Notes** tab opens a re-read page that lists, in third person, the **moments the player passed over while trusting BGB** (§7.2). It is composed from the player's own earlier choices. It states only true things.
  - **Edward's last words** (EV-23, BGB's withheld memory) now **unlock as a Notes entry,** not a scene. They confirm what the evidence already showed.
  - The Timeline completes by the player placing cards: **11:50 BGB finds Edward alive · 11:51 takes the glove and letter, unread · 11:53 bolts the chute · 11:55 rings the bell.**
  - The Board's three columns each take the correct names (§13.1). **Cause of death stays *Undetermined;* no field allows "the delay."**
- **Part D — The confrontation.** Nini or the Clockkeeper asks BGB where he was between a quarter to twelve and midnight. The player chooses how BGB answers (§9). The truth is not forced here; the player now *knows.*
- **Deductions:** DD-04, DD-06 (Part B); DD-05 (with its six conclusions), DD-10, DD-11, DD-12 (Part C); DD-01 completed.
- **Closing question:** *Who had the chance to help, and didn't?*

### CHAPTER 7 — The Truth We Choose 🟡
- **Setting:** The Old Mill (private), then Clocktower plaza at dusk before the Remembrance Bell. · **Playable:** Yes (investigation + final accusation).
- **Goal:** Decide what goes into **The Final Record.**
- **Beats:**
  1. **Green** again, now knowing who was with Edward: his **motive** (EV-21b). He didn't mean to kill Edward; he wanted to stop the truth to protect his brother. *"You think I wanted the name back? He'd have taken your life apart."*
  2. **Finding Edward's Final Record** (pendulum case). Reading Edward's confession (Edward's voice, off-screen): the swap, the reason.
  3. **The accusation scene.** A formal, quiet gathering. The player presents evidence in sequence (Case File "Present" mode). Wrong evidence = soft feedback, not failure.
  4. **The choice.** Which truths to record (§11).
- **Closing question:** ***Who had the opportunity to do the right thing, but chose not to?*** (The series refrain *"Who are you really protecting?"* returns over the credits.)

### EPILOGUE — The Final Record 🟡
- **Short, non-playable past scene, < 2 minutes (🔒 Q7), painted stills with minimal motion, no spoken exposition.**
  - **The adults decide** (⚠ R11/R12). A small room at dawn after the flood: **Edward, Mara and others** around the open register. A grieving family's demand is heard off-screen. A pen is passed hand to hand; heads nod. The names are crossed out and **written in the wrong order.** The village seal comes down. *Compassion, signed by committee.*
  - **Consequences, not explanation:** the notice goes up on the village board; the villagers cheer the younger twin; the **elder twin** is seen leaving with a bundle, his scarf tails on the **right** shoulder, past the notice (⚠ R12: he is not shown overhearing). Edward watches from the window and does not stop him.
  - Closing image: the register, ink still wet.
- **Return to present:** the tower. **The hands move to 11:48**, the minute BGB arrived and help became possible. The ending (§11) plays.

---

### 5.1 The four R13 elements: purpose, plausibility, discovery (🔒)

| Element | Causal purpose (why it exists) | Physically plausible because | How the player finds or connects it | Why it is not an early spoiler |
|---|---|---|---|---|
| **Hiding place behind the photograph** | BGB **keeps without destroying:** he cannot burn Edward's last letter or his brother's glove. He chooses the one object only he handles. As the trusted investigator, nobody will search his home. | A deep **keepsake frame** (Edward's gift) with a **hinged backing board and two turn-buttons** and a **3 cm cavity.** One wool glove, flattened, plus a letter folded in thirds fit about 2.5 cm. It **leans on the shelf** rather than hangs because of the weight. He hid them after getting home, about 1 a.m. | Prologue: the frame leans and won't be turned over. Part C: the **missing items** prove someone took them; the **"What I overlooked"** page lists the frame; the cottage opens; the player turns it over. | In the Prologue *"Leave it."* reads as grief, like the thumb on the ear. The extra weight and depth read as sentiment. |
| **Chute bolt** | BGB **removes the sign of a second person leaving by the back,** so the scene reads as a lone accident and Green's route stays hidden (23:53). | The chute door has an **inside bolt** for winter. Green fled through it unbolted; BGB found it ajar in the draught and bolted it. | Ch.1: it is bolted **inside** while footprints lead **away** outside, a contradiction. Part C: a **melt puddle at the chute door;** the Clockkeeper: *"I never went near the back."* Only BGB was inside in those minutes. | In Ch.1 it is just a puzzle (*who bolted it after someone left?*). It points at no one. |
| **Night Guard's log detail** | An **independent record** that lets the player prove what existed at the scene (gloves, paper), when BGB arrived (slow bear 23:46), and that Edward called (23:51), **without BGB's testimony.** | The Night Guard patrols the plaza and bridge nightly and logs time and temperature. He is not inside the tower. | Collected in Ch.2; **re-read** in Part C: items logged, then absent. | It reads as a routine log in Ch.2. |
| **Prologue clue** | **Fairness:** plants the hiding place so the later discovery is earned. | As in the first row. | Prologue examine action; the **Notes** re-read links back. | Silent and optional; no line states anything false. |

## 6. Evidence master list 🟡

Fields: **ID · Name · Where · Chapter · Shows · Points to · Flag**. `RH` = red herring. `*` = ambiguous alone.

| ID | Name | Where | Ch | What it shows | Points to | Flag |
|---|---|---|---|---|---|---|
| EV-01 | Home photograph (**post-flood**) | BGB's cottage | P | Two cubs; the **scarred** cub is captioned "Green"; BGB's thumb is worn over that ear | The twins | |
| EV-02 | Edward's letter to BGB | BGB's coat | P/6 | "Come to the tower at midnight." | BGB's reason to be there | * |
| EV-03 | Stopped clock | Tower | 1 | Dial frozen at 11:47; **bent pendulum rod, sheared crutch pin** (see EV-25) | Time of fall, not death | |
| EV-04 | Gear hatch | Tower | 1 | Weak latch, **left unlatched after the 22:00 winding** (Clockkeeper's log), fresh scrape | Fall site; RH: Clockkeeper's carelessness | RH |
| EV-05 | Mustard wool | **In Edward's clenched fist** (found by the Healer, Ch.6) 🟡 R17 | 6 | A strand of mustard knit, snow-damp. Edward **grasped a scarf end** while down in the pit. | Someone close enough to be held was **in the pit** (Green stayed above) | * |
| EV-06 | Stair footprints | Tower | 1 | One set up, wide stride | Not BGB's stride | * |
| EV-07 | Handbell | Tower | 1 | Rung once; Clockkeeper heard it | Alarm at **11:55** | |
| EV-08 | Café record | Café | 2 | BGB seated 11:15–~11:42 | BGB's alibi for 11:40 | |
| EV-09 | Patrol log | Night Guard | 2 | "11:35 — B.G.B. crossed Lantern Bridge" | A bear on the bridge | * |
| EV-10 | Nini's notebook | Nini | 2 | "Red ledger moved?" Torn page | Edward's hidden record | RH |
| EV-11 | Four statements | Witnesses | 2 | See §2 | Contradictions C1–C3 | |
| EV-12 | Flood-year register | Archive | 3 | Names in **two different inks**; the **flood hero entry** reads "Big Green Bear, age 7" in newer ink | Alteration | |
| EV-13 | Second photograph (**pre-flood**) | Edward's drawer | 3 | Same cubs, **no scar**, captioned with **birth names**; **knot sides** visible (right = captioned "Big Green Bear") | Swap | * |
| EV-14 | Right glove | **BGB's hiding place (EV-31)** | 6 | Wool, right-hand, snow-damp. Night Guard's log: Green wore **both** gloves at 23:35. | Green was there; **BGB removed it** | * |
| EV-15 | Rear footprints | Tower rear | 3 | Wide stride toward Old Mill | Green fled by the chute | * |
| EV-16 | Green's statement | Old Mill | 3 | "Ask yourself what you remember." | The swap | |
| EV-17 | Villager rumors | Village | 3 | Biased: "He let the bell fail." | Blame story | RH |
| M-01…M-07 | **Memories** | Past | 4–5 | Knots, right hand, bell jam, scar, abandonment | Identity | |
| EV-18 | Healer's report | Healer | 6 | Pelvic/hip fracture, rib fractures, internal bleeding; **cold and wet worsened shock**; fall potentially survivable; **earlier help might have improved chances**; **alive for at least fifteen minutes after the fall;** **voice hoarse: he had been calling out** (R17); window **11:55 PM – 12:15 AM.** **Cannot say help would have saved him.** | Weight of the five minutes, **never certainty;** Edward was alive and calling | |
| EV-19 | Snow-melt trail | Tower | 6 | **Arrival ~11:48:** puddles at the **pit ladder,** at the **gallery by the hatch,** and at the **chute door** | BGB moved between them while Edward lay below | |
| EV-20 | Clockkeeper (second statement) | Tower | 6 | BGB said he arrived "just as the bell rang"; found kneeling, **coat buttoned wrong over something**; handbell heard at 11:55 | Concealment; the five minutes | |
| EV-21 | Green's account (Ch.6B) | Old Mill | 6 | He was there; the struggle at the hatch; Edward fell; he **fled believing him dead** | Green caused the fall | |
| EV-21b | Green's motive (Ch.7) | Mill / tower | 7 | He wanted to stop the truth to protect BGB | Green's reason | |
| EV-22 | Edward's Final Record | Pendulum case | 7 | Corrected register + confession | The swap & why | |
| EV-23 | Edward's last words | BGB's withheld memory (Notes entry) | 6 | "Cold… please…" then "…Green… the clock…" Not a scene. It **confirms** what EV-05, EV-18 and EV-29 already showed. | BGB understood the urgency | |
| **EV-24** | **Edward's pocket watch** ⚠ R4 | Wheel pit / Healer | 6 | 🟡 **Keeps running**, crystal **cracked**, case dented (landed on his left hip). 🔒 Synced to the tower clock every morning by the Clockkeeper (Q8; established in Ch.1). A reliable second time base. | Fall mechanism; time base for the timeline; **not** a time-of-death clock | |
| **EV-25** | Pendulum damage 🟡 | Wheel pit | 1/6 | Bent rod, sheared crutch pin, **tuft of Edward's quills**, vest thread, blood smear | How the clock stopped; fall site | |
| **EV-26** | Pit conditions 🟡 | Wheel pit; Night Guard's log | 6 | Meltwater puddle, ice-blocked drain, frost on the stones, **Edward's vest and trousers soaked**; log shows **−9 °C** | Exposure | |
| **EV-27** | Edward's letter to Green 🟡 R5 | **BGB's hiding place (EV-31)** | 6 | Crumpled, in Edward's hand, addressed "G." Night Guard's log: Green carried a paper in his **right** hand | The "something in his right hand"; Nini's second letter; **BGB removed it** | * |
| **EV-28** | Chute door bolted from inside 🟡 R13 | Tower | 1 | Bolted inside; Green's footprints lead **away** from it outside | Someone bolted it **after** Green left | * |
| **EV-29** | Night Guard's patrol log (full) 🔒 R13 | Night Guard | 2 | **23:35** bear, **both hands gloved, paper in right hand**; **23:46** a second bear on the plaza, **slow, unhurried**; **23:51** "calling from the tower? wind?" (R17); −9 °C | Green's gloves and letter; BGB's arrival; Edward was **calling for help** | * |
| **EV-31** | Hiding place 🔒 R13 | BGB's cottage: **behind the photograph's backing** | 6 | A deep keepsake frame with a hinged backing board and two brass turn-buttons; a **3 cm cavity** holds **one wool glove, flattened, and a letter folded in thirds.** It **leans on the shelf,** never hung. | **BGB concealed evidence** | |

**Red herrings (summary):** Café Owner's debt (EV-08 aside), Night Guard's grudge, Nini's torn page (EV-10 — she tore it because it held a private poem), the missing right glove (EV-14 — Green *is* missing one, but so is the Night Guard), mustard thread (EV-05 matches both scarves), village rumor (EV-17). All **resolve by the end**; none are cheats.

---

## 7. Deduction master list 🟡

| ID | Deduction | Ch | Requires (any independent combination) | Wrong-answer feedback |
|---|---|---|---|---|
| DD-01 | **11:47 is the fall and the clock failure, not the time of death.** | 1→6 | EV-03 + EV-25 + EV-24 + EV-18 | *"The clock tells us when it broke, not when he stopped."* |
| DD-02 | **Two bears were involved.** | 2 | C1 (EV-08 vs EV-09) + C2 | *"One bear can't be in two places."* |
| DD-03 | **The 11:40 bear was right-handed, not BGB.** | 3 | Clockkeeper + EV-06 + EV-29 (paper in his right hand) + EV-16 | *"That fits a stranger — or an old rumor."* |
| DD-04 | **The twins' names were swapped.** | 6 | ≥3 of: **Physical** (M-01, M-02, M-05), **Documentary** (EV-12), **Photographic** (EV-13), **Testimonial** (EV-16, Clockkeeper 2) | *"Something fits, but not enough yet."* |
| DD-05 | **BGB found Edward alive at 11:50, hid evidence connecting Green, and did not call for help until 11:55.** *(A chain of six conclusions, §7.1.)* | 6 (Part C) | EV-08 + player-timed walk + EV-29 + EV-19 + EV-28 + EV-20 + EV-07 + EV-05 + EV-18 + **EV-31** (EV-23 only confirms) | *"Check where the water drips."* |
| DD-06 | **Green caused the fall (and believed Edward dead).** | 6 (Part B) | EV-04 + EV-06 + EV-15 + EV-25 + EV-29 + EV-21 (**not** EV-14/EV-27) | *"He was there. But how?"* |
| DD-07 | **Edward altered the register.** | 7 | EV-12 + M-04 + EV-22 | *"Someone with a steady hand and a key."* |
| DD-08 | **Green fought to protect BGB.** | 7 | EV-21 + EV-22 | *"Look at why he did it."* |
| DD-10 | **Edward lay injured, wet and cold; the stopped tower clock and the running watch together show that no clock fixes his time of death.** | 6 | EV-26 + EV-18 + EV-03 + EV-24 | *"The clock tells you when it broke, not when he died."* |
| DD-09 | **Edward hid the truth in the clock.** | 7 | EV-23 + EV-10 | *"What clock is he talking about?"* |
| DD-11 | **No one can say whether help at 11:50 would have saved Edward.** | 6 | EV-18 + EV-26 + EV-24 | *"Don't write what no one can know."* |
| DD-12 | **Green is responsible for the fall. BGB is responsible for hiding evidence and delaying help.** | 6–7 | DD-06 + DD-05 + DD-11 | Wrong pairings (e.g. BGB "caused the fall", Green "delayed help") are rejected with: *"Look at what each of them did."* |

**Wrong deductions** show a gentle note, never lock progress. **Hidden info is never revealed** by a wrong guess.

---

### 7.1 Fair-play chain: the six conclusions about BGB (🔒)

Every row has **at least two independent sources,** and **none relies only on BGB's confession.** Everything is in the player's hands **before** the final accusation (Ch.7).

| # | Conclusion | Evidence (all available by the end of Part C) | Independent of a confession? |
|---|---|---|---|
| **1** | **BGB found Edward alive.** | Edward was **alive when the Clockkeeper arrived at 11:58** (Healer: alive at least fifteen minutes after the fall), so he was alive at 11:50. **EV-05:** BGB's scarf wool in Edward's fist (the pit was not reachable from where Green stood). **EV-19** melt puddles at the pit ladder. | Yes |
| **2** | **Edward asked for help.** | **EV-18:** hoarse voice, he had been calling out. **EV-29:** the Night Guard logged calling from the tower at 23:51. **EV-05:** he **held on** to a scarf. (EV-23 only confirms the words.) | Yes |
| **3** | **BGB recognized the urgency.** | **EV-18:** injuries obvious to any bystander (bleeding, could not move, shaking with cold). **EV-07:** BGB himself **rang the alarm,** so he judged it urgent. **EV-05:** a man held his scarf. | Yes |
| **4** | **BGB concealed the glove and the letter.** | **EV-29:** Green wore both gloves and carried a paper at 23:35. **EV-27 / EV-14 absent** from the scene. **Nini:** two letters sealed. **EV-20:** coat buttoned wrong over something. **EV-31:** both found behind the photograph. | Yes |
| **5** | **BGB delayed the alarm** (11:50 to 11:55). | **Arrival 11:48:** EV-08 (left the café ~11:42) + the **player-timed 6-minute walk** + EV-29 (slow bear 23:46). **Alarm 11:55:** EV-07 + Clockkeeper. **EV-19** melt trail (pit, gallery, chute) fills the gap. **EV-28** the chute bolted from inside. | Yes |
| **6** | **BGB then concealed his own involvement.** | **EV-20:** he said he arrived "just as the bell rang." That contradicts 1 and 5. His **EV-02** letter never shown (**Nini's two letters**). He told no one about Green. **EV-31** hidden at home. | Yes |

### 7.2 "What I overlooked": the player's own re-read (🟡 R18)

After the five minutes are reconstructed, the **Notes** tab adds a re-read page. Each line is **true,** third-person, and **links to the moment** the player passed over:

1. The **photograph frame** that BGB would not turn over (Prologue).
2. BGB's **café alibi:** true, and he left at **11:42** (Ch.2).
3. **Nini's two letters,** and only one known recipient (Ch.2).
4. The **Night Guard's log:** gloves, a paper, a slow bear, a call in the wind (Ch.2).
5. The **chute bolted** from inside (Ch.1).
6. BGB's own words to the Clockkeeper: *"I came as fast as I could."* (Ch.6)

The reveal exposes **what the player did not look at because they trusted him.**

## 8. Fair-play matrix — the twin identity clues

The swap (DD-04) is declared **only** when the player has linked ≥3 independent categories.

| Clue | Where first planted | Category | Alone is it conclusive? |
|---|---|---|---|
| **Handedness** (child uses right) | Ch.4 flashback | Physical | **No** — right-handed bears are common. |
| **Scarf knot side** (Edward ties right/left) | Ch.4 flashback (M-01) | Physical | **No** — scarves can be re-tied. |
| **Ear scar** (left ear) | Ch.5 flashback (M-05); visible on Green in Ch.3 | Physical | **No** — it proves the controlled child *became* the scarred bear, not which **name** he was born with. |
| **Photograph caption vs knots** | Ch.3 (EV-13) | Photographic | **No** — captions can be wrong. |
| **Register ink** | Ch.3 (EV-12) | Documentary | **No** — ink changes. |
| **Clockkeeper's second statement** | Ch.6 | Testimonial | **No** — memory. |
| **Movement/speed, expression** | Throughout | Supporting only | Never counts alone. |

**Red herring inside the clues 🟡:** BGB sometimes **adjusts his scarf with his right hand** when nervous (a habit), and the scarf is occasionally flipped by wind; a hasty player may mis-assign. Only combined evidence resolves it.

**Why the reveal isn't "gotcha":** by Ch.5 the player has *seen* the child use the right hand, have a right-hand knot, and tear his left ear. By Ch.3 they have *seen* BGB use the left hand in play. The brain does the rest.

---

## 9. Dialogue structure

### 9.1 Data model 🟡
- **Node types:** `Line`, `Choice`, `Condition`, `Event`, `Investigate` (opens hotspot mode), `End`.
- **IDs:** `<place>.<speaker>.<topic>.<nnn>` e.g. `bv.nini.intro.001`, `tower.clockkeeper.stairs.003`. These are the localization keys (EN + KO).
- **Flags:** `lowercase.dot.case`, e.g. `met.nini`, `ev.has.EV-06`, `dd.done.DD-02`, `ch.complete.2`, `past.m.M-01`.
- **Conditions:** `HasEvidence`, `Interviewed`, `ChapterDone`, `ContradictionFound`, `FlashbackUnlocked`, `DeductionDone`.
- **Portrait expressions:** `neutral, happy, worried, surprised, thinking, sad, guarded` (Nini's art has several of these).

### 9.2 BGB's response tags 🟡
Dialogue choices carry a hidden tag used only for **ending weight** (never shown):
`HONEST` · `EVASIVE` · `DEFLECT` · `PROTECTIVE` (about Green) · `SELF-PROTECTIVE`.
A hidden **Candor** counter never gates a deduction; it only tints Ch.7 and the ending.

### 9.3 Sample lines 🟡 (EN / KO) — style guide
> **Clockkeeper** (🔒 from mockup) — *tower.clockkeeper.stairs.001*
> EN: "Last night, around 11:40. I saw a bear climbing these stairs. He was carrying something in his right hand."
> KO: "어젯밤, 11시 40분쯤이었어요. 곰이 이 계단을 올라가는 걸 봤습니다. 오른손에 무언가를 들고 있었죠."
> Choices: **[계단을 살펴본다 / Examine the stairs]** · **[다른 질문을 한다 / Ask something else]** (🔒 from mockup)

> **Nini** — *bv.nini.intro.001*
> EN: "Edward never missed the midnight bell. Never."
> KO: "에드워드 아저씨는 자정 종을 한 번도 놓친 적이 없어요. 한 번도요."

> **BGB** — *ch6.bgb.photo.001* (🔒 line)
> EN: "He always looked out for me."
> KO: "그는 언제나 나를 챙겨줬어."

> **Green** — *mill.green.first.004* 🟡
> EN: "Ask yourself what you remember."
> KO: "네가 뭘 기억하는지, 너 자신한테 물어봐."

> *Style:* short sentences, warm, a little formal. No slang. Every character has one verbal habit (Clockkeeper: "Mm." before facts; Nini: finishes sentences on a rising note; Green: answers questions with questions).

### 9.4 Interview structure
Each witness has: **Free statement → 2–3 pressure topics → one contradiction response.** Pressure topics unlock only after the player owns the relevant evidence. Re-asking never lowers any score.

---

## 10. Flashback system — transitions

### 10.1 Present → Past (Ch.3 → Ch.4)
1. In the Archive, the player clicks **photograph EV-13**.
2. Screen slowly darkens (no cut). Distant **rain** begins.
3. The cubs in the photo **move** (a subtle, painted loop).
4. Caption: **`23 YEARS EARLIER · BELL VILLAGE`.**
5. Color grading: warm, slightly desaturated, soft vignette; old-paper grain overlay. Bell Village looks cozier, then colder as the flood nears.

### 10.2 Past rules
- **The child is unnamed.** The UI shows "—" (an em-dash) as the speaker label for him. Subtitles never write his name.
- **Fixed past.** Choices *look* free. If a choice **contradicts** established events (e.g., "Don't follow Edward"), the **sepia rewind** triggers: image desaturates to sepia, reverses ~3 seconds with a tape-like wobble, and a soft line appears: *"That's not how it happened."* The player retries. No penalty.
- **Memories** (M-01…M-07) are collectible and persist to the Case File.

### 10.3 Past → Present (end of Ch.5 → Ch.6)
1. The elder child stands alone in the cold. A single slow bell-tone *that never rang that night.*
2. Fade to dark. Present-day rain on a window.
3. BGB, holding the photograph: **"He always looked out for me."** (🔒)
4. The player — and only now — can **open the Identity Board.**

### 10.4 The final short flashback (Epilogue)
Non-playable. Warm light turning cold. No sepia (so the player understands it's *not* a choice). Ends on the swapped-name line. Then the clock moves to **11:48.**

---

## 11. Endings 🟡

Determined by **three variables:** what is recorded (R), whether the swap is told (N), and who confesses (C).

| # | Ending | Condition | What happens | Tone |
|---|---|---|---|---|
| **E1** | **The Final Record** *(true / intended)* | DD-01…12 solved; BGB confesses the **concealment, the delay, and the swap;** Green confesses the fall | Names restored. The Record states what each did and says plainly that **no one can know whether help would have saved Edward.** The tower clock is restarted at **11:48.** Nini writes the record. | Bittersweet, honest |
| **E2** | **The Hero's Silence** | Cover-up: record says *accident*; BGB stays the hero | Village mourns calmly. Green returns to the Mill. The clock is repaired; the bell rings; a stain on the stair stays. | Cozy-hollow, unsettling |
| **E3** | **The Wrong Bear** | BGB names Green as sole culprit and **omits his own concealment and delay** | Green is taken. The register is "corrected" in the village's favor. BGB's scarf knot is the last frame. | Dark |
| **E4** | **The Burned Page** | BGB burns Edward's record | Truth lost. Names stay swapped. Nini keeps one page (hint of a sequel). | Ambiguous |

**Design rules for endings 🟡**
- No ending says "you were right." Even E1 shows cost.
- **Each ending replays one image from the Prologue** (the photograph) changed.
- Ending credits show the **stamp** matching the chosen record.
- Recommended **default replay path:** E1 requires doing the right thing *at cost*; E2 is the easiest.

---

## 12. Hard Rules (do not break) 🟡

1. **Edward survived the fall at 11:47** and died at about 00:08. 11:47 is only the fall + clock failure. **No clock establishes the time of death.**
2. **The elder twin is right-handed; the younger is left-handed. Always.** (See Rule 6 for how this is *drawn*.)
3. **No one in the flashbacks says either twin's name.**
4. **The controlled child uses his right hand for all interactions in Ch.4–5.** No exceptions.
5. **BGB never lies in narration.** He may withhold. The Notes tab is third-person observation.
6. **Handedness art rule:** do **not** `flipX` a bear sprite to change facing if hand is meaningful. Handedness is read from **what is held and which limb acts**, authored as separate poses or from a non-mirrored layer. A flipped sprite *swaps* apparent handedness — this would silently break the main clue.
7. **11:47** is the stopped tower clock (hour hand just short of 12, minute hand on 47). **11:48** is the *Epilogue* time: the first minute in which help was possible.
8. **No single clue** resolves the identity.
9. **The past cannot be changed.**
10. **Green is not "cleared."** He caused the fall (and believed Edward dead). **BGB is not "condemned."** He did not cause it, but he **knew Edward was alive** and chose to protect his brother first. Both sit in the gray.
11. **No mirrored sprites as final art.** Scarf tails and scar are checked per view (§12.1).
12. **The story never states or implies the five-minute delay medically caused Edward's death.** BGB's responsibility is established by **what he did:** he found Edward alive, knew he needed help, **hid evidence first,** then called. The Healer cannot establish more.
13. **Green is responsible for the fall only;** he believed Edward dead and fled. **BGB is not responsible for the fall.**
14. **Reveal order:** the player discovers Green's involvement **before** BGB's five minutes. The five minutes is the final, most significant reveal.
15. **BGB's partial ignorance never excuses him.** He knows Edward is alive and needs help, and he knows he is hiding evidence; the concealment is a **conscious choice.** (🔒 Q2)
16. **No flashback, voice-over or cutscene of 11:50 to 11:55.** The player reconstructs it from evidence. (🔒 R16)
17. **Edward's lines stay minimal:** "Cold… please…" then the ambiguous words. No speech. (🔒 R14)

---

### 12.1 Scarf and scar — view matrix (🔒 D13 + scar) for the art pass

Tails hang from the shoulder down the **front** of the chest. Draw each view separately; **never mirror.** "Left/right" = the **character's** left/right.

| View | BGB (tails on **his left**) | Green (tails on **his right**) | Green's scar (**left ear**) |
|---|---|---|---|
| 1 Left profile (we see his left side) | Tails **visible** | Tails **hidden** (far side); band only | **Visible** |
| 2 Left ¾ | Tails **visible** | Tail tip may peek | **Visible** |
| 3 Front | Tails on the **viewer's right** | Tails on the **viewer's left** | On the **viewer's right** ear |
| 4 Back | Scarf band only | Scarf band only | On the **viewer's left** ear |
| 5 Right ¾ | Tail tip may peek | Tails **visible** | May peek (far ear) |
| 6 Right profile (we see his right side) | Tails **hidden**; band only | Tails **visible** | **Hidden** |

Scar style: old, healed, **pinkish-grey**, a few thin raised lines; no red, no crust. Same ear shape and size as BGB's.

---

## 13. Timeline-card model (for the Timeline tab) 🟡

Every card has a **type**, which the player must learn to separate:

| Type | Meaning | Example |
|---|---|---|
| **W** Witness | When someone *saw* it | "Clockkeeper saw a bear at 11:40" |
| **E** Event | When it *happened* | "Edward falls at 11:47" |
| **C** Clock | What the clock *displays* | "Clock stops at 11:47" |
| **D** Death | Estimated time of death | "Healer: 11:55 PM – 12:15 AM" |
| **P** Pocket watch ⚠ R4 | A reading of Edward's **running** watch used as a time base | "Watch reads 00:14 when the Healer arrives" |

Typical player mistake: placing "E" at 11:47 and "D" at 11:47. The game gives contextual feedback: *"That's when it broke, not when he stopped."*

---

### 13.1 The Responsibility Board (🔒 R15)

A Case File board with **three columns.** Each column is a **separate question** with its own name slot and its own evidence. **Names are placed by the player;** wrong placements get feedback, never a block.

| Column | Appears | Question | Correct entry | Basis |
|---|---|---|---|---|
| **1 The fall** | Part B | Who **physically caused** Edward's fall? | **Green** (and he fled believing Edward dead) | DD-06 |
| **2 Delayed help** | After Green is identified (Part C) | Who **had the chance to help and waited?** | **BGB,** 11:50 to 11:55 | Conclusions 1 to 3, 5 |
| **3 Hid the truth** | After Green is identified (Part C) | Who **concealed evidence and the truth?** | **BGB:** glove, letter, chute, testimony. *(Green's flight and silence are noted, not weighed the same.)* | Conclusions 4, 6 |

- Under the board, **Cause of death** is fixed at ***Undetermined: injuries, blood loss and cold. No one can say whether help would have saved him.*** **There is no way to assign the delay as the cause** (DD-11).
- Beside BGB's name: ***He did not know everything. He knew Edward needed help.*** (His partial ignorance never excuses him.)
- Wrong pairings (e.g., BGB under *The fall,* Green under *Delayed help*) are rejected with: *"Look at what each of them did."* (DD-12)
- The Board is **evidence-driven,** with **no narrator explaining it** and **no cutscene.**

## 14. Decisions

**Legend:** 🔒 locked by you · ⬜ open (recommendation shown; **not decided**). Full reasoning for R-items: `STORY_AUDIT.md` §9.

### 14.1 Original decisions

| # | Decision | Status | Note |
|---|---|---|---|
| **D1** | BGB's knowledge of the swap | 🔒 | See §0.1 (D1/Q3, Q2). |
| **D2** | Edward = guardian and the one who did the swap | ⬜ ⚠ | Now a **group decision** led by Edward (Q7 🔒 "adults"). See R11. |
| **D3** | The younger twin jammed the warning bell | ⬜ | Works only if BGB does **not** know his tampering caused the failure (Q3: he doesn't know the full circumstances). |
| **D4** | A villager died in the flood | ⬜ | **Now needed** for the adults' decision to be believable (R11). Recommended: yes. |
| **D5** | Green caused the fall in a struggle (not deliberate murder) | ⬜ | Consistent with your central moral. |
| **D6** | Green fought to protect BGB | ⬜ | Consistent with Q3 (BGB doesn't know Green confronted Edward). |
| **D7** | Epilogue flashback | 🔒 reworked | Now the **adults' decision** (Q7). Content details R11, R12. |
| **D8** | Endings E1–E4 | ⬜ ⚠ | E1 must require BGB to confess the **delay** (he already knew the swap). Reword once D8 is approved. |
| **D9** | Café Owner (dog), Night Guard (owl), Mara (badger) | ⬜ | Designs yours, roles mine. |
| **D10** | Repeated 11:47 on flood night | 🔒 removed | |
| **D11** | Elder = "Big Green Bear" by birth name | ⬜ | |
| **D12** | Names for Edward (surname), Clockkeeper, Café Owner, Night Guard | ⬜ | |
| **D13** | Scarves | 🔒 | Per-view redraw for **both** twins. |
| **D14** | Pocket watch | ⬜ | The 11:52 stop is withdrawn. Recommendation: keeps running (R4). |

### 14.2 Questions Q1–Q8: outcome

| Q | Outcome |
|---|---|
| Q1 | **Withdrawn** (no second impact). |
| Q2 | 🔒 Approved. |
| Q3 | 🔒 Modified: BGB knowingly preserved the false identity; has concealed evidence/testimony. |
| Q4 | 🔒 Modified: potentially survivable; earlier help *might* have helped; window 11:55 PM – 12:15 AM. |
| Q5 | 🔒 Approved, with a consistency requirement (R9). |
| Q6 | 🔒 Approved. |
| Q7 | 🔒 Modified: adults' deliberate decision; < 2 min; consequences over exposition. |
| Q8 | 🔒 Approved. |

### 14.3 Remaining approvals (from the final logic audit)

| # | Needs your yes/no | My recommendation |
|---|---|---|
| **R1** | Why the Clockkeeper doesn't hear the fall | Edward sends him on an errand at 23:41 (chapel store, ≈ 15 min). |
| **R2** | Prologue: BGB can't learn of the death from Nini | He already knows; the village gathers over the 11:40 scarf-bear. |
| **R3** | Hypothermia vs short timeline; **C1:** cold is a contributing factor; **responsibility rests on BGB's actions, not a medical claim** | Timeline **T3** with the C1 sequence (11:50 discovery → 11:51 concealment → 11:53 chute → 11:55 alarm). |
| **R4** | Pocket watch | It does **not** stop; reference clock + cracked crystal. |
| **R5** | "Something in the right hand" | Edward's letter to Green; **now taken by BGB** and found in EV-31. The Night Guard's log supplies the right-hand clue. |
| **R6** | What BGB "previously concealed" (Q3) **and tonight (C1)** | Silence as a child; hid contact with Green and the pre-flood photo; **tonight: pockets the glove and letter unread, bolts the chute, hides them at home,** withholds arrival time and Edward's words. |
| **R7** | Did Green see Edward alive? | No: he believed him dead. |
| **R8** | Why Edward reveals now | Nini's two-ink discovery + the Remembrance Bell + conscience. |
| **R9** | Elders' knowledge tiers (Q5) | Tier A in the room · Tier B official story · Tier C newcomers. |
| **R10** | DD-05 rests on one witness | Night Guard logs a slow bear on the plaza at 23:46. |
| **R11** | Why adults blame an innocent child | A villager died; the family demanded accountability; they chose the child they could afford to lose. |
| **R12** | Does the elder twin overhear? | Not shown; only the consequence. |
| **R13** | **🔒 Approved, all four elements** (hiding place, chute bolt, Night Guard's log, Prologue clue). Each has a causal purpose and a discovery path (§5.1). | Done. |
| **R14** | **🔒 Approved.** "Cold… please…" first, then the ambiguous words. Minimal, not melodramatic. | Done. |
| **R15** | **🔒 Approved.** Changing question + Responsibility Board (three separate columns; no "delay" as cause of death). | Done (§13.1). |
| **R16** | **🔒 Approved.** No flashback of 11:50 to 11:55; the player reconstructs it. | Done. |
| **R17** | 🟡 **Three corroborating clues** that Edward asked for help, independent of BGB: **(a)** the Healer finds his voice hoarse, he had been calling out; **(b)** the Night Guard's log notes calling at 23:51; **(c)** BGB's scarf wool caught in Edward's fist. | Yes. They make conclusions 1 to 3 independent of any confession. |
| **R18** | 🟡 **"What I overlooked"** re-read page in Notes (§7.2), built from the player's own earlier moments, all true. | Yes. It delivers the "what the player overlooked" requirement. |

---

## 15. What's still ⬜ (do not invent in code or art)

- **Names** of Edward (surname), the Clockkeeper, Café Owner, Night Guard, Healer. (Species/designs are fixed by your character sheet.)
- The **flood casualty** (D4) and the **age** of the twins' parents.
- **Young twins** (23 years earlier), **Healer** and any extra villagers: no art exists yet. Green's **right glove** (EV-14) is not drawn on his sheet.
- Exact **timer** for the Remembrance Bell ceremony.
- The **Constable**.
- Final **music/ambience** cues.

---

## 16. Glossary (EN → KO)

| EN | KO |
|---|---|
| Bell Village | 벨 마을 |
| Clockkeeper | 시계지기 |
| Clocktower | 시계탑 |
| The Final Record | 마지막 기록 |
| Case File | 사건 파일 |
| Evidence | 증거 |
| Timeline | 타임라인 |
| Identity Board | 신원 보드 |
| Memory | 기억 |
| Deduction | 추리 |
| 23 Years Earlier | 23년 전 |
| Who are you really protecting? | 너는 정말 누구를 지키고 있는가? |

---

*Next step after approval of §14:* freeze v1.0, then Step B (Investigate-screen implementation) against the storybook reference and the usable assets in `ASSET_AUDIT.md`.
