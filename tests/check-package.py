import tarfile, json, hashlib, zipfile
from pathlib import Path
root = Path(__file__).resolve().parents[2]
p = root / 'releases/local-dsh-aitransx-assistant-0.2.1.tgz'
with tarfile.open(p, 'r:gz') as t:
    members = t.getmembers()
    names = [m.name for m in members]
    assert all(m.isfile() and m.name.startswith('package/') and '..' not in m.name.split('/') for m in members)
    required = ['index.js','core.js','tools.js','catalog.js','connection.js','cordis.patch.yml','locale/en.json','locale/zh.json','icon.svg','README.md','NOTICE.md']
    assert all('package/' + n in names for n in required)
    manifest = json.load(t.extractfile('package/package.json'))
    assert manifest['version'] == '0.2.1'
    assert not manifest.get('dependencies')
    assert not any(s in names for s in ['package/.env','package/atx-official.png'])
    for m in members:
        if m.name.endswith(('.js','.json','.yml','.md')):
            data=t.extractfile(m).read().decode('utf-8')
            assert 'aitx-' not in data, 'Potential credential in ' + m.name
    # Zip contains the same verified files for the documented directory installation path.
    with zipfile.ZipFile(root/'releases/ATX-assistant-0.2.1.zip','w',zipfile.ZIP_DEFLATED) as z:
        for m in members:
            z.writestr('aitransx-assistant/' + m.name.removeprefix('package/'), t.extractfile(m).read())
print('Verified',len(members),'files; no environment/profile files, dependencies or install scripts.')
for name in ['local-dsh-aitransx-assistant-0.2.1.tgz','ATX-assistant-0.2.1.zip']:
    p=root/'releases'/name
    print(name, p.stat().st_size, 'bytes; SHA256',hashlib.sha256(p.read_bytes()).hexdigest())
