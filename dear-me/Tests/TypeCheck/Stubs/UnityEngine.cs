// Minimal signature stubs of the Unity APIs Dear Me uses, written from the Unity 6 scripting
// reference. They exist only so `dotnet build` can type-check the game scripts outside Unity.
// Bodies are intentionally empty; nothing here runs.
#pragma warning disable CS0067, CS0108, CS0114, CS0660, CS0661, CS1591
using System;
using System.Collections;
using System.Collections.Generic;

namespace UnityEngine
{
    public class Object
    {
        public string name { get; set; }
        public static void Destroy(Object obj) { }
        public static void Destroy(Object obj, float t) { }
        public static implicit operator bool(Object exists) => exists != null;
        public static bool operator ==(Object x, Object y) => ReferenceEquals(x, y);
        public static bool operator !=(Object x, Object y) => !ReferenceEquals(x, y);
    }

    public class Component : Object
    {
        public GameObject gameObject => null;
        public Transform transform => null;
        public string tag { get; set; }
        public T GetComponent<T>() => default;
        public T GetComponentInChildren<T>() => default;
        public T[] GetComponentsInChildren<T>(bool includeInactive) => null;
    }

    public class Behaviour : Component
    {
        public bool enabled { get; set; }
        public bool isActiveAndEnabled => true;
    }

    public class Coroutine { }

    public class MonoBehaviour : Behaviour
    {
        public Coroutine StartCoroutine(IEnumerator routine) => null;
        public void StopCoroutine(Coroutine routine) { }
    }

    public sealed class GameObject : Object
    {
        public GameObject() { }
        public GameObject(string name) { }
        public GameObject(string name, params Type[] components) { }
        public Transform transform => null;
        public int layer { get; set; }
        public string tag { get; set; }
        public bool activeSelf => true;
        public bool activeInHierarchy => true;
        public T AddComponent<T>() where T : Component => default;
        public T GetComponent<T>() => default;
        public void SetActive(bool value) { }
    }

    public class Transform : Component, IEnumerable
    {
        public Transform parent { get; set; }
        public int childCount => 0;
        public void SetParent(Transform parent, bool worldPositionStays) { }
        public Transform GetChild(int index) => null;
        public Transform Find(string n) => null;
        public void SetAsLastSibling() { }
        public bool IsChildOf(Transform parent) => false;
        public IEnumerator GetEnumerator() => null;
    }

    public sealed class RectTransform : Transform
    {
        public Vector2 anchorMin { get; set; }
        public Vector2 anchorMax { get; set; }
        public Vector2 pivot { get; set; }
        public Vector2 offsetMin { get; set; }
        public Vector2 offsetMax { get; set; }
        public Vector2 sizeDelta { get; set; }
        public Vector2 anchoredPosition { get; set; }
        public Rect rect => default;
        public void GetWorldCorners(Vector3[] fourCornersArray) { }
    }

    public struct Vector2
    {
        public float x, y;
        public Vector2(float x, float y) { this.x = x; this.y = y; }
        public static Vector2 zero => default;
        public static Vector2 one => default;
        public float sqrMagnitude => 0f;
        public static Vector2 operator +(Vector2 a, Vector2 b) => a;
        public static Vector2 operator -(Vector2 a, Vector2 b) => a;
        public static Vector2 operator *(Vector2 a, float d) => a;
        public static Vector2 operator /(Vector2 a, float d) => a;
        public static bool operator ==(Vector2 a, Vector2 b) => true;
        public static bool operator !=(Vector2 a, Vector2 b) => false;
        public static implicit operator Vector2(Vector3 v) => default;
        public static implicit operator Vector3(Vector2 v) => default;
    }

    public struct Vector2Int
    {
        public int x, y;
        public Vector2Int(int x, int y) { this.x = x; this.y = y; }
        public static bool operator ==(Vector2Int a, Vector2Int b) => true;
        public static bool operator !=(Vector2Int a, Vector2Int b) => false;
    }

    public struct Vector3
    {
        public float x, y, z;
        public Vector3(float x, float y, float z) { this.x = x; this.y = y; this.z = z; }
    }

    public struct Color
    {
        public float r, g, b, a;
        public Color(float r, float g, float b, float a) { this.r = r; this.g = g; this.b = b; this.a = a; }
        public static Color white => default;
        public static Color magenta => default;
        public float grayscale => 0f;
    }

    public struct Rect
    {
        public Rect(float x, float y, float width, float height) { }
        public float xMin => 0; public float xMax => 0; public float yMin => 0; public float yMax => 0;
        public float width => 0; public float height => 0;
        public Vector2 center => default; public Vector2 min => default; public Vector2 max => default;
        public Vector2 size => default;
        public static Rect MinMaxRect(float xmin, float ymin, float xmax, float ymax) => default;
        public static bool operator ==(Rect a, Rect b) => true;
        public static bool operator !=(Rect a, Rect b) => false;
    }

    public class RectOffset
    {
        public RectOffset() { }
        public RectOffset(int left, int right, int top, int bottom) { }
        public int left, right, top, bottom;
        public int horizontal => 0;
        public int vertical => 0;
    }

