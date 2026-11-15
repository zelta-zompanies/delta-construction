"""Build only public website files. Retired branding remains in source history."""
from pathlib import Path
import shutil
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
for pattern in ('*.html', '*.css', '*.js', 'robots.txt', 'sitemap.xml'):
    for source in ROOT.glob(pattern):
        shutil.copy2(source, OUT / source.name)
# Copy site assets, omitting retired branding and development/source artifacts.
for source in (ROOT / 'assets').rglob('*'):
    if not source.is_file():
        continue
    rel = source.relative_to(ROOT)
    # assets/logo/creed/ is the full 16-variant logo kit (source files); the
    # pages use the resampled files directly in assets/logo/.
    if (rel.parts[1] in {'social', 'test', 'placeholders'} or
        rel.parts[1:3] == ('logo', 'creed') or
        source.name in {'logo.svg', 'delta-means-change.png'} or
        source.suffix.lower() in {'.md', '.zip', '.psd', '.ai'}):
        continue
    dest = OUT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, dest)
print(f'Built {len(list(OUT.rglob("*")))} public files/directories in {OUT}')
