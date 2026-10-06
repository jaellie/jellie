using UnityEngine;

// Press Play in ANY scene: this creates the whole game from code (no scene setup needed).
public static class Bootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindObjectOfType<GameController>() != null) return;
        // switch off whatever the default scene came with (camera, light, listener)
        foreach (var c in Object.FindObjectsOfType<Camera>()) c.gameObject.SetActive(false);
        foreach (var l in Object.FindObjectsOfType<Light>()) l.gameObject.SetActive(false);
        foreach (var a in Object.FindObjectsOfType<AudioListener>()) a.enabled = false;
        var go = new GameObject("MomGame");
        go.AddComponent<GameController>();
    }
}
