# Big Green Bear's Adventure II — Unity project

Unity (2D, C#, uGUI/TextMeshPro, ScriptableObjects). Built in phases, vertical slice first.
Layout follows the production prompt. Art is **Batch 1** from the asset pack; nothing is regenerated.

## Open it
1. Unity Hub → New project → **2D (Built-in Render Pipeline or URP 2D)**, Unity 6.
2. Copy this folder's `Assets/` into the new project's `Assets/` (merge).
3. Unity imports the art; `Assets/Editor/AssetImportRules.cs` sets sprite settings automatically on first import.

## Status
| Phase | State |
|---|---|
| 0. Asset audit (`docs/ASSET_INVENTORY.md`) | DONE |
| Project folders / import rules | DONE |
| 1. Architecture (GameState, data SOs, localization keys) | TODO (next) |
| 2. Vertical slice | TODO — blocked on missing assets (`docs/MISSING_ASSETS.md`) for Edward + entrance background |

See `docs/` for the inventory, missing assets, and original pack readme/manifest.
