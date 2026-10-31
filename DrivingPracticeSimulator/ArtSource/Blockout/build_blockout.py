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
'M_BO_Graphite':(.165,.176,.192,1),'M_BO_Plastic':(.086,.094,.106,1),'M_BO_Trim':(.74,.74,.72,1),
'M_ClusterDisplay':(.012,.02,.025,1),'M_MirrorGlass':(.23,.36,.42,1),'M_BO_Glass':(.68,.82,.84,.06),
'M_BO_Asphalt':(.19,.21,.22,1),'M_BO_Pavers':(.61,.59,.55,1),'M_BO_Curb':(.73,.73,.69,1),'M_BO_White':(.94,.95,.92,1),'M_BO_Yellow':(.99,.72,.10,1),
'M_BO_Building':(.74,.71,.63,1),'M_BO_Brick':(.66,.57,.49,1),'M_BO_Concrete':(.66,.71,.72,1),'M_BO_Window':(.27,.46,.57,1),'M_BO_Sign':(.11,.40,.45,1),
'M_BO_StreetMetal':(.30,.36,.37,1),'M_BO_Leaf':(.36,.53,.20,1),'M_BO_Bark':(.46,.34,.23,1),'M_BO_Signal_Off':(.025,.04,.035,1),
'M_BO_BusBlue':(.06,.28,.66,1),'M_BO_CarPaint':(.83,.86,.86,1),'M_BO_Tire':(.09,.10,.11,1),'M_BO_Red':(.65,.20,.16,1)}
M={};manifest={'materials':[]}
for name,color_srgb in colors.items():
 color=tuple((v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for v in color_srgb[:3])+(color_srgb[3],)
 transparent=name=='M_BO_Glass'
 manifest['materials'].append(dict(name=name,shader='simplelit',surface='transparent' if transparent else 'opaque',baseColor=list(color),baseMap='',normalMap='',maskMap='',emissionMap='',emissionColor=[0,0,0],smoothness=.15,metallic=0,doubleSided=transparent))
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=color;b.inputs['Roughness'].default_value=.85;b.inputs['Alpha'].default_value=color[3]
 if transparent:m.surface_render_method='DITHERED'
 M[name]=m
(OUT/'materials.json').write_text(json.dumps(manifest,indent=2)+'\n')
ALIAS={'M_Cluster':'M_BO_Plastic','M_ClusterDisplay':'M_ClusterDisplay','M_MirrorGlass':'M_MirrorGlass','M_CabinGlass':'M_BO_Glass','M_DashLamp_Off':'M_BO_Plastic','M_Asphalt_A':'M_BO_Asphalt','M_Pavers_A':'M_BO_Pavers','M_Curb_A':'M_BO_Curb','M_Marking_White':'M_BO_White','M_Marking_Yellow':'M_BO_Yellow','M_StreetMetal':'M_BO_StreetMetal','M_Leaf_A':'M_BO_Leaf','M_Bark_A':'M_BO_Bark','M_Signal_Off':'M_BO_Signal_Off'}
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
  mat=({1:'M_BO_Plastic',3:'M_BO_Trim',6:'M_BO_Trim',8:'M_BO_Graphite',9:'M_BO_Trim'}.get(cell,'M_BO_Graphite') if mat=='M_Cockpit' else ALIAS.get(mat,mat))
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
 def softbox(self,c,size,r=.01,mat='M_Cockpit',cell=0):
  # Eight-sided rounded rectangle extruded in height, with bevelled top/bottom rings.
  x,y,z=c;w,h,d=size;r=min(r,w/4,h/4,d/4)
  rings=[]
  for yy,inset in [(y-h/2,r),(y-h/2+r,0),(y+h/2-r,0),(y+h/2,r)]:
   ring=[]
   for cx,cz,start in [(x+w/2-r,z+d/2-r,0),(x-w/2+r,z+d/2-r,90),(x-w/2+r,z-d/2+r,180),(x+w/2-r,z-d/2+r,270)]:
    for j in range(3):
     a=math.radians(start+j*45);px=cx+math.cos(a)*max(.0001,r-inset);pz=cz+math.sin(a)*max(.0001,r-inset);ring.append((px,yy,pz))
   rings.append(ring)
  for a,b in zip(rings,rings[1:]):
   for i in range(12):j=(i+1)%12;self.face([a[i],a[j],b[j],b[i]],mat,cell)
  for ring in [rings[0],rings[-1]]:
   for i in range(1,11):self.face([ring[0],ring[i],ring[i+1]],mat,cell)
 def loft(self,sections,mat='M_Cockpit',cell=0):
  for a,b in zip(sections,sections[1:]):
   for i in range(len(a)):j=(i+1)%len(a);self.face([a[i],b[i],b[j],a[j]],mat,cell)
  for ring in [sections[0],sections[-1]]:
   pts=[Vector(p) for p in ring]
   for tri in tessellate_polygon([pts]):self.face([tuple(pts[i]) if isinstance(i,int) else tuple(i) for i in tri],mat,cell)
 def disk(self,center,radius,mat,normal=(0,.207912,-.978148),segments=40):
  c=Vector(center);n=Vector(normal).normalized();up=Vector((0,1,0));v=(up-n*up.dot(n)).normalized();u=n.cross(v).normalized()
  for i in range(segments):
   a=2*math.pi*i/segments;b=2*math.pi*(i+1)/segments
   self.face([tuple(c),tuple(c+u*math.cos(a)*radius+v*math.sin(a)*radius),tuple(c+u*math.cos(b)*radius+v*math.sin(b)*radius)],mat)
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

exports={}; report={'status':'PROVISIONAL; Blender-exported; NOT Unity-verified','referenceCommit':'448695c49605d26f2511583af7573c782c802251','layoutSHA256':hashlib.sha256((SRC/'TestTownLayout.reference.json').read_bytes()).hexdigest(),'assets':[]}
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
# Continuous, softly formed top pad, connected to the full-width windshield base.
g=Geo('Interior_Dashboard');sections=[]
for x in [-.81,-.75,-.62,-.38,-.12,.14,.42,.67,.78,.81]:
 crown=.018*(1-(x/.82)**2)
 yz=[(.64,.34),(.66,.96),(.92,1.04),(.97,.98),(1.005+crown,.83),(1.0+crown,.62),(.965,.44),(.88,.34)]
 sections.append([(x,y,z) for y,z in yz])
g.loft(sections);g.profile(-.79,.79,[(.86,.335),(.87,.35),(.89,.35),(.885,.335)],cell=3)
# Cluster hood: curved eyebrow with a tapered back, not a freestanding cube.
hood=[]
for z,width,height in [(.40,.25,.085),(.43,.25,.092),(.61,.22,.07),(.75,.20,.025)]:
 ring=[]
 for i in range(17):
  a=math.pi*i/16;ring.append((-.29+width*math.cos(a),1.075+height*math.sin(a),z))
 ring += [(-.29+(width-.008)*math.cos(math.pi*i/16),1.075+(height-.008)*math.sin(math.pi*i/16),z) for i in reversed(range(17))]
 hood.append(ring)
g.loft(hood,cell=1)
g.rod((-.37,.73,.39),(-.37,.90,.12),.045,cell=1,n=12)
# Basic center stack, screen blank, vents and control shapes, no UI or branded details.
g.softbox((.24,.84,.37),(.39,.30,.10),.025,cell=1)
g.panel((.24,.91,.312),.225,.127,'M_BO_Plastic')
for x,y,w in [(-.69,.935,.16),(.68,.935,.16),(.24,1.002,.27)]:
 g.softbox((x,y,.365),(w,.055,.04),.008,cell=1)
 for i in range(3):g.box((x,y-.018+i*.018,.339),(w-.02,.004,.008),cell=3)
g.panel((.24,.795,.31),.028,.022,'M_BO_Trim')
g.panel((.24,.74,.31),.27,.08,'M_BO_Plastic')
for x in [.145,.335]:g.rod((x,.74,.311),(x,.74,.294),.022,cell=3,n=12)
# Cowl lip and defroster slots conceal the resting blades without moving their pivots.
g.profile(-.76,.76,[(.98,.95),(1.046,.98),(1.035,1.08),(.98,1.08)],cell=1)
for x in [-.5,-.25,0,.25,.5]:g.box((x,1.027,.90),(.15,.006,.025),cell=1)
finish(g)
g=Geo('Interior_Seats')
for x in [-.40,.40]:
 g.softbox((x,.45,-.70),(.46,.18,.60),.055,cell=8)
 g.profile(x-.23,x+.23,[(.5,-1.02),(1.13,-.90),(1.19,-.84),(1.15,-.72),(.54,-.83)],cell=8)
 g.softbox((x,1.245,-.84),(.30,.20,.14),.035,cell=8)
 for xx in [x-.08,x+.08]:g.rod((xx,1.12,-.84),(xx,1.22,-.84),.007,cell=3,n=6)
finish(g)
g=Geo('Interior_Doors')
for sign in [-1,1]:
 x=sign*.83;g.profile(x-.026,x+.026,[(.43,-1.16),(.96,-1.16),(.98,.72),(.90,.94),(.43,.94)])
 g.softbox((sign*.795,.73,-.10),(.09,.12,.72),.025,cell=8)
 g.box((sign*.783,.84,.15),(.025,.025,.14),cell=3)
 g.box((sign*.752,.795,.04),(.025,.012,.11),cell=1)
 # Mirror sail belongs to the OUTSIDE of the actual side window, never the dashboard.
 g.face([(sign*.845,.985,.44),(sign*.845,1.14,.61),(sign*.845,.985,.74)],'M_BO_Plastic',uv=[(0,0),(1,1),(1,0)])
 g.rod((sign*.86,1.015,.60),(sign*.98,1.02,.56),.018,cell=1,n=8)
 g.mirror_housing((sign*1.0,1.02,.55),.185,.125)
 # Upper door/window frame connects A-pillar to B-pillar.
 g.rod((sign*.70,1.48,.68),(sign*.77,1.47,-.82),.018,cell=9,n=8)
finish(g)
g=Geo('Interior_Headliner')
# Interior roof crown raised within the 1.52m envelope; remains a real roof, not a cutaway.
g.softbox((0,1.505,-.45),(1.48,.025,2.25),.006,cell=9);finish(g)
g=Geo('Interior_SunVisors')
for x in [-.40,.40]:g.softbox((x,1.475,.58),(.34,.026,.15),.01,cell=9)
finish(g)
g=Geo('Interior_Pillars')
for sign in [-1,1]:
 g.rod((sign*.75,.97,.95),(sign*.70,1.48,.68),.027,cell=9,n=10)
 g.rod((sign*.83,.88,-.82),(sign*.77,1.48,-.82),.028,cell=9,n=8)
g.rod((-.70,1.48,.68),(.70,1.48,.68),.019,cell=9,n=10);finish(g)
g=Geo('Interior_Console')
g.profile(-.14,.14,[(.35,-.90),(.35,.58),(.66,.58),(.72,.25),(.57,-.12),(.54,-.90)])
g.softbox((0,.696,.20),(.23,.018,.28),.006,cell=1)
g.rod((0,.71,.21),(0,.80,.19),.017,cell=1,n=10);g.softbox((0,.81,.19),(.075,.042,.052),.012,cell=1)
for z in [-.15,-.32]:g.rod((0,.555,z),(0,.56,z),.052,cell=1,n=16)
finish(g)
g=Geo('Glass_Interior')
g.face([(-.75,.97,.95),(.75,.97,.95),(.70,1.48,.68),(-.70,1.48,.68)],'M_CabinGlass')
for sign in [-1,1]:g.face([(sign*.844,.985,.74),(sign*.844,.985,-.82),(sign*.77,1.47,-.82),(sign*.70,1.47,.66)],'M_CabinGlass')
finish(g)
center=(-.37,.90,.12);g=Geo('SteeringWheel',center)
theta=math.radians(22);up=Vector((0,math.cos(theta),math.sin(theta)));right=Vector((1,0,0));normal=right.cross(up)
for i in range(64):
 for j in range(10):
  pts=[]
  for ii,jj in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]:
   a=ii/64*2*math.pi;b=jj/10*2*math.pi;rad=right*math.cos(a)+up*math.sin(a)
   pts.append(tuple(Vector(center)+rad*(.174+.016*math.cos(b))+normal*(.016*math.sin(b))))
  g.face(pts,'M_Cockpit',6 if i in [15,16] else 1)
