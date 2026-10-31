using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class DialMathTests
    {
        [Test]
        public void Needle_SweepsSymmetricallyAroundTop()
        {
            Assert.AreEqual(-120f, DialMath.NeedleAngle(0f, 180f, 240f), 1e-3f);
            Assert.AreEqual(0f, DialMath.NeedleAngle(90f, 180f, 240f), 1e-3f);
            Assert.AreEqual(120f, DialMath.NeedleAngle(180f, 180f, 240f), 1e-3f);
        }

        [Test]
        public void Needle_ClampsOutsideRange()
        {
            Assert.AreEqual(120f, DialMath.NeedleAngle(400f, 180f, 240f), 1e-3f);
            Assert.AreEqual(-120f, DialMath.NeedleAngle(-20f, 180f, 240f), 1e-3f);
        }
    }
}
