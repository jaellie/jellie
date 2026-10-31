using System.Collections;
using System.Collections.Generic;
using System.Linq;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Startup;
using DrivingSim.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace DrivingSim.Tests
{
    // Written for the existing PlayMode assembly. Not executed without Unity.
    public class AutomotiveUIPresentationTests
    {
        readonly List<GameObject> objects = new List<GameObject>();
        Component events;
        bool previousSuppression;

        [SetUp]
        public void SetUp()
        {
            previousSuppression = StartupFlow.SuppressForAutomatedTests;
            // The existing test asmdef has no direct uGUI reference. Keep it unchanged and
            // construct real uGUI event objects through reflection in these editor PlayMode tests.
            System.Type eventType = System.Type.GetType("UnityEngine.EventSystems.EventSystem, UnityEngine.UI", true);
            var go = new GameObject("UI Test Events");
            objects.Add(go);
            events = go.AddComponent(eventType);
            eventType.GetProperty("sendNavigationEvents").SetValue(events, false);
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            foreach (GameObject item in objects) if (item != null) Object.Destroy(item);
            objects.Clear();
            StartupFlow.SuppressForAutomatedTests = previousSuppression;
            yield return null;
        }

        HoldButton Find(Component view, string name) => view.GetComponentsInChildren<HoldButton>(true).Single(b => b.name == name);
        void Press(Component view, string name)
        {
            HoldButton button = Find(view, name);
            var down = typeof(HoldButton).GetMethod("OnPointerDown");
            System.Type pointerType = down.GetParameters()[0].ParameterType;
            object pointer = System.Activator.CreateInstance(pointerType, new object[] { events });
            System.Type inputButton = pointerType.GetNestedType("InputButton");
            pointerType.GetProperty("button").SetValue(pointer, System.Enum.Parse(inputButton, "Left"));
            pointerType.GetProperty("pointerId").SetValue(pointer, 1);
            down.Invoke(button, new[] { pointer });
            typeof(HoldButton).GetMethod("OnPointerUp").Invoke(button, new[] { pointer });
        }

        [Test]
        public void BundledTheme_HasKoreanFont_AndAssignedArt()
        {
            HudTheme theme = Resources.Load<HudTheme>("UI/MidnightTheme");
            Assert.IsNotNull(theme);
            Assert.IsNotNull(theme.font);
            Assert.IsTrue(theme.Font.HasCharacter('한'));
            Assert.IsTrue(theme.Font.HasCharacter('글'));
            Assert.IsNotNull(theme.roundedPanel);
            Assert.IsNotNull(theme.turnArrowLeft);
            Assert.IsNotNull(theme.turnArrowRight);
            Assert.IsNotNull(theme.carMarker);
        }

        [UnityTest]
        public IEnumerator RequiredNotice_OnlyExplicitAcknowledgment_OncePerShow()
        {
            PlaceholderDisclaimerView view = PlaceholderDisclaimerView.Create();
            objects.Add(view.gameObject);
            int accepted = 0, closed = 0;
            view.Show(DisclaimerViewMode.Required, () => accepted++, () => closed++);
            yield return null;
            Assert.AreEqual(0, accepted, "Showing/laying out the notice must not accept it.");
            Assert.IsFalse(Find(view, "Close").gameObject.activeSelf);
            Press(view, "Close");
            Assert.AreEqual(0, closed);
            Press(view, "Acknowledge");
            Press(view, "Acknowledge");
            Assert.AreEqual(1, accepted);
            Assert.AreEqual(0, closed);
        }

        [UnityTest]
        public IEnumerator ReviewNotice_ClosesWithoutAcknowledgment()
        {
            PlaceholderDisclaimerView view = PlaceholderDisclaimerView.Create();
            objects.Add(view.gameObject);
            int accepted = 0, closed = 0;
            view.Show(DisclaimerViewMode.Review, () => accepted++, () => closed++);
            yield return null;
            Assert.IsFalse(Find(view, "Acknowledge").gameObject.activeSelf);
            Press(view, "Acknowledge");
            Press(view, "Close");
            Press(view, "Close");
            Assert.AreEqual(0, accepted);
            Assert.AreEqual(1, closed);
        }

        [UnityTest]
        public IEnumerator Language_FirstLaunchCannotCancel_AndCallbacksAreExclusive()
        {
            PlaceholderLanguageView view = PlaceholderLanguageView.Create();
            objects.Add(view.gameObject);
            int selected = 0, cancelled = 0;
            view.Show(Language.Korean, false, _ => selected++, () => cancelled++);
            yield return null;
            Assert.IsFalse(Find(view, "Cancel").gameObject.activeSelf);
            Press(view, "Cancel");
            Press(view, "Korean");
            Press(view, "English");
            Assert.AreEqual(1, selected);
            Assert.AreEqual(0, cancelled);
            view.Show(Language.Korean, true, _ => selected++, () => cancelled++);
            Press(view, "Cancel");
            Press(view, "English");
            Assert.AreEqual(1, selected);
            Assert.AreEqual(1, cancelled);
        }

        [UnityTest]
        public IEnumerator Menu_DoesNotLaunchUnavailableModes_OrDuplicateRequests()
        {
            StartupFlow.SuppressForAutomatedTests = true;
            var flowObject = new GameObject("UI Test Startup", typeof(StartupFlow));
            objects.Add(flowObject);
            StartupFlow flow = flowObject.GetComponent<StartupFlow>();
            yield return null; // StartupFlow.Allow, using the existing test-only bypass.
            PracticeMenuView view = PracticeMenuView.Create(flow);
            objects.Add(view.gameObject);
            int launches = 0;
            view.LaunchRequested += _ => launches++;
            var option = new PracticeEnvironmentOption
            {
                id = "test", titleKey = "environments.skills.title", descriptionKey = "environments.skills.description",
                detailsKey = "environments.skills.details", available = true, freeDrivingAvailable = false
            };
            view.SetCatalog(new[] { option });
            view.ShowEnvironments();
            Assert.IsTrue(DrivingInputGate.DrivingBlocked);
            Press(view, "environments.startFreeDriving");
            Assert.AreEqual(0, launches);
            option.freeDrivingAvailable = true;
            view.SetCatalog(new[] { option });
            yield return null;
            Press(view, "environments.startFreeDriving");
            Press(view, "environments.startFreeDriving");
            Assert.AreEqual(1, launches);
            view.ClearLaunchPending();
            Press(view, "environments.missions");
            yield return null;
            Press(view, "environments.startMission");
            Assert.AreEqual(1, launches, "No mission may fall back to free driving.");
            view.Hide();
            Assert.IsFalse(DrivingInputGate.DrivingBlocked);
        }

        [UnityTest]
        public IEnumerator LandscapeFrame_StaysInsideSafeContainer_AfterResize()
        {
            var go = new GameObject("Safe Container", typeof(RectTransform));
            objects.Add(go);
            RectTransform safe = go.GetComponent<RectTransform>();
            safe.sizeDelta = new Vector2(1760f, 1010f);
            RectTransform frame = AutomotiveLayout.Frame(safe);
            yield return null;
            Assert.LessOrEqual(frame.rect.width * frame.localScale.x, safe.rect.width + 0.1f);
            Assert.LessOrEqual(frame.rect.height * frame.localScale.y, safe.rect.height + 0.1f);
            safe.sizeDelta = new Vector2(2300f, 1000f);
            yield return null;
            yield return null;
            Assert.LessOrEqual(frame.rect.width * frame.localScale.x, safe.rect.width + 0.1f);
            Assert.LessOrEqual(frame.rect.height * frame.localScale.y, safe.rect.height + 0.1f);
        }
    }
}
