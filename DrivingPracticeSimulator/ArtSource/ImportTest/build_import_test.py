"""ASSET_SPEC v1 import-proof asset only. Blender 4.3.2, no external Python modules.
Run: blender --background --factory-startup --python build_import_test.py
Run generate_textures.py first. Writes only Art/ImportTest and ArtSource/ImportTest.
"""
from pathlib import Path
import json,math
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
PROJECT=HERE.parents[1]
ART=PROJECT/'Assets/DrivingSim/Art/ImportTest'
BLEND=HERE/'IT_Calibration.blend'
FBX=ART/'IT_Calibration.fbx'
ANCHORS={
 'DriverEye':(-0.37,1.22,-0.30), 'SteeringWheelPivot':(-0.37,0.90,0.12),
 'Mirror_Rear':(0,1.40,0.62), 'Mirror_Left':(-1,1.02,0.55), 'Mirror_Right':(1,1.02,0.55)
}
MARKERS={'IT_Nose':(0,0.5,2),'IT_Left':(-1,0.5,0),'IT_Up':(0,2,0)}
EXPORT={
 'use_selection':True,'object_types':{'MESH','EMPTY'},'global_scale':1.0,
 'apply_scale_options':'FBX_SCALE_ALL','apply_unit_scale':True,
 'axis_forward':'-Z','axis_up':'Y','use_space_transform':True,'bake_space_transform':True,
 'use_mesh_modifiers':True,'mesh_smooth_type':'FACE','use_tspace':False,'use_triangles':True,
 'bake_anim':False,'add_leaf_bones':False,'use_custom_props':False,
 'path_mode':'AUTO','embed_textures':False
}

def blender_point(unity):
 x,y,z=unity
 return (-x,-z,y)

def unity_point(blender):
 x,y,z=blender
 return (-x,z,-y)

def setup_materials():
 checker=bpy.data.materials.new('M_IT_Checker');checker.use_nodes=True
 checker.diffuse_color=(0.6,0.7,0.75,1)
 nodes=checker.node_tree.nodes;links=checker.node_tree.links
 bsdf=nodes.get('Principled BSDF')
 maps={}
 for suffix,color_space in [('BaseMap','sRGB'),('Normal','Non-Color'),('Mask','Non-Color')]:
  path=ART/f'T_IT_Checker_{suffix}.png'
  if not path.is_file():raise FileNotFoundError(str(path)+'; run generate_textures.py first')
  image=bpy.data.images.load(str(path),check_existing=True)
  image.colorspace_settings.name=color_space
  image.filepath=bpy.path.relpath(str(path),start=str(HERE))
  node=nodes.new('ShaderNodeTexImage');node.image=image;node.name=f'T_IT_Checker_{suffix}'
  node.label=node.name;maps[suffix]=node
 links.new(maps['BaseMap'].outputs['Color'],bsdf.inputs['Base Color'])
 normal=nodes.new('ShaderNodeNormalMap');normal.space='TANGENT';normal.inputs['Strength'].default_value=1
 links.new(maps['Normal'].outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bsdf.inputs['Normal'])
 split=nodes.new('ShaderNodeSeparateColor');split.mode='RGB'
 links.new(maps['Mask'].outputs['Color'],split.inputs['Color']);links.new(split.outputs['Red'],bsdf.inputs['Metallic'])
 inverse=nodes.new('ShaderNodeMath');inverse.operation='SUBTRACT';inverse.inputs[0].default_value=1
 links.new(maps['Mask'].outputs['Alpha'],inverse.inputs[1]);links.new(inverse.outputs[0],bsdf.inputs['Roughness'])
 marker=bpy.data.materials.new('M_IT_Marker');marker.use_nodes=True
 marker.diffuse_color=(1,0.16,0.025,1)
 m=marker.node_tree.nodes.get('Principled BSDF');m.inputs['Base Color'].default_value=(1,0.16,0.025,1)
 m.inputs['Roughness'].default_value=1
 m.inputs['Emission Color'].default_value=(1,0.16,0.025,1);m.inputs['Emission Strength'].default_value=1
 # Unity's final unlit/lit choice comes from materials.json, not Blender's viewport shader.
 return checker,marker

