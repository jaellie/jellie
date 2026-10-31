"""Generate original UI geometry assets; Pillow is a development-only dependency."""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[2]
folder = root / 'Assets/DrivingSim/Resources/UI/Sprites'
folder.mkdir(parents=True, exist_ok=True)

def guid(path):
    return hashlib.sha256(str(path.relative_to(root)).encode()).hexdigest()[:32]

for name in ['Panel', 'Circle', 'TurnLeft', 'TurnRight', 'CarMarker', 'Pause', 'Camera', 'Headlights', 'Hazard', 'Wipers']:
    image = Image.new('RGBA', (256, 256))
    draw = ImageDraw.Draw(image)
    if name == 'Panel':
        draw.rounded_rectangle((1, 1, 254, 254), radius=16, fill='white')
    elif name == 'Circle':
        draw.ellipse((2, 2, 253, 253), fill='white')
    elif name.startswith('Turn'):
        draw.polygon([(24, 128), (116, 42), (116, 94), (228, 94), (228, 162), (116, 162), (116, 214)], fill='white')
        if name == 'TurnRight': image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    elif name == 'CarMarker':
        draw.rounded_rectangle((64, 30, 192, 226), radius=36, fill='white')
        draw.rounded_rectangle((80, 72, 176, 121), radius=10, fill=(0, 0, 0, 0))
        draw.rectangle((58, 64, 65, 104), fill='white'); draw.rectangle((191, 64, 198, 104), fill='white')
    elif name == 'Pause':
        for x in [82, 158]: draw.rounded_rectangle((x, 52, x + 16, 204), radius=8, fill='white')
    elif name == 'Camera':
        draw.line([(32, 74), (78, 74), (94, 44), (166, 44), (182, 74), (224, 74), (224, 204), (32, 204), (32, 74)], fill='white', width=12, joint='curve')
        draw.ellipse((88, 95, 168, 175), outline='white', width=12)
    elif name == 'Headlights':
        draw.line([(140, 45), (140, 211)], fill='white', width=12)
        draw.arc((60, 45, 224, 211), -90, 90, fill='white', width=12)
        for y in [62, 128, 194]: draw.line([(24, y), (108, y)], fill='white', width=12)
    elif name == 'Hazard':
        draw.line([(128, 28), (234, 216), (22, 216), (128, 28)], fill='white', width=12, joint='curve')
        draw.line([(128, 92), (128, 149)], fill='white', width=14)
        draw.ellipse((120, 174, 136, 190), fill='white')
    elif name == 'Wipers':
        draw.line([(24, 172), (54, 90), (128, 58), (202, 90), (232, 172), (128, 220), (24, 172)], fill='white', width=12, joint='curve')
        draw.line([(128, 220), (194, 102)], fill='white', width=12)
    path = folder / (name + '.png')
    image.save(path)
    border = '{x: 18, y: 18, z: 18, w: 18}' if name == 'Panel' else '{x: 0, y: 0, z: 0, w: 0}'
    path.with_suffix('.png.meta').write_text(f'''fileFormatVersion: 2
guid: {guid(path)}
TextureImporter:
  externalObjects: {{}}
  serializedVersion: 12
  mipmaps:
    enableMipMap: 0
  isReadable: 0
  textureSettings:
    serializedVersion: 2
    filterMode: 1
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  nPOTScale: 0
  textureType: 8
  textureShape: 1
  spriteMode: 1
  spritePixelsToUnits: 100
  spriteMeshType: 0
  spriteExtrude: 1
  spriteAlignment: 0
  spritePivot: {{x: 0.5, y: 0.5}}
  spriteBorder: {border}
  alphaIsTransparency: 1
  maxTextureSize: 256
  textureCompression: 0
  userData:
  assetBundleName:
  assetBundleVariant:
''')
# UI-only schematic; never road geometry or navigable lane data.
image = Image.new('RGB', (1080, 600), '#101e2c'); draw = ImageDraw.Draw(image)
for x in range(24, 1080, 48): draw.line((x, 0, x, 600), fill='#203442')
for y in range(24, 600, 48): draw.line((0, y, 1080, y), fill='#203442')
route = [(260, -20), (260, 190), (320, 240), (720, 240), (780, 290), (780, 480), (730, 530), (340, 530), (260, 470), (260, 330), (200, 285), (-20, 285)]
draw.line(route, fill='#345262', width=30, joint='curve')
draw.line(route[3:10], fill='#b9ddf4', width=4, joint='curve')
draw.ellipse((247, 414, 273, 440), fill='#64c5ba')
path = folder.parent / 'EnvironmentDiagram.png'; image.save(path)
path.with_suffix('.png.meta').write_text(f'fileFormatVersion: 2\nguid: {guid(path)}\nTextureImporter:\n  externalObjects: {{}}\n  mipmaps:\n    enableMipMap: 0\n  maxTextureSize: 2048\n  textureType: 0\n  textureCompression: 0\n')
print('Generated 10 UI sprites and one presentation diagram.')
