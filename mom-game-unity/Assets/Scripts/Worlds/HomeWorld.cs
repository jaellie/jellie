using UnityEngine;
public class HomeWorld : World, IStandUp
{
    public HomeWorld(GameController game) : base(game, "home") { }
    public override void Build() { MakeSun("#FFD9A0", 1.2f, new Vector3(50, 200, 0)); }
    public void StandUp() { g.mom.Stand(); }
}
