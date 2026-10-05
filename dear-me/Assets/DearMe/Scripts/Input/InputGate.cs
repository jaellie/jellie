namespace DearMe.Input
{
    public enum InputState { Idle, Displaying, WaitingForInput, Choice, Transitioning, Locked }

    public enum GameAction { Advance, Choose, Interact, Cancel }

    /// <summary>
    /// Single gate every gameplay input goes through, so one physical click/tap/key can
    /// never advance dialogue twice, pick two choices, or slip through a transition.
    /// Pure logic: the caller supplies time and frame numbers.
    /// </summary>
    public class InputGate
    {
        public InputState State { get; private set; } = InputState.Idle;

        /// <summary>Minimum seconds between two accepted actions (filters double-clicks and rapid taps).</summary>
        public double MinInterval = 0.18;

        double lastAccepted = double.NegativeInfinity;
        int lastFrame = -1;
        double suspendedUntil = double.NegativeInfinity;

        public event System.Action<InputState> StateChanged;

        public void SetState(InputState state)
        {
            if (State == state) return;
            State = state;
            StateChanged?.Invoke(state);
        }

        /// <summary>Ignore everything until <paramref name="until"/>. Only ever extends an existing suspension.</summary>
        public void SuspendUntil(double until)
        {
            if (until > suspendedUntil) suspendedUntil = until;
        }

        /// <summary>App/tab lost focus: accept nothing until <see cref="Resume"/>.</summary>
        public void Suspend() => suspendedUntil = double.PositiveInfinity;

        /// <summary>Focus is back; keep ignoring input briefly so the click that refocused the tab doesn't act.</summary>
        public void Resume(double now, double grace = 0.35) => suspendedUntil = now + grace;

        public bool IsSuspended(double now) => now < suspendedUntil;

        public bool Allows(GameAction action)
        {
            switch (action)
            {
                case GameAction.Advance: return State == InputState.WaitingForInput || State == InputState.Displaying;
                case GameAction.Choose: return State == InputState.Choice;
                case GameAction.Interact: return State == InputState.Idle;
                case GameAction.Cancel: return State != InputState.Transitioning && State != InputState.Locked;
            }
            return false;
        }

        /// <summary>
        /// Returns true if the action may run now and records it. Callers must change
        /// <see cref="State"/> as a result of an accepted action (e.g. to Displaying).
        /// </summary>
        public bool TryConsume(GameAction action, double now, int frame)
        {
            if (IsSuspended(now)) return false;
            if (!Allows(action)) return false;
            if (frame == lastFrame) return false;
            if (action != GameAction.Cancel && now - lastAccepted < MinInterval) return false;
            lastAccepted = now;
            lastFrame = frame;
            return true;
        }
    }
}
