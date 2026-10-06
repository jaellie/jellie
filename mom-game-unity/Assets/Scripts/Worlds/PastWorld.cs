using UnityEngine;
public class PastWorld : World
{
    public PastWorld(GameController game) : base(game, "past") { }
    public override void Build() { MakeSun("#FFD9A0", 1.2f, new Vector3(50, 200, 0)); }

}