# Broad three-spoke surfaces and airbag hub in the same immutable wheel plane.
for a in [0,math.pi,math.pi*1.5]:
 r=right*math.cos(a)+up*math.sin(a);v=right*(-math.sin(a))+up*math.cos(a)
 pts=[Vector(center)+r*.045-v*.03,Vector(center)+r*.173-v*.016,Vector(center)+r*.173+v*.016,Vector(center)+r*.045+v*.03]
 g.face([tuple(p-normal*.012) for p in pts],'M_BO_Graphite')
 for offset in [-.019,.019]:
  c=Vector(center)+r*.12+v*offset-normal*.017
  g.rod(tuple(c-normal*.001),tuple(c-normal*.009),.009,cell=3,n=8)
g.rod(tuple(Vector(center)-normal*.027),tuple(Vector(center)+normal*.018),.071,cell=1,n=24)
g.rod(tuple(Vector(center)-normal*.029),tuple(Vector(center)-normal*.031),.018,cell=3,n=16)
finish(g)
# Binding origins retained. The spec places speed on the left; no silent pivot relocation.
panel_center=(-.37,1.09,.47);normal=(0,math.sin(math.radians(12)),-math.cos(math.radians(12)))
g=Geo('Cluster_Panel',panel_center)
g.panel((-.29,1.09,.475),.48,.16,'M_BO_Plastic',normal=normal)
for c in [(-.45,1.091,.464),(-.13,1.091,.464)]:
 g.disk(c,.066,'M_BO_Graphite',normal)
 for k in range(25):
  angle=math.radians(-120+k*10);v=Vector((math.sin(angle),math.cos(angle)*math.cos(math.radians(12)),math.cos(angle)*math.sin(math.radians(12))))
  p1=Vector(c)+v*.056;p2=Vector(c)+v*(.064 if k%3 else .067)
  g.rod(tuple(p1+Vector((0,0,-.002))),tuple(p2+Vector((0,0,-.002))),.0012,cell=3,n=4)
