# Four-World Environment Pipeline (long-term plan)

Status: **plan only (2026-10-31). No world production starts until the Test Town vertical slice is playable on
Android.** Dataset facts below were checked on 2026-10-31; items marked **verify** must be confirmed against the
provider's own terms page before any data enters the game.

## 1. Scope

| World | Terrain | Built environment |
|---|---|---|
| **Yeosu** (여수, Korea) | real elevation, coastline, islands | designed for gameplay; Korean coastal-city atmosphere |
| **Hawaiʻi** | real elevation, coastline, volcanic landforms | designed; island atmosphere |
| **San Francisco** | real elevation, hills, bay shoreline | designed; steep-grid atmosphere |
| **Sci-Fi** | fictional | fictional |

- Accuracy target: **natural terrain only**. Hills, valleys, ridgelines, coastlines and islands keep their real shape,
  scale (1:1) and gradients as far as the data allows.
- **Not reproduced:** individual buildings, exact street layouts, real signage or trademarks.
  Roads, intersections and props are designed for driving practice and sit on top of the real terrain.
- Each world is a cropped **area of interest (AOI)**, not a whole city or island (mobile limits, §5).

Relation to earlier plans: ROADMAP.md's map types (practice ground, city streets, residential alleys, winding roads)
become **districts inside these worlds** rather than separate maps. To be confirmed by the user (§9).

## 2. Data sources

| Use | Dataset | Resolution | License / terms | Notes |
|---|---|---|---|---|
| Elevation, all real worlds (baseline) | **Copernicus DEM GLO-30** | 1 arc-second (~30 m) | free license, worldwide; adapted data must carry the notice "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA" (**verify** commercial wording in the license PDF) | surface model (includes buildings and trees in places), so urban areas need smoothing |
| Elevation, Yeosu (preferred) | **NGII (국토지리정보원) DEM**, data.go.kr | 5 m | **verify**: 공공누리 type and conditions are not confirmed | IMG format; much better than 30 m for Yeosu's small hills |
| Elevation, Hawaiʻi / SF | **USGS 3DEP 1/3 arc-second** | ~10 m | US federal, described as public domain | seamless; covers Hawaiʻi |
| Elevation, Hawaiʻi / SF (detail) | **USGS 3DEP 1 m lidar DEM** (or Seamless 1 m, S1M) | 1 m | public domain | coverage depends on lidar projects (**verify** for each AOI in the National Map viewer) |
| Coast and shallow sea, Hawaiʻi / SF | **NOAA NCEI CUDEM** topo-bathymetric tiles | 1/9 arc-second (~3 m) | US federal data, publicly available (**verify** the exact terms in the record) | Hawaiʻi tiles confirmed; SF Bay coverage at 1/9" likely but **verify**; a 1/3" SF Bay coastal DEM also exists |
| Open sea depth | **GEBCO Grid** | 15 arc-seconds (~450 m) | public domain, attribution required, not for navigation (**verify** on gebco.net) | only for sea color and depth gradients |
| Land cover for terrain materials | **ESA WorldCover** | 10 m | CC BY 4.0, acknowledgement required; the 2020 page also asks for approval before use in advertising (**verify** for v200) | trees, grass, bare rock, built-up, water → splat maps |
| Reference only | OpenStreetMap | n/a | ODbL | **not imported into game data** (share-alike for derived databases). People may look at it for orientation only |

Not used: Google Maps, Earth or Street View captures and other imagery without a reuse license.
Atmosphere references come from our own photos or public-domain / CC-licensed images with recorded credits.

## 3. Accuracy limits (stated in-game in the credits)

- **30 m data smooths features** smaller than ~60–90 m: small knolls, road cuts and cliffs.
  Added surface detail (noise, rock meshes) is decorative and not accurate.
- **Surface vs. terrain:** GLO-30 includes buildings and canopy in places, so urban hills read slightly high until
  smoothed. 3DEP and NGII are bare-earth models.
- **Vertical accuracy** varies by source (a few meters for 30 m global data, sub-meter for lidar). Mixing sources
  needs blend zones to avoid steps.