    public static class Mathf
    {
        public const float PI = 3.14159265f;
        public static float Max(float a, float b) => a; public static int Max(int a, int b) => a;
        public static float Min(float a, float b) => a; public static int Min(int a, int b) => a;
        public static float Clamp(float v, float min, float max) => v; public static int Clamp(int v, int min, int max) => v;
        public static float Clamp01(float v) => v;
        public static float Sin(float f) => f; public static float Exp(float f) => f; public static float Abs(float f) => f;
        public static float Sign(float f) => f; public static float Round(float f) => f;
        public static int RoundToInt(float f) => 0; public static int CeilToInt(float f) => 0;
        public static float Lerp(float a, float b, float t) => a; public static float SmoothStep(float from, float to, float t) => t;
        public static float MoveTowards(float current, float target, float maxDelta) => current;
        public static bool Approximately(float a, float b) => true;
    }

    public static class Time
    {
        public static float unscaledTime => 0f;
        public static double unscaledTimeAsDouble => 0;
        public static float unscaledDeltaTime => 0f;
        public static int frameCount => 0;
    }

    public static class Screen
    {
        public static int width => 0;
        public static int height => 0;
        public static Rect safeArea => default;
    }

    public static class Random
    {
        public static float Range(float min, float max) => min;
        public static int Range(int min, int max) => min;
    }

    public static class Resources
    {
        public static T Load<T>(string path) where T : Object => default;
        public static T GetBuiltinResource<T>(string path) where T : Object => default;
    }

    public class TextAsset : Object { public string text => ""; }
    public sealed class Font : Object { }
    public sealed class Sprite : Object { }

    public static class Debug
    {
        public static void Log(object message) { }
        public static void LogWarning(object message) { }
        public static void LogError(object message) { }
    }

    public static class JsonUtility
    {
        public static string ToJson(object obj) => "";
        public static T FromJson<T>(string json) => default;
    }

    public static class ColorUtility
    {
        public static bool TryParseHtmlString(string htmlString, out Color color) { color = default; return true; }
    }

    public static class PlayerPrefs
    {
        public static bool HasKey(string key) => false;
        public static string GetString(string key) => "";
        public static void SetString(string key, string value) { }
        public static void DeleteKey(string key) { }
        public static void Save() { }
    }

    public static class Application
    {
        public static bool isMobilePlatform => false;
        public static void Quit() { }
    }

    public enum CameraClearFlags { Skybox = 1, SolidColor = 2, Depth = 3, Nothing = 4 }

    public sealed class Camera : Behaviour
    {
        public static Camera main => null;
        public CameraClearFlags clearFlags { get; set; }
        public Color backgroundColor { get; set; }
        public bool orthographic { get; set; }
        public int cullingMask { get; set; }
    }

    public enum RenderMode { ScreenSpaceOverlay, ScreenSpaceCamera, WorldSpace }

    public sealed class Canvas : Behaviour
    {
        public RenderMode renderMode { get; set; }
        public int sortingOrder { get; set; }
        public static void ForceUpdateCanvases() { }
    }

    public sealed class CanvasGroup : Behaviour
    {
        public float alpha { get; set; }
        public bool blocksRaycasts { get; set; }
        public bool interactable { get; set; }
    }

    public sealed class AudioClip : Object
    {
        public float length => 0f;
        public static AudioClip Create(string name, int lengthSamples, int channels, int frequency, bool stream) => null;
        public bool SetData(float[] data, int offsetSamples) => true;
    }

    public sealed class AudioSource : Behaviour
    {
        public AudioClip clip { get; set; }
        public bool loop { get; set; }
        public float volume { get; set; }
        public bool playOnAwake { get; set; }
        public float time { get; set; }
        public bool isPlaying => false;
        public void Play() { }
        public void Stop() { }
        public void PlayOneShot(AudioClip clip, float volumeScale) { }
    }

    public enum RuntimeInitializeLoadType { AfterSceneLoad = 0, BeforeSceneLoad = 1, AfterAssembliesLoaded = 2, BeforeSplashScreen = 3, SubsystemRegistration = 4 }

    [AttributeUsage(AttributeTargets.Method)]
    public class RuntimeInitializeOnLoadMethodAttribute : Attribute
    {
        public RuntimeInitializeOnLoadMethodAttribute() { }
        public RuntimeInitializeOnLoadMethodAttribute(RuntimeInitializeLoadType loadType) { }
    }

    public enum TextAnchor { UpperLeft, UpperCenter, UpperRight, MiddleLeft, MiddleCenter, MiddleRight, LowerLeft, LowerCenter, LowerRight }
    public enum HorizontalWrapMode { Wrap, Overflow }
    public enum VerticalWrapMode { Truncate, Overflow }
    public enum FontStyle { Normal, Bold, Italic, BoldAndItalic }

    public struct TextGenerationSettings { }

    public sealed class TextGenerator
    {
        public float GetPreferredWidth(string str, TextGenerationSettings settings) => 0f;
        public float GetPreferredHeight(string str, TextGenerationSettings settings) => 0f;
    }

    public enum KeyCode { Space, Return, KeypadEnter, Escape, Alpha1, Alpha2, Alpha3, Alpha4, Keypad1, Keypad2, Keypad3, Keypad4 }

    public static class Input
    {
        public static bool GetKeyDown(KeyCode key) => false;
        public static bool GetMouseButtonDown(int button) => false;
        public static Vector3 mousePosition => default;
        public static bool touchSupported => false;
    }

    public static class RectTransformUtility
    {
        public static bool ScreenPointToLocalPointInRectangle(RectTransform rect, Vector2 screenPoint, Camera cam, out Vector2 localPoint)
        { localPoint = default; return true; }
    }
}

namespace UnityEngine.Events
{
    public delegate void UnityAction();
    public class UnityEvent
    {
        public void AddListener(UnityAction call) { }
    }
}

namespace UnityEngine.SceneManagement
{
    public struct Scene { }
}