finish(g)
g=Geo('Cluster_Display',(-.29,1.09,.47));g.panel((-.29,1.09,.460),.16,.08,'M_ClusterDisplay',normal=normal);finish(g)
for name,c in [('Cluster_Needle_Speed',(-.45,1.091,.464)),('Cluster_Needle_Tach',(-.13,1.091,.464))]:
 g=Geo(name,c);top=Vector(c)+Vector((0,.056*math.cos(math.radians(12)),.056*math.sin(math.radians(12))))
 g.face([(c[0]-.0025,c[1]-.007,c[2]-.004),tuple(top+Vector((0,0,-.004))),(c[0]+.0025,c[1]-.007,c[2]-.004)],'M_BO_Trim',uv=[(0,0),(.5,1),(1,0)]);finish(g)
eye=Vector((-.37,1.22,-.30))
for suffix,c,w,h in [('Rear',(0,1.4,.62),.26,.065),('Left',(-1,1.02,.55),.16,.10),('Right',(1,1.02,.55),.16,.10)]:
 g=Geo('MirrorGlass_'+suffix,c);g.panel(c,w,h,'M_MirrorGlass',normal=tuple(eye-Vector(c)));finish(g)
g=Geo('Interior_MirrorHousing_Rear');g.mirror_housing((0,1.4,.62),.284,.086);g.rod((0,1.47,.68),(0,1.40,.65),.011,cell=1,n=8);finish(g)
# Upright binding geometry is required by ASSET_SPEC; render applies existing -85-degree rest.
for suffix,x in [('L',-.50),('R',.12)]:
 c=(x,1.0,.975);end=(x,1.424,.750);g=Geo('Interior_Wiper_'+suffix,c)
 g.rod(c,(x,1.309,.811),.0055,cell=1,n=6);g.rod((x,1.247,.844),end,.0065,cell=1,n=6);finish(g)
