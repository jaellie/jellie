"""Static cross-reference: member accesses on project types vs. their declarations (not a compiler)."""
import re, glob, os, sys
ROOT = sys.argv[1]
files = [f for f in glob.glob(ROOT + '/**/*.cs', recursive=True)]
src = {f: open(f, encoding='utf-8').read() for f in files}
strip = lambda s: re.sub(r'//.*', '', re.sub(r'"(\\.|[^"\\])*"', '""', s))

# 1) declared members per type (class/struct/enum), coarse but adequate
decl = {}
type_re = re.compile(r'\b(class|struct|enum|interface)\s+(\w+)')
for f, s in src.items():
    s2 = strip(s)
    # split by type declarations; members until next type keyword at same file (approximate)
    pos = [(m.start(), m.group(2), m.group(1)) for m in type_re.finditer(s2)]
    for i, (p, name, kind) in enumerate(pos):
        body = s2[p: pos[i + 1][0] if i + 1 < len(pos) else len(s2)]
        names = decl.setdefault(name, set())
        if kind == 'enum':
            m = re.search(r'\{([^}]*)\}', body)
            if m: names.update(re.findall(r'\b([A-Z]\w*)\b', m.group(1)))
            continue
        names.update(re.findall(r'\b(?:public|internal|protected|private|static|readonly|const|override|virtual|event|\s)+[\w<>\[\],\.\?]+\s+(\w+)\s*(?:\(|=>|\{|;|=)', body))
        names.update(re.findall(r'\[SerializeField\][^;]*?(\w+)\s*(?:=[^;]*)?;', body))
        names.update(re.findall(r'\bpublic\s+[\w<>\[\],\.\?]+\s+(\w+)\s*,', body))
        names.update(re.findall(r',\s*(\w+)\s*;', body))        # comma-separated field lists
        names.update(re.findall(r',\s*(\w+)\s*,', body))
        names.update(re.findall(r'\bpublic\s+(\w+)\s*\(', body))  # ctor

# 2) instance variables in the files under review mapped to their types
typed = {
  'vehicle': 'VehicleController', 'accessories': 'VehicleAccessories', 'footPedals': 'PedalInputManager',
  'touchSteering': 'TouchSteeringController', 'cameraController': 'CameraController', 'calibration': 'PedalCalibrationWizard',
  'startup': 'StartupFlow', 'startupFlow': 'StartupFlow', 'router': 'VehicleInputRouter', 'minimap': 'MinimapCamera',
  'hud': 'DrivingHUDController', 'pauseMenu': 'CabinPauseMenu', 'wheel': 'VehicleWheel', 'mobilePedals': 'MobilePedalController',
  'brakePedal': 'TouchPedalButton', 'acceleratorPedal': 'TouchPedalButton', 'rig': 'CockpitRig', 'mirror': 'MirrorCamera',
}
statics = ['CabinStyle', 'UIBuild', 'UISprites', 'DriverPreferences', 'Loc', 'LocalizationService', 'DrivingMessages', 'VehicleAccessories',
           'CockpitBuilder', 'TownGreyboxBuilder', 'PrimitiveUtil', 'SceneAtmosphere', 'GameFlow', 'EnvironmentCatalog', 'DialMath',
           'TownGeometry', 'ArtLocator', 'ArtImportPostprocessor', 'VehicleArtBinder', 'DrivingHUDController', 'CabinPauseMenu',
           'PhysicsTestRig', 'PhysicsTestSceneMenu', 'KeyboardShim', 'DrivingInputGate', 'HudTheme', 'SignalCycle', 'MaterialSource',
           'RuntimeMaterialSource', 'TownLayoutData', 'TownDressingData', 'ProjectConfigurator', 'ArtMaterialBuilder', 'ArtImportValidator',
           'TrafficSignalController', 'StartupFlow', 'DisclaimerService', 'PedalCalibrationWizard', 'MainMenuBootstrap']
review = [f for f in files if any(k in f for k in sys.argv[2:])]
problems = []
for f in review:
    s = strip(src[f])
    for var, typ in typed.items():
        for m in re.finditer(r'(?<![\w.])' + var + r'\??\.(\w+)', s):
            mem = m.group(1)
            if typ in decl and mem not in decl[typ] and mem not in ('gameObject', 'transform', 'name', 'enabled', 'isActiveAndEnabled', 'GetComponent', 'GetComponentsInChildren', 'GetComponentInParent', 'AddComponent', 'TryGetComponent'):
                problems.append(f"{os.path.relpath(f, ROOT)}: {var}.{mem} not declared on {typ}")
    for typ in statics:
        for m in re.finditer(r'(?<![\w.])' + typ + r'\.(\w+)', s):
            mem = m.group(1)
            if typ in decl and mem not in decl[typ]:
                problems.append(f"{os.path.relpath(f, ROOT)}: {typ}.{mem} not declared")
print(len(review), "files reviewed")
for p in sorted(set(problems)): print(p)
