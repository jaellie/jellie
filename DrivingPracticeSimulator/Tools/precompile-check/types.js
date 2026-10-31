const Parser = require('web-tree-sitter'); const fs = require('fs'), path = require('path');
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (p.endsWith('.cs')) out.push(p); } return out; }
const known = new Set(`bool byte char decimal double float int long object sbyte short string uint ulong ushort void var dynamic
Action Func Array Exception ArgumentException InvalidOperationException NotImplementedException IEnumerable IEnumerator IReadOnlyList IList List Dictionary HashSet Queue Stack KeyValuePair Math Environment StringBuilder DateTime TimeSpan Type Enum Guid Regex Match File Path Directory Serializable NonSerialized Obsolete Flags SerializableAttribute StringComparison Predicate Comparison Tuple IComparable IDisposable Attribute EventArgs Lazy Nullable Span
MonoBehaviour ScriptableObject GameObject Transform RectTransform Component Behaviour Object Vector2 Vector3 Vector4 Vector2Int Quaternion Color Color32 Rect Bounds Mathf Debug Time Screen Application Resources Mesh MeshFilter MeshRenderer MeshCollider Renderer Material Shader Texture Texture2D RenderTexture RenderTextureFormat Sprite SpriteMeshType Camera Light LightType LightShadows Rigidbody Collider BoxCollider WheelCollider WheelHit Physics RaycastHit LayerMask PrimitiveType Font FontStyle TextAnchor TextMesh TextAlignment TextAsset JsonUtility PlayerPrefs SystemInfo GraphicsDeviceType SerializeField Header Tooltip Range Min RequireComponent DefaultExecutionOrder RuntimeInitializeOnLoadMethod RuntimeInitializeLoadType ExecuteAlways ContextMenu HideInInspector AnimationCurve Keyframe GUI GUILayout GUIStyle GUIContent Gizmos WaitForSeconds WaitForFixedUpdate WaitForEndOfFrame WaitUntil Coroutine YieldInstruction CustomYieldInstruction AsyncOperation SceneManager Scene LoadSceneMode RenderSettings AmbientMode FogMode DefaultReflectionMode QualitySettings GraphicsSettings ShadowCastingMode BlendMode RenderQueue MaterialGlobalIlluminationFlags IndexFormat CameraClearFlags StaticBatchingUtility TextureFormat TextureWrapMode FilterMode Random Input KeyCode Touch TouchPhase ColorSpace FindObjectsSortMode FindObjectsInactive RigidbodyInterpolation ForceMode CollisionDetectionMode ScreenOrientation DeviceOrientation SpaceAttribute
Canvas CanvasScaler GraphicRaycaster Image RawImage Text Graphic Button Toggle Slider ScrollRect RectMask2D ContentSizeFitter HorizontalLayoutGroup VerticalLayoutGroup LayoutElement Mask MaskableGraphic Outline Shadow
EventSystem PointerEventData BaseEventData IPointerDownHandler IPointerUpHandler IPointerExitHandler IPointerEnterHandler IPointerClickHandler IDragHandler IBeginDragHandler IEndDragHandler IInitializePotentialDragHandler ExecuteEvents StandaloneInputModule BaseInputModule RaycastResult
InputSystemUIInputModule Keyboard Mouse Touchscreen Gamepad InputSystem Key InputDevice InputAction KeyControl TouchControl
UniversalRenderPipelineAsset UniversalRendererData ScriptableRendererData UniversalAdditionalCameraData
EditorWindow AssetDatabase AssetPostprocessor ModelImporter TextureImporter TextureImporterType TextureImporterFormat TextureImporterPlatformSettings ModelImporterAnimationType ModelImporterMeshCompression ModelImporterNormals ModelImporterTangents ModelImporterMaterialImportMode ModelImporterMaterialLocation ModelImporterMaterialName ModelImporterMaterialSearch AssetImporter MenuItem EditorUtility EditorApplication EditorSceneManager NewSceneSetup NewSceneMode EditorBuildSettings EditorBuildSettingsScene BuildPipeline BuildPlayerOptions BuildReport BuildSummary BuildResult BuildTarget BuildTargetGroup BuildOptions EditorUserBuildSettings PlayerSettings NamedBuildTarget UIOrientation ScriptingImplementation AndroidArchitecture AndroidSdkVersions SerializedObject SerializedProperty Unsupported Selection EditorGUIUtility InitializeOnLoad AssetModificationProcessor
Test TestCase UnityTest SetUp TearDown UnitySetUp UnityTearDown Assert CollectionAssert StringAssert Is Has LogAssert OneTimeSetUp OneTimeTearDown TestFixture Category Ignore Description Values Repeat Timeout Explicit`.split(/\s+/));
(async () => {
  await Parser.init();
  const lang = await Parser.Language.load(path.join(__dirname, 'node_modules/tree-sitter-wasms/out/tree-sitter-c_sharp.wasm'));
  const parser = new Parser(); parser.setLanguage(lang);
  const files = walk(process.argv[2]); const declared = new Set(); const uses = [];
  const trees = files.map(f => ({ f, src: fs.readFileSync(f, 'utf8') })).map(o => ({ ...o, tree: parser.parse(o.src) }));
  for (const { tree } of trees) (function v(n) {
    if (['class_declaration','struct_declaration','enum_declaration','interface_declaration','delegate_declaration'].includes(n.type)) { const id = n.childForFieldName('name'); if (id) declared.add(id.text); }
    if (n.type === 'type_parameter') declared.add(n.text);
    for (const c of n.children) v(c);
  })(tree.rootNode);
  for (const { f, tree } of trees) (function v(n) {
    const typeField = n.childForFieldName && n.childForFieldName('type');
    if (typeField && ['variable_declaration','parameter','object_creation_expression','method_declaration','property_declaration','cast_expression','array_creation_expression','local_function_statement','event_field_declaration'].includes(n.type)) {
      (function ids(t) { if (t.type === 'identifier' && t.parent.type !== 'qualified_name') uses.push([f, t.text, t.startPosition.row + 1]); else if (t.type === 'qualified_name') {} else for (const c of t.children) ids(c); })(typeField);
    }
    if (n.type === 'generic_name') { const args = n.children.find(c => c.type === 'type_argument_list'); if (args) for (const a of args.namedChildren) if (a.type === 'identifier') uses.push([f, a.text, a.startPosition.row + 1]); }
    for (const c of n.children) v(c);
  })(tree.rootNode);
  const unknown = {};
  for (const [f, t, row] of uses) if (!declared.has(t) && !known.has(t)) (unknown[t] = unknown[t] || []).push(`${path.relative(process.argv[2], f)}:${row}`);
  for (const [t, where] of Object.entries(unknown).sort()) console.log(t.padEnd(28), where.length, where.slice(0, 3).join('  '));
  console.log(`${files.length} files, ${declared.size} project types, ${Object.keys(unknown).length} unknown type names`);
})();
