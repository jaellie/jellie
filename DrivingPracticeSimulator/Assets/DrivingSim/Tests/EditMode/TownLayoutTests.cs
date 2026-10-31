using System.IO;
using System.Linq;
using DrivingSim.Core;
using NUnit.Framework;
using UnityEngine;

namespace DrivingSim.Tests
{
    /// <summary>Invariants of the authoritative test-town layout (the JSON Codex models against).</summary>
    public class TownLayoutTests
    {
        static TownLayoutData Load()
        {
            string path = Path.Combine(Application.dataPath, "DrivingSim", "Resources", TownLayoutData.ResourcePath + ".json");
            Assert.IsTrue(File.Exists(path), path);
            return JsonUtility.FromJson<TownLayoutData>(File.ReadAllText(path));
        }

        [Test]
        public void Parses_WithExpectedCrossSection()
        {
            TownLayoutData t = Load();
            Assert.AreEqual(1, t.version);
            Assert.AreEqual(0f, t.roadSurfaceY);
            Assert.AreEqual(0.15f, t.curbHeight, 1e-4f);
            Assert.AreEqual(t.roadSurfaceY + t.curbHeight, t.blockGroundY, 1e-4f);
            Assert.AreEqual(3f, t.sidewalkWidth, 1e-4f);
            Assert.AreEqual(6, t.roads.Length);
            Assert.AreEqual(4, t.crosswalks.Length);
            Assert.AreEqual(4, t.signals.Length);
        }

        [Test]
        public void RoadWidths_MatchLaneCounts()
        {
            foreach (TownRoad r in Load().roads)
            {
                Assert.AreEqual((r.lanesPositive + r.lanesNegative) * r.laneWidth, r.width, 1e-3f, r.id);
                var b = TownGeometry.Bounds(r.points);
                float across = r.axis == "z" ? b.maxX - b.minX : b.maxZ - b.minZ;
                Assert.AreEqual(r.width, across, 1e-3f, r.id);
            }
        }

        [Test]
        public void EveryStopLine_IsOnItsApproachLanes_AndBeforeTheCrosswalk()
        {
            TownLayoutData t = Load();
            foreach (TownStopLine s in t.stopLines)
            {
                var b = TownGeometry.Bounds(s.points);
                bool alongZ = s.approach == "NB" || s.approach == "SB";
                float depth = alongZ ? b.maxZ - b.minZ : b.maxX - b.minX;
                Assert.AreEqual(s.width, depth, 1e-3f, s.id);
                // Right-hand traffic: NB uses x > 0, SB x < 0, EB z < 0, WB z > 0.
                if (s.approach == "NB") Assert.Greater(b.minX, 0f, s.id);
                if (s.approach == "SB") Assert.Less(b.maxX, 0f, s.id);
                if (s.approach == "EB") Assert.Less(b.maxZ, 0f, s.id);
                if (s.approach == "WB") Assert.Greater(b.minZ, 0f, s.id);
            }
            foreach (TownStopLine s in t.stopLines.Where(x => x.intersection == "X0"))
            {
                var sb = TownGeometry.Bounds(s.points);
                TownCrosswalk cw = t.crosswalks.Single(c =>
                {
                    var cb = TownGeometry.Bounds(c.points);
                    switch (s.approach)
                    {
                        case "NB": return cb.maxZ < 0f && c.stripeAxis == "z";
                        case "SB": return cb.minZ > 0f && c.stripeAxis == "z";
                        case "EB": return cb.maxX < 0f && c.stripeAxis == "x";
                        default: return cb.minX > 0f && c.stripeAxis == "x";
                    }
                });
                var cwb = TownGeometry.Bounds(cw.points);
                float gap = s.approach == "NB" ? cwb.minZ - sb.maxZ : s.approach == "SB" ? sb.minZ - cwb.maxZ
                          : s.approach == "EB" ? cwb.minX - sb.maxX : sb.minX - cwb.maxX;
                Assert.AreEqual(2f, gap, 1e-3f, s.id + " to " + cw.id);
            }
        }

        [Test]
        public void Crosswalks_AreFourMetersDeep_WithKoreanStripes()
        {
            foreach (TownCrosswalk c in Load().crosswalks)
            {
                var b = TownGeometry.Bounds(c.points);
                float depth = c.stripeAxis == "z" ? b.maxZ - b.minZ : b.maxX - b.minX;
                Assert.AreEqual(4f, depth, 1e-3f, c.id);
                Assert.AreEqual(0.45f, c.stripeWidth, 1e-4f, c.id);
                Assert.AreEqual(0.45f, c.stripeGap, 1e-4f, c.id);
            }
        }

        [Test]
        public void Signals_StandOnSidewalks_WithHeadsAboveFourAndAHalfMeters()
        {
            TownLayoutData t = Load();
            foreach (TownSignal s in t.signals)
            {
                Assert.AreEqual(t.blockGroundY, s.pole[1], 1e-3f, s.id + " pole base on the sidewalk");
                bool onRoad = t.roads.Any(r => TownGeometry.Contains(r.points, s.pole[0], s.pole[2], -0.01f))
                           || t.intersections.Any(i => TownGeometry.Contains(i.points, s.pole[0], s.pole[2], -0.01f));
                Assert.IsFalse(onRoad, s.id + " pole must not stand on a carriageway");
                Assert.GreaterOrEqual(s.head[1] - 0.25f, 4.5f, s.id + " head bottom height");
                Assert.AreEqual(s.type == "4lamp" ? 4 : 3, s.lamps.Length, s.id);
            }
            Assert.AreEqual(45f, t.signalCycle.Sum(p => p.durationS), 1e-3f);
        }

        [Test]
        public void Spawn_IsOnTheNorthboundOuterLane_InsideItsClearZone()
        {
            TownLayoutData t = Load();
            TownSpawn s = t.spawns.Single(x => x.id == "Default");
            TownRoad main = t.roads.Single(r => r.id == "Main");
            Assert.AreEqual(main.laneWidth * 1.5f, s.position[0], 1e-3f);
            Assert.IsTrue(TownGeometry.Contains(t.keepOut.Single(k => k.kind == "spawn_clear").points, s.position[0], s.position[2]));
        }
    }
}
