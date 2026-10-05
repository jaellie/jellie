using DearMe.Content;
using UnityEngine;

namespace DearMe.Platform
{
    /// <summary>Loads every content file from Resources/DearMe/Data into a <see cref="ContentDatabase"/>.</summary>
    public static class ContentLoader
    {
        const string Folder = "DearMe/Data/";

        public static ContentDatabase LoadAll()
        {
            var db = new ContentDatabase();
            db.AddStory(Load<StoryFile>("story_slice", db));
            db.AddVocab(Load<VocabFile>("vocabulary", db));
            db.AddGrammar(Load<GrammarFile>("grammar", db));
            db.AddDrills(Load<DrillFile>("drills", db));
            db.AddDocuments(Load<DocumentFile>("documents", db));
            db.AddPhotos(Load<PhotoFile>("photos", db));
            db.AddLocations(Load<LocationFile>("locations", db));
            db.AddRooms(Load<RoomFile>("rooms", db));
            db.AddCharacters(Load<CharacterFile>("characters", db));
            db.AddUi(Load<UiStringFile>("ui", db));
            foreach (var e in db.Errors) Debug.LogError("[DearMe content] " + e);
            return db;
        }

        static T Load<T>(string name, ContentDatabase db) where T : class
        {
            var asset = Resources.Load<TextAsset>(Folder + name);
            if (asset == null)
            {
                db.Errors.Add("Missing content file Resources/" + Folder + name + ".json");
                return null;
            }
            try
            {
                return ContentSanitizer.Sanitize(JsonUtility.FromJson<T>(asset.text));
            }
            catch (System.ArgumentException e)
            {
                // JsonUtility reports malformed JSON as ArgumentException.
                db.Errors.Add(name + ".json is not valid JSON: " + e.Message);
                return null;
            }
        }
    }
}
