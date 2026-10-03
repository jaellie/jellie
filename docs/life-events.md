# Life events — the 245 ideas, mapped

All **245** ideas are in the game: **315 events** across 15 files under `data/story/events/` (engine: `src/story/lifeEvents.ts`, runtime: `src/story/lifeEventRuntime.ts`). A few live in systems that already existed (promotion, retirement, divorce, losing a parent or a pet).

## How an event happens (사주-driven, not scripted)

- **When**: each month a new event may roll (at most one every 9–18 months; on the same device, events you have already met in earlier lives are less likely). Its chance = rarity × e^(trigger score).
  - rarity per year: common 8% · uncommon 3.5% · rare 1.2% · legendary 0.25%
  - trigger score: this year's 사주/점성술 signals (도화, 역마, 편재, 삼재, 대운 전환, ♄□☉, SR 앵귤러…) + the month's hidden modifiers (risk, stability, wealth…) + MBTI temperament + life facts
- **Who it can happen to**: `requires` is re-checked when it shows (no texts from the dead, no work drama without a job). A keyword guard lints every popup against its requirements.
- **Reaction choices**: the player picks; the outcome still leans with temperament and the chart (an impulsive person who tries gambling 'just once' gets hooked more often).
- **Chains**: outcomes queue follow-ups months later, so one bad year snowballs (도박 → 사채 → 이혼 위기 → 재기 or 파산). Urgent ones (the loan shark at the door) bring a played day.
- **Every life is different (사람마다)**: the same event rarely leads to the same place. A chain can branch (`oneOf`): which branch happens leans on *that* person — temperament, the month's hidden modifiers, life facts (married? broke? parents alive?), this year's 사주/점성술 signals and 궁합 with the partner. Outcomes of a choice lean the same way, and when an event resolves off-screen it follows that person's instinct. E.g. after getting hooked on gambling (1,000 lives each): married + impulsive + broke in a 겁재·흉년 year → 사채 63%, 배우자에게 들킴 17%; a married planner in a 천을귀인 year → 스스로 멈춤 35%, 배우자에게 들킴 30%, 사채 13%; single with a close family → 가족에게 들킴 39%; single, parents gone, reckless and broke → 사채 84%.
- **Hooks**: some events follow life moments (a parent's death → a letter found among the belongings, a feud over the will, a secret at the 기일…).
- **Revelations** (coming out, adoption, secrets): not misfortunes. Each family member (and your partner) reacts by hidden openness — supportive / needs time / shocked — and those who needed time may come around later (`COMING_AROUND`).
- **Off-screen**: an event not seen within 30 months resolves by instinct and shows as a line on the 시간이 흐른다 screen, with a memory card.

## Signature chains

| Chain | Events |
|---|---|
| 107 → 121 → 43 도박 → 사채 → 이혼 위기 → 재기/파산 | GAMBLING → (사람마다) LOAN_SHARK (urgent) / GAMBLING_CAUGHT_BY_PARTNER / GAMBLING_CAUGHT_BY_FAMILY / GAMBLING_SELF_STOP → DEBT_MARRIAGE_CRISIS → GAMBLING_RECOVERY / BANKRUPTCY → COMEBACK |
| 89/91 → 117 대박 → 탕진 or 지킴 | STOCK_BOOM / CRYPTO_MOON / LOTTO_WIN → (사람마다) LOTTO_BROKE (→ BANKRUPTCY) / LOTTO_WISE |
| 123 사이비 → 더 깊이 or 탈출 | CULT_JOIN → (사람마다) CULT_DEEPER / CULT_ESCAPE |
| 127 술 → 개입 or 바닥 → 회복 | ALCOHOL → (사람마다) ALCOHOL_PARTNER_INTERVENES / ALCOHOL_BOTTOM → ALCOHOL_RECOVERY |
| 91 → 118 로또 → 가족의 손 | LOTTO_WIN (가족에게 알림) → FAMILY_DRAINS_MONEY |
| 29/36/76/110 → 102 사기·분쟁 → 승소 | MARRIAGE_FRAUD, PARTNER_VANISHES, INHERITANCE_FEUD, JEONSE_FRAUD, DOXXED, … → LAWSUIT_WIN |
| 58 → 가족의 반응 → 화해 | SIBLING_COMES_OUT → (familyReact) → COMING_AROUND |
| 169 → 183 수상 → 표절 의혹 | CONTEST_WIN → PLAGIARISM_ACCUSED |
| 157 → 158 떡상 → 몰락 | YOUTUBE_BOOM → INFLUENCER_FLOP |
| 242 → 74/76/244/66 부모님의 죽음 이후 | (parentDies hook) → LATE_PARENT_LETTER / INHERITANCE_FEUD / FUNERAL_SECRET / DAD_OTHER_FAMILY |

## 💘 Romance & dating (1–20)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 1 | Love at first sight at a café | `LOVE_AT_FIRST_SIGHT` | uncommon | 도화, 일지 천간합, 일지 육합, romance↑, novelty↑ |  |
| 2 | 첫사랑 reunion by pure coincidence | `FIRST_LOVE_REUNION` | rare | 도화, 일지 천간합, 일지 육합, romance↑ |  |
| 3 | 소개팅 with a coworker's cousin | `BLIND_DATE_COUSIN` | common | 도화, 일지 천간합, 일지 육합, romance↑, social↑ |  |
| 4 | Friends-to-lovers after a drunk confession | `DRUNK_CONFESSION` | uncommon | 도화, 일지 천간합, 비견, romance↑ |  |
| 5 | Crush confesses the same day you planned to | `SAME_DAY_CONFESSION` | rare | 도화, 일지 천간합, 일지 육합, romance↑ |  |
| 6 | 사내연애 goes public | `OFFICE_ROMANCE`, `OFFICE_ROMANCE_PUBLIC` | uncommon | 도화, 일지 천간합, 일지 육합, romance↑, career↑ |  |
| 7 | Long-distance relationship starts | `LONG_DISTANCE`, `LDR_TEST` | uncommon | 역마, ♃ 9하우스, 일지 충, relocation↑, overseas↑ |  |
| 8 | Dating app match is an old classmate | `APP_MATCH_CLASSMATE` | common | 도화, 일지 천간합, 일지 육합, romance↑, social↑ |  |
| 9 | Ex asks to get back together | `EX_WANTS_BACK`, `EX_SAME_PATTERN` | uncommon | 도화, 일지 천간합, 화개, romance↑ |  |
| 10 | 환승이별 (dumped for someone new) | `DUMPED_FOR_SOMEONE` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ | REBOUND_REAL |
| 11 | Ghosted after 3 months | `GHOSTED` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑ |  |
| 12 | Public proposal that's super awkward | `AWKWARD_PROPOSAL` | uncommon | 일지 천간합, 도화, 일지 육합, marriage↑ |  |
| 13 | Proposal rejected | `PROPOSAL_REJECTED` | uncommon | 일지 충, ♄ 7하우스, ♅□♀, marriage↓ |  |
| 14 | Age-gap romance the family opposes | `AGE_GAP_OPPOSED` | uncommon | 년지 충, 월지 충, ♄□☽, family↑ |  |
| 15 | Falling for your best friend's partner | `FRIENDS_PARTNER`, `FRIEND_FINDS_OUT` | rare | 도화, 일지 충, ♅□♀, romance↑, risk↑ |  |
| 16 | Rebound turns into the real thing | `REBOUND_REAL`, `REBOUND_STANDALONE` | chain |  |  |
| 17 | 비밀연애 gets exposed | `SECRET_DATING_EXPOSED` | common | 도화, 일지 천간합, 일지 육합, social↑ |  |
| 18 | Love triangle with two close friends | `LOVE_TRIANGLE` | rare | 도화, 겁재, 일지 천간합, romance↑, social↑ |  |
| 19 | Partner's ex keeps showing up | `PARTNERS_EX_AROUND` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑ |  |
| 20 | Meeting someone with a near-identical 사주 | `SAME_SAJU` | legendary | 도화, 화개, 일지 천간합 |  |

## 💔 Cheating & betrayal (21–37)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 21 | Partner cheating with your sister | `CHEAT_WITH_SISTER` | legendary | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ | HOLIDAY_BLOWUP |
| 22 | Partner cheating with your best friend | `CHEAT_WITH_BESTIE` | rare | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 23 | 양다리 caught through shared location | `CAUGHT_BY_LOCATION` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 24 | Emotional affair through DMs | `DM_EMOTIONAL_AFFAIR` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 25 | Partner has a secret second family | `SECOND_FAMILY` | legendary | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 26 | Partner has a secret child | `SECRET_CHILD` | rare | 일지 충, ♅□♀, ♅□☽ |  |
| 27 | Partner was already married | `PARTNER_ALREADY_MARRIED` | rare | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 28 | 로맨스 스캠 | `ROMANCE_SCAM` | uncommon | 겁재, ♅ 2하우스, 삼재, romance↑, planning↓ |  |
| 29 | 결혼사기 | `MARRIAGE_FRAUD` | legendary | 겁재, 일지 충, ♅□♀ | LAWSUIT_WIN |
| 30 | Partner hiding massive debt | `PARTNER_HIDDEN_DEBT`, `MONEY_FIGHTS` | uncommon | 겁재, 일지 충, ♅□♀ |  |
| 31 | Partner faked their job or degree (학력 위조) | `FAKE_CREDENTIALS` | rare | 일지 충, ♅□♀, ♅□☽ |  |
| 32 | Catching your partner on a dating app | `PARTNER_ON_APP` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |
| 33 | You cheat and get caught | `YOU_CHEAT`, `YOU_CHEAT_EXPOSED` | rare | 도화, 일지 충, ♅□♀, romance↑, risk↑ |  |
| 34 | One-night mistake with an ex | `ONE_NIGHT_EX` | rare | 일지 충, ♅□♀, 일지 해, romance↑, risk↑ | YOU_CHEAT_EXPOSED |
| 35 | Friend hooks up with your ex | `FRIEND_WITH_EX` | uncommon | 겁재, 월지 충, 비견 |  |
| 36 | Partner takes your savings and vanishes | `PARTNER_VANISHES` | legendary | 겁재, 일지 충, ♅□♀ | LAWSUIT_WIN |
| 37 | Partner secretly tracks your phone | `PARTNER_TRACKS_PHONE`, `CONTROL_ESCAPE` | uncommon | 일지 충, ♅□♀, 일지 해, volatility↑, stability↓ |  |

## 💍 Marriage & family life (38–57)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 38 | Wedding called off a week before | `CALLED_OFF_WEEK_BEFORE` | rare | 일지 충, ♅□♀, ♄ 7하우스 |  |
| 39 | 상견례 disaster | `PARENTS_CLASH_BEFORE_WEDDING` | uncommon | 년지 충, 월지 충, ♄□☽ |  · 상견례 당일은 기존 ENGAGEMENT 아크의 MEET_PARENTS 단계. |
| 40 | 속도위반 wedding | `SURPRISE_PREGNANT_DATING` | uncommon | 도화, 일지 천간합, 시지 충, marriage↑ |  |
| 41 | 고부갈등 blows up | `MOTHER_IN_LAW` | uncommon | 년지 충, 월지 충, ♄□☽, family↑ | MOVE_IN_WITH_INLAWS_FIGHT |
| 42 | 장서갈등 (conflict with wife's family) | `FATHER_IN_LAW_CLASH` | uncommon | 년지 충, 월지 충, ♄□☽, family↑ | MOVE_IN_WITH_INLAWS_FIGHT |
| 43 | Divorce | `RUT_CRISIS`, `DEBT_MARRIAGE_CRISIS` | chain |  | GAMBLING_RECOVERY, BANKRUPTCY · 이혼 자체는 기존 DIVORCE 아크(위기 → 별거 → 법원). 이 이벤트들은 이혼으로 가는 길을 만든다. |
| 44 | Remarriage and a blended family | `BLENDED_FAMILY` | uncommon | 도화, 일지 천간합, 일지 육합, family↑ |  |
| 45 | Surprise pregnancy | `SURPRISE_PREGNANCY` | uncommon | 시지 충, ♃ 5하우스, 시지 육합 |  |
| 46 | Twins | `TWINS_NEWS` | rare | 시지 충, 시지 육합, 시지 천간합 |  |
| 47 | Infertility struggle | `INFERTILITY`, `IVF_AGAIN` | uncommon | 시지 충, ♄□☉, ♄□☽ | ADOPTION |
| 48 | Adoption | `ADOPTION` | uncommon | 천을귀인, 시지 충, 시지 육합, family↑ |  |
| 49 | 권태기 hits hard | `MARRIAGE_RUT` | common | ♄ 7하우스, ♄ 리턴, 일지 충, stability↓ | RUT_CRISIS |
| 50 | Parents' 황혼이혼 | `PARENTS_LATE_DIVORCE` | rare | 년지 충, 월지 충, ♄□☽, family↑ | PARENTS_REUNITE |
| 51 | Divorced parents get back together | `PARENTS_REUNITE` | chain |  |  |
| 52 | Kid turns out to be a prodigy | `KID_PRODIGY` | rare | 식신, 시지 충, 시지 육합 |  |
| 53 | Kid drops out of school | `KID_DROPOUT` | uncommon | 시지 충, 시지 육합, 시지 천간합 | TEEN_RUNAWAY |
| 54 | Teen child runs away | `TEEN_RUNAWAY` | rare | 시지 충, 시지 육합, 시지 천간합 |  |
| 55 | Kid becomes an idol trainee | `KID_IDOL_TRAINEE`, `KID_DEBUT`, `KID_TRAINEE_QUITS` | rare | 식신, 시지 충, 시지 육합 |  |
| 56 | Moving in with the in-laws | `MOVE_IN_WITH_INLAWS`, `MOVE_IN_WITH_INLAWS_FIGHT` | uncommon | 년지 충, 월지 충, ♄□☽, family↑ |  |
| 57 | Custody battle | `CUSTODY_BATTLE` | rare | 년지 충, 겁재, 일지 충 |  |

## 🤫 Family secrets & revelations (58–75)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 58 | Sibling comes out as gay | `SIBLING_COMES_OUT`, `SIBLING_OUT_LATER`, `SIBLING_REACH_OUT`, `COMING_AROUND`, `ME_COMES_OUT`, `ME_COMES_OUT_BI` | uncommon | ♅□☽, 화개, 편인, family↑, change↑ |  |
| 59 | Partner comes out as bisexual | `PARTNER_BISEXUAL` | rare | ♅□☽, 화개, 편인, romance↑ |  |
| 60 | Parent comes out late in life | `PARENT_COMES_OUT_DAD`, `PARENT_COMES_OUT_MOM`, `PARENT_REACH_OUT` | rare | ♅□☽, 화개, 편인, family↑, change↑ |  |
| 61 | Child comes out as trans | `KID_COMES_OUT_TRANS`, `KID_COMES_OUT`, `KID_REACH_OUT` | rare | ♅□☽, 시지 충, 화개, family↑ |  |
| 62 | Finding out you were adopted | `ADOPTED_REVEAL`, `BIRTH_PARENT_FOUND` | rare | ♅□☽, 화개, 편인, family↑ |  |
| 63 | 친자 불일치 (not dad's biological kid) | `PATERNITY_MISMATCH`, `PATERNITY_TELL_DAD` | legendary | ♅□☽, 화개, 편인, family↑ |  |
| 64 | Hidden half-sibling shows up | `HALF_SIBLING_APPEARS` | rare | ♅□☽, 화개, 편인, family↑ |  |
| 65 | Parent's long-term affair revealed | `PARENT_AFFAIR_DAD`, `PARENT_AFFAIR_MOM`, `SECRETS_AT_TABLE` | rare | 일지 충, ♅□♀, ♅□☽, family↑ |  |
| 66 | Parent had a whole other family | `DAD_OTHER_FAMILY` | chain |  | HALF_SIBLING_APPEARS, ⟵ parentDies 5% |
| 67 | Grandparent's hidden fortune | `GRANDPARENT_FORTUNE` | chain |  | INHERITANCE_FEUD, ⟵ grandparentDies 8% |
| 68 | Family member's secret criminal past | `FAMILY_CRIMINAL_PAST` | rare | ♅□☽, 화개, 편인, family↑ |  |
| 69 | Sibling got married in secret | `SIBLING_SECRET_MARRIAGE` | rare | 도화, ♅□☽, 일지 천간합, marriage↑ |  |
| 70 | Parent secretly drowning in debt | `PARENT_SECRET_DEBT` | rare | 겁재, ♅□☽, ♅ 2하우스, wealth↓ | FAMILY_DRAINS_MONEY |
| 71 | Twin separated at birth | `TWIN_SEPARATED` | legendary | 화개, 편인, ♅□☽ |  |
| 72 | Family member faked their own death (full 막장 mode) | `FAKED_DEATH` | legendary | ♅□☽, 흉한 해, 화개 |  |
| 73 | DNA test finds long-lost relatives | `DNA_RELATIVES` | uncommon | ♅□☽, 화개, 편인, overseas↑ |  |
| 74 | Late parent's letter reveals a secret | `LATE_PARENT_LETTER` | chain |  | ⟵ parentDies 18% |
| 75 | Switched at birth | `SWITCHED_AT_BIRTH` | legendary | ♅□☽, 화개, 편인 |  |

## ⚡ Family conflict (76–88)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 76 | 유산 분쟁 | `INHERITANCE_FEUD` | chain |  | LAWSUIT_WIN, ⟵ parentDies 14% |
| 77 | Sibling borrows money and disappears | `SIBLING_BORROWS_VANISHES`, `SIBLING_RETURNS` | uncommon | 겁재, 월지 충, 년지 충, wealth↓ |  |
| 78 | 편애 finally blows up | `FAVORITISM_BLOWUP` | uncommon | 년지 충, 월지 충, ♄□☽, family↓, emotionalExpression↑ |  |
| 79 | 절연 (cutting off family) | `CUT_OFF_MOM`, `CUT_OFF_DAD` | rare | 년지 충, 월지 충, ♄□☽, family↓, change↑ | RECONCILE_MOM, RECONCILE_DAD |
| 80 | Reconciling with an estranged parent | `RECONCILE_MOM`, `RECONCILE_DAD` | uncommon | 비견, ♃ 11하우스, 월지 육합, family↑ |  |
| 81 | Becoming a caregiver (간병) | `CAREGIVER_MOM`, `CAREGIVER_DAD` | uncommon | ♄□☽, 년지 충, ♄□☉, family↑ |  |
| 82 | Parent diagnosed with dementia | `PARENT_DEMENTIA_MOM`, `PARENT_DEMENTIA_DAD`, `DEMENTIA_LUCID` | uncommon | ♄□☉, ♄□☽, ♄ 6하우스, family↑ |  |
| 83 | Family business succession war | `FAMILY_BUSINESS_WAR` | rare | 년지 충, ♃ 10하우스, 월지 충, business↑ |  |
| 84 | Sibling marries someone everyone hates | `SIBLING_MARRIES_DISLIKED` | uncommon | 도화, 년지 충, 월지 충, family↓ |  |
| 85 | 명절 blowup | `HOLIDAY_BLOWUP` | common | 년지 충, 월지 충, ♄□☽, family↓ |  |
| 86 | Parent's new partner is your age | `PARENT_NEW_PARTNER_DAD`, `PARENT_NEW_PARTNER_MOM` | rare | 도화, 년지 충, 일지 천간합 |  |
| 87 | Sibling leaves their kid with you to raise | `SIBLING_LEAVES_KID` | rare | 년지 충, 월지 충, 시지 충, family↑ | SIBLING_RETURNS |
| 88 | Family group chat drama | `FAMILY_CHAT_DRAMA` | common | 년지 충, 월지 충, ♄□☽ |  |

## 💰 Money wins (89–104)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 89 | 주식 대박 | `STOCK_BOOM` | uncommon | 편재, ♃ 2하우스, ♃ 8하우스, wealth↑, volatility↑ | LOTTO_BROKE, STOCK_CRASH |
| 90 | 코인 떡상 | `CRYPTO_MOON` | uncommon | 편재, ♃ 2하우스, ♃ 8하우스, volatility↑, risk↑ | LOTTO_BROKE, CRYPTO_RUGPULL |
| 91 | 로또 1등 | `LOTTO_WIN`, `LOTTO_WISE` | legendary | 편재, ♃ 2하우스, ♃ 8하우스, wealth↑, opportunity↑ | LOTTO_BROKE, FAMILY_DRAINS_MONEY · branches 사람마다 |
| 92 | Small scratch-ticket win | `SCRATCH_WIN` | common | 편재, ♃ 2하우스, ♃ 8하우스 |  |
| 93 | Inheritance from a relative you never knew | `UNKNOWN_RELATIVE_INHERITANCE` | rare | 편재, ♃ 2하우스, ♃ 8하우스, family↑, overseas↑ |  |
| 94 | 청약 당첨 | `HOUSING_LOTTERY` | rare | 편재, ♃ 2하우스, ♃ 8하우스, stability↑, wealth↑ |  |
| 95 | Home value skyrockets | `HOME_VALUE_UP` | uncommon | 편재, ♃ 2하우스, ♃ 8하우스, wealth↑ |  |
| 96 | Side hustle blows up | `SIDE_HUSTLE_BOOM` | uncommon | 편재, ♃ 2하우스, 식신, business↑ |  |
| 97 | Startup gets acquired | `STARTUP_ACQUIRED` | rare | 편재, 길한 해, ♃ 2하우스, business↑ |  |
| 98 | Returning a lost wallet gets a huge reward | `WALLET_REWARD` | uncommon | 편재, ♃ 2하우스, ♃ 8하우스, opportunity↑ |  |
| 99 | Massive 성과급 | `BIG_BONUS` | uncommon | 길한 해, 편재, ♃ 10하우스, career↑, wealth↑ |  |
| 100 | Your app or game goes viral | `VIRAL_APP` | rare | 편재, 식신, ♃ 2하우스, creativity↑, opportunity↑ |  |
| 101 | Investing in a friend's business pays off | `FRIEND_INVEST`, `FRIEND_BIZ_RESULT` | uncommon | 편재, ♃ 2하우스, 비견, business↑, social↑ |  |
| 102 | Winning a lawsuit settlement | `LAWSUIT_WIN` | chain |  |  |
| 103 | Old collectible worth a fortune | `COLLECTIBLE_FORTUNE` | uncommon | 편재, ♃ 2하우스, ♃ 8하우스, opportunity↑ |  |
| 104 | 재개발 compensation | `REDEVELOPMENT` | rare | 편재, ♃ 2하우스, ♃ 8하우스, relocation↑, wealth↑ |  |

## 📉 Money losses (105–122)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 105 | Stock crash, 상폐 | `STOCK_CRASH` | uncommon | 겁재, ♅ 2하우스, 삼재, volatility↑, wealth↓ |  |
| 106 | Crypto rug pull | `CRYPTO_RUGPULL` | uncommon | 겁재, ♅ 2하우스, 삼재, volatility↑, risk↑ | LAWSUIT_WIN |
| 107 | 도박 중독 | `GAMBLING`, `GAMBLING_CAUGHT_BY_PARTNER`, `GAMBLING_CAUGHT_BY_FAMILY`, `GAMBLING_SELF_STOP`, `GAMBLING_RECOVERY` | rare | 편재, 흉한 해, ♅ 2하우스, risk↑, wealth↓ | LOAN_SHARK · branches 사람마다 |
| 108 | Illegal 토토 betting | `ILLEGAL_TOTO` | uncommon | 편재, 흉한 해, risk↑, wealth↓, riskTolerance↑ | LOAN_SHARK |
| 109 | 빚보증 collapses on you | `LOAN_GUARANTEE`, `GUARANTEE_COLLAPSE` | uncommon | 겁재, 월지 충, 년지 충, family↑, conflictAvoidance↑ | BANKRUPTCY |
| 110 | 전세사기 | `JEONSE_FRAUD` | rare | 겁재, ♅ 2하우스, 삼재, stability↓, wealth↓ | LAWSUIT_WIN |
| 111 | Business goes 부도 | `BUSINESS_BANKRUPT`, `COMEBACK` | rare | 흉한 해, 겁재, ♅ 2하우스, business↓ |  |
| 112 | Scammed by a friend | `SCAMMED_BY_FRIEND` | uncommon | 겁재, 월지 충, ♅ 2하우스, social↑ |  |
| 113 | 보이스피싱 | `VOICE_PHISHING`, `VOICE_PHISHING_KID` | common | 겁재, ♅ 2하우스, 삼재 |  |
| 114 | 다단계 | `MLM` | uncommon | 겁재, ♅ 2하우스, 삼재, social↑, opportunity↑ |  |
| 115 | Credit card debt from overspending | `CREDIT_CARD_DEBT` | common | 겁재, ♅ 2하우스, 삼재, wealth↓, spontaneity↑ | LOAN_SHARK |
| 116 | Tax audit | `TAX_AUDIT` | uncommon | 흉한 해, 겁재, ♅ 2하우스, business↓ |  |
| 117 | Lottery winner goes broke | `LOTTO_BROKE` | chain |  | BANKRUPTCY |
| 118 | Family keeps draining your money | `FAMILY_DRAINS_MONEY` | uncommon | 겁재, 월지 충, 년지 충, family↑, wealth↓ |  |
| 119 | Car accident repair bills | `CAR_ACCIDENT_BILL` | common | ♅☌ASC, 삼재, 년지 충 |  |
| 120 | House flood or fire | `HOUSE_FLOOD`, `HOUSE_FIRE` | uncommon | 삼재, 겁재, ♅☌ASC |  |
| 121 | 사채 (loan shark) | `LOAN_SHARK`, `BANKRUPTCY` | uncommon | 삼재, 흉한 해, 겁재, wealth↓ | GAMBLING_RECOVERY, DEBT_MARRIAGE_CRISIS, COMEBACK · branches 사람마다 |
| 122 | Identity theft | `IDENTITY_THEFT` | uncommon | 겁재, ♅ 2하우스, 삼재 |  |

## 🌀 Cults, addiction & dark turns (123–138)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 123 | 사이비 입단 | `CULT_JOIN`, `CULT_DEEPER` | rare | 대운 전환, 흉한 해, 화개, stability↓, social↓ | CULT_ESCAPE · branches 사람마다 |
| 124 | Partner gets pulled into a cult | `PARTNER_JOINS_CULT`, `PARTNER_CULT_END` | rare | 대운 전환, 흉한 해, 화개, stability↓, romance↓ |  |
| 125 | Escaping a cult | `CULT_ESCAPE` | chain |  |  |
| 126 | Family member tries to recruit you | `FAMILY_RECRUITS_CULT` | rare | 대운 전환, 흉한 해, 화개, family↑, stability↓ | FAMILY_DRAINS_MONEY |
| 127 | Alcohol addiction | `ALCOHOL`, `ALCOHOL_PARTNER_INTERVENES`, `ALCOHOL_BOTTOM`, `ALCOHOL_RECOVERY` | uncommon | ♄□☽, 흉한 해, 삼재, stability↓, social↓ | branches 사람마다 |
| 128 | Game addiction | `GAME_ADDICTION` | uncommon | 흉한 해, ♄ 12하우스, 식신, social↓, noveltySeeking↑ |  |
| 129 | Shopping addiction | `SHOPPING_ADDICTION` | uncommon | 흉한 해, 겁재, ♄□☽, wealth↓, stability↓ | CREDIT_CARD_DEBT |
| 130 | Stalker | `STALKER`, `STALKER_CAUGHT` | rare | 흉한 해, 삼재, ♄□☉, stability↓ |  |
| 131 | Getting doxxed | `DOXXED` | uncommon | 흉한 해, 삼재, ♄□☉, communication↓, volatility↑ | LAWSUIT_WIN |
| 132 | Fake rumor spreads online | `FAKE_RUMOR` | uncommon | 겁재, 흉한 해, 삼재, communication↓ |  |
| 133 | 사이버렉카 targets you | `CYBER_WRECKER` | rare | 흉한 해, 삼재, ♄□☉, volatility↑ | LAWSUIT_WIN |
| 134 | Unknowingly involved in a fraud | `FRAUD_INVOLVED` | uncommon | 흉한 해, 삼재, 겁재, wealth↓, planning↓ |  |
| 135 | Witnessing a crime | `WITNESS_CRIME` | uncommon | 흉한 해, 삼재, ♄□☉ |  |
| 136 | Wrongly accused | `WRONGLY_ACCUSED` | uncommon | 흉한 해, 삼재, ♄□☉ |  |
| 137 | Blackmail | `BLACKMAIL`, `BLACKMAIL_END` | rare | 흉한 해, ♅□☽, 삼재 |  |
| 138 | 은둔형 외톨이 phase | `HIKIKOMORI`, `HIKIKOMORI_OUT` | uncommon | 대운 전환, 흉한 해, 화개, social↓, stability↓ |  |

## 👯 Friendship (139–152)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 139 | Best friend betrays you | `BEST_FRIEND_BETRAYS` | uncommon | 겁재, 월지 충, 비견, social↓ |  |
| 140 | 뒷담 leaks in the group chat | `GOSSIP_LEAK` | common | 겁재, 월지 충, 비견, communication↓ |  |
| 141 | Friend group splits | `FRIEND_GROUP_SPLITS` | uncommon | 겁재, 월지 충, 비견, social↓ |  |
| 142 | Reuniting with a childhood friend | `CHILDHOOD_FRIEND_REUNION` | uncommon | 비견, ♃ 11하우스, 월지 육합, social↑ |  |
| 143 | Friend borrows money and ghosts | `FRIEND_BORROWS_GHOSTS` | uncommon | 겁재, 월지 충, ♅ 2하우스 |  |
| 144 | Friend becomes famous | `FRIEND_FAMOUS` | rare | ♃ 10하우스, 비견, ♃ 11하우스 |  |
| 145 | Wedding speech disaster | `WEDDING_SPEECH` | uncommon | 비견, ♃ 11하우스, 월지 육합, social↑ |  |
| 146 | Frenemy exposed | `FRENEMY_EXPOSED` | uncommon | 도화, 겁재, 일지 천간합 |  |
| 147 | Online friend becomes a lifelong friend | `ONLINE_FRIEND` | uncommon | 비견, ♃ 11하우스, 월지 육합, communication↑ |  |
| 148 | Friend falls for your sibling | `FRIEND_LOVES_SIBLING` | uncommon | 도화, 비견, ♃ 11하우스 |  |
| 149 | Friend asks you to be their fake partner | `FAKE_PARTNER_FAVOR` | uncommon | 도화, 비견, ♃ 11하우스 |  |
| 150 | Group trip goes wrong | `GROUP_TRIP_WRONG` | common | 역마, 비견, ♃ 11하우스, travel↑ |  |
| 151 | Friend starts copying your life (따라쟁이) | `COPYCAT_FRIEND` | uncommon | 겁재, 월지 충, 비견 |  |
| 152 | Roommate from hell | `ROOMMATE_FROM_HELL` | common | 겁재, 월지 충, 비견 |  |

## 💼 Career (153–175)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 153 | Fired | `FIRED` | uncommon | ♄□☉, 편관, ♄☌MC, career↓, stability↓ |  |
| 154 | Promoted | — | — | — | 기존 커리어 시스템: CAREER_TURN → PROMOTION (명함 카드 포함). |
| 155 | Headhunted (이직 대박) | `HEADHUNTED` | uncommon | ♃ 10하우스, 정관, ♃☌MC, career↑, opportunity↑ |  |
| 156 | Quit to start a business | `QUIT_TO_START_BUSINESS` | uncommon | 길한 해, 편재, ♃ 10하우스, business↑, change↑ | BUSINESS_BANKRUPT |
| 157 | YouTube 떡상 | `YOUTUBE_BOOM` | rare | 식신, ♃ 10하우스, 정관, creativity↑, communication↑ | INFLUENCER_FLOP |
| 158 | Influencer career flops | `INFLUENCER_FLOP` | chain |  |  |
| 159 | 공무원 합격 | `CIVIL_SERVICE_EXAM` | uncommon | ♃ 10하우스, 정인, 정관, education↑, stability↑ | CIVIL_SERVICE_RETRY |
| 160 | Failing the exam again (N수) | `CIVIL_SERVICE_RETRY` | chain |  |  |
| 161 | 직장 내 괴롭힘 | `WORKPLACE_BULLYING` | uncommon | ♄□☉, 편관, ♄☌MC, career↓, stability↓ |  |
| 162 | Whistleblowing | `WHISTLEBLOWING` | rare | ♄□☉, 편관, ♅□☽, career↓, conflictAvoidance↓ | LAWSUIT_WIN |
| 163 | Boss steals your idea | `IDEA_STOLEN` | uncommon | 상관, 식신, ♄□☉ |  |
| 164 | Company goes under | `COMPANY_UNDER` | uncommon | 흉한 해, 겁재, ♄□☉, career↓ |  |
| 165 | Transferred abroad | `TRANSFER_ABROAD` | uncommon | 역마, ♃ 10하우스, ♃ 9하우스, overseas↑, career↑ |  |
| 166 | Burnout | `BURNOUT` | common | ♄□☉, 흉한 해, 편관, stability↓, career↑ |  |
| 167 | Career change at 40 | `CAREER_CHANGE_40` | uncommon | 대운 전환, ♅□☉, ♅☌MC, change↑, career↓ |  |
| 168 | Scouted as a model or actor | `SCOUTED` | rare | 도화, ♃ 10하우스, 일지 천간합, opportunity↑ |  |
| 169 | Winning a contest | `CONTEST_WIN` | uncommon | 식신, ♃ 10하우스, 정관, creativity↑, creativity↑ | PLAGIARISM_ACCUSED |
| 170 | Viral post makes you famous overnight | `VIRAL_POST` | uncommon | 식신, 상관, ♃ 5하우스, communication↑, volatility↑ | CYBER_WRECKER |
| 171 | New coworker is your ex | `EX_IS_COWORKER`, `EX_COWORKER_AGAIN` | rare | 도화, 일지 충, ♅□♀ |  |
| 172 | Your boss is your partner's parent | `BOSS_IS_PARTNERS_PARENT` | rare | 도화, ♃ 10하우스, 일지 천간합 |  |
| 173 | Freelance client doesn't pay | `FREELANCE_NOT_PAID` | common | 흉한 해, 겁재, ♅ 2하우스, business↓ | LAWSUIT_WIN |
| 174 | Coworker turns out to be a 재벌 heir | `COWORKER_HEIR` | rare | 천을귀인, 길한 해, 편재 |  |
| 175 | Retirement | — | — | — | 기존 RETIREMENT 아크. |

## 🎓 School (176–184)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 176 | Top of the class | `KID_TOP_OF_CLASS` | uncommon | ♃ 10하우스, 시지 충, 정관, education↑ |  |
| 177 | 수능 대박 | `KID_SUNEUNG` | common | 시지 충, 시지 육합, 시지 천간합, education↑ | KID_RETAKE |
| 178 | 수능 망함 → 재수 | `KID_SUNEUNG`, `KID_RETAKE` | common | 시지 충, 시지 육합, 시지 천간합, education↑ |  |
| 179 | Accepted to a school abroad | `KID_ABROAD_ACCEPTED` | uncommon | 역마, 시지 충, ♃ 9하우스, education↑, overseas↑ |  |
| 180 | Dropping out | `DROP_OUT` | uncommon | 흉한 해, 겁재, ♄□☉, education↓ |  |
| 181 | Getting a degree later in life | `LATE_DEGREE` | uncommon | 정인, ♃ 9하우스, ♃ 10하우스, education↑ |  |
| 182 | Full scholarship | `KID_SCHOLARSHIP` | uncommon | 편재, ♃ 2하우스, 시지 충, education↑ |  |
| 183 | Plagiarism accusation | `PLAGIARISM_ACCUSED` | chain |  |  |
| 184 | Exchange-student romance | `EXCHANGE_ROMANCE`, `LANGUAGE_EXCHANGE_ROMANCE` | uncommon | 도화, 역마, 일지 천간합 |  |

## 🏥 Health & body (185–198)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 185 | Checkup finds something | `CHECKUP_FINDS` | uncommon | ♄□☉, ♄□☽, ♄ 6하우스, stability↓ |  |
| 186 | Serious accident | `SERIOUS_ACCIDENT` | rare | ♅☌ASC, 삼재, 년지 충, stability↓, mobility↑ | RECOVERY_AGAINST_ODDS |
| 187 | Recovery against the odds | `RECOVERY_AGAINST_ODDS` | chain |  |  |
| 188 | Chronic illness diagnosis | `CHRONIC_ILLNESS` | uncommon | ♄□☉, ♄□☽, ♄ 6하우스, stability↓ |  |
| 189 | Major glow-up | `GLOW_UP` | uncommon | ♃ 1하우스, ♃ 6하우스, 길한 해, change↑, planning↑ |  |
| 190 | Plastic surgery | `PLASTIC_SURGERY` | uncommon | ♃ 1하우스, 상관, change↑ |  |
| 191 | Depression period | `DEPRESSION`, `DEPRESSION_HELP` | uncommon | ♄□☽, ♄ 12하우스, ♄□☉, stability↓, social↓ |  |
| 192 | Panic attacks | `PANIC_ATTACK` | uncommon | ♄□☽, ♅□☽, 흉한 해, stability↓ |  |
| 193 | Near-death experience | `NEAR_DEATH` | rare | ♅☌ASC, 삼재, 년지 충 |  |
| 194 | Donating an organ to family | `ORGAN_DONATION` | rare | ♄□☽, 년지 충, ♄□☉, family↑ |  |
| 195 | Sudden hearing loss | `HEARING_LOSS` | uncommon | ♄□☉, ♄□☽, ♄ 6하우스, stability↓ |  |
| 196 | Pregnancy complications | `PREGNANCY_COMPLICATIONS` | uncommon | ♄□☉, ♄□☽, 시지 충 |  |
| 197 | Parent suddenly collapses | `PARENT_COLLAPSE_MOM`, `PARENT_COLLAPSE_DAD` | uncommon | ♄□☽, 년지 충, ♄□☉, family↑ |  |
| 198 | Starting marathons and transforming your life | `MARATHON`, `MARATHON_FULL` | uncommon | ♃ 6하우스, ♃ 1하우스, 길한 해, change↑, planning↑ |  |

## 🔮 Fate, luck & mystical (199–215)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 199 | Meeting a 귀인 | `MEET_GWIIN` | uncommon | 천을귀인, ♃ 11하우스, ♃ 10하우스, opportunity↑ |  |
| 200 | Fortune teller's prediction comes true | `FORTUNE_TELLER`, `FORTUNE_COMES_TRUE` | common | 화개, 편인, 천을귀인, romance↑, introspection↑ |  |
| 201 | 돼지꿈 → lucky streak | `PIG_DREAM` | uncommon | 화개, 편재, 천을귀인, wealth↑ |  |
| 202 | 태몽 | `TAEMONG` | uncommon | 화개, 시지 충, 편인 |  |
| 203 | 삼재 year bad-luck streak | `SAMJAE_STREAK` | common | 삼재, 흉한 해 |  |
| 204 | Déjà vu with a stranger | `DEJA_VU` | uncommon | 화개, 도화, 편인 |  |
| 205 | 인연 reconnects years later | `INYEON_RECONNECTS` | rare | 도화, 일지 천간합, 일지 육합, romance↑ |  |
| 206 | 신병 / 신내림 calling | `SHINBYEONG` | legendary | 화개, 편인, ♄ 12하우스, introspection↑ |  |
| 207 | Past-life memories | `PAST_LIFE` | uncommon | 화개, 편인, 천을귀인, introspection↑ |  |
| 208 | Lucky number keeps showing up | `LUCKY_NUMBER` | common | 화개, 편재, 천을귀인 |  |
| 209 | Moving to a lucky direction (방위) | `LUCKY_DIRECTION_MOVE` | uncommon | 역마, 화개, ♃ 9하우스 |  |
| 210 | 개명 changes your luck | `NAME_CHANGE` | uncommon | 흉한 해, 대운 전환, 화개, change↑ |  |
| 211 | Haunted house | `HAUNTED_HOUSE` | uncommon | 화개, ♅ 4하우스, 삼재 |  |
| 212 | Running into someone you know abroad | `MEET_ACQUAINTANCE_ABROAD` | uncommon | 역마, ♃ 9하우스, 비견 |  |
| 213 | Wrong number becomes a friend | `WRONG_NUMBER_FRIEND` | uncommon | 화개, 비견, ♃ 11하우스 |  |
| 214 | Saving a stranger who turns out to be a CEO | `SAVE_STRANGER`, `CEO_THANKS` | rare | 천을귀인, 정인, 길한 해, opportunity↑ |  |
| 215 | Same-birthday soulmate | `SAME_BIRTHDAY_SOULMATE` | rare | 도화, 화개, 일지 천간합 |  |

## 😂 Daily chaos (216–235)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 216 | 층간소음 war | `FLOOR_NOISE` | common | 월지 충, ♄ 4하우스, ♅ 4하우스, stability↓ | NEIGHBOR_FEUD |
| 217 | 카톡 sent to the wrong person | `WRONG_KAKAO`, `WRONG_KAKAO_LOVE` | common | 상관, ♅□☽, communication↓, spontaneity↑ |  |
| 218 | Pet runs away | `PET_RUNS_AWAY`, `PET_FOUND` | uncommon | 역마, 월지 충, 삼재 |  |
| 219 | Adopting a stray | `ADOPT_STRAY` | uncommon | ♃ 6하우스, 식신, family↑, emotionalExpression↑ |  |
| 220 | Locked out at 3 a.m. | `LOCKED_OUT` | common | 삼재, ♅ 4하우스 |  |
| 221 | Food poisoning on a date | `FOOD_POISONING_DATE` | common | 삼재, 도화 |  |
| 222 | Phone dies at the worst moment | `PHONE_DIES` | common | ♅ 3하우스, 삼재 |  |
| 223 | Neighbor feud | `NEIGHBOR_FEUD` | uncommon | 월지 충, 월지 형, stability↓ |  |
| 224 | Parking fight | `PARKING_FIGHT` | common | 월지 충, 겁재 | NEIGHBOR_FEUD |
| 225 | Package mix-up leads to meeting someone | `PACKAGE_MIXUP_MEET` | uncommon | 도화, 일지 천간합, 일지 육합 |  |
| 226 | Embarrassing video goes viral | `EMBARRASSING_VIRAL` | uncommon | 상관, ♅☌☉, volatility↑ |  |
| 227 | Lost in a foreign country | `LOST_ABROAD` | uncommon | 역마, ♃ 9하우스 |  |
| 228 | Winning a random giveaway | `GIVEAWAY_WIN` | common | 편재, ♃ 2하우스, ♃ 8하우스 |  |
| 229 | Moving house | `MOVING_HOUSE` | common | 역마, ♃ 4하우스, ♅ 4하우스, relocation↑ |  |
| 230 | 노래방 confession | `NORAEBANG_CONFESSION` | uncommon | 도화, 일지 천간합, 비견 |  |
| 231 | Drunk-texting your ex | `DRUNK_TEXT_EX`, `EX_TALK` | common | 도화, 일지 충, spontaneity↑, emotionalExpression↑ |  |
| 232 | Accidentally liking your ex's old photo | `LIKED_EX_PHOTO` | common | ♄□♀, 도화, spontaneity↑ |  |
| 233 | Scammed on 당근 | `DANGGEUN_SCAM` | common | 겁재, ♅ 2하우스, 삼재 |  |
| 234 | 당근 deal turns into a romance | `DANGGEUN_ROMANCE` | uncommon | 도화, 일지 천간합, 일지 육합 |  |
| 235 | Kitchen fire | `KITCHEN_FIRE` | common | 삼재, SR ♂ 앵귤러 |  |

## 🌍 Big life events (236–245)

| # | Idea | Event(s) | Rarity | 사주/점성술 trigger | Leads to |
|---|---|---|---|---|---|
| 236 | Emigrating | `EMIGRATE` | rare | 역마, ♃ 9하우스, ♃ 4하우스, overseas↑, relocation↑ |  |
| 237 | Military enlistment | `MILITARY_ENLISTMENT` | common | 역마 |  |
| 238 | Natural disaster | `NATURAL_DISASTER` | uncommon | 삼재, ♅ 4하우스, 년지 충 |  |
| 239 | Pandemic lockdown | `PANDEMIC` | uncommon | ♄□☽, 삼재, social↓ |  |
| 240 | Wedding abroad | `WEDDING_ABROAD` | uncommon | 도화, 역마, 일지 천간합, travel↑ |  |
| 241 | Becoming a grandparent | `BECOME_GRANDPARENT` | uncommon | 시지 충, 시지 육합, 시지 천간합, family↑ |  |
| 242 | Losing a parent | — | — | — | 기존 PARENT_PASSING / FAMILY_LOSS 아크. 사망 후 훅으로 LATE_PARENT_LETTER · INHERITANCE_FEUD · FUNERAL_SECRET · DAD_OTHER_FAMILY가 따라올 수 있음. |
| 243 | Losing a pet | — | — | — | 기존 PET_FAREWELL 아크 (+ PET_RUNS_AWAY). |
| 244 | Secrets come out at a funeral | `FUNERAL_SECRET` | chain |  | HALF_SIBLING_APPEARS, ⟵ parentDies 10%, ⟵ grandparentDies 5% |
| 245 | Writing a will | `WRITING_WILL` | uncommon | ♄ 리턴, 화개, introspection↑ |  |

## Your partner's job (the destined person's job from setup)

| Event | Title | Requires | Rarity |
|---|---|---|---|
| `PJ_AWAY_AGAIN` | 또 떠나는 사람 | fatedPartner, fatedJobAway | common |
| `PJ_BAD_NIGHT` | 새벽 세 시의 전화 | fatedPartner, fatedJobCare | uncommon |
| `PJ_BREAKTHROUGH` | 드디어 | fatedPartner, fatedJobUnstable | uncommon |
| `PJ_NIGHT_SHIFT` | 엇갈리는 시간 | fatedPartner, fatedJobNight | common |
| `PJ_RAISE` | {partner}의 좋은 소식 | fatedPartner, fatedJobRich | common |
| `PJ_TIMEZONE_FIGHT` | 시차 | fatedPartner, fatedAbroad, dating | common |
| `PJ_WORK_VISIT` | 몰래 찾아가기 | fatedPartner, !fatedFar | common |
| `PJ_ZERO_MONTH` | 수입 0원 | fatedPartner, fatedJobUnstable | uncommon |

## Others' big moments — invitations & news

| Event | Title | Requires | Rarity |
|---|---|---|---|
| `FRIEND_PASSING_NEWS` | 부고 | — | queued by the engine |
| `INVITE_FRIEND_WEDDING` | 청첩장 | — | queued by the engine |
| `INVITE_SIBLING_WEDDING` | 가족의 결혼식 | — | queued by the engine |
| `NEPHEW_BORN` | 조카 | — | queued by the engine |

