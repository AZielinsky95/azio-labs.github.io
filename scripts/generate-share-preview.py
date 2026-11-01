"""Render the site's real Voronoi field and masthead mark for link previews.

Optional authoring tools: Node.js, Pillow, and macOS Georgia/Menlo fonts.
The generated PNG is committed; normal builds need no rendering tools.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
width, height, scale = 1200, 630, 3

# Capture the actual canvas paths, without starting an animation or a browser.
capture = r"""
import fs from 'node:fs';
import vm from 'node:vm';
const commands = [];
const context = {
  setTransform(){}, fillRect(){}, beginPath(){commands.length = 0;}, stroke(){},
  moveTo(x,y){commands.push([0,x,y]);}, lineTo(x,y){commands.push([1,x,y]);}
};
const canvas = {
  getContext(){return context;},
  getBoundingClientRect(){return {width:1200,height:630};}
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), {
  document:{hidden:false,querySelector(){return canvas;},addEventListener(){}},
  window:{addEventListener(){}},
  matchMedia(query){return {matches:query.includes('reduced-motion'),addEventListener(){}};},
  ResizeObserver:class{observe(){}},
  devicePixelRatio:1,performance:{now(){return 0;}},
  cancelAnimationFrame(){},requestAnimationFrame(){return 0;}
});
process.stdout.write(JSON.stringify(commands));
"""
commands = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e', capture, str(root / 'js/voronoi.js')
], text=True))
image = Image.new('RGB', (width * scale, height * scale), '#141313')
draw = ImageDraw.Draw(image)
previous = None
for kind, x, y in commands:
    point = (round(x * scale), round(y * scale))
    if kind == 1 and previous is not None:
        draw.line([previous, point], fill='#383634', width=4)
    previous = point

# Gently quiet the contours behind the mark, retaining the visible edge pattern.
mask = Image.radial_gradient('L').point(lambda value: round((255 - value) * .42))
mask = mask.resize(image.size, Image.Resampling.LANCZOS)
image = Image.composite(Image.new('RGB', image.size, '#141313'), image, mask)
draw = ImageDraw.Draw(image)
serif = ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', 176 * scale)
mono = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 164 * scale)

def letter(text, x, font):
    left, top, right, bottom = font.getbbox(text)
    position = (x * scale - (right + left) / 2, 315 * scale - (bottom + top) / 2)
    draw.text(position, text, font=font, fill='#f4f1eb')

letter('A', 316, serif)
letter('Z', 458, serif)
draw.line([(570 * scale, 405 * scale), (630 * scale, 225 * scale)], fill='#fa806f', width=11 * scale)
letter('I', 742, mono)
draw.ellipse([(833 * scale, 245 * scale), (935 * scale, 385 * scale)], outline='#f4f1eb', width=6 * scale)

image = image.resize((width, height), Image.Resampling.LANCZOS)
output = root / 'public/portfolio/azio-voronoi-share-v1.png'
image.save(output, optimize=True)
print(f'{output.name}: {width}x{height}, {output.stat().st_size:,} bytes')
