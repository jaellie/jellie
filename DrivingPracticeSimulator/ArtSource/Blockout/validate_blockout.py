"""Blender-only asset and driver-eye inspection. No Unity validation claims."""
from pathlib import Path
import bpy,json,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
SRC=Path(__file__).resolve().parent;ROOT=SRC.parents[1];OUT=ROOT/'Assets/DrivingSim/Art/Blockout'
def B(p):x,y,z=p;return Vector((-x,-z,y))
def U(p):return(-p.x,p.z,-p.y)
def near(a,b):return max(abs(x-y) for x,y in zip(a,b))<.001
manifest=json.loads((OUT/'materials.json').read_text())['materials'];known={m['name'] for m in manifest}
assert len(known)==len(manifest)
for m in manifest:
 assert m['shader']=='simplelit'
 assert not any(m[k] for k in ['baseMap','normalMap','maskMap','emissionMap'])
assert not list(OUT.rglob('*.png')) and not list(OUT.rglob('*.blend'))
bpy.ops.wm.open_mainfile(filepath=str(SRC/'BO_Cockpit.blend'))
source={};eye=B((-.37,1.22,-.30));opaque=[]
for obj in bpy.context.scene.objects:
 assert obj.name.startswith('BO_') and '_LOD' not in obj.name
 assert all(abs(v)<1e-6 for v in obj.rotation_euler) and near(obj.scale,(1,1,1))
 assert obj.type in ['MESH','EMPTY'] and not obj.modifiers
 row={'origin':U(obj.location),'type':obj.type}
 if obj.type=='MESH':
  pts=[obj.matrix_world@v.co for v in obj.data.vertices]
  row['bounds']=([min(p[i] for p in pts) for i in range(3)],[max(p[i] for p in pts) for i in range(3)])
  if obj.name.startswith(('BO_Interior_','BO_SteeringWheel','BO_Cluster','BO_Lamp_')):
   opaque.append(obj)
 source[obj.name]=row
positions={'BO_DriverEye':(-.37,1.22,-.30),'BO_SteeringWheel':(-.37,.90,.12),'BO_SteeringWheelPivot':(-.37,.90,.12),'BO_Cluster_Panel':(-.37,1.09,.47),'BO_Cluster_Needle':(-.45,1.091,.464),'BO_MirrorGlass_Rear':(0,1.4,.62),'BO_MirrorGlass_Left':(-1,1.02,.55),'BO_MirrorGlass_Right':(1,1.02,.55)}
for name,pos in positions.items():assert near(source[name]['origin'],pos),(name,source[name])
verts=[];faces=[]
for obj in opaque:
 n=len(verts);verts.extend([obj.matrix_world@v.co for v in obj.data.vertices]);faces.extend([tuple(n+i for i in p.vertices) for p in obj.data.polygons])
tree=BVHTree.FromPolygons(verts,faces);nearest=tree.find_nearest(eye);assert nearest[3]>=.10
# Transparent glazing ignored for physical sightline tests; static wipers kept in mandated up pose.
targets={'wheel_rim_top':(-.37,.90+.19*math.cos(math.radians(22)),.12+.19*math.sin(math.radians(22))),'wheel_center':(-.37,.90,.12),'cluster_center':(-.37,1.09,.47),'mirror_rear':(0,1.4,.62),'mirror_left':(-1,1.02,.55),'mirror_right':(1,1.02,.55)}
approach=(4.875,0,-35)
worldtargets={'road_center_X0':(4.875,0,0),'crosswalk_S_near':(3.25,.005,-14),'crosswalk_S_far':(3.25,.005,-10),'crosswalk_N':(3.25,.005,12),'signal_NB':(3.25,4.75,15.5),'stop_line_NB':(3.35,.005,-16.225)}
for key,p in worldtargets.items():targets[key]=tuple(p[i]-approach[i] for i in range(3))
sightlines={}
for key,p in targets.items():
 delta=B(p)-eye;dist=delta.length;hit=tree.ray_cast(eye,delta.normalized(),max(0,dist-.04))
 # Wheel, cluster and mirror endpoints naturally sit on their own visual surfaces.
 delta_u=Vector(p)-Vector((-.37,1.22,-.30));yaw=math.degrees(math.atan2(delta_u.x,delta_u.z));pitch=math.degrees(math.atan2(delta_u.y,math.hypot(delta_u.x,delta_u.z)))+4;half_h=math.degrees(math.atan(math.tan(math.radians(65/2))*20/9))
 sightlines[key]={'targetLocalUnity':p,'clearBeforeTarget':hit[0] is None,'firstHitDistance':hit[3] if hit[0] is not None else None,'yawFromStraightAheadDegrees':yaw,'pitchFromCameraDegrees':pitch,'withinDefault20x9Frustum':abs(yaw)<=half_h and abs(pitch)<=32.5}
