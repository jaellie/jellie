# Canon decisions (confirmed by the author)

Single source of truth for choices that code, art prompts and evidence text must follow.
Anything not listed here is still TBD (see "Open").

## Characters
- **Edward** is an elderly **hedgehog**, the clock tower's archivist (the victim).
- **Big Green Bear** and **Green** are twins drawn from ONE sprite set. Green = the same drawing mirrored.

## Left / right convention
- LEFT / RIGHT always mean **the side seen on the screen**, never the character's anatomy. Evidence art shows characters facing the viewer.
- **Big Green Bear** uses the hand on the **RIGHT side of the image**; scarf tail hangs on the **RIGHT side of the image**.
- **Green** uses the hand on the **LEFT side of the image**; scarf tail on the **LEFT side of the image**.

## Identity clues
- **Ear scar: GREEN has it**, on the ear on the **LEFT side of the image**.
  Implementation: overlay applied on the final (already mirrored) Green sprite, so it always appears on the screen-left ear.
  Consequence: in the mirror window, a reflected Big Green Bear (no scar) must NOT show a scar; a reflected Green shows it on the opposite side (physically correct).
- Smile: Big Green Bear closes his eyes when smiling; Green keeps them slightly open. (Delivered `bear_smile_openeyes` = Green's smile.)

## Resolved art decisions
- **The bell is GREEN** (jade green). `bear_hold_bell.png` was recolored from brass (`tools/harmonize_bear_colors.py`).
- All bear sprites share one fur colour (~RGB 95,130,88) and one scarf colour (~RGB 197,167,102); the script re-applies this to new sprites.

## Story (see STORY_BIBLE.md for details)
- **Motive: C**, hiding the identity plus an old wound; not a planned murder, Green is not a plain villain.
- **Clock:** 11:47 = blackout + clock stops (electric movement, no tampering). **Real death = 11:52.** Edward's pocket watch stops at 11:52 from the impact.
- **Twins:** the bear the player controls (BGB) was born as "Green"; the bear now called Green was born "Big Green Bear". Records were swapped after the flood.
- **Core of the story:** what BGB knew and hid after the death. Responsibilities are separate: (1) the fall = Green, (2) the delay in calling help = BGB, (3) concealment = both. Cause of death is the fall; the delay is never stated as the cause.
- **Chapter 1:** show only blackout, cry, clock stop at 11:47. Edward's body is found later.

## Open (not decided yet)
1. ~~Time of death vs stopped clock~~ RESOLVED (11:47 / 11:52).
2. ~~Who is "Big Green Bear"~~ RESOLVED (see Story).
3. Relationship to Season 1 (before / after / separate).
4. Physical explanation of the mirror "reflection that was not a reflection".
5. ~~Motive~~ RESOLVED (C).
6. Supporting cast: Clockkeeper = old gray cat (70%), Café owner = golden dog (90%), Night guard = tall barn owl (105%). Species chosen by Claude, approved by the user as long as instantly recognizable.
7. Witness positions 11:47-11:52, delay length, when BGB learned the swap, ear-scar side (screen-left vs anatomical), see STORY_BIBLE.md section 8.
