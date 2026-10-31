"""Actual flat-color source geometry, rendered in Blender; NOT a Unity screenshot.
blender -b --factory-startup --python-exit-code 1 --python render_blockout.py -- driver
Use -- overview for the intersection. Preview lights/camera are never saved/exported.
"""
from pathlib import Path
import bpy,sys,math
from mathutils import Vector,Matrix
SRC=Path(__file__).resolve().parent
mode=sys.argv[-1] if sys.argv[-1] in ['driver','overview','corner'] else 'driver'
def B(p):x,y,z=p;return Vector((-x,-z,y))
bpy.ops.wm.open_mainfile(filepath=str(SRC/'BO_Intersection.blend'));scene=bpy.context.scene
cab_prefix=('Interior_','Glass_Interior','SteeringWheel','Cluster','MirrorGlass_','Lamp_Dash_')
for obj in scene.objects:
 iscab=obj.name.startswith(cab_prefix) or (obj.type=='EMPTY' and obj.name!='BO_Intersection')
 obj.hide_viewport=False;obj.hide_render=iscab and mode!='driver'
 if iscab and mode=='driver' and obj.parent is None:obj.location+=B((4.875,0,-35))
 if obj.name.startswith('Interior_Wiper_') and mode=='driver':
  rotation=Matrix.Rotation(math.radians(85),4,B((0,.468,.884)).normalized());obj.data.transform(rotation)
if mode=='driver':
 position=B((4.875-.37,1.22,-35-.30));target=position+B((0,-math.sin(math.radians(4)),math.cos(math.radians(4))))
elif mode=='corner':position=B((10.8,1.65,-20));target=B((-1,5,8))
else:position=B((67,52,-74));target=B((0,4,0))
data=bpy.data.cameras.new('InspectionCamera');cam=bpy.data.objects.new('InspectionCamera',data);scene.collection.objects.link(cam);cam.location=position;cam.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler();scene.camera=cam
scene.render.resolution_x=1600;scene.render.resolution_y=720 if mode=='driver' else 1000;scene.render.resolution_percentage=100
data.sensor_fit='VERTICAL';data.angle_y=math.radians(65 if mode=='driver' else (55 if mode=='corner' else 48));data.clip_start=.03
world=bpy.data.worlds.new('InspectionClearBlueSky');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.32,.55,.90,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65
light=bpy.data.lights.new('InspectionSun','SUN');light.energy=3.0;light.angle=.09;light.color=(1.0,.94,.85)
sun=bpy.data.objects.new('InspectionSun',light);scene.collection.objects.link(sun);sun.rotation_euler=(math.radians(40),0,math.radians(145))
if mode=='driver':
 fill=bpy.data.lights.new('InspectionFill','AREA');fill.energy=14;fill.size=1.2
 ob=bpy.data.objects.new('InspectionFill',fill);scene.collection.objects.link(ob);ob.location=position+Vector((0,0,.1));ob.rotation_euler=(B((4.875,.8,-34.5))-ob.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
folder=SRC/'Previews';folder.mkdir(exist_ok=True);scene.render.filepath=str(folder/('DriverEye.png' if mode=='driver' else ('BO_StreetCorner.png' if mode=='corner' else 'BO_Intersection_Overview.png')))
frame=data.view_frame(scene=scene);actual_vertical=2*math.atan(abs(frame[0].y/frame[0].z))
if mode=='driver':
 assert abs(math.degrees(actual_vertical)-65)<.01,(math.degrees(actual_vertical),'actual camera FOV')
bpy.ops.render.render(write_still=True)
