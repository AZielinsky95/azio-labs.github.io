"""Generate responsive WebP assets from the portfolio's original images.

Optional authoring dependency: Pillow. The site build only reads the manifest.
Run again after adding or replacing a source image in scripts/build.mjs.
"""
import hashlib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
assets = root / 'public/portfolio'
output = assets / 'optimized'
output.mkdir(exist_ok=True)
source = (root / 'scripts/build.mjs').read_text()
names = sorted(set(re.findall(r'''['"]([^'"]+\.(?:png|jpe?g))['"]''', source)))
manifest = {}
original_bytes = optimized_bytes = 0

for name in names:
    path = assets / name
    if not path.is_file() or 'poster' in name:
        continue
    with Image.open(path) as image:
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        kind = 'icon' if '-icon.' in name else 'portrait' if name == 'portrait-pencil-sketch.png' else 'phone' if name.startswith('home-') else 'image'
        candidates = {'icon': [64, 128, 192], 'portrait': [256, 384, 576, 768], 'phone': [384, 640, 960], 'image': [480, 960, 1440]}[kind]
        widths = sorted(set(min(width, image.width) for width in candidates))
        variants = []
        for width in widths:
            height = round(image.height * width / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            data = io.BytesIO()
            resized.save(data, format='WEBP', quality=88, method=6)
            content = data.getvalue()
            digest = hashlib.sha256(content).hexdigest()[:8]
            filename = f'{path.stem}-{width}-{digest}.webp'
            (output / filename).write_bytes(content)
            variants.append({'file': f'optimized/{filename}', 'width': width})
        manifest[name] = {'width': image.width, 'height': image.height, 'kind': kind, 'variants': variants}
        original_bytes += path.stat().st_size
        optimized_bytes += len(content)

(root / 'scripts/image-assets.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Generated {len(manifest)} responsive images. Originals: {original_bytes:,} bytes; largest WebP variants: {optimized_bytes:,} bytes.')
