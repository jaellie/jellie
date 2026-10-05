using System;
using System.Collections.Generic;
using DearMe.Audio;
using DearMe.Content;
using DearMe.Input;
using DearMe.Settings;
using DearMe.Story;
using DearMe.UI;

namespace DearMe.Core
{
    /// <summary>Connects the pure StoryRunner to the Unity views. Holds no story state of its own.</summary>
    public class StoryPresenter : IStoryPresenter
    {
        public StoryStateManager Story;

        readonly ContentDatabase db;
        readonly GameSettings settings;
        readonly InputGate gate;
        readonly TooltipController tooltips;
        readonly BackgroundView background;
        readonly RoomView room;
        readonly DialogueView dialogue;
        readonly ChoiceListView choices;
        readonly DocumentView documents;
        readonly PhotoView photos;
        readonly DrillView drills;
        readonly ScreenFader fader;
        readonly EndCardView endCard;
        readonly AudioManager audio;

        public StoryPresenter(ContentDatabase db, GameSettings settings, InputGate gate, TooltipController tooltips,
            BackgroundView background, RoomView room, DialogueView dialogue, ChoiceListView choices, DocumentView documents,
            PhotoView photos, DrillView drills, ScreenFader fader, EndCardView endCard, AudioManager audio)
        {
            this.db = db;
            this.settings = settings;
            this.gate = gate;
            this.tooltips = tooltips;
            this.background = background;
            this.room = room;
            this.dialogue = dialogue;
            this.choices = choices;
            this.documents = documents;
            this.photos = photos;
            this.drills = drills;
            this.fader = fader;
            this.endCard = endCard;
            this.audio = audio;
            choices.Selected += () => audio.PlaySfx("tap");
        }

        bool English => settings.support != LanguageSupportLevel.Off;

        void ClearStage()
        {
            room.Hide();
            choices.Hide();
            tooltips.Hide();
        }

        public void ShowLine(DialogueLine line, Action done)
        {
            ClearStage();
            dialogue.ShowLine(line, done);
        }

        public void ShowChoices(DialogueLine prompt, IList<DialogueLine> options, Action<int> chosen)
        {
            ClearStage();
            if (prompt != null) dialogue.ShowPrompt(prompt);
            else dialogue.Hide();
            choices.Show(options, index =>
            {
                dialogue.Hide();
                chosen(index);
            });
        }

        public void ShowDrill(DrillDef drill, Action<DrillOutcome> done)
        {
            ClearStage();
            dialogue.Hide();
            drills.Show(drill, done);
        }

        public void ShowDocument(DocumentDef document, Action closed)
        {
            ClearStage();
            dialogue.Hide();
            documents.Show(document, closed);
        }

        public void ShowPhoto(PhotoDef photo, PhotoState state, Action closed)
        {
            ClearStage();
            dialogue.Hide();
            photos.Show(photo, state, closed);
        }

        public void ShowRoom(RoomDef roomDef, IList<RoomObjectDef> visibleObjects, Action<RoomObjectDef> inspect)
        {
            ClearStage();
            dialogue.Hide();
            if (background.CurrentId != roomDef.location && db.Locations.TryGetValue(roomDef.location, out var loc))
                background.Show(loc);
            room.Show(roomDef, visibleObjects, Story.State.inspectedObjects, inspect);
        }

        public void PlayTransition(TransitionDef transition, Action done)
        {
            ClearStage();
            dialogue.Hide();
            gate.SetState(InputState.Transitioning);
            fader.Play(transition, English,
                () => RestoreScene(transition.to, transition.ambience),
                () =>
                {
                    gate.SetState(InputState.Idle);
                    done();
                });
        }

        public void ShowEnd(StoryNode end, Action done)
        {
            ClearStage();
            dialogue.Hide();
            gate.SetState(InputState.Locked);
            audio.SetAmbience(null);
            endCard.Show(end, English, done);
        }

        /// <summary>Puts the right place and sound back (after a transition, or when continuing a save).</summary>
        public void RestoreScene(string locationId, IEnumerable<string> ambience)
        {
            if (!string.IsNullOrEmpty(locationId) && db.Locations.TryGetValue(locationId, out var loc)) background.Show(loc);
            if (ambience != null) audio.SetAmbience(ambience);
        }

        public void HideAll()
        {
            ClearStage();
            dialogue.Hide();
            documents.Dismiss();
            photos.Dismiss();
            drills.Dismiss();
            endCard.Hide();
        }
    }
}