for name,x in [('Indicator_L',-.54),('Indicator_R',-.20),('ParkingBrake',-.29)]:
 g=Geo('Lamp_Dash_'+name);g.panel((x,1.145,.460),.012,.007,'M_DashLamp_Off',normal=normal);finish(g)
g=Geo('Interior_HoodEdge');g.profile(-.79,.79,[(.82,1.10),(.85,1.10),(.84,1.65),(.78,1.85)],cell=0);finish(g)
for name,c in [('DriverEye',(-.37,1.22,-.30)),('SteeringWheelPivot',(-.37,.90,.12)),('Mirror_Rear',(0,1.40,.62)),('Mirror_Left',(-1,1.02,.55)),('Mirror_Right',(1,1.02,.55))]:
 obj=bpy.data.objects.new('BO_'+name,None);scene.collection.objects.link(obj);obj.location=B(c);obj.empty_display_size=.05;cab.append(obj)
# BO_ files, mesh data and a BO_ root keep the pass isolated; transform names remain binding-exact.
for obj in cab:obj.name=obj.name.removeprefix('BO_')
cabroot=bpy.data.objects.new('BO_Cockpit',None);scene.collection.objects.link(cabroot)
for obj in cab:obj.parent=cabroot
cab.append(cabroot)
export('Blockout/SM_BO_Cockpit.fbx',cab)

