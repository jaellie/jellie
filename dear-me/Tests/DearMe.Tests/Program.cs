using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using DearMe.Content;
using DearMe.Input;
using DearMe.Language;
using DearMe.Save;
using DearMe.Settings;
using DearMe.Story;

namespace DearMe.Tests
{
    /// <summary>Tiny dependency-free test runner (the sandbox has no NuGet access).</summary>
    public static class Program
    {
        static int failures;
        static int checks;
        static string current = "";

        public static void Check(bool ok, string message)
        {
            checks++;
            if (ok) return;
            failures++;
            Console.WriteLine($"  FAIL [{current}] {message}");
        }

        public static int Main()
        {
            var tests = new (string, Action)[]
            {
                ("Markup", MarkupTests.Run),
                ("Flow line breaking", FlowLineTests.Run),
                ("Content sanitizer", SanitizerTests.Run),
                ("Content", ContentTests.Run),
                ("Drills", DrillTests.Run),
                ("Patterns", PatternTests.Run),
                ("Story conditions/effects", StateTests.Run),
                ("Playthroughs", PlaythroughTests.Run),
                ("Save", SaveTests.Run),
                ("Input gate", InputTests.Run),
                ("Settings", SettingsTests.Run),
            };
            foreach (var (name, run) in tests)
            {
                current = name;
                int before = failures;
                try { run(); }
                catch (Exception e) { failures++; Console.WriteLine($"  FAIL [{name}] threw {e}"); }
                Console.WriteLine($"{(failures == before ? "ok  " : "FAIL")} {name}");
            }
            Console.WriteLine($"\n{checks} checks, {failures} failures");
            return failures == 0 ? 0 : 1;
        }
    }

    public static class Data
    {
        public static readonly JsonSerializerOptions Options = new JsonSerializerOptions
        {
            IncludeFields = true,
            ReadCommentHandling = JsonCommentHandling.Disallow,
        };

        public static string Root
        {
            get
            {
                var dir = AppContext.BaseDirectory;
                while (dir != null && !Directory.Exists(Path.Combine(dir, "Assets"))) dir = Path.GetDirectoryName(dir);
                if (dir == null) throw new Exception("Could not find the Unity project root");
                return dir;
            }
        }

        public static string DataDir => Path.Combine(Root, "Assets/DearMe/Resources/DearMe/Data");

        public static T Load<T>(string file) =>
            JsonSerializer.Deserialize<T>(File.ReadAllText(Path.Combine(DataDir, file)), Options);

        static ContentDatabase cached;

        /// <summary>Mirrors ContentLoader.cs (Unity) — same files, same order.</summary>
        public static ContentDatabase Database()
        {
            if (cached != null) return cached;
            var db = new ContentDatabase();
            db.AddStory(Load<StoryFile>("story_slice.json"));
            db.AddVocab(Load<VocabFile>("vocabulary.json"));
            db.AddGrammar(Load<GrammarFile>("grammar.json"));
            db.AddDrills(Load<DrillFile>("drills.json"));
            db.AddDocuments(Load<DocumentFile>("documents.json"));
            db.AddPhotos(Load<PhotoFile>("photos.json"));
            db.AddLocations(Load<LocationFile>("locations.json"));
            db.AddRooms(Load<RoomFile>("rooms.json"));
            db.AddCharacters(Load<CharacterFile>("characters.json"));
            db.AddUi(Load<UiStringFile>("ui.json"));
            cached = db;
            return db;
        }
    }

    public class SystemTextJsonSerializer : IJsonSerializer
    {
        public string ToJson(SaveData data) => JsonSerializer.Serialize(data, Data.Options);
        public SaveData FromJson(string json) => JsonSerializer.Deserialize<SaveData>(json, Data.Options);
    }

    public class MemoryStorage : ISaveStorage
    {
        public readonly Dictionary<string, string> Values = new Dictionary<string, string>();
        public int Flushes;
        public string Read(string key) => Values.TryGetValue(key, out var v) ? v : null;
        public void Write(string key, string value) => Values[key] = value;
        public void Delete(string key) => Values.Remove(key);
        public void Flush() => Flushes++;
    }
}
