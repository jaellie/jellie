using System;
using DearMe.Story;

namespace DearMe.Save
{
    [Serializable]
    public class SaveData
    {
        public int version = SaveService.CurrentVersion;
        public string savedAtUtc = "";
        public string nodeId = "";
        public StoryState state = new StoryState();
    }

    /// <summary>Where save text lives. PlayerPrefs in Unity (IndexedDB on Web builds); memory in tests.</summary>
    public interface ISaveStorage
    {
        string Read(string key);
        void Write(string key, string value);
        void Delete(string key);
        /// <summary>Make sure data reaches disk / IndexedDB (browser tabs can close at any time).</summary>
        void Flush();
    }

    public interface IJsonSerializer
    {
        string ToJson(SaveData data);
        /// <summary>Returns null instead of throwing on malformed text.</summary>
        SaveData FromJson(string json);
    }

    public enum LoadStatus { NoSave, Loaded, RecoveredFromBackup, Corrupt, Migrated }

    public class LoadResult
    {
        public LoadStatus status;
        public SaveData data;
        public string message = "";
    }

    /// <summary>
    /// Saves only at stable story nodes (the runner's Checkpoint event). Keeps the previous
    /// good save as a backup so a half-written or corrupt primary slot never loses progress.
    /// </summary>
    public class SaveService
    {
        public const int CurrentVersion = 1;
        public const string PrimaryKey = "dearme.save";
        public const string BackupKey = "dearme.save.backup";

        readonly ISaveStorage storage;
        readonly IJsonSerializer json;
        readonly Func<DateTime> clock;

        public SaveService(ISaveStorage storage, IJsonSerializer json, Func<DateTime> clock = null)
        {
            this.storage = storage;
            this.json = json;
            this.clock = clock ?? (() => DateTime.UtcNow);
        }

        public bool HasSave => Validate(Parse(storage.Read(PrimaryKey))) || Validate(Parse(storage.Read(BackupKey)));

        public void Save(string nodeId, StoryState state)
        {
            var data = new SaveData
            {
                version = CurrentVersion,
                savedAtUtc = clock().ToString("o"),
                nodeId = nodeId,
                state = state,
            };
            string text = json.ToJson(data);

            // Promote the current primary to backup only if it is itself valid.
            string previous = storage.Read(PrimaryKey);
            if (Validate(Parse(previous))) storage.Write(BackupKey, previous);
            storage.Write(PrimaryKey, text);
            storage.Flush();
        }

        public LoadResult Load()
        {
            string primaryText = storage.Read(PrimaryKey);
            string backupText = storage.Read(BackupKey);
            if (string.IsNullOrEmpty(primaryText) && string.IsNullOrEmpty(backupText))
                return new LoadResult { status = LoadStatus.NoSave };

            var primary = Parse(primaryText);
            if (Validate(primary))
            {
                bool migrated = Migrate(primary);
                return new LoadResult { status = migrated ? LoadStatus.Migrated : LoadStatus.Loaded, data = primary };
            }

            var backup = Parse(backupText);
            if (Validate(backup))
            {
                Migrate(backup);
                return new LoadResult
                {
                    status = LoadStatus.RecoveredFromBackup,
                    data = backup,
                    message = "Primary save was unreadable; restored the previous checkpoint.",
                };
            }
            return new LoadResult { status = LoadStatus.Corrupt, message = "Save data could not be read." };
        }

        public void DeleteAll()
        {
            storage.Delete(PrimaryKey);
            storage.Delete(BackupKey);
            storage.Flush();
        }

        SaveData Parse(string text)
        {
            if (string.IsNullOrEmpty(text)) return null;
            try { return json.FromJson(text); }
            catch (Exception) { return null; } // Malformed JSON is reported as Corrupt by Load().
        }

        static bool Validate(SaveData d) =>
            d != null && d.version >= 0 && d.version <= CurrentVersion && !string.IsNullOrEmpty(d.nodeId) && d.state != null;

        /// <summary>Upgrades older formats in place. Returns true if anything changed.</summary>
        static bool Migrate(SaveData d)
        {
            if (d.version == CurrentVersion) return false;
            // Version 0 = prototype saves without pattern progress / loop numbers.
            if (d.state.patterns == null) d.state.patterns = new System.Collections.Generic.List<PatternProgress>();
            if (d.state.currentLoop < 1 && d.state.visitedLocations.Count > 1) d.state.currentLoop = 1;
            d.version = CurrentVersion;
            return true;
        }
    }
}