def box(name,size,location,material,bottom_origin=False):
 h=size/2;z0=0 if bottom_origin else -h;z1=size if bottom_origin else h
 verts=[(-h,-h,z0),(h,-h,z0),(h,h,z0),(-h,h,z0),(-h,-h,z1),(h,-h,z1),(h,h,z1),(-h,h,z1)]
 faces=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
 mesh=bpy.data.meshes.new(name+'_Mesh');mesh.from_pydata(verts,[],faces);mesh.update()
 obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
 obj.location=blender_point(location);mesh.materials.append(material)
 uv=mesh.uv_layers.new(name='UVMap')
 # Each face gets the full 0..1 square, outward-facing +U/right and +V/up in that face's view.
 for face in mesh.polygons:
  for index,coord in zip(face.loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[index].uv=coord
 return obj

def snapshot(obj):
 data={'name':obj.name,'type':obj.type,'blender_origin':list(obj.location),
       'expected_unity_origin':list(unity_point(obj.location)),
       'rotation_euler_radians':list(obj.rotation_euler),'scale':list(obj.scale)}
 if obj.type=='MESH':
  mesh=obj.data;mesh.calc_loop_triangles()
  points=[obj.matrix_world@Vector(v) for v in obj.bound_box]
  low=Vector([min(p[i] for p in points) for i in range(3)])
  high=Vector([max(p[i] for p in points) for i in range(3)])
  data.update(triangles=len(mesh.loop_triangles),vertices=len(mesh.vertices),
              uv_layers=[u.name for u in mesh.uv_layers],materials=[m.name for m in mesh.materials],
              blender_bounds_center=list((low+high)*0.5),blender_bounds_size=list(high-low),
              expected_unity_bounds_center=list(unity_point((low+high)*0.5)))
 return data

def main():
 if bpy.app.version[:2]!=(4,3):raise RuntimeError('Use Blender 4.3.x; approved/tested here with 4.3.2')
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.context.preferences.filepaths.save_version=0
 scene=bpy.context.scene
 scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1.0;scene.unit_settings.length_unit='METERS'
 checker,marker=setup_materials()
 objects=[box('IT_Cube_1m',1,(0,0,0),checker,bottom_origin=True)]
 for name,point in MARKERS.items():objects.append(box(name,0.1,point,marker))
 for name,point in ANCHORS.items():
  obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj)
  obj.empty_display_type='PLAIN_AXES';obj.empty_display_size=0.08;obj.location=blender_point(point)
  objects.append(obj)
 for name,segments,rings in [('IT_LODTest_LOD0',32,32),('IT_LODTest_LOD1',16,16)]:
  bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=0.5,location=blender_point((2,0.75,0)))
  obj=bpy.context.object;obj.name=name;obj.data.name=name+'_Mesh';obj.data.materials.append(checker)
  for face in obj.data.polygons:face.use_smooth=True
  objects.append(obj)
 for obj in objects:
  bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
  bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
  if obj.type=='MESH':
   tri=obj.modifiers.new('Applied_Triangulation','TRIANGULATE');tri.quad_method='FIXED'
   bpy.ops.object.modifier_apply(modifier=tri.name)
 bpy.context.view_layer.update()
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 report=[snapshot(o) for o in objects]
 by_name={o['name']:o for o in report}
 assert by_name['IT_Cube_1m']['triangles']==12
 assert by_name['IT_LODTest_LOD0']['triangles']==1984
 assert by_name['IT_LODTest_LOD1']['triangles']==480
 assert len(objects)==11 and sum(o.type=='MESH' for o in objects)==6
 assert all(all(abs(a)<1e-7 for a in o.rotation_euler) and all(abs(s-1)<1e-7 for s in o.scale) for o in objects)
 assert not any(o.type in {'CAMERA','LIGHT','ARMATURE'} for o in bpy.data.objects)
 for area in (bpy.context.screen.areas if bpy.context.screen else []):
  if area.type=='VIEW_3D':area.spaces.active.clip_end=100;area.spaces.active.shading.type='MATERIAL'
 ART.mkdir(parents=True,exist_ok=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(BLEND),check_existing=False,compress=True,relative_remap=False)
 bpy.ops.export_scene.fbx(filepath=str(FBX),**EXPORT)
 export_json={k:sorted(v) if isinstance(v,set) else v for k,v in EXPORT.items()}
 (HERE/'source-report.json').write_text(json.dumps({
  'kind':'Blender source geometry/export checks; NOT Unity validation',
  'spec_version':1,'spec_commit':'6939f97fb0e3e3604444250c8472453bb990f4b9',
  'blender_version':bpy.app.version_string,'unit_system':scene.unit_settings.system,'unit_scale':scene.unit_settings.scale_length,
  'coordinate_rule':'Blender=(-Unity.x,-Unity.z,Unity.y)',
  'export_options':export_json,'objects':report,
  'total_triangles_with_both_lods':sum(o.get('triangles',0) for o in report),
  'lod_note':'Coincident sibling spheres intentionally represent alternative LODs; not two separately placed props.',
  'unity_validation':'NOT RUN; Claude must import and run ArtImportValidator and ArtImportTestKitTests'
 },indent=2)+'\n')
 print('IMPORT_PROOF: saved',BLEND)
 print('IMPORT_PROOF: exported',FBX)
 print('IMPORT_PROOF: cube=12 triangles; LOD0=1984; LOD1=480; all origins/rotation/scale checked in Blender')

if __name__=='__main__':main()
