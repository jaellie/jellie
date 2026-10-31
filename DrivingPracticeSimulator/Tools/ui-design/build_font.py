"""Build the bundled OFL font from a locally supplied Noto Sans CJK TTC.
Requires fonttools; not a Unity/build/runtime dependency.
Usage: python build_font.py /path/to/NotoSansCJK-Regular.ttc
"""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

project = Path(__file__).resolve().parents[2]
out = project / 'Assets/DrivingSim/Resources/UI/Fonts'
out.mkdir(parents=True, exist_ok=True)
font = TTFont(sys.argv[1], fontNumber=1)  # Korean face in upstream regular collection
options = subset.Options()
options.name_IDs = ['*']
subsetter = subset.Subsetter(options=options)
# All modern Hangul syllables and Jamo, Latin, general punctuation, UI arrows and symbols.
codes = set(range(0x20, 0x250)) | set(range(0x1100, 0x1200)) | set(range(0x3130, 0x3190))
codes |= set(range(0xAC00, 0xD7A4)) | set(range(0x2000, 0x2070)) | set(range(0x2190, 0x2200))
codes |= {0x2212, 0x25B2, 0x25B6, 0x25BC, 0x25C0, 0x25CB, 0x25CF, 0x2713, 0xFFFD}
subsetter.populate(unicodes=codes)
subsetter.subset(font)
# Modified font uses a distinct family name; retain upstream copyright and license records.
for record in font['name'].names:
    replacements = {1: 'Jellie UI', 2: 'Regular', 3: 'JellieUI-Regular-1.0',
                    4: 'Jellie UI Regular', 6: 'JellieUI-Regular', 16: 'Jellie UI', 17: 'Regular'}
    if record.nameID in replacements:
        record.string = replacements[record.nameID].encode(record.getEncoding(), errors='replace')
if 'CFF ' in font:
    cff = font['CFF '].cff
    cff.fontNames = ['JellieUI-Regular']
    cff.topDictIndex[0].FamilyName = 'Jellie UI'
    cff.topDictIndex[0].FullName = 'Jellie UI Regular'
font.save(out / 'JellieUI-Regular.otf')
print('Font:', (out / 'JellieUI-Regular.otf').stat().st_size, 'bytes')
