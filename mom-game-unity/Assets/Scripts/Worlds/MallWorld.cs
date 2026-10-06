using UnityEngine;
public class MallWorld : World
{
    public MallWorld(GameController game) : base(game, "mall") { }
    public override void Build() { MakeSun("#FFD9A0", 1.2f, new Vector3(50, 200, 0)); }

}
