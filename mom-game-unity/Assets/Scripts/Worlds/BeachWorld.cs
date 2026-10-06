using UnityEngine;
public class BeachWorld : World
{
    public BeachWorld(GameController game) : base(game, "beach") { }
    public override void Build() { MakeSun("#FFD9A0", 1.2f, new Vector3(50, 200, 0)); }

}
