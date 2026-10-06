// Data.cs — evidence, statements, times. Observations stay neutral on purpose:
// the game never states what a clue "proves" (design prompt §26).
using System;
using System.Linq;

namespace BigGreenBear2
{
    [Serializable]
    public class Evidence
    {
        public string id, title, place, obs;
        public string trait, value;      // null trait = no claim (atmosphere / context)
        public Evidence(string id, string title, string place, string obs, string trait = null, string value = null)
        { this.id = id; this.title = title; this.place = place; this.obs = obs; this.trait = trait; this.value = value; }
    }

    public static class Data
    {
        public static readonly Evidence[] Evidences =
        {
            new Evidence("pencil",  "PENCIL",        "Archive desk",   "The pencil is held in the left hand.",    "hand",  "left"),
            new Evidence("cup",     "TEACUP",        "Café table",     "The cup was lifted with the right hand.", "hand",  "right"),
            new Evidence("knotL",   "SCARF",         "Photograph",     "The tail hangs toward the left.",         "tail",  "left"),
            new Evidence("knotR",   "SCARF",         "Bell room",      "The tail hangs toward the right.",        "tail",  "right"),
            new Evidence("ear",     "EAR",           "Old photograph", "A small scar on the left ear.",           "ear",   "scar"),
            new Evidence("bellLike","BELL",          "Café",           "Smiled when the bell rang.",              "bell",  "likes"),
            new Evidence("bellNo",  "BELL",          "Bell room",      "Covered both ears when it rang.",         "bell",  "dislikes"),
            new Evidence("smileC",  "SMILE",         "Statement",      "Eyes closed when smiling.",               "smile", "closed"),
            new Evidence("smileO",  "SMILE",         "Statement",      "Eyes stayed slightly open when smiling.", "smile", "open"),
            new Evidence("cafe",    "SEEN AT CAFÉ",  "Nini",           "Seen near the café around 11:20."),
            new Evidence("tower",   "SEEN AT TOWER", "Night guard",    "Seen at the tower gate around 11:40."),
            new Evidence("photo",   "FAMILY PHOTO",  "Archive",        "One child in the frame. Or two."),
        };

        public static Evidence Get(string id) => Evidences.First(e => e.id == id);

        public static readonly string[][] Statements =
        {
            new[] { "NINI",        "11:25", "\"He waved at me. I think. It was raining.\"" },
            new[] { "NIGHT GUARD", "11:40", "\"Same scarf, same smile. Same bear, I'd say.\"" },
        };

        public static readonly string[] Times = { "11:10", "11:20", "11:30", "11:40", "11:47", "11:50" };
    }
}