road=Geo('Road_X0');side=Geo('Sidewalk_X0');curb=Geo('Curb_X0');white=Geo('Marking_X0_White');yellow=Geo('Marking_X0_Yellow')
def rect(g,x0,z0,x1,z1,y,mat,tile=False):
 uv=[(x0/4,z0/4),(x1/4,z0/4),(x1/4,z1/4),(x0/4,z1/4)] if tile else None
 g.face([(x0,y,z0),(x1,y,z0),(x1,y,z1),(x0,y,z1)],mat,uv=uv)
rect(road,-6.5,-60,6.5,60,0,'M_Asphalt_A',True)
rect(road,-60,-3,-6.5,3,0,'M_Asphalt_A',True);rect(road,6.5,-3,60,3,0,'M_Asphalt_A',True)
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
 poly=outer+[(sx*60,sz*6),(sx*60,(60 if sz>0 else -60)),(sx*9.5,(60 if sz>0 else -60))]
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
 zlim=60 if sz>0 else -60
 rect(side,*[min(sx*6.5,sx*9.5),min(cz,zlim),max(sx*6.5,sx*9.5),max(cz,zlim)],.15,'M_Pavers_A',True)
 rect(side,min(cx,sx*60),min(sz*3,sz*6),max(cx,sx*60),max(sz*3,sz*6),.15,'M_Pavers_A',True)
 # Curb edge strips and front faces, without collision proxies.
 for a,b in [((sx*6.5,cz),(sx*6.5,zlim)),((cx,sz*3),(sx*60,sz*3))]:
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
 lo,hi=(-60,60) if line['axis']=='z' else(-60,60)
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


# Eleven coarse urban masses: eight commercial, three apartment backdrops. No LODs/textures.
for sx,sz,quadrant in [(1,1,'NE'),(-1,1,'NW'),(1,-1,'SE'),(-1,-1,'SW')]:
 for row,(xabs,zabs,w,d,h) in enumerate([(20,23,12,14,19.8),(20,46,12,16,26.4)]):
  x=sx*xabs;z=sz*zabs;g=Geo('Bldg_'+quadrant+'_'+str(row+1));material=['M_BO_Building','M_BO_Brick','M_BO_Concrete'][(row+(sx>0)+(sz>0))%3]
  g.box((x,.15+h/2,z),(w,h,d),material);g.box((x,h+.23,z),(w+.15,.16,d+.15),'M_BO_Concrete')
  for face in ['main','cross']:
   normal=(-sx,0,0) if face=='main' else(0,0,-sz)
   for floor in range(int(h/3.3)):
    for col in [-1,0,1]:
     c=(x-sx*(w/2+.012),1.65+floor*3.3,z+col*3.5) if face=='main' else(x+col*3.1,1.65+floor*3.3,z-sz*(d/2+.012))
     g.panel(c,2.2,1.8,'M_BO_Window',normal=normal)
   c=(x-sx*(w/2+.025),3.05,z) if face=='main' else(x,3.05,z-sz*(d/2+.025))
   g.panel(c,(d if face=='main' else w)-1,.70,'M_BO_Sign',normal=normal)
  g.box((x+2,h+.75,z+1),(2.0,1.2,2.4),'M_BO_Concrete');town.append(g.finish())
for i,(x,z,h) in enumerate([(43,42,42.0),(-43,42,45.0),(-43,-43,39.0)]):
 g=Geo('Bldg_Apartment_'+str(i+1));g.box((x,.15+h/2,z),(14,h,12),'M_BO_Concrete')
 for floor in range(int(h/3)):
  for col in [-1,0,1]:g.panel((x+col*3.4,1.6+floor*3,z-6.015),2.0,1.7,'M_BO_Window')
 town.append(g.finish())
