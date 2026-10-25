#!/usr/bin/env python3
"""Generate a standalone Pages site; never modifies source photographs."""
import hashlib
import json
import shutil
from datetime import datetime
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'originals'
OUTPUT = ROOT / 'dist'
SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'}

def capture_timestamp(source):
    # DateTimeOriginal is the capture date, not the file's modification date.
    exif = source.getexif()
    try:
        original = exif.get_ifd(34665).get(36867) or exif.get(36867)
        if isinstance(original, bytes):
            original = original.decode('ascii')
        captured = datetime.strptime(original.strip().rstrip('\x00'), '%Y:%m:%d %H:%M:%S')
        return int(captured.strftime('%Y%m%d%H%M%S'))
    except (AttributeError, TypeError, ValueError, UnicodeError, OSError, KeyError):
        return 0


def build():
    overrides = json.loads((ROOT / 'photo-settings.json').read_text())
    photos = []
    # Fresh output means deleting a source photo also removes its published copies.
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    shutil.copytree(ROOT / 'site', OUTPUT)
    for directory in ['images/thumbs', 'images/fulls']:
        (OUTPUT / directory).mkdir(parents=True, exist_ok=True)
    for path in sorted(SOURCE.rglob('*')):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED:
            continue
        key = path.relative_to(SOURCE).as_posix()
        settings = overrides.get(key, {})
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
        name = hashlib.sha256(key.encode()).hexdigest()[:10] + '-' + digest + '.webp'
        with Image.open(path) as source:
            captured = capture_timestamp(source)
            image = ImageOps.exif_transpose(source)
            profile = image.info.get('icc_profile')
            if profile:
                image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(BytesIO(profile)), ImageCms.createProfile('sRGB'), outputMode='RGB')
            elif image.mode in ('RGBA','LA') or 'transparency' in image.info:
                rgba = image.convert('RGBA')
                image = Image.new('RGB', rgba.size, '#171b1c')
                image.paste(rgba, mask=rgba.getchannel('A'))
            else:
                image = image.convert('RGB')
            # Keep the thumbnail's complete frame; CSS crops around the chosen focal point.
            thumb = image.copy()
            thumb.thumbnail((1000,1000), Image.Resampling.LANCZOS)
            large = image.copy()
            large.thumbnail((2560,2560), Image.Resampling.LANCZOS)
            thumb.save(OUTPUT/'images/thumbs'/name, 'WEBP', quality=80, method=6)
            large.save(OUTPUT/'images/fulls'/name, 'WEBP', quality=90, method=6)
            photos.append({'thumb':f'images/thumbs/{name}', 'full':f'images/fulls/{name}',
                           'alt':settings.get('alt',''), 'position':settings.get('position','50% 50%'),
                           'width':large.width,'height':large.height,'captured':captured})
    (OUTPUT / 'photos.json').write_text(json.dumps(photos,indent=2)+'\n')
    # Updated assets get fresh URLs so browsers cannot reuse an older build.
    index_path = OUTPUT / 'index.html'
    html = index_path.read_text()
    for asset in ('style.css', 'gallery.js'):
        version = hashlib.sha256((OUTPUT / asset).read_bytes()).hexdigest()[:12]
        html = html.replace(f'"{asset}"', f'"{asset}?v={version}"')
    index_path.write_text(html)
    (OUTPUT / '.nojekyll').touch()
    print(f'Built {len(photos)} photographs in {OUTPUT}')

if __name__ == '__main__':
    build()
