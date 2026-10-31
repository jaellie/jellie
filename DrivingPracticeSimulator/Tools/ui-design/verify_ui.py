"""Static handoff checks against the supplied source ZIP. This is not a Unity compile.
Usage: python verify_ui.py /path/to/DrivingPracticeSimulator-source-69692df.zip
"""
from pathlib import Path
from collections import Counter
import hashlib, json, re, sys, zipfile
from fontTools.ttLib import TTFont

project = Path(__file__).resolve().parents[2]
with zipfile.ZipFile(sys.argv[1]) as archive:
    prefix = next(n[:-len('PROGRESS.md')] for n in archive.namelist() if n.endswith('/DrivingPracticeSimulator/PROGRESS.md'))
    original = {n[len(prefix):]: archive.read(n) for n in archive.namelist() if n.startswith(prefix) and not n.endswith('/')}

def check(value, reason):
    if not value: raise AssertionError(reason)

protected = ('Assets/DrivingSim/Core/', 'Assets/DrivingSim/Runtime/Controls/',
             'Assets/DrivingSim/Runtime/Vehicle/', 'Assets/DrivingSim/Runtime/Startup/',
             'Assets/DrivingSim/Runtime/Localization/', 'Assets/DrivingSim/Runtime/Cameras/',
             'Assets/DrivingSim/Runtime/TestBed/', 'Assets/DrivingSim/Runtime/Persistence/',
             'Packages/', 'ProjectSettings/')
verified = []
for path, data in original.items():
    if path.startswith(protected) or path.endswith('.asmdef') or path.endswith('PhysicsTestSceneMenu.cs') or path.endswith('/HoldButton.cs') or path.endswith('/TouchPedalButton.cs') or path.endswith('/GearSelectorUI.cs') or path.endswith('/SafeAreaFitter.cs'):
        check((project/path).read_bytes() == data, 'Protected file changed: ' + path)
        verified.append(path)

strings = 'Assets/DrivingSim/Resources/Localization/strings.json'
old = {e['key']: e for e in json.loads(original[strings])['entries']}
entries = json.loads((project/strings).read_text())['entries']
new = {e['key']: e for e in entries}
check(len(new) == len(entries), 'Duplicate localization keys')
check(old.keys() <= new.keys(), 'Existing localization key removed')
check({k: new['disclaimer.body'][k] for k in ['ko','en']} == {k: old['disclaimer.body'][k] for k in ['ko','en']}, 'Notice wording changed')
def formats(s): return Counter(re.findall(r'\{(\d+)(:[^}]*)?\}', s))
for e in entries:
    check(e['ko'].strip() and e['en'].strip(), 'Empty translation: ' + e['key'])
    check(formats(e['ko']) == formats(e['en']), 'Placeholder mismatch: ' + e['key'])
    if e['key'] in old:
        for lang in ['ko','en']:
            check(formats(e[lang]) == formats(old[e['key']][lang]), 'Original format specifier changed: ' + e['key'])
check(all(k.startswith(('menu.','environments.')) for k in new.keys()-old.keys()), 'Unapproved key namespace')
pattern = re.compile(r'"((?:menu|environments|gear|shift|parkingBrake|signal|hazard|headlights|wipers|camera|hud|toast|nav|pause|wizard|disclaimer|language|common)\.[A-Za-z0-9.]*[A-Za-z0-9])"')
for path in (project/'Assets/DrivingSim/Runtime').rglob('*.cs'):
    for key in pattern.findall(path.read_text()):
        check(key in new, f'Missing key {key} in {path.name}')

