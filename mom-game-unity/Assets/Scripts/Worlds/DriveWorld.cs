using UnityEngine;
public class DriveWorld : World
{
    public DriveWorld(GameController game) : base(game, "drive") { }
    public override void Build() { MakeSun("#FFD9A0", 1.2f, new Vector3(50, 200, 0)); }

}
