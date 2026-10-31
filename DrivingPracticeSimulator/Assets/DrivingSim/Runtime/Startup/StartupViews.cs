using System;
using DrivingSim.Core;

namespace DrivingSim.Startup
{
    /// <summary>
    /// Screen contract for choosing the language. Codex's final design implements this on a
    /// MonoBehaviour and is assigned to <see cref="StartupFlow"/>; the logic never changes.
    /// </summary>
    public interface ILanguageSelectionView
    {
        /// <param name="current">Language to highlight.</param>
        /// <param name="allowCancel">False on first launch (a choice is required), true from Settings.</param>
        /// <param name="onSelected">Call once with the chosen language.</param>
        /// <param name="onCancelled">Call if the player backs out (only when allowCancel).</param>
        void Show(Language current, bool allowCancel, Action<Language> onSelected, Action onCancelled);
        void Hide();
    }

    public enum DisclaimerViewMode
    {
        /// <summary>First launch (or new notice version): the only way forward is acknowledging.</summary>
        Required,
        /// <summary>Opened from Settings: read-only, with a close button.</summary>
        Review,
    }

    /// <summary>Screen contract for the first-launch notice. Texts come from DisclaimerService keys.</summary>
    public interface IDisclaimerView
    {
        /// <param name="onAcknowledged">Required mode: call when the player confirms. Never call it automatically.</param>
        /// <param name="onClosed">Review mode: call when the player closes the notice.</param>
        void Show(DisclaimerViewMode mode, Action onAcknowledged, Action onClosed);
        void Hide();
    }
}
