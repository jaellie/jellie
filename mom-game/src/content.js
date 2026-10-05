// ─────────────────────────────────────────────────────────────
//  엄마의 하루 — all editable text and settings live here.
//  Every text below is a gentle default so the game is playable now.
//  Replace anything marked ✍️ with your own words whenever you like.
//  Set `hidden: true` on a discoverable to remove it from the game.
// ─────────────────────────────────────────────────────────────

export const content = {
  mom: {
    skin: '#F6E3D8',
    heightCm: 155,
    build: 'slim',
    hair: 'short-perm-black',
    hairColor: '#1E1A19',
    cardigan: '#F4B6C2',
    skirt: 'denim-long',
    skirtColor: '#5B7DA8',
    slippers: '#C9B6E4',
    shoes: '#141414',
    smile: true,
    // little-girl form in The Past
    child: { blouse: '#FFF4DC', skirt: '#9C5B4B', ribbon: '#E4574F' },
  },

  // Turn a whole world off if it isn't ready (its trigger object disappears).
  features: { mall: true, past: true }, // set false to hide a world's trigger

  // 'chase' = low camera just behind Mom (W forward, S back, A/D turn); 'fixed' = dollhouse view
  camera: 'chase',

  // Minutes of real time for the home sunset (0 → 1). The door to the beach
  // always works after `doorAlwaysAfterMin` minutes.
  sunsetMinutes: 5,
  doorAlwaysAfterMin: 5,

  bubbles: {
    palm: '어머, 이게 뭐야?',
    sofa: '아, 좋다.',
    persimmon: '장흥 감나무 생각나네…',
    doorEarly: '조금 더 있다 가도 괜찮아.',
    curtains: '와… 바다다.',
    balcony: '바람 좋다.',
    stool: '물 먹고 쑥쑥 크렴.',
    chairEat: '맛있다.',
    mango: '달다, 달아.',
    fan: '시원하네.',
    whale: '고래가 헤엄치네.',
    kitchenWindow: '하늘 색 좀 봐.',
    phoneRing: '어, 전화 왔네?',
    carKey: '아빠 차 좀 빌려 갈게요~',
    shoes: '이 신발… 어릴 때 생각나네.',
    mallBack: '이제 집에 가볼까.',
    pastBack: '…이제 집에 가야지.',
    noMore: '여긴 이제 아무것도 없네.',
    beachBack: '집에 갈까.',
  },

  // 15 to find (7 at home, 4 at LF Square, 4 in the past). Items with hidden: true are switched off —
  // delete that flag to bring one back.
  // id: { type: note|photo|gift|voice, world, title, text, file?, icon?, token? }
  //   icon  = emoji shown on the card
  //   token = the tiny object on the Memory Shelf (default by type)
  discoverables: {
    // ── Home: living room ──────────────────────────────────
    palm_charm: { type: 'gift', world: 'home', title: '용 부적', icon: '🐉', token: 'dragon',
      text: '1964년 갑진년, 용띠 우리 엄마.\n올해도 용처럼 힘차게, 그리고 늘 건강하게! ✍️' },
    sofa_note: { type: 'note', world: 'home', title: '쿠션 밑 쪽지',
      text: '사랑이란 어디 있을까?\n팔딱팔딱 뛰는 나의 가슴 속에 있지.\n사랑이란 무얼까?\n우리의 가슴과 가슴 사이를 연결해주는 금실이지.\n— 한강' },
    lfbag_gift: { hidden: true, type: 'gift', world: 'home', title: '쇼핑백 속 선물', icon: '🎀',
      text: '엄마가 좋아하는 색으로 골랐어요.\n잘 어울릴 거예요. ✍️' },
    balcony_note: { hidden: true, type: 'note', world: 'home', title: '화분 옆 쪽지',
      text: '이 바다를 매일 보는 엄마가 부러워요.\n그리고 그런 엄마가 있는 내가 더 좋아요. ✍️' },
    stool_gift: { hidden: true, type: 'gift', world: 'home', title: '다육이 밑 선물', icon: '🌱', token: 'sprout',
      text: '엄마 손에서는 뭐든 잘 자라요.\n나도 그렇게 컸으니까. ✍️' },
    tv_photos: { type: 'photo', world: 'home', title: '우리 가족', token: 'frame',
      files: ['photos/01.jpg', 'photos/02.jpg', 'photos/03.jpg', 'photos/04.jpg', 'photos/05.jpg'],
      captions: ['우리 가족 ✍️', '그날 기억나요? ✍️', '엄마 웃는 얼굴 ✍️', '여행 갔던 날 ✍️', '또 가요, 우리 ✍️'] },
    tv_note1: { hidden: true, type: 'note', world: 'home', title: 'TV장 왼쪽 서랍',
      text: '엄마가 해주는 밥이 세상에서 제일 맛있어요. ✍️' },
    tv_note2: { hidden: true, type: 'note', world: 'home', title: 'TV장 작은 서랍',
      text: '바쁘다는 핑계로 전화 자주 못 해서 미안해요. ✍️' },
    phone_voice: { type: 'voice', world: 'home', title: '전화 한 통', file: 'audio/voice_message.mp3',
      subtitles: ['엄마, 나야.', '생일 축하해요.', '오늘 하루는 엄마만 생각하는 날이에요.', '사랑해요, 엄마. ✍️'] },
    intercom_voice: { hidden: true, type: 'voice', world: 'home', title: '인터폰', file: 'audio/intercom.mp3',
      subtitles: ['딩동~ 택배 왔습니다!', '…라고 할 줄 알았죠?', '마음 배달 왔어요. 생신 축하해요! ✍️'] },

    // ── Home: kitchen ──────────────────────────────────────
    fridge_cake: { type: 'gift', world: 'home', title: '냉장고 속 케이크', icon: '🎂', token: 'cake',
      text: '촛불 끄면서 무슨 소원 빌었어요?\n엄마 소원은 다 이루어질 거예요. ✍️' },
    soup_gift: { type: 'gift', world: 'home', title: '생일 미역국', icon: '🍲', token: 'bowl',
      text: '오늘 미역국은 내가 끓인 걸로 해요.\n(마음만은 진짜예요!) ✍️' },
    flower_note: { hidden: true, type: 'note', world: 'home', title: '꽃 사이 쪽지',
      text: '엄마는 꽃보다 예뻐요.\n진짜로. ✍️' },
    tissue_note: { hidden: true, type: 'note', world: 'home', title: '휴지 속 쪽지',
      text: '혹시 이거 읽고 울면 이 휴지 쓰세요. 😊 ✍️' },
    clock_note: { hidden: true, type: 'note', world: 'home', title: '시계 쪽지',
      text: '엄마랑 보내는 시간은 늘 너무 빨리 가요.\n오늘은 천천히 가라고 시계한테 부탁해뒀어요. ✍️' },
    persimmon_gift: { type: 'gift', world: 'home', title: '감 하나', icon: '🍊', token: 'persimmon',
      text: '장흥 감나무 아래서 놀던 꼬마가\n이렇게 멋진 엄마가 됐네요. ✍️' },
    fridge_photo: { hidden: true, type: 'photo', world: 'home', title: '냉장고 자석 사진', token: 'frame',
      files: ['photos/06.jpg'], captions: ['냉장고에 붙여둔 우리 ✍️'] },
    whale_note: { hidden: true, type: 'note', world: 'home', title: '고래의 쪽지',
      text: '고래도 엄마 생일 축하한대요. 🐋 ✍️' },
    mango_gift: { hidden: true, type: 'gift', world: 'home', title: '망고 한 조각', icon: '🥭', token: 'mango',
      text: '달콤한 일만 가득하길! ✍️' },
    sink_note: { hidden: true, type: 'note', world: 'home', title: '마지막 접시 밑',
      text: '설거지는 오늘 내가 할게요. 진짜로! ✍️' },

    // ── LF Square ──────────────────────────────────────────
    mall_mirror: { type: 'photo', world: 'mall', title: '거울 속 엄마', token: 'frame',
      files: ['photos/07.jpg'], captions: ['오늘 정말 예뻐요, 엄마. ✍️'] },
    mall_rack_gift: { hidden: true, type: 'gift', world: 'mall', title: '옷걸이 태그', icon: '🏷️',
      text: '이 옷 엄마한테 딱이다! 생각했어요. ✍️' },
    mall_cardigan_note: { type: 'note', world: 'mall', title: '가디건 주머니 쪽지',
      text: '오늘은 누구 것도 말고 엄마 것만 골라요.\n엄마 마음에 드는 걸로! ✍️' },
    mall_scarf_gift: { hidden: true, type: 'gift', world: 'mall', title: '스카프 속 선물', icon: '🧣',
      text: '바닷바람 불 때 따뜻하게 하세요. ✍️' },
    mall_bag_gift: { hidden: true, type: 'gift', world: 'mall', title: '진열 가방 속', icon: '👜',
      text: '엄마 가방엔 늘 우리 간식이 있었죠. 이젠 엄마 것만 넣어요. ✍️' },
    mall_flower_note: { type: 'note', world: 'mall', title: '꽃다발 카드',
      text: '꽃 한 다발만큼 고마워요. 아니, 꽃집 전부만큼. ✍️' },
    mall_coffee_note: { hidden: true, type: 'note', world: 'mall', title: '컵 홀더 메시지',
      text: '엄마, 커피 한 잔 하고 가요. 내가 살게요! ✍️' },
    mall_booth_photo: { hidden: true, type: 'photo', world: 'mall', title: '포토부스', token: 'strip',
      files: ['photos/08.jpg'], captions: ['찰칵! 우리 가족 ✍️'] },
    mall_shoe_note: { hidden: true, type: 'note', world: 'mall', title: '신발가게 쪽지',
      text: '검정 고무신 신고 뛰어놀던 엄마 얘기, 또 해줘요. ✍️' },
    mall_fountain_gift: { type: 'gift', world: 'mall', title: '분수 속 동전', icon: '🪙', token: 'coin',
      text: '동전 던지며 빈 소원:\n엄마가 오래오래 행복하기. ✍️' },

    // ── The Past (장흥, 1970s) ─────────────────────────────
    past_shoe_note: { type: 'note', world: 'past', title: '고무신 속 쪽지', token: 'shoe',
      text: '하고 싶은 건 미루지 말고,\n좋아하는 건 좋아한다고 말하기.\n\n고무신 신고 뛰던 그 아이가 꿈꾸던 것들,\n이제는 엄마가 다 해도 돼요. ✍️' },
    past_persimmon_note: { type: 'note', world: 'past', title: '감에 달린 쪽지', token: 'persimmon',
      text: '역사가 우리를 망쳐 놨지만 그래도 상관없다.\n— 이민진, 『파친코』' },
    past_jar_gift: { type: 'gift', world: 'past', title: '장독 속 선물', icon: '🏺',
      text: '할머니 된장 냄새가 나는 것 같아요. ✍️' },
    past_candy_note: { hidden: true, type: 'note', world: 'past', title: '사탕 껍질 쪽지', token: 'candy',
      text: '구멍가게 눈깔사탕보다 달콤한 우리 엄마. ✍️' },
    past_boat_photo: { type: 'photo', world: 'past', title: '종이배', token: 'boat',
      files: ['photos/09.jpg'], captions: ['어린 시절의 엄마 ✍️'] },
    past_scarecrow_gift: { hidden: true, type: 'gift', world: 'past', title: '허수아비 발밑', icon: '🌾',
      text: '논두렁 따라 걷던 길, 언젠가 같이 걸어요. ✍️' },
  },

  // TV slideshow (same files as tv_photos; missing photos show a soft placeholder)
  photos: ['photos/01.jpg', 'photos/02.jpg', 'photos/03.jpg', 'photos/04.jpg', 'photos/05.jpg'],

  // LF Square storefronts, in order around the atrium. The first two are Mom's favorites.
  mallShops: ['Thursday Island', 'ZOOC', '가방가게', '꽃집', '카페', '포토부스', '신발가게'],

  // ✍️ The birthday letter. Blank lines become paragraph breaks.
  letter: `엄마에게.

엄마, 생신 축하해요.

오늘 하루, 엄마가 좋아하는 바다를 보고,
좋아하는 가게를 구경하고,
어릴 적 장흥 골목도 다시 걸어봤으면 했어요.

늘 우리 먼저 챙기느라
엄마 자신은 뒤로 미뤄왔던 거, 다 알아요.
그래서 오늘만큼은 엄마가 주인공이에요.

고맙다는 말, 사랑한다는 말,
자주 못 해서 여기 몰래 숨겨뒀어요.
하나씩 찾으면서 웃었으면 좋겠어요.

앞으로도 건강하게,
지금처럼 웃으면서 우리 곁에 있어 주세요.

✍️ (여기에 하고 싶은 말을 더 적어주세요)`,
  finalLine: '엄마가 엄마로서가 아니라,\n한 사람으로서 재밌는 인생을 살길 바라.\n생일 축하해!',
  letterFrom: '— 엄마를 사랑하는 ✍️',

  // Optional: shown on the Home TV screen when no photo loads
  tvIdleText: '우리 가족',
};
