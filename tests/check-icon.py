from lxml import etree
from pathlib import Path
p = Path(__file__).resolve().parent.parent / 'icon.svg'
r = etree.fromstring(p.read_bytes())
assert r.tag == '{http://www.w3.org/2000/svg}svg'
assert p.stat().st_size < 262144
for element in r.iter():
    assert etree.QName(element).localname not in ('script', 'foreignObject', 'image')
    for key, value in element.attrib.items():
        assert not key.lower().startswith('on')
        assert not ('href' in key and not value.startswith('#'))
print('Official SVG valid and self-contained:', p.stat().st_size, 'bytes')
