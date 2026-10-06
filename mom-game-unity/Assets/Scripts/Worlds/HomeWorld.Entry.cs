using System.Collections;
using UnityEngine;

public partial class HomeWorld
{
    Transform frontDoorLeaf, keyT;
    GameObject floorShoes, floorSlippers;
    const float DOOR_X = 7.0f;
    static readonly Vector3 SHOES = new Vector3(6.85f, 0f, 5.25f);
    static readonly Vector3 KEYTRAY = new Vector3(7.66f, 0.95f, 5.45f);

    void BuildEntry()
    {
        var r = root.transform;
        // front door: dark brown with a digital lock, straight ahead on the north wall
        var pivot = Kit.Group(r, "front-door", new Vector3(DOOR_X - 0.46f, 0f, EZ1 - 0.03f), 0f);
        frontDoorLeaf = pivot;
        Kit.Box(pivot, new Vector3(0.92f, 2.1f, 0.05f), new Vector3(0.46f, 0f, 0f), "#5A4034", 0.01f);
        Kit.Box(pivot, new Vector3(0.7f, 1.8f, 0.01f), new Vector3(0.46f, 0.15f, -0.028f), "#4E372C");
        Kit.Box(pivot, new Vector3(0.07f, 0.3f, 0.035f), new Vector3(0.82f, 0.95f, -0.04f), "#E8E8E6", 0.01f, Kit.Mat("#E8E8E6", 0.5f, 0.4f));
        Kit.Box(pivot, new Vector3(0.05f, 0.12f, 0.01f), new Vector3(0.82f, 1.1f, -0.06f), "#1B1C1F", 0f, Kit.Mat("#1B1C1F", 0.3f, 0f, "#3A6A9A", 0.3f));
        Kit.Box(r, new Vector3(1.05f, 2.18f, 0.08f), new Vector3(DOOR_X, 0f, EZ1 - 0.07f), "#EADCC6");

        // tall white floating shoe cabinet on the east wall
        var white = Kit.Mat("#FAF8F3", 0.4f);
        Kit.Solid(Kit.Box(r, new Vector3(0.4f, 0.72f, 1.55f), new Vector3(7.7f, 0.22f, 5.45f), "#FAF8F3", 0.01f, white));
        Kit.Solid(Kit.Box(r, new Vector3(0.4f, 1.05f, 1.55f), new Vector3(7.7f, 1.3f, 5.45f), "#FAF8F3", 0.01f, white));
        Kit.Box(r, new Vector3(0.04f, 0.36f, 1.55f), new Vector3(7.88f, 0.94f, 5.45f), "#EFE6D6");
        for (int i = 1; i < 3; i++) Kit.NoShadow(Kit.Box(r, new Vector3(0.005f, 1.75f, 0.006f), new Vector3(7.495f, 0.22f, 4.675f + i * 0.5167f), "#E2DED6"));
        // key tray + the key (Dad's car key)
        Kit.Box(r, new Vector3(0.18f, 0.02f, 0.28f), new Vector3(7.7f, 0.95f, 5.45f), "#C9A06A", 0.01f);
        var key = Kit.Group(r, "car-key", new Vector3(7.7f, 0.98f, 5.45f), 0f); keyT = key;
        Kit.Cyl(key, 0.025f, 0.012f, new Vector3(0f, 0f, 0.05f), "#202225");
        Kit.Box(key, new Vector3(0.03f, 0.012f, 0.08f), new Vector3(0f, 0f, -0.03f), "#BFC4C8");
        Kit.Box(key, new Vector3(0.05f, 0.016f, 0.015f), new Vector3(0f, 0f, -0.07f), "#BFC4C8");
        // tidy pairs tucked under the cabinet
        string[] cols = { "#E9B8C4", "#2A2E3A", "#7FC2D6" }; float[] zs = { 4.95f, 5.45f, 5.9f };
        for (int i = 0; i < 3; i++)
            for (int s = -1; s <= 1; s += 2)
                Kit.Box(r, new Vector3(0.24f, 0.07f, 0.09f), new Vector3(7.62f, 0f, zs[i] + s * 0.065f), cols[i], 0.03f);
        // the shoes + the lilac slippers left on the step
        floorShoes = new GameObject("floor-shoes"); floorShoes.transform.SetParent(r, false);
        floorShoes.transform.localPosition = SHOES;
        for (int s = -1; s <= 1; s += 2)
        {
            var sh = Kit.Group(floorShoes.transform, "shoe", new Vector3(0f, 0f, s * 0.07f), 8f * s);
            Kit.Box(sh, new Vector3(0.09f, 0.04f, 0.26f), new Vector3(0f, 0f, 0f), "#141414", 0.025f);
            Kit.Box(sh, new Vector3(0.085f, 0.07f, 0.17f), new Vector3(0f, 0.02f, -0.03f), "#1E1E20", 0.03f);
        }
        floorSlippers = new GameObject("floor-slippers"); floorSlippers.transform.SetParent(r, false);
        floorSlippers.transform.localPosition = new Vector3(SHOES.x, 0f, EZ0 + 0.12f);
        for (int s = -1; s <= 1; s += 2)
            Kit.Box(floorSlippers.transform, new Vector3(0.1f, 0.05f, 0.25f), new Vector3(s * 0.08f, 0f, 0f), "#B9A2D6", 0.04f);
        floorSlippers.SetActive(false);
        Kit.Blocker(r, new Vector3(7.7f, 1f, 5.45f), new Vector3(0.42f, 2f, 1.55f));

        Add("door", new Vector3(DOOR_X, 1.3f, EZ1 - 0.35f), 0.95f, () => UseDoor());
        if (Content.MallOn)
            Add("key", new Vector3(7.35f, 1.05f, 5.45f), 0.95f, () => TakeKey());
        else keyT.gameObject.SetActive(false);
        if (Content.PastOn)
            Add("shoes", new Vector3(SHOES.x, 0.2f, SHOES.z), 0.9f, () => TakeShoes(), null, () => floorShoes.activeSelf, 0.4f);
    }

