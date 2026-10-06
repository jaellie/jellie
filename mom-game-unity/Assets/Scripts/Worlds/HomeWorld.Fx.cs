using UnityEngine;

public partial class HomeWorld
{
    GameObject[] shafts; Renderer[] shaftRend;
    Transform[] motes; Vector3[] moteBase; float[] motePh;
    float fxTime;

    void BuildFx()
    {
        // soft sun shafts coming through the window
        shafts = new GameObject[4]; shaftRend = new Renderer[4];
        var beam = ProcTex.Beam();
        for (int i = 0; i < 4; i++)
        {
            var m = Kit.AdditiveMat(beam, new Color(1f, 0.85f, 0.6f, 0.08f));
            var q = Kit.Quad(root.transform, 0.5f + i * 0.08f, 3.2f, new Vector3(1.0f + i * 0.75f, 1.2f, 1.5f), m);
            Kit.NoShadow(q);
            q.transform.localRotation = Quaternion.Euler(-28f, 180f, 0f);
            shafts[i] = q; shaftRend[i] = q.GetComponent<Renderer>();
        }
        // floating dust motes
        const int N = 26;
        motes = new Transform[N]; moteBase = new Vector3[N]; motePh = new float[N];
        var rnd = new System.Random(11);
        for (int i = 0; i < N; i++)
        {
            moteBase[i] = new Vector3(0.7f + (float)rnd.NextDouble() * 3f, 0.4f + (float)rnd.NextDouble() * 1.7f, 0.5f + (float)rnd.NextDouble() * 2.5f);
            motePh[i] = (float)rnd.NextDouble() * 10f;
            var s = Kit.GlowSprite(root.transform, moteBase[i], 0.05f, "#FFEBC4", 0.6f);
            motes[i] = s.transform;
        }
    }

    void TickFx(float dt)
    {
        fxTime += dt;
        TickEntryHints();
        float t = fxTime;
        float s = Sunset;
        float a = Mathf.Lerp(0.1f, 0.18f, s) * Mathf.Lerp(0.3f, 1f, curtainAmount) * (g.chase != null && g.chase.useOverride ? 0.2f : 1f);
        if (shaftRend != null)
            for (int i = 0; i < shaftRend.Length; i++)
            {
                float wob = 0.75f + 0.25f * Mathf.Sin(t * 0.5f + i * 1.7f);
                shaftRend[i].sharedMaterial.SetColor("_TintColor", new Color(1f, 0.85f - s * 0.25f, 0.6f - s * 0.2f, a * wob) * 0.5f);
            }
        if (motes != null)
            for (int i = 0; i < motes.Length; i++)
                motes[i].position = root.transform.TransformPoint(moteBase[i] + new Vector3(Mathf.Sin(t * 0.2f + motePh[i]) * 0.3f, Mathf.Sin(t * 0.3f + motePh[i] * 2f) * 0.2f, Mathf.Cos(t * 0.17f + motePh[i]) * 0.3f));
        // boats bob, gulls circle
        for (int i = 0; i < boats.Count; i++)
        {
            var p = boats[i].localPosition; p.y = -55f + Mathf.Sin(t * 0.7f + i * 2f) * 0.9f;
            boats[i].localPosition = p;
            boats[i].localRotation = Quaternion.Euler(Mathf.Sin(t * 0.6f + i) * 1.5f, boats[i].localEulerAngles.y, Mathf.Sin(t * 0.8f + i * 1.3f) * 2f);
        }
        for (int i = 0; i < gulls.Count; i++)
        {
            float ang = t * (0.12f + i * 0.02f) + i * 1.7f;
            gulls[i].localPosition = new Vector3(Mathf.Cos(ang) * (90f + i * 25f) + (i - 1.5f) * 40f, -10f + i * 6f + Mathf.Sin(t * 1.3f + i) * 2f, -170f - i * 35f + Mathf.Sin(ang) * 40f);
            gulls[i].localRotation = Quaternion.Euler(0f, -ang * Mathf.Rad2Deg, Mathf.Sin(t * 5f + i) * 14f);
            gulls[i].localScale = Vector3.one * 7f;
        }
    }
}
