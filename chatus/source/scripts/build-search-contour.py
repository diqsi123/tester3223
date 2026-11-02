"""Bake contour phase/distance into RGB; preserve the source alpha byte-for-byte."""
from pathlib import Path
from collections import defaultdict
import json
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parent.parent
source=Image.open(root/'public/assets/chatus/character-original.png').convert('RGBA')
a=np.asarray(source)[:,:,3]
inside=a>0
h,w=inside.shape
edges=[]
for y,x in zip(*np.nonzero(inside)):
 x,y=int(x),int(y)
 if y==0 or not inside[y-1,x]:edges.append(((x,y),(x+1,y)))
 if x==w-1 or not inside[y,x+1]:edges.append(((x+1,y),(x+1,y+1)))
 if y==h-1 or not inside[y+1,x]:edges.append(((x+1,y+1),(x,y+1)))
 if x==0 or not inside[y,x-1]:edges.append(((x,y+1),(x,y)))
links=defaultdict(list)
for start,end in edges:links[start].append(end)
remaining=set(edges);loops=[]
while remaining:
 start,end=next(iter(remaining));loop=[start];prev=start;current=end;remaining.remove((start,end))
 while current!=start:
  loop.append(current)
  candidates=[p for p in links[current] if (current,p) in remaining]
  if not candidates:break
  dx,dy=current[0]-prev[0],current[1]-prev[1]
  # Right turn at diagonal raster junctions keeps connected contours separate.
  def priority(p):
   ex,ey=p[0]-current[0],p[1]-current[1]
   cross=dx*ey-dy*ex;dot=dx*ex+dy*ey
   return 0 if cross>0 else 1 if dot>0 else 2 if cross<0 else 3
  nxt=min(candidates,key=priority);remaining.remove((current,nxt));prev,current=current,nxt
 if current==start:loops.append(loop)
def area(loop):return abs(sum(x*loop[(i+1)%len(loop)][1]-y*loop[(i+1)%len(loop)][0] for i,(x,y) in enumerate(loop)))
contour=np.array(max(loops,key=area),dtype=np.float32)
raw_contour=contour.copy()
# Subpixel anti-staircase smoothing only; the displayed mask is untouched.
contour=(np.roll(contour,1,axis=0)+2*contour+np.roll(contour,-1,axis=0))/4
# Stable seam at the highest boundary point, with clockwise travel.
start=np.lexsort((contour[:,0],contour[:,1]))[0];contour=np.roll(contour,-start,axis=0)
nextp=np.roll(contour,-1,axis=0);delta=nextp-contour
lengths=np.sqrt((delta*delta).sum(axis=1));arc=np.concatenate(([0],np.cumsum(lengths)));total=arc[-1]
# Constant-speed head lookup, sampled directly from the alpha boundary.
distances=np.linspace(0,total,1025);indices=np.minimum(np.searchsorted(arc,distances,side='right')-1,len(contour)-1)
t=(distances-arc[indices])/lengths[indices]
path=contour[indices]+delta[indices]*t[:,None];path[-1]=path[0]
(root/'src/components/LivingSearchSilhouette/contour-data.ts').write_text('// Generated from original PNG alpha by scripts/build-search-contour.py. Do not hand-edit.\nexport const CONTOUR_PATH = '+json.dumps(np.round(path,3).flatten().tolist(),separators=(',',':'))+';\n')
yy,xx=np.mgrid[:h,:w].astype(np.float32);xx+=.5;yy+=.5
best=np.full((h,w),np.inf,dtype=np.float32);phase=np.zeros((h,w),dtype=np.float32)
for i,(p,d) in enumerate(zip(contour,delta)):
 u=np.clip(((xx-p[0])*d[0]+(yy-p[1])*d[1])/max(float((d*d).sum()),1e-6),0,1)
 d2=(xx-p[0]-u*d[0])**2+(yy-p[1]-u*d[1])**2
 near=d2<best;best[near]=d2[near];phase[near]=(arc[i]+u[near]*lengths[i])/total
out=np.empty((h,w,4),dtype=np.uint8)
# Sine/cosine phase permits linear texture filtering across the closed-loop seam.
out[:,:,0]=np.round((np.cos(phase*2*np.pi)*.5+.5)*255)
out[:,:,1]=np.round((np.sin(phase*2*np.pi)*.5+.5)*255)
out[:,:,2]=np.round(np.minimum(np.sqrt(best)/32,1)*255)
out[:,:,3]=a
Image.fromarray(out).save(root/'public/assets/chatus/character-contour.png',optimize=True)
assert np.array_equal(out[:,:,3],a)
nearest=np.full(len(path),np.inf)
for start,end in zip(raw_contour,np.roll(raw_contour,-1,axis=0)):
 d=end-start;u=np.clip(((path-start)*d).sum(axis=1)/(d*d).sum(),0,1)
 nearest=np.minimum(nearest,np.sqrt(((path-start-u[:,None]*d)**2).sum(axis=1)))
assert nearest.max()<.51
summary={'boundary_segments' :len(contour),'perimeter_px':round(float(total),2),'path_samples':1025,'alpha_unchanged':True,'max_head_distance_to_alpha_boundary_px':round(float(nearest.max()),4)}
(root/'evidence/search-contour-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(summary)
