# Asset Research, Acquisition, and Licensing Policy

## Workflow (mandatory before implementation)
1. Find candidate environment models, firecracker props, textures, HDRIs, fireworks effect code and SFX.
2. **Open the original listing/repository** and inspect author, download availability, license and redistribution rules.
3. Preview actual asset quality and style; check geometry count, textures, scale, orientation, formats and download size.
4. Record full source/creator/license and relevant license URL in `06_ASSET_MANIFEST.csv`.
5. Download only approved files; keep original licenses/notices under `public/assets/licenses/` where required.
6. Convert/optimize to web-ready formats and test the result visually.
7. Don't use marketplace previews, web search thumbnails or screenshots as textures unless rights expressly permit it.

## Candidate sources (starting places; not verified asset selections)
- **Poly Haven:** https://polyhaven.com/ — environment materials, props and HDRIs; inspect each selection and stated license.
- **Kenney:** https://kenney.nl/assets — game props; visual styles vary.
- **Sketchfab:** https://sketchfab.com/ — per-model license and download rules vary significantly.
- **OpenGameArt:** https://opengameart.org/ — licenses vary, including attribution/share-alike restrictions.
- **Three.js examples:** https://threejs.org/examples/ — examples for rendering techniques; verify licenses for any third-party dependencies/assets.
- **Candidate effect repository:** https://github.com/toddegray/fireworks — verify latest code, license and dependency compatibility before use.
- **Pixabay sound-effects:** https://pixabay.com/sound-effects/ — individual content license and restrictions must be reviewed.
- **Freesound:** https://freesound.org/ — individual recording license varies; check attribution and commercial rights.

## Acceptance standards
- Legal right to use, modify, host and redistribute within a public/commercial web app as intended.
- License conditions compatible with project. An asset being publicly viewable is not permission to copy.
- Source author credited as required; preserve copyright/license notices for code and assets.
- No ripped paid game models, trademarked packaging, misleading affiliation or unlicensed copyrighted festival artwork.
- Avoid raw heavyweight scans and textures until compressed/optimized.
- Avoid baking external network dependencies into gameplay; deploy approved local assets.

## Mandatory columns
`asset_id,category,description,source_url,creator,license,license_url,attribution_required,downloaded_file,optimized_file,format,size_mb,polycount_or_particles,status,notes`

## Status flow
`candidate -> reviewed -> approved -> downloaded -> optimized -> integrated -> tested`; or `rejected`. Never mark approved before license review. Project is not blocked if a particular model is unavailable: simple geometry + licensed material is an acceptable initial fallback.

## Optimize
Use glTF/GLB where possible, remove unseen geometry, compress textures, reduce large HDRIs, resize audio thoughtfully, preload only first-view assets, lazy-load later effects. Check actual output in a browser, not just in Blender.
