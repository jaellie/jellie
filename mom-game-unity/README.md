# 엄마의 모험 (Mom's Adventure) — Unity version

A cozy birthday game for Mom. Soft low-poly 3D, built **entirely from code** (no scene or prefab to set up)
with [Kenney](https://kenney.nl) CC0 models. Home → LF Square (Dad's black car) → The Past (little Mom,
black rubber shoes) → Ungcheon Beach at dusk → the birthday letter. 15 hidden letters, no score, no timer.

## Run it
1. Open this folder with **Unity 6 (6000.x)** (Unity Hub → Add → this folder). First import takes a few minutes.
2. Open any scene (or make an empty one) and press **Play**. A bootstrap script creates the whole game.
3. Build: File → Build Profiles → Windows / macOS → Build.

Pipeline: Built-in Render Pipeline + Standard shader (everything is generated in code, so no URP asset needed).

## Controls
W / S walk · A / D turn · E or Space use · hold **Alt** (or right mouse) + move mouse to look around · **F10** reset found letters

## Make it yours
- **Photos**: drop `01.jpg … 09.jpg` into `Assets/Resources/Photos/` (names used in `Core/Content.cs`).
- **Voice message**: put an audio file in `Assets/Resources/Audio/` and set `voiceFile` in `Content.cs` (`phone_voice`).
- **Any sound**: `Assets/Resources/Audio/<name>.wav|ogg` overrides the built-in synthesized sound of the same name.
- **Texts / letters / the ending**: `Assets/Scripts/Core/Content.cs`.
- Logo: `Assets/Resources/logo.png`. Font: `Assets/Resources/Fonts/Griun_Mongtori-Rg.ttf`.

## If something looks off (this project was written without Unity available to run it)
- Mom walks backwards / faces away → `Mom.ModelYawOffset` = 180 in `Entities/Mom.cs`.
- Models look too big/small or have wrong colors → menu **Mom → Reimport Kenney models**.
- Text on signs too small/large → scale constant in `Kit.Text` (`Core/Kit.cs`).
- Send me the Console errors / a screenshot and I'll fix it.

## Credits
3D models, UI and emotes by Kenney (CC0) — licenses in `Assets/Kenney_Licenses`. Font: 그리운몽토리체.
`Tools/` has the Python scripts that import the Kenney packs and paint Mom's skins.
