using System;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.UI;
using UnityEngine;

namespace DrivingSim.Startup
{
    /// <summary>
    /// First-launch gate: language selection (until a choice is saved), then the mandatory notice
    /// (until the current notice version is acknowledged). Driving input and keyboard shortcuts are
    /// blocked until both are done. Settings can reopen either screen later.
    /// Screens are pluggable through <see cref="ILanguageSelectionView"/> / <see cref="IDisclaimerView"/>;
    /// when none is assigned, temporary placeholder screens are created so the gate always works.
    /// </summary>
    [DefaultExecutionOrder(-200)]
    public class StartupFlow : MonoBehaviour
    {
        /// <summary>Automated tests set this to skip the gate. Never set it in the shipped game.</summary>
        public static bool SuppressForAutomatedTests;

        [Tooltip("Optional final design: a component implementing ILanguageSelectionView.")]
        [SerializeField] MonoBehaviour languageViewOverride;
        [Tooltip("Optional final design: a component implementing IDisclaimerView.")]
        [SerializeField] MonoBehaviour disclaimerViewOverride;

        ILanguageSelectionView languageView;
        IDisclaimerView disclaimerView;
        bool blocking;

        /// <summary>True once language and notice are done; gameplay input is allowed.</summary>
        public bool GameplayAllowed { get; private set; }
        public event Action GameplayAllowedChanged;

        public bool IsShowingScreen { get; private set; }

        public void SetViews(MonoBehaviour languageViewComponent, MonoBehaviour disclaimerViewComponent)
        {
            languageViewOverride = languageViewComponent;
            disclaimerViewOverride = disclaimerViewComponent;
            languageView = null;
            disclaimerView = null;
        }

        void Awake()
        {
            // Block before any other component's Start can read input.
            if (!SuppressForAutomatedTests && NeedsFirstLaunchFlow) Block();
        }

        void Start()
        {
            if (SuppressForAutomatedTests)
            {
                Allow();
                return;
            }
            Continue();
        }

        void OnDestroy() => Unblock();

        public static bool NeedsFirstLaunchFlow => !LocalizationService.HasSavedChoice || !DisclaimerService.IsAcknowledged;

        /// <summary>Settings: change language. Gameplay stays blocked while the screen is open.</summary>
        public void OpenLanguageSelection() => ShowLanguage(firstLaunch: false);

        /// <summary>Settings: read the notice again.</summary>
        public void OpenDisclaimer()
        {
            ResolveViews();
            Block();
            IsShowingScreen = true;
            disclaimerView.Show(DisclaimerViewMode.Review, null, () =>
            {
                disclaimerView.Hide();
                IsShowingScreen = false;
                if (GameplayAllowed) Unblock();
            });
        }

        void Continue()
        {
            if (!LocalizationService.HasSavedChoice) ShowLanguage(firstLaunch: true);
            else if (!DisclaimerService.IsAcknowledged) ShowRequiredDisclaimer();
            else Allow();
        }

        void ShowLanguage(bool firstLaunch)
        {
            ResolveViews();
            Block();
            IsShowingScreen = true;
            languageView.Show(LocalizationService.Current, !firstLaunch,
                language =>
                {
                    LocalizationService.SetLanguage(language);
                    languageView.Hide();
                    IsShowingScreen = false;
                    if (firstLaunch || !GameplayAllowed) Continue();
                    else Unblock();
                },
                () =>
                {
                    languageView.Hide();
                    IsShowingScreen = false;
                    if (GameplayAllowed) Unblock();
                });
        }

        void ShowRequiredDisclaimer()
        {
            ResolveViews();
            Block();
            IsShowingScreen = true;
            disclaimerView.Show(DisclaimerViewMode.Required, () =>
            {
                DisclaimerService.Acknowledge();
                disclaimerView.Hide();
                IsShowingScreen = false;
                Allow();
            }, null);
        }

        void Allow()
        {
            bool changed = !GameplayAllowed;
            GameplayAllowed = true;
            Unblock();
            if (changed) GameplayAllowedChanged?.Invoke();
        }

        void Block()
        {
            if (blocking) return;
            blocking = true;
            DrivingInputGate.BlockDriving(this, blockKeyboardShortcuts: true);
        }

        void Unblock()
        {
            if (!blocking) return;
            blocking = false;
            DrivingInputGate.Release(this);
        }

        void ResolveViews()
        {
            if (languageView == null)
            {
                languageView = languageViewOverride as ILanguageSelectionView;
                if (languageView == null)
                {
                    if (languageViewOverride != null) Debug.LogWarning($"{languageViewOverride.name} does not implement ILanguageSelectionView; using the placeholder.");
                    languageView = PlaceholderLanguageView.Create();
                }
            }
            if (disclaimerView == null)
            {
                disclaimerView = disclaimerViewOverride as IDisclaimerView;
                if (disclaimerView == null)
                {
                    if (disclaimerViewOverride != null) Debug.LogWarning($"{disclaimerViewOverride.name} does not implement IDisclaimerView; using the placeholder.");
                    disclaimerView = PlaceholderDisclaimerView.Create();
                }
            }
        }
    }
}
