from pathlib import Path
from urllib.parse import urlsplit, unquote
import json,re,tomllib
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'dist'
errors=[]
class Page(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.forms=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        for key in ('href','src','data-src'):
            if d.get(key):self.refs.append(d[key])
        if tag=='form':self.forms.append(d)
for p in SITE.glob('*.html'):
    s=p.read_text();doc=Page();doc.feed(s)
    if len(doc.ids)!=len(set(doc.ids)):errors.append(f'{p.name}: duplicate IDs')
    for ref in doc.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc or not u.path:continue
        target=SITE/unquote(u.path.lstrip('/'))
        if not target.exists():errors.append(f'{p.name}: missing {ref}')
    for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(data)
    scrub=s.replace('901 Delta Consulting, LLC','')
    if re.search(r'\bdelta\b|901deltaconstruction|901deltacompanies',scrub,re.I):errors.append(f'{p.name}: retired brand remains')
    for form in doc.forms:
        assert form.get('data-netlify')=='true' and form.get('method')=='POST'
        assert 'data-creed-form' in form
    if p.name=='draft-bathroom-renovation-cost.html':assert 'noindex' in s
for css in SITE.glob('*.css'):
    for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',css.read_text()):
        if not urlsplit(ref).scheme and not (SITE/ref).exists():errors.append(f'{css.name}: missing {ref}')
config=tomllib.loads((ROOT/'netlify.toml').read_text());assert config['build']['publish']=='dist'
assert not (SITE/'assets/about/delta-means-change.png').exists()
assert not (SITE/'assets/logo').exists()
assert len(list(SITE.glob('*.html')))==12
if errors:raise SystemExit('\n'.join(errors))
print('PASS: 12 pages, local references, JSON-LD, retired-brand sweep, static forms, draft noindex, build exclusions and config')
