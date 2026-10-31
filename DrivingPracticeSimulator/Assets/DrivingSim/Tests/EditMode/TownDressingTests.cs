using System.IO;
using System.Linq;
using DrivingSim.Core;
using NUnit.Framework;
using UnityEngine;

namespace DrivingSim.Tests
{
    /// <summary>Street dressing stays out of the road layout's keep-out zones (the layout itself is not changed).</summary>
    public class TownDressingTests
    {
        static T Load<T>(string resource)
        {
            string path = Path.Combine(Application.dataPath, "DrivingSim", "Resources", resource + ".json");
            Assert.IsTrue(File.Exists(path), path);
            return JsonUtility.FromJson<T>(File.ReadAllText(path));
        }

        [Test]
        public void Dressing_MatchesLayoutVersion_AndHasContent()
        {
            var layout = Load<TownLayoutData>(TownLayoutData.ResourcePath);
            var dressing = Load<TownDressingData>(TownDressingData.ResourcePath);
            Assert.AreEqual(layout.version, dressing.layoutVersion);
            Assert.Greater(dressing.signs.Length, 0);
            Assert.Greater(dressing.props.Length, 0);
            Assert.IsTrue(dressing.signs.Any(s => s.type == "speed_limit" && s.value == "50"));
        }

        [Test]
        public void SignsAndOffRoadProps_AvoidKeepOutZones()
        {
            var layout = Load<TownLayoutData>(TownLayoutData.ResourcePath);
            var dressing = Load<TownDressingData>(TownDressingData.ResourcePath);
            var blocking = layout.keepOut.Where(k => k.kind != "sight_triangle").ToArray();
            foreach (TownSign s in dressing.signs)
                foreach (TownZone k in blocking)
                    Assert.IsFalse(TownGeometry.Inside(k.points, s.position[0], s.position[2]), $"{s.id} inside {k.id}");
            foreach (TownProp p in dressing.props.Where(p => !p.onRoad))
                foreach (TownZone k in blocking)
                    Assert.IsFalse(TownGeometry.Inside(k.points, p.position[0], p.position[2]), $"{p.id} inside {k.id}");
        }

        [Test]
        public void ParkedCars_AreInsideBuildingBlocks_AndOnRoadPropsSparePlayerLanes()
        {
            var layout = Load<TownLayoutData>(TownLayoutData.ResourcePath);
            var dressing = Load<TownDressingData>(TownDressingData.ResourcePath);
            foreach (TownProp p in dressing.props.Where(p => p.kind.StartsWith("parked")))
                Assert.IsTrue(layout.decorationZones.Any(z => z.kind == "building" && TownGeometry.Inside(z.points, p.position[0], p.position[2])), p.id);
            foreach (TownProp p in dressing.props.Where(p => p.onRoad))
                Assert.Less(p.position[0], 0f, p.id + " must stay out of the northbound lanes (default spawn)");
        }
    }
}
