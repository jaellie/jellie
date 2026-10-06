// GENERATED from the web version's content.js (15 active letters). Edit freely: this file is yours.
using System.Collections.Generic;

public enum DType { Note, Photo, Gift, Voice }

public class Disc
{
    public string id, world, title, text, icon, voiceFile;
    public DType type;
    public string[] files, captions, subtitles;
    public Disc(string id, DType type, string world, string title, string text, string icon, string[] files, string[] captions, string[] subtitles, string voiceFile)
    { this.id = id; this.type = type; this.world = world; this.title = title; this.text = text; this.icon = icon; this.files = files; this.captions = captions; this.subtitles = subtitles; this.voiceFile = voiceFile; }
}

public static class Content
{
    // Turn a world off to hide its trigger (Dad's car key / the black rubber shoes).
    public static bool MallOn = true, PastOn = true;
    public const float SunsetMinutes = 5f;      // real minutes for the home sunset (0 -> 1)
    public const float DoorAlwaysAfterMin = 5f;

    // 15 letters to find: 7 at home, 4 at LF Square, 4 in The Past.
    public static readonly Disc[] All =
    {
        new Disc("palm_charm", DType.Gift, "home", "용 부적", "1964년 갑진년, 용띠 우리 엄마.\n올해도 용처럼 힘차게, 그리고 늘 건강하게! ✍️", "🐉", null, null, null, null),
        new Disc("sofa_note", DType.Note, "home", "쿠션 밑 쪽지", "어느 늦은 저녁 나는\n흰 공기에 담긴 밥에서\n김이 피어 올라오는 것을\n보고 있었다\n그때 알았다\n무엇인가 영원히 지나가버렸다고\n지금도 영원히\n지나가버리고 있다고\n\n밥을 먹어야지\n\n나는 밥을 먹었다\n— 한강, 「어느 늦은 저녁 나는」", "", null, null, null, null),
        new Disc("tv_photos", DType.Photo, "home", "우리 가족", "", "", new[] { "photos/01.jpg", "photos/02.jpg", "photos/03.jpg", "photos/04.jpg", "photos/05.jpg" }, new[] { "우리 가족 ✍️", "그날 기억나요? ✍️", "엄마 웃는 얼굴 ✍️", "여행 갔던 날 ✍️", "또 가요, 우리 ✍️" }, null, null),
        new Disc("phone_voice", DType.Voice, "home", "전화 한 통", "", "", null, null, new[] { "엄마, 나야.", "생일 축하해요.", "오늘 하루는 엄마만 생각하는 날이에요.", "사랑해요, 엄마. ✍️" }, "audio/voice_message.mp3"),
        new Disc("fridge_cake", DType.Gift, "home", "냉장고 속 케이크", "촛불 끄면서 무슨 소원 빌었어요?\n엄마 소원은 다 이루어질 거예요. ✍️", "🎂", null, null, null, null),
        new Disc("soup_gift", DType.Gift, "home", "생일 미역국", "오늘 미역국은 내가 끓인 걸로 해요.\n(마음만은 진짜예요!) ✍️", "🍲", null, null, null, null),
        new Disc("persimmon_gift", DType.Gift, "home", "감 하나", "장흥 감나무 아래서 놀던 꼬마가\n이렇게 멋진 엄마가 됐네요. ✍️", "🍊", null, null, null, null),
        new Disc("mall_mirror", DType.Photo, "mall", "거울 속 엄마", "", "", new[] { "photos/07.jpg" }, new[] { "오늘 정말 예뻐요, 엄마. ✍️" }, null, null),
        new Disc("mall_cardigan_note", DType.Note, "mall", "가디건 주머니 쪽지", "오늘은 누구 것도 말고 엄마 것만 골라요.\n엄마 마음에 드는 걸로! ✍️", "", null, null, null, null),
        new Disc("mall_flower_note", DType.Note, "mall", "꽃다발 카드", "꽃 한 다발만큼 고마워요. 아니, 꽃집 전부만큼. ✍️", "", null, null, null, null),
        new Disc("mall_fountain_gift", DType.Gift, "mall", "분수 속 동전", "동전 던지며 빈 소원:\n엄마가 오래오래 행복하기. ✍️", "🪙", null, null, null, null),
        new Disc("past_shoe_note", DType.Note, "past", "고무신 속 쪽지", "인생이란 탐구하면서 살아가는 것이 아니라\n살아가면서 탐구하는 것이다.\n— 양귀자, 『모순』", "", null, null, null, null),
        new Disc("past_persimmon_note", DType.Note, "past", "감에 달린 쪽지", "역사가 우리를 망쳐 놨지만 그래도 상관없다.\n— 이민진, 『파친코』", "", null, null, null, null),
        new Disc("past_jar_gift", DType.Gift, "past", "장독 속 선물", "할머니 된장 냄새가 나는 것 같아요. ✍️", "🏺", null, null, null, null),
        new Disc("past_boat_photo", DType.Photo, "past", "종이배", "", "", new[] { "photos/09.jpg" }, new[] { "어린 시절의 엄마 ✍️" }, null, null),
    };

