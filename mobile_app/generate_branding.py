"""Generate clinic launcher and splash assets from the high-quality logo.

Runs in CI before `flutter build apk` (Pillow is installed by the workflow).
Overwrites mipmap-*/ic_launcher.png with the clinic logo on white and writes
adaptive-icon foregrounds plus the splash logo, all derived from
assets/images/clinic_logo.png.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
RES = ROOT / 'android' / 'app' / 'src' / 'main' / 'res'

logo = Image.open(ROOT / 'assets' / 'images' / 'clinic_logo.png').convert('RGBA')
badge = logo.crop(logo.split()[3].getbbox())


def target(name, d):
    dd = RES / f'mipmap-{d}'
    dd.mkdir(parents=True, exist_ok=True)
    return dd / name


def paste_center(canvas, diameter):
    r = badge.resize((diameter, diameter), Image.LANCZOS)
    canvas.alpha_composite(r, ((canvas.width - diameter) // 2, (canvas.height - diameter) // 2))
    return canvas


# Static launcher icons: clinic logo on white at 66% (safe inside masks).
for d, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    out = paste_center(Image.new('RGBA', (s, s), (255, 255, 255, 255)), round(s * 0.66))
    out.convert('RGB').save(target('ic_launcher.png', d))
    print('ic_launcher', d)

# Adaptive icon foregrounds: transparent 108dp canvas, logo in the safe zone.
for d, s in {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}.items():
    out = paste_center(Image.new('RGBA', (s, s), (0, 0, 0, 0)), round(s * 2 / 3))
    out.save(target('ic_launcher_foreground.png', d))
    print('foreground', d)

# Native splash logo: transparent 200dp canvas, logo at 2/3, all densities.
for d, s in {'mdpi': 200, 'hdpi': 300, 'xhdpi': 400, 'xxhdpi': 600, 'xxxhdpi': 800}.items():
    out = paste_center(Image.new('RGBA', (s, s), (0, 0, 0, 0)), round(s * 2 / 3))
    out.save(target('splash_logo.png', d))
    print('splash', d)
