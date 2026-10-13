# Big Green Bear's Adventure 2: Unity project (Investigate screen milestone)

**Status: written but NOT yet opened in Unity.** No Unity Editor exists in the cloud session that produced this, so
nothing here has been compiled or run. The C# files pass a syntax check only. Use `IMPLEMENTATION_STATUS.md` for the exact state.

## What this is
A Unity 2D URP project skeleton plus a **one-click builder** for the first playable screen: Bell Village with four parallax layers,
BGB, Nini and Oliver, lamp lighting, a fading interaction prompt, the always-visible category panel, a large case plate, a centred
dialogue box with choices, evidence collection and a Case File overlay. It mirrors the web prototype in `prototype/bell_village_web`,
which **was** tested in a browser.

## Open it (beginner steps)
1. Install **Unity Hub** and Unity **2022.3 LTS** with the *Windows Build Support* if you need it. (`ProjectSettings/ProjectVersion.txt`
   says 2022.3.62f1. If you have another 2022.3.x, Unity offers to continue with it: choose that.)
2. In Unity Hub: **Add > Add project from disk** and pick this folder (`unity/BGB2`). Open it. Unity downloads URP, Input System and
   TextMeshPro (about 5 minutes) and then **compiles the scripts. If the Console shows red errors, copy them to me; I wrote the code without a compiler.**
3. When asked about the new Input System, click **Yes** (restart). Then open **Edit > Project Settings > Player > Other Settings >
   Active Input Handling** and make sure it is **Input System Package (New)** or **Both**.
4. Open **Window > TextMeshPro > Import TMP Essential Resources** and click **Import**.
5. **Fonts (needed for Korean):** download *Noto Serif KR* and *Alegreya* (Google Fonts) and drop the `.ttf` files into
   `Assets/_BGB/Fonts/` (create the folder if missing). The builder makes a TMP font asset from the first font it finds there.
6. Menu **BGB2 > 1 Setup Project.** (Creates the URP 2D renderer, sets every sprite to the right import settings and nine-slice borders.)
7. Menu **BGB2 > 2 Build Investigate Scene.** (Creates the scene, lights, characters, UI and the evidence/dialogue assets.)
8. Press **Play**. Keys: **A/D** or arrows walk, **Shift** run, **E** interact, **Tab** Case File, **F2** English/Korean.

## What to check (please report what differs)
- Parallax scrolls at different speeds; camera follows smoothly and stops at the ends.
- Walking near a lamp warms the side of BGB facing it; the contact shadow leans away from the lamp.
- Prompt: appears only in range, fades in about 0.25 s, vanishes instantly when you press E.
- The "!" is large and clearly visible, and sits above heads (not over faces).
- Dialogue box is centred; choices are centred and fit their text. Korean needs the font from step 5.
- Left category panel: all six buttons are the same size. Clicking one opens the Case File on that tab.
- Evidence: examine the signpost and the clock, close the card, see "Evidence added", then open Tab > Evidence.
- Quit and press Play again: your position and evidence are restored (`bgb2_save.json` in `Application.persistentDataPath`).

## Layout (see `docs` in the repo root for the full plan)
```
Assets/_BGB/
  Art/        UI, Characters (6 views each, never mirrored), Backgrounds/BellVillage, Props
  Scripts/    Core (state, save, localisation), Data (ScriptableObjects), Player, Camera (parallax), Interaction,
              Lighting, UI, Editor (the two setup menus)
  ScriptableObjects/  Evidence, Dialogue (created by the builder)
  Scenes/BellVillage/ BellVillage_Investigate.unity (created by the builder)
```

## Decisions
- **URP 2D Renderer** for painted sprites with 2D lights; **no custom shaders, no shadow casters, no post-processing.**
- **Unity Input System** (polled keyboard) rather than the old Input Manager.
- **ScriptableObjects** for evidence and dialogue, a plain serializable **GameState** saved as versioned JSON (`version: 1`).
- **No sprite flipping.** Facing uses separate left/right/front sprites so BGB stays left-handed (STORY_BIBLE Hard Rule 6).
- **Nine-slice UI**: corners and ends keep their drawn size; `FitToText` resizes the middle to the words.
- Dialogue is a small in-house node system, not Ink or Yarn Spinner: for 5 to 20 short conversations it avoids a package; revisit at Chapter 2.

## Not built yet
Clocktower scene (the door shows a placeholder toast), People/Timeline/Map pages, deduction system, Identity Board, flashbacks,
audio, pause menu. Art still missing is listed in `ASSET_REQUIREMENTS.md`.
