using System;
using System.Collections;
using System.Collections.Generic;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Persistence;
using DrivingSim.Startup;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace DrivingSim.Tests
{
    /// <summary>Test double for the language screen: records what StartupFlow asked for and lets the test act as the player.</summary>
    public class FakeLanguageView : MonoBehaviour, ILanguageSelectionView
    {
        public int ShowCount;
        public bool Visible;
        public bool LastAllowCancel;
        public Language LastCurrent;
        Action<Language> onSelected;
        Action onCancelled;

        public void Show(Language current, bool allowCancel, Action<Language> selected, Action cancelled)
        {
            ShowCount++;
            Visible = true;
            LastCurrent = current;
            LastAllowCancel = allowCancel;
            onSelected = selected;
            onCancelled = cancelled;
        }

        public void Hide() => Visible = false;

        public void Pick(Language language) => onSelected(language);
        public void Cancel() => onCancelled();
    }

    /// <summary>Test double for the notice screen.</summary>
    public class FakeDisclaimerView : MonoBehaviour, IDisclaimerView
    {
        public int ShowCount;
        public bool Visible;
        public DisclaimerViewMode LastMode;
        public Action OnAcknowledged;
        public Action OnClosed;

        public void Show(DisclaimerViewMode mode, Action acknowledged, Action closed)
        {
            ShowCount++;
            Visible = true;
            LastMode = mode;
            OnAcknowledged = acknowledged;
            OnClosed = closed;
        }

        public void Hide() => Visible = false;
    }

    /// <summary>
    /// First-launch gate: language → mandatory notice → gameplay, with driving input blocked until
    /// both are done, plus the Settings entry points. Uses test-double screens, so it checks the
    /// logic, not the visual design. The player's saved language and acknowledgment are restored afterwards.
    /// </summary>
    public class StartupFlowPlayModeTests
    {
        readonly List<GameObject> created = new List<GameObject>();
        FakeLanguageView languageView;
        FakeDisclaimerView disclaimerView;

        bool savedSuppress;
        string savedLanguagePref;
        DisclaimerAcknowledgment savedRecord;

        [SetUp]
        public void SetUp()
        {
            LogAssert.ignoreFailingMessages = true;
            savedSuppress = StartupFlow.SuppressForAutomatedTests;
            savedLanguagePref = PlayerPrefs.HasKey(LocalizationService.PrefsKey) ? PlayerPrefs.GetString(LocalizationService.PrefsKey) : null;
            DisclaimerService.Reload();
            savedRecord = DisclaimerService.Record;

            StartupFlow.SuppressForAutomatedTests = false;
            DrivingInputGate.ResetAll();
            LocalizationService.ClearSavedChoice();
            DisclaimerService.ClearAcknowledgment();

            var views = new GameObject("TestStartupViews");
            created.Add(views);
            languageView = views.AddComponent<FakeLanguageView>();
            disclaimerView = views.AddComponent<FakeDisclaimerView>();
        }

        [TearDown]
        public void TearDown()
        {
            foreach (GameObject go in created) if (go != null) UnityEngine.Object.Destroy(go);
            created.Clear();
            DrivingInputGate.ResetAll();
            StartupFlow.SuppressForAutomatedTests = savedSuppress;

            if (savedLanguagePref != null && LanguageInfo.TryParse(savedLanguagePref, out Language language))
                LocalizationService.SetLanguage(language);
            else
                LocalizationService.ClearSavedChoice();

            if (savedRecord != null) SaveManager.Save(DisclaimerService.SaveName, savedRecord);
            else SaveManager.Delete(DisclaimerService.SaveName);
            DisclaimerService.Reload();
        }

        IEnumerator StartFlow(Action<StartupFlow> received)
        {
            var go = new GameObject("StartupFlow");
            created.Add(go);
            StartupFlow flow = go.AddComponent<StartupFlow>(); // Awake runs now
            flow.SetViews(languageView, disclaimerView);
            yield return null;                                 // Start runs before this frame ends
            received(flow);
        }

        [UnityTest]
        public IEnumerator FirstLaunch_LanguageThenRequiredNotice_BlocksUntilAcknowledged()
        {
            StartupFlow flow = null;
            int allowedEvents = 0;
            yield return StartFlow(f => flow = f);
            flow.GameplayAllowedChanged += () => allowedEvents++;

            Assert.AreEqual(1, languageView.ShowCount, "language screen first");
            Assert.IsFalse(languageView.LastAllowCancel, "first launch: a language must be chosen");
            Assert.AreEqual(0, disclaimerView.ShowCount);
            Assert.IsTrue(DrivingInputGate.DrivingBlocked);
            Assert.IsTrue(DrivingInputGate.KeyboardShortcutsBlocked);
            Assert.IsFalse(flow.GameplayAllowed);

            languageView.Pick(Language.EnglishUS);
            Assert.IsFalse(languageView.Visible);
            Assert.AreEqual(Language.EnglishUS, LocalizationService.Current);
            Assert.IsTrue(LocalizationService.HasSavedChoice);
            Assert.AreEqual("en-US", PlayerPrefs.GetString(LocalizationService.PrefsKey));

            Assert.AreEqual(1, disclaimerView.ShowCount, "notice after the language");
            Assert.AreEqual(DisclaimerViewMode.Required, disclaimerView.LastMode);
            Assert.IsNull(disclaimerView.OnClosed, "Required mode offers no way to dismiss");
            Assert.IsNotNull(disclaimerView.OnAcknowledged);
            Assert.IsTrue(DrivingInputGate.DrivingBlocked, "still blocked until the notice is acknowledged");
            Assert.IsFalse(DisclaimerService.IsAcknowledged);
            Assert.IsFalse(flow.GameplayAllowed);

            disclaimerView.OnAcknowledged();
            Assert.IsFalse(disclaimerView.Visible);
            Assert.IsTrue(flow.GameplayAllowed);
            Assert.AreEqual(1, allowedEvents);
            Assert.IsFalse(DrivingInputGate.DrivingBlocked);
            Assert.IsFalse(DrivingInputGate.KeyboardShortcutsBlocked);

            Assert.IsTrue(DisclaimerService.IsAcknowledged);
            Assert.AreEqual(DisclaimerPolicy.CurrentVersion, DisclaimerService.Record.version);
            Assert.AreEqual("en-US", DisclaimerService.Record.language);
            Assert.IsTrue(DateTime.TryParse(DisclaimerService.Record.acknowledgedUtc, out _), "acknowledgment time is stored");
        }

        [UnityTest]
        public IEnumerator Acknowledgment_IsSavedToDisk()
        {
            LocalizationService.SetLanguage(Language.Korean);
            DisclaimerService.Acknowledge();
            DisclaimerService.Reload(); // forget the cache, read the file
            Assert.IsTrue(DisclaimerService.IsAcknowledged);
            Assert.AreEqual("ko-KR", DisclaimerService.Record.language);
            yield return null;
        }

        [UnityTest]
        public IEnumerator ReturningPlayer_SeesNoScreens_AndCanDrive()
        {
            LocalizationService.SetLanguage(Language.Korean);
            DisclaimerService.Acknowledge();

            StartupFlow flow = null;
            yield return StartFlow(f => flow = f);

            Assert.AreEqual(0, languageView.ShowCount);
            Assert.AreEqual(0, disclaimerView.ShowCount);
            Assert.IsTrue(flow.GameplayAllowed);
            Assert.IsFalse(DrivingInputGate.DrivingBlocked);
        }

        [UnityTest]
        public IEnumerator LanguageSaved_NoticeNotAcknowledged_ShowsOnlyTheNotice()
        {
            LocalizationService.SetLanguage(Language.Korean);

            StartupFlow flow = null;
            yield return StartFlow(f => flow = f);

            Assert.AreEqual(0, languageView.ShowCount);
            Assert.AreEqual(1, disclaimerView.ShowCount);
            Assert.AreEqual(DisclaimerViewMode.Required, disclaimerView.LastMode);
            Assert.IsTrue(DrivingInputGate.DrivingBlocked);
            Assert.IsFalse(flow.GameplayAllowed);
        }

        [UnityTest]
        public IEnumerator Settings_ReviewNotice_BlocksWhileOpen_AndKeepsTheRecord()
        {
            LocalizationService.SetLanguage(Language.Korean);
            DisclaimerService.Acknowledge();
            string acknowledgedAt = DisclaimerService.Record.acknowledgedUtc;

            StartupFlow flow = null;
            yield return StartFlow(f => flow = f);

            flow.OpenDisclaimer();
            Assert.AreEqual(DisclaimerViewMode.Review, disclaimerView.LastMode);
            Assert.IsNull(disclaimerView.OnAcknowledged, "Review mode has nothing to acknowledge");
            Assert.IsNotNull(disclaimerView.OnClosed);
            Assert.IsTrue(DrivingInputGate.DrivingBlocked);

            flow.OpenLanguageSelection(); // ignored: one startup screen at a time
            Assert.AreEqual(0, languageView.ShowCount);

            disclaimerView.OnClosed();
            Assert.IsFalse(disclaimerView.Visible);
            Assert.IsFalse(DrivingInputGate.DrivingBlocked);
            Assert.IsTrue(flow.GameplayAllowed);
            Assert.AreEqual(acknowledgedAt, DisclaimerService.Record.acknowledgedUtc);
        }

        [UnityTest]
        public IEnumerator Settings_ChangeLanguage_CancelKeeps_SelectSwitchesAndSaves()
        {
            LocalizationService.SetLanguage(Language.Korean);
            DisclaimerService.Acknowledge();
            var changes = new List<Language>();
            Action<Language> listener = changes.Add;
            LocalizationService.LanguageChanged += listener;
            try
            {
                StartupFlow flow = null;
                yield return StartFlow(f => flow = f);

                flow.OpenLanguageSelection();
                Assert.IsTrue(languageView.LastAllowCancel, "Settings may cancel");
                Assert.AreEqual(Language.Korean, languageView.LastCurrent);
                Assert.IsTrue(DrivingInputGate.DrivingBlocked);
                languageView.Cancel();
                Assert.AreEqual(Language.Korean, LocalizationService.Current);
                Assert.IsFalse(DrivingInputGate.DrivingBlocked);
                Assert.AreEqual(0, changes.Count);

                flow.OpenLanguageSelection();
                languageView.Pick(Language.EnglishUS);
                Assert.AreEqual(Language.EnglishUS, LocalizationService.Current);
                Assert.AreEqual("en-US", PlayerPrefs.GetString(LocalizationService.PrefsKey));
                CollectionAssert.AreEqual(new[] { Language.EnglishUS }, changes);
                Assert.IsFalse(DrivingInputGate.DrivingBlocked);
                Assert.AreEqual(0, disclaimerView.ShowCount, "changing language later does not re-ask the notice");
                Assert.IsTrue(flow.GameplayAllowed);
            }
            finally
            {
                LocalizationService.LanguageChanged -= listener;
            }
        }

        [UnityTest]
        public IEnumerator NoDesignAssigned_PlaceholderScreensStillGate()
        {
            var go = new GameObject("StartupFlow");
            created.Add(go);
            StartupFlow flow = go.AddComponent<StartupFlow>();
            yield return null;

            var placeholder = UnityEngine.Object.FindFirstObjectByType<DrivingSim.UI.PlaceholderLanguageView>();
            Assert.IsNotNull(placeholder, "a placeholder language screen is created");
            created.Add(placeholder.gameObject);
            Assert.IsTrue(DrivingInputGate.DrivingBlocked);
            Assert.IsFalse(flow.GameplayAllowed);

            var notice = UnityEngine.Object.FindFirstObjectByType<DrivingSim.UI.PlaceholderDisclaimerView>(FindObjectsInactive.Include);
            if (notice != null) created.Add(notice.gameObject);
        }
    }
}
