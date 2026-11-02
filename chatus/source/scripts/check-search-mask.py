"""Verify the packed contour texture retains the exact PNG alpha."""
from pathlib import Path
import json
from PIL import Image
root = Path(__file__).resolve().parent.parent
assets = root / 'public/assets/chatus'
original = Image.open(assets / 'character-original.png').getchannel('A')
for name in ['character-mask.png', 'character-contour.png']:
 mask = Image.open(assets / name).getchannel('A')
 assert original.size == mask.size == (402,379)
 assert original.tobytes() == mask.tobytes(), f'{name}: source alpha changed'
report = json.loads((root / 'evidence/search-contour-validation.json').read_text())
assert report['max_head_distance_to_alpha_boundary_px'] <= .5
print(json.dumps(report, indent=2))
