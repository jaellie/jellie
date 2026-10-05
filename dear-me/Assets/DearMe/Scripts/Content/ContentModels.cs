using System;
using System.Collections.Generic;

// Plain serializable content definitions. They are filled from the JSON files in
// Resources/DearMe/Data by JsonUtility (Unity) or System.Text.Json (tests), so they
// use public fields, no properties, no polymorphism, and initialized arrays.
namespace DearMe.Content
{
    public enum TokenType { Word, Particle, Grammar, Phrase, Punctuation }

    /// <summary>One hoverable/tappable piece of a Korean line. Produced by <see cref="KoreanMarkup"/>.</summary>
    [Serializable]
    public class Token
    {
        public string korean = "";
        public string english = "";
        public TokenType type = TokenType.Word;
        public string vocabId = "";
        public string patternId = "";
        public string optionalExplanation = "";
        /// <summary>True when this token attaches to the previous one without a space (one unbreakable unit).</summary>
        public bool glue;

        public bool HasInfo => english.Length > 0 || vocabId.Length > 0 || patternId.Length > 0;
    }

    /// <summary>A parsed, display-ready Korean line.</summary>
    public class DialogueLine
    {
        public string id = "";
        public string speaker = "";
        public string koreanText = "";
        public string englishTranslation = "";
        public List<Token> tokens = new List<Token>();
    }

    // ---------------------------------------------------------------- story graph

    [Serializable]
    public class StoryFile
    {
        public string id = "";
        public string start = "";
        public StoryNode[] nodes = new StoryNode[0];
    }

    [Serializable]
    public class StoryNode
    {
        public string id = "";
        /// <summary>line | choice | drill | document | photo | explore | transition | branch | effect | return | end</summary>
        public string type = "line";
        public string speaker = "";
        public string ko = "";
        public string en = "";
        /// <summary>Empty means "the next node in the file".</summary>
        public string next = "";
        public string[] effects = new string[0];

        public ChoiceDef[] choices = new ChoiceDef[0];
        public string drill = "";
        public string document = "";
        public string photo = "";
        public string room = "";
        public string[] exitWhen = new string[0];
        public BranchCase[] cases = new BranchCase[0];
        public TransitionDef transition = new TransitionDef();
        public string titleKo = "";
        public string titleEn = "";
        public string bodyKo = "";
        public string bodyEn = "";
    }

    [Serializable]
    public class ChoiceDef
    {
        public string ko = "";
        public string en = "";
        public string next = "";
        public string[] when = new string[0];
        public string[] effects = new string[0];
    }

    [Serializable]
    public class BranchCase
    {
        public string[] when = new string[0];
        public string next = "";
    }

    [Serializable]
    public class TransitionDef
    {
        public string to = "";
        /// <summary>fade | photo | slow | cut</summary>
        public string style = "fade";
        public string[] ambience = new string[0];
        public string titleKo = "";
        public string titleEn = "";
    }

    // ---------------------------------------------------------------- language data

    [Serializable]
    public class VocabFile { public VocabEntry[] entries = new VocabEntry[0]; }

    [Serializable]
    public class VocabEntry
    {
        public string id = "";
        public string ko = "";
        public string en = "";
        public string pos = "";
        public int level = 1;
        public string note = "";
    }

    [Serializable]
    public class GrammarFile { public GrammarPattern[] patterns = new GrammarPattern[0]; }

    [Serializable]
    public class GrammarPattern
    {
        public string patternId = "";
        public string patternText = "";
        public string meaning = "";
        public string englishMeaning = "";
        public string explanation = "";
        public int difficulty = 1;
        public int chapterIntroduced = 1;
        public ExampleSentence[] exampleSentences = new ExampleSentence[0];
        public string[] substitutionWords = new string[0];
        public string negativeForm = "";
        public string[] transformationRules = new string[0];
        public string[] drillTemplates = new string[0];
        public int[] recyclingChapters = new int[0];
    }

    [Serializable]
    public class ExampleSentence
    {
        public string ko = "";
        public string en = "";
        public int chapter;
    }

    // ---------------------------------------------------------------- drills

    [Serializable]
    public class DrillFile { public DrillDef[] drills = new DrillDef[0]; }

    [Serializable]
    public class DrillDef
    {
        public string id = "";
        /// <summary>meaning | comprehension | context | substitution | order | transform | negative | production | match</summary>
        public string kind = "";
        public string patternId = "";
        public string speaker = "";
        public string introKo = "";
        public string introEn = "";
        public string promptKo = "";
        public string promptEn = "";
        public string instructionKo = "";
        public string instructionEn = "";
        public string referenceDocument = "";
        public string referencePhoto = "";
        public string storeAs = "";

