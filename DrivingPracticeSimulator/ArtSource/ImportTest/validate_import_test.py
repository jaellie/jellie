"""Blender source reopen + FBX reimport checks, not Unity validation.
Run: blender --background --factory-startup --python-exit-code 1 --python validate_import_test.py
"""
from pathlib import Path
import json,math,hashlib
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parents[1]
ART=PROJECT/'Assets/DrivingSim/Art/ImportTest'
ANCHORS={'DriverEye':(-.37,1.22,-.30),'SteeringWheelPivot':(-.37,.90,.12),'Mirror_Rear':(0,1.40,.62),'Mirror_Left':(-1,1.02,.55),'Mirror_Right':(1,1.02,.55)}
MARKERS={'IT_Nose':(0,.5,2),'IT_Left':(-1,.5,0),'IT_Up':(0,2,0)}
COUNTS={'IT_Cube_1m':12,'IT_Nose':12,'IT_Left':12,'IT_Up':12,'IT_LODTest_LOD0':1984,'IT_LODTest_LOD1':480}
EXPECTED=set(ANCHORS)|set(COUNTS)
EPS=1e-5

def bpoint(u):return Vector((-u[0],-u[2],u[1]))
def close(a,b,tolerance=EPS):return (Vector(a)-Vector(b)).length<tolerance

def measure(obj):
 item={'name':obj.name,'type':obj.type,'world_origin':list(obj.matrix_world.translation)}
 if obj.type=='MESH':
  obj.data.calc_loop_triangles()
  corners=[obj.matrix_world@Vector(v) for v in obj.bound_box]
  low=Vector([min(p[i] for p in corners) for i in range(3)]);high=Vector([max(p[i] for p in corners) for i in range(3)])
  item.update(center=list((low+high)/2),size=list(high-low),triangles=len(obj.data.loop_triangles),
              uv_layers=[uv.name for uv in obj.data.uv_layers],material_slots=[m.name for m in obj.data.materials])
 return item

def verify_objects(stage):
 objects={o.name:o for o in bpy.context.scene.objects}
 assert set(objects)==EXPECTED,(stage,'Unexpected/missing objects',set(objects)^EXPECTED)
 assert not any(o.type in {'CAMERA','LIGHT','ARMATURE'} for o in objects.values())
 report={n:measure(o) for n,o in objects.items()}
 for name,position in ANCHORS.items():
  assert objects[name].type=='EMPTY',(stage,name,'not empty')
  assert close(report[name]['world_origin'],bpoint(position)),(stage,name,'anchor changed',report[name])
 cube=report['IT_Cube_1m']
 assert close(cube['world_origin'],(0,0,0)),(stage,'cube bottom origin')
 assert close(cube['center'],(0,0,.5)) and close(cube['size'],(1,1,1)),(stage,'cube bounds',cube)
 for name,position in MARKERS.items():
  assert close(report[name]['center'],bpoint(position)),(stage,name,'marker center',report[name])
  assert close(report[name]['size'],(.1,.1,.1)),(stage,name,'marker size',report[name])
 for name,triangles in COUNTS.items():
  item=report[name]
  assert item['triangles']==triangles,(stage,name,'triangle mismatch',item)
  assert item['uv_layers'],(stage,name,'no UVs')
  expected='M_IT_Marker' if name in MARKERS else 'M_IT_Checker'
  assert item['material_slots']==[expected],(stage,name,'material slot mismatch',item)
  uv=objects[name].data.uv_layers.active
  assert all(-1e-6<=x<=1+1e-6 for v in uv.data for x in v.uv),(stage,name,'UV outside 0..1')
  assert all(len(p.vertices)==3 for p in objects[name].data.polygons),(stage,name,'not triangulated')
 # A center and radius shared by both spheres; Unity LODGroup creation is not asserted here.
 for name in ['IT_LODTest_LOD0','IT_LODTest_LOD1']:
  assert close(report[name]['center'],bpoint((2,.75,0))),(stage,'LOD center',report[name])
  assert close(report[name]['size'],(1,1,1)),(stage,'LOD bounds',report[name])
 return report

def main():
 bpy.ops.wm.open_mainfile(filepath=str(HERE/'IT_Calibration.blend'))
 assert bpy.context.scene.unit_settings.system=='METRIC'
 assert abs(bpy.context.scene.unit_settings.scale_length-1)<1e-9
 assert bpy.context.scene.unit_settings.length_unit=='METERS'
 for obj in bpy.context.scene.objects:
  assert all(abs(x)<1e-7 for x in obj.rotation_euler),('source rotation not applied',obj.name)
  assert all(abs(x-1)<1e-7 for x in obj.scale),('source scale not applied',obj.name)
  assert not obj.modifiers,('source has unapplied modifiers',obj.name)
 for image in bpy.data.images:
  assert image.filepath.startswith('//'),('non-relative image path',image.filepath)
  assert Path(bpy.path.abspath(image.filepath)).is_file(),('missing linked texture',image.filepath)
 source=verify_objects('REOPENED_BLEND')
 bpy.ops.wm.read_factory_settings(use_empty=True)
 # Default FBX metadata conversion back to Blender; never claims to emulate Unity's importer.
 bpy.ops.import_scene.fbx(filepath=str(ART/'IT_Calibration.fbx'),use_image_search=False)
 bpy.context.view_layer.update()
 reimport=verify_objects('FBX_REIMPORT_BLENDER')
 for name in EXPECTED:
  assert close(source[name]['world_origin'],reimport[name]['world_origin']),('roundtrip origin',name)
 result={'kind':'Blender 4.3.2 validation only; NOT Unity import/validator results',
         'source_reopen':'PASS','fbx_round_trip_in_blender':'PASS','tolerance_m':EPS,
         'object_count':len(EXPECTED),'mesh_count':len(COUNTS),'empty_count':len(ANCHORS),
         'triangle_counts':COUNTS,'total_triangles_both_lods':sum(COUNTS.values()),
         'source':source,'fbx_reimport_in_blender':reimport,
         'unity_validation':'NOT RUN. Await Claude: Build Materials From Manifest, Remap Model Materials, Validate Import Test / ArtImportTestKitTests.'}
 (HERE/'blender-validation.json').write_text(json.dumps(result,indent=2)+'\n')
 print('IMPORT_PROOF_VALIDATION: reopened .blend PASS; FBX -> Blender round trip PASS')
 print('IMPORT_PROOF_VALIDATION: exact object names, origins, dimensions, triangles, UVs and material slots checked')
 print('IMPORT_PROOF_VALIDATION: Unity validation NOT RUN; stop before detailed work')

if __name__=='__main__':main()
