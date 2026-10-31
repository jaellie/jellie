using DrivingSim.EditorTools;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    /// <summary>Runs the FBX import-test checks once Codex's kit is in Assets/DrivingSim/Art/ImportTest.</summary>
    public class ArtImportTestKitTests
    {
        [Test]
        public void ImportTestKit_MeetsTheAssetSpec()
        {
            if (!ArtImportValidator.KitPresent) Assert.Ignore("Import-test kit not delivered yet (Art/ImportTest/IT_Calibration.fbx).");
            CollectionAssert.IsEmpty(ArtImportValidator.Validate());
        }

        [Test]
        public void VehicleArt_HasEveryBindingTheGameNeeds()
        {
            if (ArtLocator.FindVehicleArt().IsEmpty) Assert.Ignore("No vehicle art yet.");
            CollectionAssert.IsEmpty(ArtLocator.ValidateBindings());
        }

        [Test]
        public void MaterialManifest_BuildsWithoutProblems()
        {
            if (!System.IO.File.Exists(ArtMaterialBuilder.ManifestPath)) Assert.Ignore("No materials.json yet.");
            CollectionAssert.IsEmpty(ArtMaterialBuilder.Build());
        }
    }
}