        public DrillOption[] options = new DrillOption[0];
        public SubstitutionItem[] items = new SubstitutionItem[0];
        public Chunk[] chunks = new Chunk[0];
        /// <summary>Accepted answers for order/transform/negative drills, compared without spaces.</summary>
        public string[] answers = new string[0];
        /// <summary>Grammatical but not what this drill asks for; gets a gentle redirect instead of "wrong".</summary>
        public AltAnswer[] alternatives = new AltAnswer[0];
        public string hintKo = "";
        public string hintEn = "";
        public Chunk[] slotsA = new Chunk[0];
        public Chunk[] slotsB = new Chunk[0];
        public PairVerdict[] pairs = new PairVerdict[0];
        public MatchPair[] matchPairs = new MatchPair[0];
        public string successKo = "";
        public string successEn = "";
        public string[] successEffects = new string[0];
    }

    [Serializable]
    public class DrillOption
    {
        public string ko = "";
        public string en = "";
        public bool correct;
        /// <summary>For context drills: grammatical but unnatural here.</summary>
        public bool grammaticalOnly;
        public string feedbackKo = "";
        public string feedbackEn = "";
        public string[] effects = new string[0];
    }

    [Serializable]
    public class SubstitutionItem
    {
        public string who = "";
        public string baseKo = "";
        public string baseEn = "";
        public string[] options = new string[0];
        public int answer;
        public string feedbackKo = "";
        public string feedbackEn = "";
    }

    [Serializable]
    public class Chunk
    {
        public string ko = "";
        public string en = "";
        /// <summary>Attaches to the previous chunk without a space when assembled.</summary>
        public bool glue;
    }

    [Serializable]
    public class AltAnswer
    {
        public string answer = "";
        public string feedbackKo = "";
        public string feedbackEn = "";
    }

    [Serializable]
    public class PairVerdict
    {
        public int a;
        public int b;
        /// <summary>natural | odd | wrong</summary>
        public string verdict = "odd";
        public string feedbackKo = "";
        public string feedbackEn = "";
        public string[] effects = new string[0];
    }

    [Serializable]
    public class MatchPair
    {
        public string ko = "";
        public string en = "";
    }

    // ---------------------------------------------------------------- world

    [Serializable]
    public class DocumentFile { public DocumentDef[] documents = new DocumentDef[0]; }

    [Serializable]
    public class DocumentDef
    {
        public string id = "";
        /// <summary>diary | notice | note | messages | paper</summary>
        public string kind = "paper";
        public string titleKo = "";
        public string titleEn = "";
        public DocLine[] lines = new DocLine[0];
    }

    [Serializable]
    public class DocLine
    {
        public string speaker = "";
        public string ko = "";
        public string en = "";
        /// <summary>"" | heading | small | stain | gap</summary>
        public string style = "";
    }

    [Serializable]
    public class PhotoFile { public PhotoDef[] photos = new PhotoDef[0]; }

    [Serializable]
    public class PhotoDef
    {
        public string id = "";
        public string titleKo = "";
        public string titleEn = "";
        public PhotoState[] states = new PhotoState[0];
    }

    [Serializable]
    public class PhotoState
    {
        public string id = "";
        public string background = "#d8cdb5";
        public string dateStamp = "";
        public Shape[] shapes = new Shape[0];
        public DocLine[] details = new DocLine[0];
    }

    [Serializable]
    public class Shape
    {
        public float x;
        public float y;
        public float w;
        public float h;
        public string color = "#000000";
        /// <summary>Optional markup label drawn inside the shape.</summary>
        public string label = "";
        public string labelEn = "";
    }

    [Serializable]
    public class LocationFile { public LocationDef[] locations = new LocationDef[0]; }

    [Serializable]
    public class LocationDef
    {
        public string id = "";
        public string nameKo = "";
        public string nameEn = "";
        public string top = "#1d2738";
        public string bottom = "#2b3448";
        public bool rain;
        /// <summary>Where rain is visible (e.g. the window glass). Empty = whole screen.</summary>
        public Shape rainArea = new Shape();
        public bool night;
        public Shape[] shapes = new Shape[0];
    }

    [Serializable]
    public class RoomFile { public RoomDef[] rooms = new RoomDef[0]; }

    [Serializable]
    public class RoomDef
    {
        public string id = "";
        public string location = "";
        public string hintKo = "";
        public string hintEn = "";
        public RoomObjectDef[] objects = new RoomObjectDef[0];
    }

    [Serializable]
    public class RoomObjectDef
    {
        public string id = "";
        public string labelKo = "";
        public string labelEn = "";
        public string verbKo = "살펴보기";
        public string verbEn = "Examine";
        public float x;
        public float y;
        public float w;
        public float h;
        public string color = "#c9b98f";
        public string node = "";
        public string[] visibleWhen = new string[0];
    }

    [Serializable]
    public class CharacterFile { public CharacterDef[] characters = new CharacterDef[0]; }

    [Serializable]
    public class CharacterDef
    {
        public string id = "";
        public string nameKo = "";
        public string nameEn = "";
        public string color = "#2a3550";
    }

    [Serializable]
    public class UiStringFile { public UiString[] strings = new UiString[0]; }

    [Serializable]
    public class UiString
    {
        public string id = "";
        public string ko = "";
        public string en = "";
    }
}