# Parked props only, on private forecourts outside roads, crossings and sight triangles.
def parked_vehicle(name,c,length,width,height,paint):
 g=Geo('Prop_Parked_'+name);x,y,z=c
 g.softbox((x,y+.53,z),(width,.63,length),.12,paint)
 g.softbox((x,y+(height+.76)/2,z-.12),(width*.84,height-.76,length*.52),.12,paint)
 g.panel((x,y+(height+.76)/2,z+length*.26+.012),width*.72,.38,'M_BO_Window')
 for sign in [-1,1]:
  g.panel((x+sign*(width*.42+.012),y+(height+.76)/2,z-.12),length*.43,.37,'M_BO_Window',normal=(sign,0,0))
  for zz in [-length*.30,length*.30]:
   g.rod((x+sign*(width/2-.06),y+.31,z+zz),(x+sign*(width/2+.02),y+.31,z+zz),.30,'M_BO_Tire',n=12)
 town.append(g.finish())
for i,c in enumerate([(12,.15,39),(-12,.15,39),(12,.15,-47),(-12,.15,-47)]):parked_vehicle(str(i+1),c,4.4 if i<3 else 4.6,1.76 if i<3 else 1.85,1.48 if i<3 else 1.65,'M_BO_CarPaint')
g=Geo('Prop_Parked_BlueBus');g.softbox((30,1.65,15),(2.45,3.0,10.5),.18,'M_BO_BusBlue')
for sign in [-1,1]:
 for zz in [11.3,13.3,15.3,17.3]:g.panel((30+sign*1.237,2.25,zz),1.65,1.05,'M_BO_Window',normal=(sign,0,0))
 for zz in [11.6,18.4]:g.rod((30+sign*1.18,.68,zz),(30+sign*1.26,.68,zz),.48,'M_BO_Tire',n=12)
g.panel((30,2.15,20.26),2.1,1.4,'M_BO_Window',normal=(0,0,1));town.append(g.finish())
# Basic sparse street props stay out of all decoration keep-outs.
for sx,sz in [(1,1),(-1,1),(1,-1),(-1,-1)]:
 x=sx*7;z=sz*33;g=Geo('Prop_Streetlight_'+str(sx)+'_'+str(sz))
 g.rod((x,.15,z),(x,6,z),.06,'M_StreetMetal',n=8)
 g.rod((x,6,z),(x,6,z+.65),.035,'M_StreetMetal',n=8);g.box((x,5.96,z+.65),(.18,.1,.5),'M_StreetMetal');town.append(g.finish())
# Deciduous crown masses in forecourt planting beds, not oversized road-overhanging cones.
for i,(x,z) in enumerate([(11.5,33),(-11.5,33),(11.5,-33),(-11.5,-33),(35,9),(-35,9),(35,-9),(-35,-9)]):
 g=Geo('Tree_Forecourt_'+str(i+1));g.rod((x,.15,z),(x,3.9,z),.11,'M_Bark_A',n=8,r2=.055)
 rings=[]
 for y,radius in [(2.8,.55),(3.3,1.05),(4.1,1.20),(4.9,.90),(5.3,.12)]:
  rings.append([(x+radius*math.cos(k*math.pi/4),y,z+radius*math.sin(k*math.pi/4)) for k in range(8)])
 g.loft(rings,'M_Leaf_A');town.append(g.finish())
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
for obj in town:obj.name=obj.name.removeprefix('BO_')
townroot=bpy.data.objects.new('BO_Intersection',None);scene.collection.objects.link(townroot)
for obj in town:obj.parent=townroot
town.append(townroot)
export('Blockout/SM_BO_Intersection.fbx',town)
allobjects=cab+town
for group,filename in [(cab,'BO_Cockpit.blend'),(town,'BO_Intersection.blend')]:
 for o in allobjects:o.hide_viewport=o not in group;o.hide_render=o not in group
 bpy.ops.wm.save_as_mainfile(filepath=str(SRC/filename),compress=True)
(SRC/'asset-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('BLOCKOUT:',[(a['file'],a['triangles']) for a in report['assets']])