    static Dictionary<string, Disc> byId;
    public static Disc Get(string id)
    {
        if (byId == null) { byId = new Dictionary<string, Disc>(); foreach (var d in All) byId[d.id] = d; }
        Disc r; byId.TryGetValue(id, out r); return r;
    }

    public static readonly Dictionary<string, string> Bubbles = new Dictionary<string, string>
    {
        { "palm", "어머, 이게 뭐야?" },
        { "sofa", "아, 좋다." },
        { "persimmon", "장흥 감나무 생각나네…" },
        { "doorEarly", "조금 더 있다 가도 괜찮아." },
        { "curtains", "와… 바다다." },
        { "balcony", "바람 좋다." },
        { "stool", "물 먹고 쑥쑥 크렴." },
        { "chairEat", "맛있다." },
        { "mango", "달다, 달아." },
        { "fan", "시원하네." },
        { "whale", "고래가 헤엄치네." },
        { "kitchenWindow", "하늘 색 좀 봐." },
        { "phoneRing", "어, 전화 왔네?" },
        { "carKey", "아빠 차 좀 빌려 갈게요~" },
        { "shoes", "이 신발… 어릴 때 생각나네." },
        { "mallBack", "이제 집에 가볼까." },
        { "pastBack", "…이제 집에 가야지." },
        { "noMore", "여긴 이제 아무것도 없네." },
        { "beachBack", "집에 갈까." },
    };
    public static string Bubble(string key) { string s; return Bubbles.TryGetValue(key, out s) ? s : ""; }

    public static readonly string[] MallShops = { "Thursday Island", "ZOOC", "가방가게", "꽃집", "카페", "포토부스", "신발가게" };

    public const string Letter = "엄마에게.\n\n엄마, 생신 축하해요.\n\n오늘 하루, 엄마가 좋아하는 바다를 보고,\n좋아하는 가게를 구경하고,\n어릴 적 장흥 골목도 다시 걸어봤으면 했어요.\n\n늘 우리 먼저 챙기느라\n엄마 자신은 뒤로 미뤄왔던 거, 다 알아요.\n그래서 오늘만큼은 엄마가 주인공이에요.\n\n고맙다는 말, 사랑한다는 말,\n자주 못 해서 여기 몰래 숨겨뒀어요.\n하나씩 찾으면서 웃었으면 좋겠어요.\n\n앞으로도 건강하게,\n지금처럼 웃으면서 우리 곁에 있어 주세요.\n\n✍️ (여기에 하고 싶은 말을 더 적어주세요)";
    public const string FinalLine = "엄마가 엄마로서가 아니라,\n한 사람으로서 재밌는 인생을 살길 바라.\n생일 축하해!";
    public const string LetterFrom = "— 엄마를 사랑하는 ✍️";
    public const string TvIdleText = "우리 가족";
}
