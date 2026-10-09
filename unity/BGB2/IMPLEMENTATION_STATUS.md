# IMPLEMENTATION STATUS (Unity)

Legend: **Implemented** = code written. **Compiled** = opened in Unity with no errors. **Runtime tested** = played in the Editor.
Nothing is compiled or runtime-tested because no Unity Editor was available. The same behaviour **is** runtime-tested in the web prototype.

| Area | Implemented | Syntax-checked | Compiled in Unity | Runtime tested (Unity) | Needs manual test |
|---|---|---|---|---|---|
| Project skeleton (manifest, version, .gitignore) | yes | n/a | no | no | open in Unity Hub |
| URP 2D setup + sprite import + nine-slice borders (`BGB2 > 1`) | yes | yes | no | no | run the menu |
| Scene builder (`BGB2 > 2`) | yes | yes | no | no | run the menu, press Play |
| Player walk/run, no flipping | yes | yes | no | no | walk both ways |
| Camera follow + parallax (4 layers) | yes | yes | no | no | scroll the village |
| Interaction sensor, prompt (fade, instant hide), "!" markers | yes | yes | no | no | stand near Nini/Oliver/sign |
| Dialogue (typewriter, choices, centred, flags) | yes | yes | no | no | talk to Nini and Oliver |
| Category panel (6 equal buttons) + Case File (Investigate, Evidence, Notes) | yes | yes | no | no | click each tab |
| Evidence (ScriptableObject) + save/load JSON | yes | yes | no | no | collect, quit, replay |
| Lamp lighting (Light2D) + contact shadows | yes | yes | no | no | walk past a lamp |
| Korean text | needs a Hangul font in `Assets/_BGB/Fonts` | n/a | no | no | add font, press F2 |
| People / Timeline / Map pages | stub text | n/a | no | no | not built |
| Clocktower scene | no | | | | next milestone |
| Deduction, Identity Board, Responsibility Board, flashbacks, audio, pause | no | | | | later milestones |

**Blocked by missing assets:** Green's scar and corrected scarves, torn-tail variant, young twins, council-room stills, hatch/handbell
prop animation (see `ASSET_REQUIREMENTS.md`). Placeholder: the Clocktower door has no sprite; only an interaction point.