    IEnumerator TakeKey()
    {
        g.busy = true;
        g.audio.Play("coin");
        g.mom.FaceToward(new Vector3(7.7f, 0f, 5.45f));
        Vector3 p0 = keyT.localPosition;
        yield return g.StartCoroutine(Anim.Over(0.4f, t => keyT.localPosition = p0 + Vector3.up * (t * 0.18f)));
        g.SayKey("carKey", 2.2f);
        yield return Anim.Wait(1.2f);
        keyT.localPosition = p0;
        yield return g.StartCoroutine(LeaveHome("mall"));
    }

    IEnumerator TakeShoes()
    {
        g.busy = true;
        g.SayKey("shoes", 2.6f);
        g.mom.FaceToward(SHOES);
        yield return Anim.Wait(1.6f);
        yield return g.StartCoroutine(LeaveHome("past"));
    }

    IEnumerator UseDoor()
    {
        bool early = Sunset < 0.6f && g.elapsed < Content.DoorAlwaysAfterMin * 60f;
        if (early) { g.SayKey("doorEarly", 2.8f); yield break; }
        g.busy = true;
        yield return g.StartCoroutine(LeaveHome("beach"));
    }

    IEnumerator LeaveHome(string where)
    {
        g.busy = true;
        floorShoes.SetActive(false); floorSlippers.SetActive(true);
        g.mom.SetFootwear(true);
        if (where == "beach")
        {
            g.audio.Play("door");
            yield return g.StartCoroutine(Anim.Over(0.9f, t => frontDoorLeaf.localRotation = Quaternion.Euler(0f, -t * 75f, 0f)));
            g.mom.FaceToward(new Vector3(DOOR_X, 0f, 7f));
            g.busy = false;
            yield return g.StartCoroutine(g.GoTo("beach", Kit.C("#FFE2B0"), 1.8f));
        }
        else if (where == "mall")
        {
            g.busy = false;
            yield return g.StartCoroutine(g.GoTo("drive", Color.black, 1.2f));
        }
        else
        {
            g.busy = false;
            yield return g.StartCoroutine(g.GoTo("past", Color.white, 2.0f));
        }
    }
}