close_target=Vector((3.25-4.875,.005,-14+23));delta=B(close_target)-eye;hit=tree.ray_cast(eye,delta.normalized(),delta.length-.04)
near_crosswalk={'vehicleZ':-23,'targetUnity':[3.25,.005,-14],'clearBeforeTarget':hit[0] is None,'note':'Central near-road may be masked by the exact cluster geometry; review in Unity before changing specified anchors/dimensions.'}
layout=json.loads((SRC/'TestTownLayout.reference.json').read_text())
def intersects(a,b):
 for poly in [a,b]:
  for i,p in enumerate(poly):
   q=poly[(i+1)%len(poly)];nx,nz=-(q[1]-p[1]),q[0]-p[0]
   if abs(nx)+abs(nz)<1e-10:continue
   aa=[x*nx+z*nz for x,z in a];bb=[x*nx+z*nz for x,z in b]
   if max(aa)<min(bb)+1e-6 or max(bb)<min(aa)+1e-6:return False
 return True
report=json.loads((SRC/'asset-report.json').read_text());checks=[];decor=0
for asset in report['assets']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.fbx(filepath=str(ROOT/asset['file']),use_image_search=False);bpy.context.view_layer.update()
 objects={o.name:o for o in bpy.context.scene.objects};assert set(objects)=={r['name'] for r in asset['objects']}
 materials=set()
 for row in asset['objects']:
  o=objects[row['name']];assert near(U(o.location),source[o.name]['origin'])
  if o.type=='EMPTY':continue
  assert o.type=='MESH';o.data.calc_loop_triangles();assert len(o.data.loop_triangles)==row['triangles']
  assert o.data.uv_layers
  assert set(m.name for m in o.data.materials)<=known;materials.update(m.name for m in o.data.materials)
  pts=[o.matrix_world@v.co for v in o.data.vertices];bounds=([min(p[i] for p in pts) for i in range(3)],[max(p[i] for p in pts) for i in range(3)])
  assert all(near(a,b) for a,b in zip(bounds,source[o.name]['bounds'])),o.name
  if o.name.startswith(('BO_Road_','BO_Marking_','BO_Sidewalk_')):assert all((o.matrix_world.to_3x3()@p.normal).z>.99 for p in o.data.polygons),o.name
  if o.name.startswith(('BO_Bldg_','BO_Prop_','BO_Tree_')):
   for tri in o.data.loop_triangles:
    coords=[U(o.matrix_world@o.data.vertices[i].co) for i in tri.vertices];poly=[(p[0],p[2]) for p in coords]
    for zone in layout['keepOut']:
     if zone['kind']=='sight_triangle' and max(p[1] for p in coords)<=zone['maxHeight']:continue
     raw=zone['points'];assert not intersects(poly,list(zip(raw[::2],raw[1::2]))),(o.name,zone['id'])
    decor+=1
  if o.name=='BO_Interior_Dashboard':assert max(p[1] for p in map(lambda v:U(o.matrix_world@v.co),o.data.vertices) if p[2]>=.8)<=1.0601
  if o.name=='BO_Interior_Headliner':assert min(U(o.matrix_world@v.co)[1] for v in o.data.vertices)>=1.42
 if 'Cockpit' in asset['file']:assert asset['triangles']<=15000 and len(materials)<=8
 else:assert asset['triangles']<=60000 and sum(o.name.startswith('BO_Bldg_') for o in objects.values())==8
 checks.append({'file':asset['file'],'triangles':asset['triangles'],'objects':len(objects),'materials':len(materials),'BlenderFBXRoundTrip':'PASS'})
result={'status':'Blender-side validation only; Unity import, compilation, gameplay and Android NOT RUN','assetChecks':checks,'decorationTrianglesCheckedAgainstKeepOuts':decor,'eyeClearanceMeters':nearest[3],'driverView':{'eyeLocalUnity':[-.37,1.22,-.30],'verticalFOV':65,'pitchDown':4,'previewVehiclePositionUnity':approach,'sightlines':sightlines,'closerApproachCheck':near_crosswalk},'knownLimits':['All mirrors/displays/signals are flat placeholders, not live outputs.','Wipers are in the specified up-glass binding pose, not gameplay rest.','Exact left mirror quad/eye specification slightly exceeds the stated 2.10m exterior width; needs Claude review.','Default gameplay spawn at z=-80 is outside this approximately 40m-per-approach visual slice.']}
(SRC/'validation-report.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
