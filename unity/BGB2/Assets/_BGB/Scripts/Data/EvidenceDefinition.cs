using UnityEngine;

namespace BGB2
{
    /// <summary>Static definition of one evidence item (story data lives in assets, not controllers).</summary>
    [CreateAssetMenu(menuName = "BGB2/Evidence", fileName = "EV_New")]
    public class EvidenceDefinition : ScriptableObject
    {
        public string id;                      // e.g. "notice", "clock" (bible ids EV-xx can be added as aliases)
        public string bibleId;                 // e.g. "EV-03"
        public LocalizedText displayName;
        [TextArea(2, 8)] public string descriptionEn;
        [TextArea(2, 8)] public string descriptionKo;
        public LocalizedText note;             // line added to the Notes tab
        public string tag;                     // e.g. "CLOCK"
        public Sprite icon;
        public string discoveryLocation;
        public int discoveryChapter;

        public string Description => Loc.Current == Language.Korean && !string.IsNullOrEmpty(descriptionKo) ? descriptionKo : descriptionEn;
    }
}