# Remove only explicitly permitted presentation methods and compare all remaining tokens.
lex_pattern = re.compile(r'//[^\n]*|/\*.*?\*/|@"(?:""|[^"])*"|\$?"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[A-Za-z_][A-Za-z_0-9]*|[^\s]', re.S)
def tokens(s): return [m.group() for m in lex_pattern.finditer(s) if not m.group().startswith(('//','/*'))]
def erase_methods(s,names):
    masked = list(s)
    for m in lex_pattern.finditer(s):
        if m.group().startswith(('//','/*','"','@"','$"',"'")):
            for i in range(m.start(),m.end()):
                if masked[i] != '\n': masked[i] = ' '
    masked = ''.join(masked)
    spans=[]
    for name in names:
        header = re.search(r'^\s*(?:(?:public|private|protected|internal|static)\s+)*[\w<>\[\].]+\s+'+name+r'\s*\(',masked,re.M)
        check(header is not None,'Method not found: '+name)
        start=masked.index('{',header.end());depth=1;end=start+1
        while depth:
            if masked[end]=='{':depth+=1
            if masked[end]=='}':depth-=1
            end+=1
        spans.append((start,end))
    for a,b in sorted(spans,reverse=True):s=s[:a]+'{}'+s[b:]
    return tokens(s)
ui='Assets/DrivingSim/Runtime/UI/'
for filename, methods in [('PedalCalibrationWizard.cs',['Build','Block']),('CameraControlsOverlay.cs',['Create','MakeText']),('DrivingHUDController.cs',['CreateCanvas','Build','BuildSteeringRing','BuildPauseMenu','UpdateSteeringRing'])]:
    before=original[ui+filename].decode();after=(project/(ui+filename)).read_text()
    check(erase_methods(before,methods)==erase_methods(after,methods),'Behavior outside presentation changed: '+filename)
# Steering indicator changes must be limited to opacity.
before=original[ui+'DrivingHUDController.cs'].decode().replace('touchSteering.IsSteering ? 0.35f : 0.14f','touchSteering.IsSteering ? 0.12f : 0.055f')
after=(project/(ui+'DrivingHUDController.cs')).read_text()
check(erase_methods(before,['CreateCanvas','Build','BuildSteeringRing','BuildPauseMenu'])==erase_methods(after,['CreateCanvas','Build','BuildSteeringRing','BuildPauseMenu']),'Steering indicator logic changed')

for path in (project/'Assets/DrivingSim').rglob('*.cs'):
    stack=[]
    for tok in tokens(path.read_text()):
        if tok in ['{','(','[']:stack.append(tok)
        elif tok in ['}',')',']']:
            check(stack and stack.pop()=={'}':'{',')':'(',']':'['}[tok], 'Unbalanced delimiters: '+path.name)
    check(not stack,'Unclosed delimiters: '+path.name)

font=TTFont(project/'Assets/DrivingSim/Resources/UI/Fonts/JellieUI-Regular.otf')
cmap=font.getBestCmap()
check(all(c in cmap for c in range(0xAC00,0xD7A4)),'Incomplete modern Hangul coverage')
visible=''.join(e[l] for e in entries for l in ['ko','en'])
missing={c for c in visible if not c.isspace() and ord(c) not in cmap}
check(not missing,'Missing localized glyphs: '+repr(missing))

# Resolve the authored theme's script/font/sprite GUIDs using their checked-in metadata.
guid_paths={}
for path in (project/'Assets').rglob('*.meta'):
    check(not path.name.endswith('.meta.meta'), 'Metadata attached to metadata: '+str(path))
    m=re.search(r'^guid: ([a-f0-9]{32})$',path.read_text(),re.M)
    if m:
        check(m[1] not in guid_paths,'Duplicate GUID: '+m[1]);guid_paths[m[1]]=str(path)
asset=(project/'Assets/DrivingSim/Resources/UI/MidnightTheme.asset').read_text()
for guid in re.findall(r'guid: ([a-f0-9]{32})',asset):check(guid in guid_paths,'Unresolved theme GUID: '+guid)
report={'kind':'Static source/asset checks; NOT Unity compilation or execution','baseline':'69692dff2d341a942d9ef6a22dd9b3bb7a67c853','protectedFilesUnchanged':len(verified),'localizationKeys':len(new),'originalKeysPreserved':len(old),'additiveKeys':sorted(new.keys()-old.keys()),'modernHangulSyllablesCovered':11172,'result':'PASS'}
(project/'Tools/ui-design/static-results.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
