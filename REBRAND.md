# Creed Construction rebrand

This change updates the existing static website, not a replacement two-page demo.

## Brand and scope
- Newest November 9 Creed-Construction-16-Logo-Kit(2).zip artwork copied byte-for-byte: horizontal stamp logo, new dimensional seal for About, and stamp icon. Versioned asset filenames avoid stale immutable caches.
- Navy `#041A2E`, red `#8A3B42`, white; locally served Cinzel, Roboto Slab and Bitter fonts.
- All 12 HTML pages, shared navigation/footer, metadata, contact details, sitemap and legacy redirects updated.
- Canonical website: `https://creedconstructionco.com`; public email: `zach@creedconstructionco.com`.
- Existing projects, galleries, comparison sliders, forms and phone number retained.
- Legal entity remains `901 Delta Consulting, LLC`; a brand change is not evidence of a legal name change.
- Original customer reviews referring to Delta are omitted rather than rewritten. They remain in Git history.
- Retired social links and embeds removed until verified Creed profiles are available.
- Legacy consent storage/cookie keys remain to preserve returning visitors' privacy choices.
- Retired branding files remain in source, but the production build excludes them.

## Build and checks
Requires Python 3.11+ for the TOML check and Node.js for JavaScript tests.

```sh
python3 scripts/build_site.py
python3 scripts/check_site.py
node scripts/check_form_handlers.js
node --check script.js
node --check measurement.js
node --check ads-tracking.js
git diff --check
```

Netlify uses `python3 scripts/build_site.py` and publishes `dist/`. Do not publish the repository root manually: it retains historical/source material deliberately excluded from the build.

Checks pass for local asset references, structured data, brand sweep, forms, noindex draft, build exclusions, JavaScript syntax, and mocked form success/error/uncertain-delivery behavior. No live form was submitted. Browser screenshot/mobile interaction QA could not run in the isolated execution environment and remains a release check.

## Before release
1. Confirm the correct Netlify project and its production/branch/deploy-preview settings. Do not push or merge into an auto-publishing target unless publication is authorized.
2. Confirm Creed domain ownership/aliases and TLS in Netlify. Repository redirects do not attach domains to a Netlify project.
3. Preview desktop/mobile navigation, galleries, project pages and forms.
4. After authorized deployment, verify Netlify form detection and notification recipients, then perform an authorized end-to-end test. A successful form POST alone does not establish email delivery.
5. Update analytics/ads destination-domain settings and verified social/Business Profile listings separately where applicable.

## November 14 preparation
- Updated assets from the November 9 kit, without changing logo pixels.
- The new seal is used on About; the stamp remains the header/footer identity and favicon.
- Retired Creed artwork is excluded from the production output.
- Re-ran the source/build and mocked form checks successfully.
- Netlify requires sign-in; branch-preview behavior, attached domains, TLS, form notifications and current deployment remain unverified.
- Browser could not reach the private local preview server (connection refused). Visual desktop/mobile and live interactions are NOT verified.
- No GitHub push, public preview, deployment, DNS change, or live form submission was performed.

Deployment optimization: approved mark resampled to 512px PNG for icons, seal to 960px lossless WebP for About. Transparent RGBA encoding verified pixel-exact after resampling. Full-resolution originals preserved in prepared source ZIP.
