from pathlib import Path
from urllib.parse import urlsplit, unquote
import json,re,tomllib
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent.parent
SITE=ROOT/'dist'
errors=[]
# Exact historical quotation blocks and registered legal name are not rebrand copy.
LEGACY_TEXT = [
    "\"legalName\": \"901 Delta Consulting, LLC\"",
    "<p class=\"testimonial-quote\">\"I've worked with Delta Construction on my last 4–5 renovations and they all have very quality work and transparent pricing. Highly recommend!\"</p>",
    "<p class=\"testimonial-quote\">\"I am an out of state investor who needs good communication, honesty and trust. I have found this in Lawson and his company Delta Construction. They are very responsive and quick — it is nice to know I have them on my side.\"</p>",
    "<p class=\"testimonial-quote\">\"As an out of state investor, it can be difficult to find a good contractor that follows through AND has good communication. I've been very happy with Delta Construction — Lawson has met my needs and has been GREAT to work with!\"</p>",
    "<blockquote class=\"cs-quote\">\n          <p>&ldquo;My only go-to. Extremely quick, responsive, professional. Very strongly recommend Delta.&rdquo;</p>\n          <cite>Alex Kernus &mdash; 5-star Google review</cite>\n        </blockquote>"
]

class Page(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.forms=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        for key in ('href','src','data-src'):
            if d.get(key):self.refs.append(d[key])
        if tag=='form':self.forms.append(d)
for p in SITE.glob('*.html'):
    s=p.read_text(encoding='utf-8');doc=Page();doc.feed(s)
    if len(doc.ids)!=len(set(doc.ids)):errors.append(f'{p.name}: duplicate IDs')
    for ref in doc.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc or not u.path:continue
        target=SITE/unquote(u.path.lstrip('/'))
        if not target.exists():errors.append(f'{p.name}: missing {ref}')
    for data in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):json.loads(data)
    # Internal measurement/form identifiers keep the delta name on purpose:
    # renaming the opt-out cookie/storage would reset visitors' opt-outs.
    scrub=re.sub(r'data-delta-form|delta-measurement|delta_measurement|deltaMeasurement|deltaAds','',s)
    for historical in LEGACY_TEXT:scrub=scrub.replace(historical,'')
    # Customer review quotes keep the reviewer's wording, including the old name.
    scrub=re.sub(r'<p class="testimonial-quote">.*?</p>','',scrub,flags=re.S)
    if 'TODO_LEGAL_NAME' in s:errors.append(f'{p.name}: unresolved legal name')
    if re.search(r'\bdelta\b|901deltaconstruction|901deltacompanies',scrub,re.I):errors.append(f'{p.name}: retired brand remains')
    for form in doc.forms:
        assert form.get('data-netlify')=='true' and form.get('method')=='POST'
        assert 'data-delta-form' in form
    if p.name=='draft-bathroom-renovation-cost.html':assert 'noindex' in s
for css in SITE.glob('*.css'):
    for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',css.read_text(encoding='utf-8')):
        if not urlsplit(ref).scheme and not (SITE/ref).exists():errors.append(f'{css.name}: missing {ref}')
config=tomllib.loads((ROOT/'netlify.toml').read_text(encoding='utf-8'));assert config['build']['publish']=='dist'
assert not (SITE/'assets/about/delta-means-change.png').exists()
assert not (SITE/'assets/logo/creed').exists()
assert len(list(SITE.glob('*.html')))==12
if errors:raise SystemExit('\n'.join(errors))
print('PASS: 12 pages, local references, JSON-LD, retired-brand sweep, static forms, draft noindex, build exclusions and config')
