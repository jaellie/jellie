"""Blender 4.3.2 provisional flat-color blockout. No gameplay or Unity assembly.
Rebuild: blender -b --factory-startup --python-exit-code 1 --python build_blockout.py
"""
from pathlib import Path
import bpy,bmesh,json,math,hashlib
from mathutils import Vector,Matrix
from mathutils.geometry import tessellate_polygon
SRC=Path(__file__).resolve().parent
ROOT=SRC.parents[1];ART=ROOT/'Assets/DrivingSim/Art';OUT=ART/'Blockout'
OUT.mkdir(parents=True,exist_ok=True)
layout=json.loads((SRC/'TestTownLayout.reference.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.unit_settings.length_unit='METERS'
colors={
'M_BO_Cabin_Dark':(.10,.12,.14,1),'M_BO_Cabin_Trim':(.27,.30,.32,1),'M_BO_Fabric':(.16,.18,.20,1),'M_BO_Metal':(.50,.54,.56,1),
'M_BO_Display':(.025,.04,.045,1),'M_BO_Mirror':(.24,.36,.42,1),'M_BO_Glass':(.68,.80,.84,.04),'M_BO_Marker':(.77,.87,.89,1),
'M_BO_Asphalt':(.22,.24,.25,1),'M_BO_Pavers':(.54,.53,.50,1),'M_BO_Curb':(.66,.66,.62,1),'M_BO_White':(.9,.91,.87,1),'M_BO_Yellow':(.95,.65,.08,1),
'M_BO_Building':(.64,.62,.56,1),'M_BO_Brick':(.46,.39,.34,1),'M_BO_Concrete':(.57,.60,.60,1),'M_BO_Window':(.19,.29,.34,1),'M_BO_Sign':(.10,.28,.32,1),
'M_BO_StreetMetal':(.24,.28,.28,1),'M_BO_Leaf':(.28,.39,.22,1),'M_BO_Bark':(.36,.28,.21,1),'M_BO_Signal_Off':(.025,.04,.035,1)}
M={};manifest={'materials':[]}
for name,color in colors.items():
 transparent=name=='M_BO_Glass'
 manifest['materials'].append(dict(name=name,shader='simplelit',surface='transparent' if transparent else 'opaque',baseColor=list(color),baseMap='',normalMap='',maskMap='',emissionMap='',emissionColor=[0,0,0],smoothness=.15,metallic=0,doubleSided=transparent))
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=color;b.inputs['Roughness'].default_value=.85;b.inputs['Alpha'].default_value=color[3]
 if transparent:m.surface_render_method='DITHERED'
 M[name]=m
(OUT/'materials.json').write_text(json.dumps(manifest,indent=2)+'\n')
ALIAS={'M_Cluster':'M_BO_Display','M_ClusterDisplay':'M_BO_Display','M_MirrorGlass':'M_BO_Mirror','M_CabinGlass':'M_BO_Glass','M_DashLamp_Off':'M_BO_Display','M_Asphalt_A':'M_BO_Asphalt','M_Pavers_A':'M_BO_Pavers','M_Curb_A':'M_BO_Curb','M_Marking_White':'M_BO_White','M_Marking_Yellow':'M_BO_Yellow','M_StreetMetal':'M_BO_StreetMetal','M_Leaf_A':'M_BO_Leaf','M_Bark_A':'M_BO_Bark','M_Signal_Off':'M_BO_Signal_Off'}
def B(p):x,y,z=p;return(-x,-z,y)
def U(p):x,y,z=p;return(-x,z,-y)
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def mul(a,s):return tuple(x*s for x in a)
def patch(i):
 x=i%4;y=i//4
 return [(x/4+.012,1-(y+1)/4+.012),((x+1)/4-.012,1-(y+1)/4+.012),((x+1)/4-.012,1-y/4-.012),(x/4+.012,1-y/4-.012)]
class Geo:
 def __init__(self,name,origin=(0,0,0)):
  self.name=name;self.origin=origin;self.v=[];self.f=[];self.uv=[];self.mi=[];self.mats=[]
 def face(self,points,mat,cell=None,uv=None):
  mat=({1:'M_BO_Cabin_Dark',3:'M_BO_Metal',6:'M_BO_Marker',8:'M_BO_Fabric',9:'M_BO_Cabin_Trim'}.get(cell,'M_BO_Cabin_Dark') if mat=='M_Cockpit' else ALIAS.get(mat,mat))
  start=len(self.v);self.v.extend([B(tuple(p[i]-self.origin[i] for i in range(3))) for p in points]);self.f.append(tuple(range(start,start+len(points))))
  if mat not in self.mats:self.mats.append(mat)
  self.mi.append(self.mats.index(mat));self.uv.append(uv or (patch(cell) if cell is not None else [(0,0),(1,0),(1,1),(0,1)])[:len(points)])
 def box(self,c,s,mat='M_Cockpit',cell=0):
  x,y,z=c;a,b,d=[v/2 for v in s]
  vs=[(x-a,y-b,z-d),(x+a,y-b,z-d),(x+a,y+b,z-d),(x-a,y+b,z-d),(x-a,y-b,z+d),(x+a,y-b,z+d),(x+a,y+b,z+d),(x-a,y+b,z+d)]
  for inds in [(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(0,1,5,4),(3,7,6,2)]:self.face([vs[i] for i in inds],mat,cell)
 def rod(self,a,b,r,mat='M_Cockpit',cell=0,n=10,r2=None):
  aa=Vector(a);bb=Vector(b);w=(bb-aa).normalized();u=w.cross(Vector((0,1,0)))
  if u.length<.001:u=w.cross(Vector((1,0,0)))
  u.normalize();v=w.cross(u);r2=r if r2 is None else r2
  rings=[[tuple(c+(u*math.cos(i*2*math.pi/n)+v*math.sin(i*2*math.pi/n))*rr) for i in range(n)] for c,rr in [(aa,r),(bb,r2)]]
  for i in range(n):j=(i+1)%n;self.face([rings[0][i],rings[0][j],rings[1][j],rings[1][i]],mat,cell)
  for ring in rings:
   for i in range(1,n-1):self.face([ring[0],ring[i],ring[i+1]],mat,cell)
 def mirror_housing(self,c,w,h):
  eye=Vector((-.37,1.22,-.30));n=(eye-Vector(c)).normalized();up=Vector((0,1,0));v=(up-n*up.dot(n)).normalized();u=n.cross(v).normalized();center=Vector(c)-n*.03
  verts=[tuple(center+u*x*w/2+v*y*h/2+n*z*.025) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
  for inds in [(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(0,1,5,4),(3,7,6,2)]:self.face([verts[i] for i in inds],'M_Cockpit',1)
 def profile(self,x0,x1,yz,mat='M_Cockpit',cell=0):
  for i in range(len(yz)):
   a,b=yz[i],yz[(i+1)%len(yz)];self.face([(x0,*a),(x1,*a),(x1,*b),(x0,*b)],mat,cell)
  for x in [x0,x1]:
   ring=[Vector((x,y,z)) for y,z in yz]
   for tri in tessellate_polygon([ring]):self.face([tuple(ring[p]) if isinstance(p,int) else tuple(p) for p in tri],mat,cell)
 def panel(self,center,width,height,mat,cell=None,normal=(0,0,-1),up=(0,1,0)):
  c=Vector(center);n=Vector(normal).normalized();v=Vector(up);v=(v-n*v.dot(n)).normalized();u=n.cross(v).normalized()
  # u points right to a person looking at the front of the panel.
  pts=[c-u*width/2-v*height/2,c+u*width/2-v*height/2,c+u*width/2+v*height/2,c-u*width/2+v*height/2]
  self.face([tuple(p) for p in pts],mat,cell)
 def finish(self):
  mesh=bpy.data.meshes.new('BO_'+self.name);mesh.from_pydata(self.v,[],self.f);mesh.update()
  for name in self.mats:mesh.materials.append(M[name])
  uv=mesh.uv_layers.new(name='UVMap')
  for p,coords,idx in zip(mesh.polygons,self.uv,self.mi):
   p.material_index=idx
   for j,li in enumerate(p.loop_indices):uv.data[li].uv=coords[j%len(coords)]
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-7);bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
  for face in bm.faces:
   if self.name.startswith(('Road_','Marking_','Sidewalk_')) and face.normal.z<0:face.normal_flip()
   elif self.name.startswith('Curb_'):
    if abs(face.normal.z)>.5:
     if face.normal.z<0:face.normal_flip()
    else:
     p=U(face.calc_center_median());cx=math.copysign(12.5,p[0]);cz=math.copysign(9,p[2]);toward=Vector(B((p[0]-cx,0,p[2]-cz)))
     if face.normal.dot(toward)<0:face.normal_flip()
   elif self.name.startswith('MirrorGlass_'):
    toward=Vector(B(tuple(a-b for a,b in zip((-.37,1.22,-.30),self.origin))))
    if face.normal.dot(toward)<0:face.normal_flip()
   elif self.name.endswith(('_LeftArrow','_left_arrow')) and face.normal.y<0:face.normal_flip()
  bm.to_mesh(mesh);bm.free()
  obj=bpy.data.objects.new('BO_'+self.name,mesh);scene.collection.objects.link(obj);obj.location=B(self.origin)
  return obj

exports={}; report={'status':'PROVISIONAL; Blender-exported; NOT Unity-verified','referenceCommit':'f80c00d8e63e30745a1e6af5cfe52c46da1b6356','layoutSHA256':hashlib.sha256((SRC/'TestTownLayout.reference.json').read_bytes()).hexdigest(),'assets':[]}
def export(rel,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 dest=ART/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 bpy.ops.export_scene.fbx(filepath=str(dest),use_selection=True,object_types={'MESH','EMPTY'},global_scale=1,apply_unit_scale=True,apply_scale_options='FBX_SCALE_ALL',axis_forward='-Z',axis_up='Y',use_space_transform=True,bake_space_transform=True,use_mesh_modifiers=True,mesh_smooth_type='FACE',use_tspace=False,use_triangles=True,bake_anim=False,add_leaf_bones=False,use_custom_props=False,path_mode='STRIP',embed_textures=False)
 rows=[]
 for o in objects:
  
  if o.type=='MESH':o.data.calc_loop_triangles()
  count=len(o.data.loop_triangles) if o.type=='MESH' else 0
  rows.append({'name':o.name,'triangles':count,'originUnity':list(U(o.location)),'materials':[s.name for s in o.data.materials] if o.type=='MESH' else []})
 exports[rel]=objects;report['assets'].append({'file':str(dest.relative_to(ROOT)),'triangles':sum(r['triangles'] for r in rows),'objects':rows})

cab=[]
def finish(g):o=g.finish();cab.append(o);return o
g=Geo('Interior_Dashboard')
g.profile(-.79,.79,[(.67,.40),(.67,.98),(.94,1.02),(1.03,.93),(1.065,.68),(1.02,.44)],cell=0)
g.profile(-.77,.77,[(.86,.43),(.87,.48),(.90,.49),(.91,.44)],cell=3)
# Cluster hood lowered around the panel; windshield base stays below 1.06 at z>=.8.
g.profile(-.62,-.12,[(1.04,.40),(1.15,.51),(1.15,.63),(1.04,.70)],cell=1)
g.rod((-.37,.73,.39),(-.37,.90,.12),.045,cell=1,n=12)
finish(g)
g=Geo('Interior_Seats')
for x in [-.4,.4]:
 g.profile(x-.23,x+.23,[(.38,-1),(.38,-.42),(.49,-.37),(.55,-.43),(.55,-.93),(.48,-1.02)],cell=8)
 g.profile(x-.23,x+.23,[(.5,-1.02),(1.15,-.88),(1.19,-.79),(1.11,-.68),(.55,-.85)],cell=8)
 g.box((x,1.23,-.84),(.30,.19,.13),cell=0)
 for xx in [x-.09,x+.09]:g.rod((xx,1.12,-.84),(xx,1.22,-.84),.008,cell=3,n=6)
finish(g)
g=Geo('Interior_Doors')
for x in [-.83,.83]:
 g.profile(x-.035,x+.035,[(.43,-1.19),(.97,-1.19),(1.02,.73),(.84,.94),(.43,.89)],cell=0)
 g.box((x*.96,.73,-.12),(.07,.10,.7),cell=4)
 # Side mirror housing and stem stay within the 2.10 m envelope.
 g.rod((x,.99,.64),(math.copysign(.98,x),1.015,.56),.017,cell=1,n=8)
 g.mirror_housing((math.copysign(1,x),1.02,.55),.19,.13)
finish(g)
g=Geo('Interior_Headliner');g.box((0,1.465,-.43),(1.5,.04,2.04),cell=9);finish(g)
g=Geo('Interior_Pillars')
for sign in [-1,1]:
 g.rod((sign*.79,1.0,.99),(sign*.67,1.445,.59),.026,cell=9,n=8)
 g.rod((sign*.80,.87,-.78),(sign*.74,1.44,-.80),.025,cell=9,n=8)
g.rod((-.67,1.445,.59),(.67,1.445,.59),.025,cell=9,n=8);finish(g)
g=Geo('Interior_Console')
g.profile(-.15,.15,[(.35,-.9),(.35,.55),(.67,.55),(.72,.20),(.54,-.25),(.54,-.9)],cell=0)
finish(g)
g=Geo('Glass_Interior')
g.face([(-.77,1.02,1.01),(.77,1.02,1.01),(.65,1.44,.61),(-.65,1.44,.61)],'M_CabinGlass')
for x in [-.83,.83]:g.face([(x,1.01,.69),(x,1.01,-1.15),(x*.87,1.43,-1.16),(x*.8,1.43,.55)],'M_CabinGlass')
finish(g)
center=(-.37,.90,.12);g=Geo('SteeringWheel',center)
theta=math.radians(22);up=Vector((0,math.cos(theta),math.sin(theta)));right=Vector((1,0,0));normal=right.cross(up)
for i in range(48):
 for j in range(8):
  pts=[]
  for ii,jj in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]:
   a=ii/48*2*math.pi;b=jj/8*2*math.pi;rad=right*math.cos(a)+up*math.sin(a)
   pts.append(tuple(Vector(center)+rad*(.19+.015*math.cos(b))+normal*(.015*math.sin(b))))
  g.face(pts,'M_Cockpit',6 if i in [11,12] else 1)
for a in [0,math.pi,math.pi*1.5]:
 endpoint=Vector(center)+(right*math.cos(a)+up*math.sin(a))*.176
 g.rod(center,tuple(endpoint),.018,cell=2,n=8)
g.rod(tuple(Vector(center)-normal*.02),tuple(Vector(center)+normal*.02),.063,cell=1,n=16);finish(g)
normal=(0,math.sin(math.radians(12)),-math.cos(math.radians(12)))
g=Geo('Cluster_Panel',(-.37,1.09,.47));g.panel((-.45,1.091,.464),.145,.145,'M_Cluster',normal=normal);g.panel((-.37,1.09,.475),.4,.16,'M_Cockpit',cell=1,normal=normal);finish(g)
g=Geo('Cluster_Display',(-.29,1.09,.47));g.panel((-.29,1.09,.461),.16,.08,'M_ClusterDisplay',normal=normal);finish(g)
g=Geo('Cluster_Needle',(-.45,1.091,.464))
g.face([(-.454,1.086,.460),(-.450,1.150,.473),(-.446,1.086,.460)],'M_Cockpit',6,uv=[(.51,.51),(.52,.52),(.53,.51)]);finish(g)
eye=Vector((-.37,1.22,-.30))
for suffix,c,w,h in [('Rear',(0,1.4,.62),.26,.065),('Left',(-1,1.02,.55),.16,.10),('Right',(1,1.02,.55),.16,.10)]:
 g=Geo('MirrorGlass_'+suffix,c);g.panel(c,w,h,'M_MirrorGlass',normal=tuple(eye-Vector(c)));finish(g)
g=Geo('Interior_MirrorHousing_Rear');g.mirror_housing((0,1.4,.62),.29,.088);g.rod((0,1.44,.67),(0,1.40,.64),.012,cell=1,n=8);finish(g)
for s,x in [('L',-.50),('R',.12)]:
 p=(x,1,.975);end=(x,1.384,.687);g=Geo('Interior_Wiper_'+s,p);g.rod(p,end,.006,cell=1,n=6);g.rod((x-.13,end[1],end[2]),(x+.13,end[1],end[2]),.007,cell=1,n=6);finish(g)
for name,x in [('Indicator_L',-.54),('Indicator_R',-.20),('ParkingBrake',-.29)]:
 g=Geo('Lamp_Dash_'+name);g.panel((x,1.145,.464),.014,.008,'M_DashLamp_Off',normal=normal);finish(g)
for name,c in [('DriverEye',(-.37,1.22,-.30)),('SteeringWheelPivot',(-.37,.90,.12)),('Mirror_Rear',(0,1.40,.62)),('Mirror_Left',(-1,1.02,.55)),('Mirror_Right',(1,1.02,.55))]:
 obj=bpy.data.objects.new('BO_'+name,None);scene.collection.objects.link(obj);obj.location=B(c);obj.empty_display_size=.05;cab.append(obj)
export('Blockout/SM_BO_Cockpit.fbx',cab)

road=Geo('Road_X0');side=Geo('Sidewalk_X0');curb=Geo('Curb_X0');white=Geo('Marking_X0_White');yellow=Geo('Marking_X0_Yellow')
def rect(g,x0,z0,x1,z1,y,mat,tile=False):
 uv=[(x0/4,z0/4),(x1/4,z0/4),(x1/4,z1/4),(x0/4,z1/4)] if tile else None
 g.face([(x0,y,z0),(x1,y,z0),(x1,y,z1),(x0,y,z1)],mat,uv=uv)
rect(road,-6.5,-40,6.5,40,0,'M_Asphalt_A',True)
rect(road,-40,-3,-6.5,3,0,'M_Asphalt_A',True);rect(road,6.5,-3,40,3,0,'M_Asphalt_A',True)
for corner in layout['corners']:
 if not corner['id'].startswith('X0_'):continue
 cx,cz=corner['center'];sx=1 if cx>0 else -1;sz=1 if cz>0 else -1;r=corner['radius']
 # Canonical NE arc from road-side west point to road-side south point, mirrored per quadrant.
 pts=[(sx*(abs(cx)+r*math.cos(math.pi+i*math.pi/2/24)),sz*(abs(cz)+r*math.sin(math.pi+i*math.pi/2/24))) for i in range(25)]
 inner=(sx*6.5,sz*3)
 for a,b in zip(pts,pts[1:]):
  road.face([(inner[0],0,inner[1]),(a[0],0,a[1]),(b[0],0,b[1])],'M_Asphalt_A',uv=[(inner[0]/4,inner[1]/4),(a[0]/4,a[1]/4),(b[0]/4,b[1]/4)])
 # Constant-width sidewalk ring follows the authoritative radius instead of square corners.
 outer=[(sx*(abs(cx)+(r-3)*math.cos(math.pi+i*math.pi/2/24)),sz*(abs(cz)+(r-3)*math.sin(math.pi+i*math.pi/2/24))) for i in range(25)]
 # The block ground closes the visual gap behind the walk; it is not a new collider.
 block=Geo('Sidewalk_BlockGround_'+corner['id'])
 poly=outer+[(sx*40,sz*6),(sx*40,(40 if sz>0 else -40)),(sx*9.5,(40 if sz>0 else -40))]
 ring=[Vector((x,.15,z)) for x,z in poly]
 for tri in tessellate_polygon([ring]):
  block.face([tuple(ring[p]) if isinstance(p,int) else tuple(p) for p in tri],'M_Curb_A',uv=[(0,0),(1,0),(1,1)])
 # Store with the sidewalks as world-coordinate visual geometry.
 if 'blockgrounds' not in globals():blockgrounds=[]
 blockgrounds.append(block.finish())
 for a,b,c,d in zip(pts,pts[1:],outer,outer[1:]):
  side.face([(a[0],.15,a[1]),(b[0],.15,b[1]),(d[0],.15,d[1]),(c[0],.15,c[1])],'M_Pavers_A',uv=[(a[0]/4,a[1]/4),(b[0]/4,b[1]/4),(d[0]/4,d[1]/4),(c[0]/4,c[1]/4)])
  curb.face([(a[0],0,a[1]),(b[0],0,b[1]),(b[0],.15,b[1]),(a[0],.15,a[1])],'M_Curb_A')
 # Straight continuations to the clipped ends; 0.2 m curb is part of the 3 m walk.
 zlim=40 if sz>0 else -40
 rect(side,*[min(sx*6.5,sx*9.5),min(cz,zlim),max(sx*6.5,sx*9.5),max(cz,zlim)],.15,'M_Pavers_A',True)
 rect(side,min(cx,sx*40),min(sz*3,sz*6),max(cx,sx*40),max(sz*3,sz*6),.15,'M_Pavers_A',True)
 # Curb edge strips and front faces, without collision proxies.
 for a,b in [((sx*6.5,cz),(sx*6.5,zlim)),((cx,sz*3),(sx*40,sz*3))]:
  curb.face([(a[0],0,a[1]),(b[0],0,b[1]),(b[0],.15,b[1]),(a[0],.15,a[1])],'M_Curb_A')
  nx=.2*sx if a[0]==b[0] else 0;nz=.2*sz if a[1]==b[1] else 0
  curb.face([(a[0],.1505,a[1]),(b[0],.1505,b[1]),(b[0]+nx,.1505,b[1]+nz),(a[0]+nx,.1505,a[1]+nz)],'M_Curb_A')
for cw in layout['crosswalks']:
 p=cw['points'];x0,x1=min(p[::2]),max(p[::2]);z0,z1=min(p[1::2]),max(p[1::2]);step=cw['stripeWidth']+cw['stripeGap']
 if cw['stripeAxis']=='z':
  t=x0
  while t<x1:rect(white,t,z0,min(t+cw['stripeWidth'],x1),z1,.005,'M_Marking_White');t+=step
 else:
  t=z0
  while t<z1:rect(white,x0,t,x1,min(t+cw['stripeWidth'],z1),.005,'M_Marking_White');t+=step
for sl in layout['stopLines']:
 if sl['intersection']!='X0':continue
 p=sl['points'];rect(white,min(p[::2]),min(p[1::2]),max(p[::2]),max(p[1::2]),.005,'M_Marking_White')
for line in layout['laneMarkings']:
 if not line['id'].startswith(('Main_','Cross_')):continue
 lo,hi=(-40,40) if line['axis']=='z' else(-40,40)
 start=max(lo,line['from']);end=min(hi,line['to']);w=line['width'];off=line['offset'];dash=line['dash'];gap=line['gap'];g=yellow if line['type'].startswith('yellow') else white;mat='M_Marking_Yellow' if g is yellow else 'M_Marking_White'
 # Preserve the source dash phase even when the slice clips its first segment.
 t=line['from'] if dash else start
 while t<end:
  a=max(t,start);b=min(t+dash,end) if dash else end
  if b>a:
   if line['axis']=='z':rect(g,off-w/2,a,off+w/2,b,.005,mat)
   else:rect(g,a,off-w/2,b,off+w/2,.005,mat)
  if not dash:break
  t+=dash+gap
town=[road.finish(),white.finish(),yellow.finish()]
town += [side.finish(),curb.finish()]+blockgrounds


# Eight massing buildings. Flat ground-floor windows/sign blocks only; no textures or LODs.
for sx,sz,quadrant in [(1,1,'NE'),(-1,1,'NW'),(1,-1,'SE'),(-1,-1,'SW')]:
 for row,(xabs,zabs,w,d,h) in enumerate([(19,22,12,10,10.2),(19,35,12,8,13.4)]):
  x=sx*xabs;z=sz*zabs;g=Geo('Bldg_'+quadrant+'_'+str(row+1));material=['M_BO_Building','M_BO_Brick','M_BO_Concrete'][(row+(sx>0)+(sz>0))%3]
  g.box((x,.15+h/2,z),(w,h,d),material)
  g.box((x,h+.23,z),(w+.15,.16,d+.15),'M_BO_Concrete')
  for face in ['main','cross']:
   normal=(-sx,0,0) if face=='main' else(0,0,-sz)
   for floor in range(int(h/3.3)):
    for col in [-1,0,1]:
     c=(x-sx*(w/2+.012),1.6+floor*3.3,z+col*2.5) if face=='main' else(x+col*3.1,1.6+floor*3.3,z-sz*(d/2+.012))
     g.panel(c,1.8,1.5,'M_BO_Window',normal=normal)
   c=(x-sx*(w/2+.025),3.05,z) if face=='main' else(x,3.05,z-sz*(d/2+.025))
   g.panel(c,(d if face=='main' else w)-1,.65,'M_BO_Sign',normal=normal)
  town.append(g.finish())
# Basic sparse street props stay out of all decoration keep-outs.
for sx,sz in [(1,1),(-1,1),(1,-1),(-1,-1)]:
 x=sx*7;z=sz*33;g=Geo('Prop_Streetlight_'+str(sx)+'_'+str(sz))
 g.rod((x,.15,z),(x,6,z),.06,'M_StreetMetal',n=8)
 g.rod((x,6,z),(x,6,z+.65),.035,'M_StreetMetal',n=8);g.box((x,5.96,z+.65),(.18,.1,.5),'M_StreetMetal');town.append(g.finish())
 g=Geo('Tree_'+str(sx)+'_'+str(sz));tz=sz*25
 g.rod((x,.15,tz),(x,3.6,tz),.06,'M_Bark_A',n=6)
 g.rod((x,2.5,tz),(x,4.1,tz),.33,'M_Leaf_A',n=7,r2=.08);town.append(g.finish())
# Four world-space signal assemblies. Every lens is off; existing gameplay owns state.
for signal in layout['signals']:
 sid=signal['id'];count=len(signal['lamps']);c=Vector(signal['head']);base=Vector(signal['pole'])
 g=Geo('Signal_'+sid+'_PoleArm');g.rod(tuple(base),tuple(base+Vector((0,4.60,0))),.075,'M_StreetMetal',n=8)
 g.rod(tuple(base+Vector((0,4.60,0))),tuple(c),.06,'M_StreetMetal',n=8);town.append(g.finish())
 angle={'NB':0,'SB':math.pi,'EB':math.pi/2,'WB':-math.pi/2}[signal['approach']]
 transform=Matrix.Translation(Vector(B(c)))@Matrix.Rotation(-angle,4,'Z')
 g=Geo('Signal_'+sid+'_Housing');g.box((0,0,.04),(count*.28+.08,.38,.17),'M_StreetMetal');o=g.finish();o.data.transform(transform);town.append(o)
 for k,label in enumerate(signal['lamps']):
  x=(k-(count-1)/2)*.28;g=Geo('Signal_'+sid+'_'+label)
  if label=='left_arrow':
   coords=[(-.09,0),(-.015,.065),(-.015,.023),(.082,.023),(.082,-.023),(-.015,-.023),(-.015,-.065)]
   ring=[Vector((x+xx,yy,-.06)) for xx,yy in reversed(coords)]
   for tri in tessellate_polygon([ring]):g.face([tuple(ring[p]) if isinstance(p,int) else tuple(p) for p in tri],'M_Signal_Off',uv=[(0,0),(1,0),(1,1)])
  else:g.rod((x,0,-.048),(x,0,-.06),.11,'M_Signal_Off',n=12)
  o=g.finish();o.data.transform(transform);town.append(o)
export('Blockout/SM_BO_Intersection.fbx',town)
allobjects=cab+town
for group,filename in [(cab,'BO_Cockpit.blend'),(town,'BO_Intersection.blend')]:
 for o in allobjects:o.hide_viewport=o not in group;o.hide_render=o not in group
 bpy.ops.wm.save_as_mainfile(filepath=str(SRC/filename),compress=True)
(SRC/'asset-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('BLOCKOUT:',[(a['file'],a['triangles']) for a in report['assets']])
