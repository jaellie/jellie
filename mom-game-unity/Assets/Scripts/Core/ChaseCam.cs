using UnityEngine;

// Low camera just behind Mom's shoulder (almost first-person, her whole body stays in view).
// It pulls in before walls (colliders with CamBlocker) and can blend to a cinematic override.
public class ChaseCam : MonoBehaviour
{
    public Camera cam;
    public Mom mom;
    public bool useOverride;
    public Vector3 ovPos, ovLook;
    public bool ownedByWorld;          // a world (the drive) is moving the camera itself

    float chaseYaw, chaseDist = 2.3f, blend;
    Vector3 pos, look;
    bool inited;

    public void Snap() { inited = false; Step(0.0166f, true); }

    public void Step(float dt, bool instant = false)
    {
        if (cam == null || mom == null || ownedByWorld) return;
        bool child = mom.child;
        float want = child ? 2.0f : 2.3f;
        float height = (child ? 1.3f : 1.75f) - (mom.sitting ? 0.2f : 0f);
        Vector3 focus = mom.transform.position;

        float k = 1f - Mathf.Exp(-dt * 5f);
        float dy = Mathf.DeltaAngle(chaseYaw, mom.heading);
        chaseYaw = (instant || !inited) ? mom.heading : chaseYaw + dy * k;
        float h = chaseYaw * Mathf.Deg2Rad;
        Vector3 fwd = new Vector3(Mathf.Sin(h), 0f, Mathf.Cos(h));
        Vector3 right = new Vector3(Mathf.Cos(h), 0f, -Mathf.Sin(h));

        // wall check from her head back toward the desired camera spot
        Vector3 head = focus + Vector3.up * 1.4f;
        float room = want;
        Vector3 back = (-fwd * (want + 0.3f) + Vector3.up * (height - 1.4f)).normalized;
        float maxD = want + 0.3f;
        var hits = Physics.RaycastAll(head, back, maxD, ~0, QueryTriggerInteraction.Ignore);
        float best = maxD;
        foreach (var hit in hits) if (hit.collider.GetComponent<CamBlocker>() != null && hit.distance < best) best = hit.distance;
        room = Mathf.Clamp(best - 0.28f, 0.45f, want);
        chaseDist = (instant || !inited || room < chaseDist) ? room : chaseDist + (room - chaseDist) * (1f - Mathf.Exp(-dt * 2.5f));

        float sh = 0.22f * Mathf.Min(1f, chaseDist / 1.5f);
        Vector3 tp = focus - fwd * chaseDist + right * sh + Vector3.up * height;
        Vector3 tl = focus + fwd * 2.6f + right * sh * 0.4f + Vector3.up * (height * 0.7f);
        float f = (instant || !inited) ? 1f : 1f - Mathf.Exp(-dt * 12f);
        pos = inited ? Vector3.Lerp(pos, tp, f) : tp;
        look = inited ? Vector3.Lerp(look, tl, f) : tl;
        inited = true;

        blend += ((useOverride ? 1f : 0f) - blend) * (instant ? 1f : 1f - Mathf.Exp(-dt * 1.6f));
        Vector3 p = pos, l = look;
        if (blend > 0.001f) { float t = blend * blend * (3f - 2f * blend); p = Vector3.Lerp(pos, ovPos, t); l = Vector3.Lerp(look, ovLook, t); }
        cam.transform.position = p;
        cam.transform.LookAt(l);
    }
}