- **Coastlines** follow the DEM's 0 m contour, so harbors, piers and seawalls are redesigned, not reproduced.
- **Time:** data reflects survey dates (lidar years differ by area); the coastline and landforms are what matter.
- **Projection:** each world uses its UTM zone in meters (Yeosu 52N, Oʻahu 4N, San Francisco 10N), so the
  distortion across a few kilometers is negligible.

## 4. Pipeline

```
1. AOI      choose a box per world (user decision), record bounds + UTM zone in Tools/terrain/worlds/<id>.json
2. Fetch    scripted download of DEM / bathymetry / land-cover tiles; record URL, version, date and hash in provenance.json
3. Prepare  reproject to UTM meters → clip to the AOI → fill voids → merge land + sea (blend zone) →
            smooth urban surface bumps (GLO-30 only) → set sea level 0 m
4. Export   1 km × 1 km tiles: 16-bit RAW heightmaps (513² ≈ 2 m spacing) + land-cover splat masks + coastline mask
            + metadata (min/max height, origin, source per tile)
5. Unity    editor importer builds Terrain tiles from the RAW files (Claude), as additive scenes per tile
6. Roads    gameplay road network designed on top (Claude): spline centerlines in a layout JSON per world, profile
            sampled from the DEM then smoothed to grade and curve limits; terrain cut and filled under each corridor
7. Art      modular kits per world (Codex, ASSET_SPEC rules): buildings, props, vegetation, coastal pieces
8. Check    automated: heights at checkpoints vs. source, coastline overlap, gradient histogram, road grades,
            tile seams; visual review from the cockpit
```

Tools: Python with GDAL/rasterio in `Tools/terrain/` (run by Claude outside Unity, reproducible). Raw downloads are
not committed; derived tiles are, with `provenance.json` and credits.

## 5. Unity and mobile constraints

- **AOI size:** start around **4 × 4 km** per world (16 terrain tiles), growing only after measuring on a device.
- **Streaming:** 3 × 3 tiles around the car loaded additively; a single low-resolution mesh for the far terrain.
  With a local origin at the AOI center, coordinates stay within ±4 km, so no floating-origin system is needed yet.
- **Terrain:** Unity Terrain per tile (or meshes if Terrain is too costly on the target phone); 4 splat layers max;
  URP Terrain Lit; height precision ≈ 1 cm with 16-bit over a 0–600 m range.
- **Budgets:** ASSET_SPEC §6 still applies to the visible frame; terrain counts toward the 300k triangle budget.
- **Roads vs. real gradients:** San Francisco has streets near 30% grade. The physics model must handle steep
  starts and parking; very steep grades become optional challenge routes. Default routes stay ≤ 15%.

## 6. Per-world notes (proposals, to be decided)

| World | AOI proposal | Main sources | Character |
|---|---|---|---|
| Yeosu | coastal downtown plus a nearby island connected by bridge | NGII 5 m (if licensed), else GLO-30; GEBCO sea | hilly coastal city, bridges, harbor, island roads |
| Hawaiʻi | one island; proposal: southeast Oʻahu coast (Honolulu to Diamond Head) | 3DEP 1 m / 10 m, CUDEM 1/9" | volcanic crater ridge, coastal highway, beach town |
| San Francisco | NE hills to the bay shoreline | 3DEP 1 m / 10 m, CUDEM | steep grid hills, bay views, ridge roads |
| Sci-Fi | fictional heightmap (procedural + hand-sculpted) | none | free design; same streaming and road system |

## 7. Ownership

- **Claude:** data pipeline scripts, provenance and credits, terrain import, streaming, road layout and corridor
  shaping, gameplay, tests, UI.
- **Codex:** modular 3D kits, materials and textures per world (ASSET_SPEC); no terrain data changes.

## 8. Order

1. **Now:** finish the Test Town vertical slice (playable on Android). Nothing here starts before that.
2. Then: one small terrain pilot (1 × 1 km) to prove the pipeline end to end on a phone.
3. Then: world AOIs one at a time, with the user choosing the order.

## 9. Open decisions (user)

1. AOI for each real world (and which Hawaiian island).
2. Whether the earlier map types become districts inside the four worlds.
3. Commercial release plans: this decides how strictly each license's commercial terms must be checked.
