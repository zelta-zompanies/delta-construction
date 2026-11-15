# Creed Construction rebrand

Two rebrand versions were merged on 2026-11-15: Zach's local version (pages,
styles, scripts and logo kit) and the `d2506c3` GitHub version (build step,
checks, Netlify config). Where both changed a file, the local version was kept.

## Brand
- Navy `#041A2E`, seal red `#8A3B42`, white. Fonts are served locally: Cinzel
  (h1/h2, wordmark), Roboto Slab (h3, eyebrows), Bitter (seal), Inter (body).
- The stamp is the main mark (nav, footer, favicon). The wax seal is used only
  for moments of commitment (contact submit, the homepage stamp/seal slider).
- The full 16-variant logo kit lives in `assets/logo/creed/` as source files.
  Pages use the resampled files directly in `assets/logo/`.
- Canonical site `https://creedconstructionco.com`. Old Delta domains and
  `www.` 301 to it in `netlify.toml`.

## Kept on purpose
- Internal measurement and form identifiers keep the old name
  (`deltaMeasurement`, `deltaAds`, `delta_measurement` cookie/storage,
  `data-delta-form`, `delta-measurement` meta). Renaming the opt-out cookie
  would reset visitors' privacy choices. `scripts/check_site.py` allows
  exactly these identifiers in its retired-brand check.

## Preserved historical details
- JSON-LD `legalName` remains `901 Delta Consulting, LLC`; Creed Construction
  is the public brand/DBA.
- Quoted reviews retain their pre-rebrand wording, including Delta references.
  These were restored from repository history, not independently re-verified
  against Google reviews.

## Remaining follow-ups
- Placeholder copy from the literal Delta-to-Creed text swap still needs
  rewriting in the redesign.
- Confirm the Netlify project, its domains/TLS, and form notification
  recipients. Then run one authorized live form test.
- Add a Search Console property for creedconstructionco.com.

## Build and checks
Netlify runs `python3 scripts/build_site.py` and publishes `dist/` (ignored by
Git). Don't publish the repo root: it holds source material the build leaves out.

```sh
python scripts/build_site.py
python scripts/check_site.py
node scripts/check_form_handlers.js
node --check script.js && node --check measurement.js && node --check ads-tracking.js
```
