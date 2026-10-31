using System.Collections.Generic;
using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class EnvironmentCatalogTests
    {
        [Test]
        public void Ids_AreUnique_AndFindable()
        {
            var seen = new HashSet<string>();
            foreach (EnvironmentInfo info in EnvironmentCatalog.All)
            {
                Assert.IsTrue(seen.Add(info.Id), "duplicate id " + info.Id);
                Assert.AreSame(info, EnvironmentCatalog.Find(info.Id));
            }
            Assert.IsNull(EnvironmentCatalog.Find("nope"));
        }

        [Test]
        public void OnlyTheTestTown_IsPlayable_ForNow()
        {
            foreach (EnvironmentInfo info in EnvironmentCatalog.All)
            {
                bool testTown = info.Id == EnvironmentCatalog.TestTownId;
                Assert.AreEqual(testTown, info.Status == EnvironmentStatus.Playable, info.Id);
                Assert.AreEqual(testTown, info.CanLaunchFreeDriving, info.Id);
                Assert.IsFalse(info.MissionsAvailable, "no mission system yet: " + info.Id);
            }
            Assert.AreEqual(EnvironmentCatalog.TestTownScene, EnvironmentCatalog.Find(EnvironmentCatalog.TestTownId).SceneName);
        }

        [Test]
        public void NonPlayableEnvironments_CannotLaunch_EvenIfFlagged()
        {
            var planned = new EnvironmentInfo("x", "map.urban.title", "map.urban.description", 3, EnvironmentStatus.Planned,
                sceneName: "Somewhere", freeDrivingAvailable: true, missionsAvailable: true);
            Assert.IsFalse(planned.CanLaunchFreeDriving);
            Assert.IsFalse(planned.MissionsAvailable);
        }

        [Test]
        public void ListsTheFourRoadmapMaps()
        {
            foreach (string id in new[] { "practice_ground", "urban", "residential", "suburban" })
                Assert.IsNotNull(EnvironmentCatalog.Find(id), id);
            foreach (EnvironmentInfo info in EnvironmentCatalog.All)
                Assert.That(info.Difficulty, Is.InRange(1, 3), info.Id);
        }
    }
}
