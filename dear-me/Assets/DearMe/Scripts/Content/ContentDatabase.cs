using System.Collections.Generic;

namespace DearMe.Content
{
    /// <summary>All loaded content, indexed by id. Pure C#: the Unity loader and the tests both fill it.</summary>
    public class ContentDatabase
    {
        public readonly Dictionary<string, StoryNode> Nodes = new Dictionary<string, StoryNode>();
        /// <summary>Resolved successor for nodes that leave "next" empty (the following node in the file).</summary>
        readonly Dictionary<string, string> implicitNext = new Dictionary<string, string>();

        public readonly Dictionary<string, VocabEntry> Vocab = new Dictionary<string, VocabEntry>();
        public readonly Dictionary<string, GrammarPattern> Patterns = new Dictionary<string, GrammarPattern>();
        public readonly Dictionary<string, DrillDef> Drills = new Dictionary<string, DrillDef>();
        public readonly Dictionary<string, DocumentDef> Documents = new Dictionary<string, DocumentDef>();
        public readonly Dictionary<string, PhotoDef> Photos = new Dictionary<string, PhotoDef>();
        public readonly Dictionary<string, LocationDef> Locations = new Dictionary<string, LocationDef>();
        public readonly Dictionary<string, RoomDef> Rooms = new Dictionary<string, RoomDef>();
        public readonly Dictionary<string, CharacterDef> Characters = new Dictionary<string, CharacterDef>();
        public readonly Dictionary<string, UiString> Ui = new Dictionary<string, UiString>();

        public string StartNode { get; private set; } = "";
        public readonly List<string> Errors = new List<string>();

        public void AddStory(StoryFile file)
        {
            if (file == null) return;
            if (StartNode.Length == 0) StartNode = file.start;
            for (int i = 0; i < file.nodes.Length; i++)
            {
                var node = file.nodes[i];
                if (string.IsNullOrEmpty(node.id)) { Errors.Add($"{file.id}: node #{i} has no id"); continue; }
                if (Nodes.ContainsKey(node.id)) { Errors.Add($"{file.id}: duplicate node id '{node.id}'"); continue; }
                Nodes[node.id] = node;
                if (i + 1 < file.nodes.Length) implicitNext[node.id] = file.nodes[i + 1].id;
            }
        }

        public string NextOf(StoryNode node)
        {
            if (!string.IsNullOrEmpty(node.next)) return node.next;
            return implicitNext.TryGetValue(node.id, out var n) ? n : "";
        }

        public void AddVocab(VocabFile f) { if (f != null) foreach (var e in f.entries) Add(Vocab, e.id, e, "vocab"); }
        public void AddGrammar(GrammarFile f) { if (f != null) foreach (var p in f.patterns) Add(Patterns, p.patternId, p, "pattern"); }
        public void AddDrills(DrillFile f) { if (f != null) foreach (var d in f.drills) Add(Drills, d.id, d, "drill"); }
        public void AddDocuments(DocumentFile f) { if (f != null) foreach (var d in f.documents) Add(Documents, d.id, d, "document"); }
        public void AddPhotos(PhotoFile f) { if (f != null) foreach (var p in f.photos) Add(Photos, p.id, p, "photo"); }
        public void AddLocations(LocationFile f) { if (f != null) foreach (var l in f.locations) Add(Locations, l.id, l, "location"); }
        public void AddRooms(RoomFile f) { if (f != null) foreach (var r in f.rooms) Add(Rooms, r.id, r, "room"); }
        public void AddCharacters(CharacterFile f) { if (f != null) foreach (var c in f.characters) Add(Characters, c.id, c, "character"); }
        public void AddUi(UiStringFile f) { if (f != null) foreach (var s in f.strings) Add(Ui, s.id, s, "ui string"); }

        void Add<T>(Dictionary<string, T> dict, string id, T value, string what)
        {
            if (string.IsNullOrEmpty(id)) { Errors.Add($"{what} without id"); return; }
            if (dict.ContainsKey(id)) { Errors.Add($"duplicate {what} id '{id}'"); return; }
            dict[id] = value;
        }

        public string UiKo(string id) => Ui.TryGetValue(id, out var s) ? s.ko : id;
        public string UiEn(string id) => Ui.TryGetValue(id, out var s) ? s.en : "";

        public string SpeakerNameKo(string speakerId)
        {
            if (string.IsNullOrEmpty(speakerId)) return "";
            return Characters.TryGetValue(speakerId, out var c) ? c.nameKo : speakerId;
        }

        public PhotoState PhotoStateOf(string photoId, string stateId)
        {
            if (!Photos.TryGetValue(photoId, out var photo) || photo.states.Length == 0) return null;
            foreach (var s in photo.states)
                if (s.id == stateId) return s;
            return photo.states[0];
        }
    }
}
