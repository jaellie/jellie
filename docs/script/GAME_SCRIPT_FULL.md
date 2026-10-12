# Bell Village 전체 스크립트 (한국어 / English)

자동 추출본. 대사 노드 773개, 메모 42개, 증거 55개. 줄마다 `노드ID`, 화자(표정), 한국어, 영어 순서다. `→`는 이어지는 노드, `선택`은 선택지, `⚑`는 이 줄에서 켜지는 플래그, `증거+`는 얻는 증거, `메모+`는 기록되는 메모.

## 장 제목

- 1장: 첫 번째 목격자 / The First Witness
- 2장: 멈춘 시계 / The Stopped Clock
- 3장: 오래된 기록 / Old Records
- 4장: 두 개의 매듭 / Two Knots
- 5장: 좋은 사람 / A Good Person
- 6장: 사라진 5분 / Five Missing Minutes
- 7장: 우리가 고르는 진실 / The Truth We Choose

## 화자

- `ed`: 에드워드 / Edward
- `kid`: 형 / Green
- `yo`: 동생 / Little Green
- `nar`: (이름 없음) / (no name) (나레이션 상자)
- `v1`: 마을 사람 / Villager (실루엣)
- `v2`: 주민 2 / Villager 2 (실루엣)
- `mo`: 몰리 / Grandma Molly
- `gr`: 그린 / Green
- `tm`: 토미 / Tommy
- `bgb`: 빅그베 / BGB
- `hz`: 헤이즐 / Hazel
- `nini`: 니니 / Nini
- `ck`: 올리버 / Oliver
- `cr`: 의회 관계자 / Council Rep. (실루엣)
- `hl`: 메이 / May
- `edv`: 에드워드 (적어 둔 목소리) / Edward (his written voice) (실루엣)

## 대사 (정의된 순서)


### nin0

- `nin0` **니니** (surprised): 아저씨! 아직 여기 계셨네요!
  - EN: Mr. Bear! You're still here!
  - ⚑ nini.done · → nin0_1
- `nin0_1` **빅그베** (surprised): 왜? 벌써 가길 바랐어?
  - EN: What, trying to get rid of me?
  - → nin0_2
- `nin0_2` **니니** (neutral): 아니거든요! 물어보실 거 있으면 물어보시라고요.
  - EN: No! I just thought you might have questions.
  - 선택 → `nq1`: 에드워드 아저씨를 누가 발견했어? / Who found Edward?
  - 선택 → `nq2`: 어젯밤 에드워드 아저씨 봤어? / Did you see Edward last night?
  - 선택 → `nq3`: 그 공책은 뭐야? / What's that notebook?
  - 선택 → `nq4`: 니니와 잡담하기 / Chat with Nini
  - 선택 → `nqx`: 대화 마치기 / End Conversation
  - ⚑ nin.met

### nin

- `nin` **니니** (neutral): 물어보실 거 있으면 물어보세요!
  - EN: Ask me anything you like!
  - 선택 → `nq1`: 에드워드 아저씨를 누가 발견했어? / Who found Edward?
  - 선택 → `nq2`: 어젯밤 에드워드 아저씨 봤어? / Did you see Edward last night?
  - 선택 → `nq3`: 그 공책은 뭐야? / What's that notebook?
  - 선택 → `nq4`: 니니와 잡담하기 / Chat with Nini
  - 선택 → `nqx`: 대화 마치기 / End Conversation

### nq1

- `nq1` **빅그베** (thinking): 에드워드 아저씨를 처음 발견한 게 누구래?
  - EN: Who was the first to find Edward?
  - → nq1_1
- `nq1_1` **니니** (neutral): 토미 아저씨요. 새벽 순찰 중에 발견하셨대요.
  - EN: Tommy. He found Edward while he was out on patrol early this morning.
  - → nq1_2
- `nq1_2` **빅그베** (neutral): 토미라면 자세히 알겠네.
  - EN: Then Tommy might know more.
  - → nq1_3
- `nq1_3` **니니** (neutral): 네. 근데 아저씨, 토미 아저씨도 많이 놀라신 것 같았어요.
  - EN: Yeah. But I think Tommy was pretty shaken up, too.
  - 메모+ t1

### nq2

- `nq2` **빅그베** (surprised): 어제 에드워드 아저씨 만났어?
  - EN: Did you see Edward yesterday?
  - → nq2_1
- `nq2_1` **니니** (neutral): 네! 기록관에서요. 편지를 쓰고 계셨어요.
  - EN: Yeah! At the Archive. He was writing letters.
  - → nq2_2
- `nq2_2` **빅그베** (thinking): 편지?
  - EN: Letters?
  - → nq2_3
- `nq2_3` **니니** (neutral): 두 통이요. 제가 아홉 시쯤 나올 때도 책상에 앉아 계셨어요.
  - EN: Two of them. He was still at his desk when I left around nine.
  - → nq2_4
- `nq2_4` **빅그베** (thinking): 누구한테 쓰는지는 못 봤고?
  - EN: Didn't happen to see who they were for?
  - → nq2_5
- `nq2_5` **니니** (neutral): 네. 근데 이상하게 자꾸 쓰다가 멈추셨어요.
  - EN: No. But he kept stopping in the middle of writing.
  - → nq2_6
- `nq2_6` **빅그베** (neutral): 무슨 고민이라도 있으셨나 보네.
  - EN: Maybe something was bothering him.
  - → nq2_7
- `nq2_7` **니니** (neutral): 저도 그렇게 생각했어요.
  - EN: That's what I thought, too.
  - ⚑ nini.letters · 증거+ stmt_nini

### nq3

- `nq3` **빅그베** (thinking): 그 공책은 또 뭐야?
  - EN: What's with the notebook?
  - → nq3_1
- `nq3_1` **니니** (surprised): 제 수사 수첩이요!
  - EN: My detective notebook!
  - → nq3_2
- `nq3_2` **빅그베** (surprised): 언제부터 탐정이었어?
  - EN: Since when are you a detective?
  - → nq3_3
- `nq3_3` **니니** (neutral): 방금부터요.
  - EN: Since just now.
  - → nq3_4
- `nq3_4` **빅그베** (neutral): 아주 경력이 화려하네.
  - EN: Quite the impressive career.
  - → nq3_5
- `nq3_5` **니니** (neutral): 놀리지 마세요! 어제 적어 둔 것도 있단 말이에요.
  - EN: Don't make fun of me! I wrote something down yesterday.
  - → nq3_6
- `nq3_6` **(나레이션)** (neutral): (니니가 공책을 펼쳐 보인다.) "붉은 장부 옮겨졌나?"
  - EN: (Nini opens her notebook.) "Was the red ledger moved?"
  - → nq3_7
- `nq3_7` **빅그베** (thinking): 붉은 장부?
  - EN: A red ledger?
  - → nq3_8
- `nq3_8` **니니** (neutral): 에드워드 아저씨가 찾으시던 거예요. 어디에 두셨는지 기억이 안 나신다고요.
  - EN: Edward was looking for it. He said he couldn't remember where he'd put it.
  - → nq3_9
- `nq3_9` **빅그베** (surprised): 그런데 왜 네 공책에 적혀 있어?
  - EN: Why'd you write it down?
  - → nq3_10
- `nq3_10` **니니** (neutral): 제가 찾아드리려고요! 근데 아직 못 찾았어요.
  - EN: I wanted to help him find it! Haven't had any luck yet.
  - 증거+ notebook

### nq4

- `nq4` **빅그베** (thinking): 너 오늘따라 얌전하다?
  - EN: You're unusually quiet today.
  - → nq4_1
- `nq4_1` **니니** (neutral): 저도 생각이 많을 때가 있거든요.
  - EN: I have a lot on my mind sometimes.
  - → nq4_2
- `nq4_2` **빅그베** (thinking): 무슨 생각?
  - EN: Like what?
  - → nq4_3
- `nq4_3` **니니** (neutral): 에드워드 아저씨요. 어제까지만 해도 저한테 웃어 주셨는데.
  - EN: Edward. He was smiling at me just yesterday.
  - → nq4_4
- `nq4_4` **빅그베** (neutral): 좋은 분이셨지.
  - EN: He was a good man.
  - → nq4_5
- `nq4_5` **니니** (thinking): 아저씨도 그렇게 생각하시죠?
  - EN: You think so too, right?
  - → nq4_6
- `nq4_6` **빅그베** (neutral): 응. 좋은 분이셨어.
  - EN: Yeah. He was.
  - → nq4_7
- `nq4_7` **니니** (thinking): 그럼 왜 이런 일이 생긴 걸까요?
  - EN: Then why did this have to happen?
  - → nq4_8
- `nq4_8` **빅그베** (neutral): 그걸 알아보려고 하는 거잖아.
  - EN: That's what we're trying to find out.

### nqx

- `nqx` **빅그베** (neutral): 나 다른 데도 좀 둘러볼게.
  - EN: I'm going to look around.
  - → nqx_1
- `nqx_1` **니니** (surprised): 네! 뭐 알아내시면 저한테도 알려 주세요!
  - EN: Okay! Tell me if you find anything!

### tmn0

- `tmn0` **토미** (thinking): 빅그베 씨. 무슨 일이십니까?
  - EN: Big Green Bear. What can I do for you?
  - → tmn0_1
- `tmn0_1` **빅그베** (neutral): 에드워드 아저씨 일로 왔습니다.
  - EN: I'm here about Edward.
  - → tmn0_2
- `tmn0_2` **토미** (neutral): 그렇군요. 저도 그분 생각을 떨칠 수가 없네요.
  - EN: I see. I haven't been able to stop thinking about him.
  - 선택 → `tq1`: 에드워드를 발견했을 때 / When you found Edward
  - 선택 → `tq2`: 어젯밤에 본 사람 / Someone you saw last night
  - 선택 → `tq3`: 어젯밤 날씨 / Last night's weather
  - 선택 → `tq4`: 토미와 잡담하기 / Chat with Tommy
  - 선택 → `tqx`: 대화 마치기 / End Conversation

### tmn

- `tmn` **토미** (neutral): 더 필요하신 것이 있습니까?
  - EN: Is there anything more you need?
  - 선택 → `tq1`: 에드워드를 발견했을 때 / When you found Edward
  - 선택 → `tq2`: 어젯밤에 본 사람 / Someone you saw last night
  - 선택 → `tq3`: 어젯밤 날씨 / Last night's weather
  - 선택 → `tq4`: 토미와 잡담하기 / Chat with Tommy
  - 선택 → `tqx`: 대화 마치기 / End Conversation

### tq1

- `tq1` **빅그베** (thinking): 발견하셨을 때 상황이 어땠습니까?
  - EN: What was it like when you found him?
  - → tq1_1
- `tq1_1` **토미** (neutral): 시계탑 뒤편이었습니다. 눈에 거의 파묻혀 있었어요.
  - EN: Behind the clock tower. He was almost buried in snow.
  - → tq1_2
- `tq1_2` **빅그베** (thinking): 어떻게 발견하셨습니까?
  - EN: How did you spot him?
  - → tq1_3
- `tq1_3` **토미** (neutral): 눈 위로 외투 자락이 조금 보였습니다. 그냥 지나쳤으면 못 봤을 겁니다.
  - EN: Part of his coat was sticking out of the snow. I might've walked right past him.
  - → tq1_4
- `tq1_4` **빅그베** (thinking): 그다음엔요?
  - EN: What did you do?
  - → tq1_5
- `tq1_5` **토미** (worried): 메이 선생님을 불렀습니다. 하지만 이미 늦었더군요.
  - EN: I sent for May. But it was already too late.
  - → tq1_6
- `tq1_6` **빅그베** (neutral): 그렇군요.
  - EN: I see.
  - ⚑ c1.found · 증거+ found_loc

### tq2

- `tq2` **빅그베** (thinking): 어젯밤 순찰 중에 이상한 일은 없었습니까?
  - EN: Did you notice anything unusual on patrol last night?
  - → tq2_1
- `tq2_1` **토미** (thinking): 그러고 보니, 한 사람이 기억납니다.
  - EN: Come to think of it, there was someone.
  - → tq2_2
- `tq2_2` **빅그베** (thinking): 누구였습니까?
  - EN: Who?
  - → tq2_3
- `tq2_3` **토미** (neutral): 밤 11시 35분쯤 다리 근처에서 봤습니다. 덩치가 큰 사람이었어요.
  - EN: Around 11:35, near the bridge. A pretty big fellow.
  - → tq2_4
- `tq2_4` **빅그베** (thinking): 아는 사람이었습니까?
  - EN: Someone you knew?
  - → tq2_5
- `tq2_5` **토미** (thinking): 모르겠습니다. 뒷모습만 봤거든요. 목도리를 하고 있었습니다.
  - EN: Couldn't say. I only saw them from behind. They were wearing a scarf.
  - → tq2_6
- `tq2_6` **빅그베** (thinking): 어디로 갔습니까?
  - EN: Which way were they going?
  - → tq2_7
- `tq2_7` **토미** (neutral): 시계탑 쪽이었습니다.
  - EN: Toward the clock tower.
  - → tq2_8
- `tq2_8` **빅그베** (thinking): 그 시간에요?
  - EN: At that hour?
  - → tq2_9
- `tq2_9` **토미** (neutral): 저도 이상하다고 생각했습니다. 하지만 그때는 그냥 지나쳤죠.
  - EN: I thought it was odd, too. But I didn't think much of it at the time.
  - ⚑ tm.stmt · 증거+ stmt_tm

### tq3

- `tq3` **빅그베** (thinking): 어젯밤 눈이 많이 왔습니까?
  - EN: Was it snowing hard last night?
  - → tq3_1
- `tq3_1` **토미** (neutral): 네. 자정 무렵부터 특히 심해졌습니다.
  - EN: Yes. It got especially bad around midnight.
  - → tq3_2
- `tq3_2` **빅그베** (thinking): 발자국 같은 건 남아 있지 않았습니까?
  - EN: Were there any footprints left?
  - → tq3_3
- `tq3_3` **토미** (neutral): 발견했을 때는 거의 없었습니다. 눈이 다 덮어 버렸어요.
  - EN: Hardly any by the time I found him. The snow had covered them.
  - → tq3_4
- `tq3_4` **빅그베** (neutral): 흔적을 찾기는 어렵겠군요.
  - EN: That makes things harder.
  - → tq3_5
- `tq3_5` **토미** (neutral): 네. 하지만 시계탑 안에는 뭔가 남아 있을지도 모르죠.
  - EN: Yes. But there might still be something inside the tower.
  - 메모+ snowtrack

### tq4

- `tq4` **빅그베** (worried): 순찰은 매일 혼자 도십니까?
  - EN: Do you patrol alone every night?
  - → tq4_1
- `tq4_1` **토미** (neutral): 대부분 그렇습니다. 마을이 워낙 조용해서요.
  - EN: Most nights. It's a quiet village.
  - → tq4_2
- `tq4_2` **빅그베** (neutral): 어제는 별로 조용하지 않았겠네요.
  - EN: Last night wasn't so quiet, though.
  - → tq4_3
- `tq4_3` **토미** (neutral): 그렇죠. 이 마을에서 이런 일이 생길 줄은 몰랐습니다.
  - EN: No. I never thought something like this would happen here.
  - → tq4_4
- `tq4_4` **빅그베** (neutral): 저도요.
  - EN: Neither did I.

### tqx

- `tqx` **빅그베** (neutral): 말씀 감사합니다, 토미 씨.
  - EN: Thanks for your help, Tommy.
  - → tqx_1
- `tqx_1` **토미** (neutral): 올리버 씨와도 이야기해 보십시오. 시계탑에 관해서는 그분이 제일 잘 아십니다.
  - EN: You should talk to Oliver. He knows that clock tower better than anyone.
  - → tqx_2
- `tqx_2` **빅그베** (neutral): 그래야겠군요.
  - EN: I think I will.

### c1_end

- `c1_end` **빅그베** (thinking): 시계탑에 가 봐야겠어.
  - EN: I should take a look at the clock tower.

### oka

- `oka` **올리버** (thinking): 빅그베 씨. 무슨 일이십니까?
  - EN: Big Green Bear. What brings you here?
  - → oka_1
- `oka_1` **빅그베** (neutral): 에드워드 아저씨 일로 왔습니다.
  - EN: I'm here about Edward.
  - → oka_2
- `oka_2` **올리버** (neutral): 그렇군요. 아직도 믿기지가 않습니다. 어제까지만 해도 멀쩡하셨는데.
  - EN: I see. I still can't believe it. He was perfectly fine yesterday.
  - → oka_3
- `oka_3` **빅그베** (neutral): 토미 씨한테 들었습니다. 어젯밤 시계탑 쪽으로 누군가 왔다고요.
  - EN: Tommy said he saw someone heading this way last night.
  - → oka_4
- `oka_4` **올리버** (surprised): 그랬습니까? 사실 저도 본 사람이 있습니다.
  - EN: Did he? Actually, I saw someone too.
  - 선택 → `oq1`: 어젯밤에 본 사람 / Someone you saw last night
  - 선택 → `oq2`: 시계가 멈춘 이유 / Why the clock stopped
  - 선택 → `oq3`: 에드워드 아저씨에 대해 / About Edward
  - 선택 → `oq4`: 올리버와 잡담하기 / Chat with Oliver
  - 선택 → `oqx`: 대화 마치기 / End Conversation
  - ⚑ c2.met

### okm

- `okm` **올리버** (neutral): 더 물어보실 것이 있습니까?
  - EN: Is there anything else you wish to ask?
  - 선택 → `oq1`: 어젯밤에 본 사람 / Someone you saw last night
  - 선택 → `oq2`: 시계가 멈춘 이유 / Why the clock stopped
  - 선택 → `oq3`: 에드워드 아저씨에 대해 / About Edward
  - 선택 → `oq4`: 올리버와 잡담하기 / Chat with Oliver
  - 선택 → `oqx`: 대화 마치기 / End Conversation

### oq1

- `oq1` **빅그베** (thinking): 언제 보셨습니까?
  - EN: When did you see them?
  - → oq1_1
- `oq1_1` **올리버** (neutral): 11시 40분쯤입니다. 계단을 올라가더군요.
  - EN: Around 11:40. They were going up the stairs.
  - → oq1_2
- `oq1_2` **빅그베** (thinking): 누구였습니까?
  - EN: Who was it?
  - → oq1_3
- `oq1_3` **올리버** (neutral): 얼굴은 못 봤습니다. 목도리를 두르고 있었어요.
  - EN: I didn't see their face. They had a scarf wrapped around them.
  - → oq1_4
- `oq1_4` **빅그베** (thinking): 다른 건 기억나십니까?
  - EN: Remember anything else?
  - → oq1_5
- `oq1_5` **올리버** (neutral): 오른손에 뭔가 들고 있었던 것 같습니다.
  - EN: I think they were carrying something in their right hand.
  - ⚑ c2 · → oq1_6
- `oq1_6` **빅그베** (thinking): 뭔지는 모르시고요?
  - EN: Couldn't tell what it was?
  - → oq1_7
- `oq1_7` **올리버** (neutral): 네. 어두워서요.
  - EN: No. It was too dark.
  - ⚑ ck.bear · 증거+ stmt_ck

### oq2

- `oq2` **빅그베** (neutral): 시계탑 시계가 멈췄다고 들었습니다.
  - EN: I heard the clock stopped.
  - → oq2_1
- `oq2_1` **올리버** (neutral): 네. 어젯밤부터요.
  - EN: Yes. Sometime last night.
  - → oq2_2
- `oq2_2` **빅그베** (thinking): 자주 고장 나는 시계입니까?
  - EN: Does it break down often?
  - → oq2_3
- `oq2_3` **올리버** (neutral): 아니요. 제가 어젯밤에 태엽을 감았을 때도 멀쩡했습니다.
  - EN: No. It was working when I wound it last night.
  - → oq2_4
- `oq2_4` **빅그베** (thinking): 안에 들어가 봐도 될까요?
  - EN: Mind if I take a look inside?
  - → oq2_5
- `oq2_5` **올리버** (neutral): 그러시죠. 다만 위쪽 정비 통로는 조심하세요.
  - EN: Go ahead. Just be careful near the upper maintenance walkway.
  - ⚑ c2.why · 메모+ twopen

### oq3

- `oq3` **빅그베** (thinking): 에드워드 아저씨는 자주 오셨습니까?
  - EN: Did Edward come here often?
  - → oq3_1
- `oq3_1` **올리버** (neutral): 네. 기록관 일도 바쁘셨을 텐데, 종 점검은 꼭 챙기셨습니다.
  - EN: Yes. Even with all his work at the Archive, he always made time to check the bell.
  - → oq3_2
- `oq3_2` **빅그베** (thinking): 어젯밤에도요?
  - EN: Even last night?
  - → oq3_3
- `oq3_3` **올리버** (worried): 자정 종을 확인하러 오신다고 했습니다. 그런데 종이 울리지 않았어요.
  - EN: He said he'd come to check the midnight bell. But it never rang.
  - → oq3_4
- `oq3_4` **빅그베** (thinking): 그런 적이 있었습니까?
  - EN: Has that happened before?
  - → oq3_5
- `oq3_5` **올리버** (neutral): 제가 기억하는 한은 없습니다.
  - EN: Not as long as I can remember.
  - 메모+ midbell

### oq4

- `oq4` **빅그베** (thinking): 시계탑에서 오래 일하셨죠?
  - EN: You've worked here a long time, haven't you?
  - → oq4_1
- `oq4_1` **올리버** (neutral): 오래됐죠. 이제는 시계 소리만 들어도 상태를 압니다.
  - EN: Long enough. I can usually tell how it's doing just by listening.
  - → oq4_2
- `oq4_2` **빅그베** (thinking): 이번에는요?
  - EN: And this time?
  - → oq4_3
- `oq4_3` **올리버** (neutral): 아무 소리도 안 나니까 답답하네요.
  - EN: That's the trouble. There's nothing to listen to.

### oqx

- `oqx` **빅그베** (neutral): 안을 좀 둘러보겠습니다.
  - EN: I'll have a look around inside.
  - → oqx_1
- `oqx_1` **올리버** (neutral): 조심하십시오.
  - EN: Be careful.

### okm2

- `okm2` **올리버** (neutral): 뭔가 찾으셨습니까?
  - EN: Find anything?
  - 선택 → `or1`: 열린 정비구에 대해 / About the open hatch
  - 선택 → `or2`: 시계 장치의 긁힌 자국 / About the scratches
  - 선택 → `or3`: 회중시계에 대해 / About the pocket watch
  - 선택 → `orx`: 대화 마치기 / End Conversation

### or1

- `or1` **빅그베** (neutral): 위쪽 정비구가 열려 있던데요.
  - EN: The maintenance hatch upstairs was open.
  - → or1_1
- `or1_1` **올리버** (neutral): 네. 저도 발견하고 놀랐습니다.
  - EN: Yes. I was surprised when I saw it.
  - → or1_2
- `or1_2` **빅그베** (thinking): 원래 열어 두는 곳입니까?
  - EN: Is it normally left open?
  - → or1_3
- `or1_3` **올리버** (neutral): 아닙니다. 작업이 끝나면 반드시 닫아야 합니다.
  - EN: No. It's supposed to be closed after maintenance.
  - → or1_4
- `or1_4` **빅그베** (thinking): 누가 열었을까요?
  - EN: Who could've opened it?
  - → or1_5
- `or1_5` **올리버** (thinking): 모르겠습니다. 에드워드 씨가 마지막으로 올라가셨다는 것밖에는요.
  - EN: I don't know. I only know Edward was up there last night.

### or2

- `or2` **빅그베** (neutral): 장치 옆에 긁힌 자국이 있었습니다.
  - EN: I noticed some scratches near the mechanism.
  - → or2_1
- `or2_1` **올리버** (thinking): 어디에요?
  - EN: Where?
  - → or2_2
- `or2_2` **빅그베** (neutral): 정비구 옆 금속판입니다.
  - EN: On the metal plate beside the hatch.
  - → or2_3
- `or2_3` **올리버** (neutral): 그건 저도 처음 듣는군요.
  - EN: That's news to me.
  - → or2_4
- `or2_4` **빅그베** (thinking): 최근에 생긴 걸까요?
  - EN: Could they be recent?
  - → or2_5
- `or2_5` **올리버** (thinking): 글쎄요. 정확히는 모르겠습니다.
  - EN: Hard to say. I couldn't tell you for sure.

### or3

- `or3` **빅그베** (neutral): 에드워드 아저씨의 회중시계를 봤습니다.
  - EN: I found Edward's pocket watch.
  - → or3_1
- `or3_1` **올리버** (neutral): 아, 그 시계요. 메이 선생님이 소지품을 확인한 뒤 맡겨 두셨습니다.
  - EN: Ah, that watch. May left it here after checking his belongings.
  - → or3_2
- `or3_2` **빅그베** (neutral): 깨져 있는데도 움직이더군요.
  - EN: It's cracked, but it's still ticking.
  - → or3_3
- `or3_3` **올리버** (neutral): 늘 탑 시계와 시간을 맞추셨습니다.
  - EN: He always kept it in sync with the tower clock.
  - → or3_4
- `or3_4` **빅그베** (thinking): 외투에 다른 물건은 없었습니까?
  - EN: Was there anything else in his coat?
  - → or3_5
- `or3_5` **올리버** (neutral): 부인과 찍은 사진이 한 장 있었습니다. 가슴주머니에 넣어 두셨더군요.
  - EN: There was a photograph of him and his wife in his breast pocket.
  - → or3_6
- `or3_6` **빅그베** (neutral): 그 사진을 아직 가지고 계셨군요.
  - EN: He still had that picture.

### orx

- `orx` **빅그베** (neutral): 안을 좀 둘러보겠습니다.
  - EN: I'll have a look around inside.
  - → orx_1
- `orx_1` **올리버** (neutral): 조심하십시오.
  - EN: Be careful.

### tw_clk

- `tw_clk` **(나레이션)** (neutral): (시곗바늘이 11:47에 멈춰 있다.)
  - EN: (The clock hands are frozen at 11:47.)
  - → tw_clk_1
- `tw_clk_1` **빅그베** (neutral): 11시 47분.
  - EN: Eleven forty-seven.
  - → tw_clk_2
- `tw_clk_2` **빅그베** (thinking): 어젯밤 그 시간에 무슨 일이 있었던 거지?
  - EN: What happened here at that time last night?
  - ⚑ ck.clk · 증거+ clock

### tw_mech

- `tw_mech` **(나레이션)** (neutral): (커다란 톱니바퀴들이 움직이지 않고 있다.)
  - EN: (The large gears are motionless.)
  - → tw_mech_1
- `tw_mech_1` **빅그베** (neutral): 태엽은 아직 풀리지 않았어.
  - EN: The spring hasn't run down.
  - → tw_mech_2
- `tw_mech_2` **(나레이션)** (neutral): (장치 옆 금속판에 긁힌 흔적이 있다.)
  - EN: (There are scratches on a metal plate beside the mechanism.)
  - → tw_mech_3
- `tw_mech_3` **빅그베** (thinking): 여기 긁힌 자국은 뭐지?
  - EN: What's with these scratches?
  - ⚑ ck.mech · 증거+ mech

### tw_hatch

- `tw_hatch` **(나레이션)** (neutral): (정비구 덮개가 열린 채로 있다. 아래로 눈 덮인 지면이 보인다.)
  - EN: (The maintenance hatch is open. The snow-covered ground is visible below.)
  - → tw_hatch_1
- `tw_hatch_1` **빅그베** (thinking): 이런 곳이 열려 있었나?
  - EN: Was this always left open?
  - → tw_hatch_2
- `tw_hatch_2` **(나레이션)** (neutral): (가장자리에는 무언가에 쓸린 흔적이 있다.)
  - EN: (There are scuff marks along the edge.)
  - → tw_hatch_3
- `tw_hatch_3` **빅그베** (thinking): 누가 여기서 미끄러진 걸까?
  - EN: Did someone slip here?
  - ⚑ ck.hatch · 증거+ hatch2

### tw_pw

- `tw_pw` **(나레이션)** (neutral): (정비 도구 옆에 에드워드의 회중시계가 놓여 있다.)
  - EN: (Edward's pocket watch rests beside the maintenance tools.)
  - → tw_pw_1
- `tw_pw_1` **빅그베** (neutral): 에드워드 아저씨 시계잖아.
  - EN: That's Edward's watch.
  - → tw_pw_2
- `tw_pw_2` **(나레이션)** (neutral): (유리가 깨져 있지만 초침은 움직이고 있다.)
  - EN: (The glass is cracked, but the second hand is still moving.)
  - → tw_pw_3
- `tw_pw_3` **빅그베** (neutral): 아직 움직이네.
  - EN: It's still ticking.
  - → tw_pw_4
- `tw_pw_4` **빅그베** (neutral): 탑 시계는 멈췄는데.
  - EN: Even though the tower clock stopped.
  - ⚑ ck.pw · 증거+ pwatch

### c2_end

- `c2_end` **빅그베** (thinking): 누군가 탑에 올라갔고, 얼마 지나지 않아 시계가 멈췄어.
  - EN: Someone went up the tower, and not long after, the clock stopped.
  - → c2_end_1
- `c2_end_1` **빅그베** (thinking): 그런데 에드워드 아저씨는 왜 정비구 근처에 있었을까?
  - EN: But why was Edward near the maintenance hatch?

### mol0

- `mol0` **몰리** (thinking): 빅그베 아니니? 얼굴이 영 안 좋구나.
  - EN: Big Green Bear, is that you? You look troubled.
  - → mol0_1
- `mol0_1` **빅그베** (neutral): 에드워드 아저씨 일 때문에요.
  - EN: It's about Edward.
  - → mol0_2
- `mol0_2` **몰리** (neutral): 들었다. 참 오래 알고 지낸 사람인데.
  - EN: I heard. I've known him for such a long time.
  - → mol0_3
- `mol0_3` **빅그베** (thinking): 몇 가지 여쭤봐도 될까요?
  - EN: Mind if I ask you a few things?
  - → mol0_4
- `mol0_4` **몰리** (neutral): 물론이지. 이리 와 보렴.
  - EN: Of course, dear. Come closer.
  - 선택 → `ml1`: 에드워드에 대해 묻는다 / Ask about Edward
  - 선택 → `ml2`: 옛날 종 사고에 대해 묻는다 / Ask about the old bell accident
  - 선택 → `ml3`: 에드워드의 부인에 대해 묻는다 / Ask about Edward's wife
  - 선택 → `ml4`: 몰리 할머니와 잡담하기 / Chat with Grandma Molly
  - 선택 → `mlx`: 대화 마치기 / End Conversation
  - ⚑ mol.met

### mol

- `mol` **몰리** (neutral): 그래, 또 물어볼 게 있니?
  - EN: Well, dear, what else would you like to know?
  - 선택 → `ml1`: 에드워드에 대해 묻는다 / Ask about Edward
  - 선택 → `ml2`: 옛날 종 사고에 대해 묻는다 / Ask about the old bell accident
  - 선택 → `ml3`: 에드워드의 부인에 대해 묻는다 / Ask about Edward's wife
  - 선택 → `ml4`: 몰리 할머니와 잡담하기 / Chat with Grandma Molly
  - 선택 → `mlx`: 대화 마치기 / End Conversation

### ml1

- `ml1` **빅그베** (thinking): 요즘 에드워드 아저씨가 달라 보이진 않으셨어요?
  - EN: Had Edward been acting differently lately?
  - → ml1_1
- `ml1_1` **몰리** (worried): 전보다 말수가 적어졌지. 며칠 전엔 나한테 이상한 걸 묻더구나.
  - EN: He'd grown quieter. A few days ago, he asked me something strange.
  - → ml1_2
- `ml1_2` **빅그베** (thinking): 뭐라고요?
  - EN: What did he ask?
  - → ml1_3
- `ml1_3` **몰리** (worried): 오래된 잘못을 이제 와서 바로잡으면 무슨 소용이 있겠냐고.
  - EN: Whether there was any point in making up for an old wrong after all these years.
  - → ml1_4
- `ml1_4` **빅그베** (thinking): 뭐라고 대답하셨어요?
  - EN: What did you tell him?
  - → ml1_5
- `ml1_5` **몰리** (worried): 늦었다고 해서 하지 말아야 할 이유는 없다고 했지.
  - EN: I told him being late was no reason not to try.
  - → ml1_6
- `ml1_6` **빅그베** (neutral): 그랬군요.
  - EN: I see.
  - 메모+ regret

### ml2

- `ml2` **빅그베** (worried): 예전에 마을 종 때문에 사고가 있었다고 들었어요.
  - EN: I heard there was an accident involving the village bell years ago.
  - → ml2_1
- `ml2_1` **몰리** (neutral): 23년 전 일이구나.
  - EN: That was twenty-three years ago.
  - → ml2_2
- `ml2_2` **빅그베** (thinking): 그때 무슨 일이 있었죠?
  - EN: What happened?
  - → ml2_3
- `ml2_3` **몰리** (worried): 큰비가 내렸어. 강물이 넘쳤는데 경고 종이 울리지 않았지.
  - EN: There was a terrible storm. The river flooded, but the warning bell never rang.
  - → ml2_4
- `ml2_4` **빅그베** (thinking): 그래서요?
  - EN: And then?
  - → ml2_5
- `ml2_5` **몰리** (worried): 배를 몰던 사람이 돌아오지 못했단다.
  - EN: A boatman never made it back.
  - → ml2_6
- `ml2_6` **빅그베** (worried): 종은 왜 울리지 않았어요?
  - EN: Why didn't the bell ring?
  - → ml2_7
- `ml2_7` **몰리** (neutral): 고장이었다고도 하고, 누군가 망가뜨렸다고도 했지. 결국 마을에서 발표한 건 후자였어.
  - EN: Some said it broke down. Others said someone had damaged it. The village officially went with the second story.
  - → ml2_8
- `ml2_8` **빅그베** (thinking): 누가 그랬다고요?
  - EN: Who did they blame?
  - → ml2_9
- `ml2_9` **몰리** (neutral): 그건 기록관에 남아 있을 거야. 내 기억보다는 기록을 확인하는 게 낫겠구나.
  - EN: That should be in the Archive. Better to check the records than rely on my memory.
  - ⚑ mol.bell · 증거+ bellinc

### ml3

- `ml3` **빅그베** (thinking): 에드워드 아저씨는 부인 사진을 늘 가지고 다니셨죠?
  - EN: Edward always carried a picture of his wife, didn't he?
  - → ml3_1
- `ml3_1` **몰리** (worried): 그래. 참 아끼던 사람이었지.
  - EN: He did. He loved her dearly.
  - → ml3_2
- `ml3_2` **빅그베** (neutral): 오래전에 많이 편찮으셨다고 들었어요.
  - EN: I heard she was very ill years ago.
  - → ml3_3
- `ml3_3` **몰리** (worried): 맞아. 에드워드가 그때 얼마나 힘들어했는지 모른단다.
  - EN: That's right. It was an awful time for him.
  - → ml3_4
- `ml3_4` **빅그베** (thinking): 그래도 기록관 일은 계속하셨고요?
  - EN: But he kept working at the Archive?
  - → ml3_5
- `ml3_5` **몰리** (neutral): 그럴 수밖에 없었겠지. 치료비도 필요했을 테니까.
  - EN: He probably had no choice. The treatment wasn't going to pay for itself.
  - 메모+ family

### ml4

- `ml4` **빅그베** (surprised): 할머니는 옛날 일을 정말 잘 기억하시네요.
  - EN: You remember so much about the old days.
  - → ml4_1
- `ml4_1` **몰리** (neutral): 최근 일은 자꾸 잊어버리면서 말이다.
  - EN: Funny, considering how often I forget things these days.
  - → ml4_2
- `ml4_2` **빅그베** (thinking): 그럼 제가 어제 왔던 건 기억하세요?
  - EN: Do you remember me visiting yesterday?
  - → ml4_3
- `ml4_3` **몰리** (surprised): 어제도 왔니?
  - EN: You came yesterday?
  - → ml4_4
- `ml4_4` **빅그베** (neutral): 농담이에요.
  - EN: I'm kidding.
  - → ml4_5
- `ml4_5` **몰리** (neutral): 못된 녀석.
  - EN: You little rascal.

### mlx

- `mlx` **빅그베** (neutral): 말씀 고맙습니다, 할머니.
  - EN: Thanks, Grandma Molly.
  - → mlx_1
- `mlx_1` **몰리** (neutral): 기록을 보더라도 너무 쉽게 믿지는 말거라.
  - EN: Don't believe everything you read in those records.
  - → mlx_2
- `mlx_2` **빅그베** (thinking): 왜요?
  - EN: Why not?
  - → mlx_3
- `mlx_3` **몰리** (neutral): 기록도 결국 사람이 쓰는 거니까.
  - EN: Because people are the ones who write them.

### ar_in

- `ar_in` **(나레이션)** (neutral): (에드워드가 사용하던 책상과 서류장이 있다.)
  - EN: (Edward's desk and filing cabinets stand inside.)
  - → ar_in_1
- `ar_in_1` **빅그베** (neutral): 니니가 말한 편지와 붉은 장부부터 찾아보자.
  - EN: Let's find those letters and the red ledger Nini mentioned.
  - ⚑ ar.opened

### ar_rep

- `ar_rep` **(나레이션)** (neutral): (23년 전의 사고 기록이 꽂혀 있다.)
  - EN: (A report from twenty-three years ago is filed away.)
  - → ar_rep_1
- `ar_rep_1` **(나레이션)** (neutral): 벨 마을 수해 사고 보고서
발생 시기: 23년 전
  - EN: Bell Village Flood Incident Report
Date: Twenty-three years ago
  - → ar_rep_2
- `ar_rep_2` **(나레이션)** (neutral): 사고: 홍수 당시 경고 종 미작동
인명 피해: 선원 1명 사망
  - EN: Incident: Warning bell failed during flood
Casualties: One boatman deceased
  - → ar_rep_3
- `ar_rep_3` **(나레이션)** (neutral): 공식 원인: 외부 충격에 의한 종 장치 파손
비고: 관련자의 진술에 따라 종결
  - EN: Official Cause: Bell mechanism damaged by external force
Status: Closed following witness testimony
  - → ar_rep_4
- `ar_rep_4` **빅그베** (neutral): 관련자 진술이라.
  - EN: Witness testimony, huh.
  - → ar_rep_5
- `ar_rep_5` **(나레이션)** (neutral): (보고서의 정비 기록 첨부란이 비어 있다.)
  - EN: (The maintenance records section is empty.)
  - → ar_rep_6
- `ar_rep_6` **빅그베** (thinking): 정비 기록은 어디 갔지?
  - EN: Where are the maintenance records?
  - ⚑ ar.rep · 증거+ oldrep

### ar_req

- `ar_req` **(나레이션)** (neutral): (사고 보고서 뒤에 오래된 요청서 사본이 끼워져 있다.)
  - EN: (A copy of an old maintenance request is tucked behind the report.)
  - → ar_req_1
- `ar_req_1` **(나레이션)** (neutral): 시설: 경고 종
문제: 작동 레버의 움직임이 원활하지 않음
  - EN: Facility: Warning Bell
Issue: Operating lever stiff and unreliable
  - → ar_req_2
- `ar_req_2` **(나레이션)** (neutral): 요청: 레버 부품 교체
처리: 예산 검토 후 보류
  - EN: Request: Replacement of lever components
Status: Deferred pending budget review
  - → ar_req_3
- `ar_req_3` **빅그베** (worried): 사고가 나기 전부터 문제가 있었던 거야?
  - EN: The bell had problems even before the accident?
  - ⚑ ar.req · 증거+ mreq

### ar_shelf

- `ar_shelf` **(나레이션)** (neutral): (서류장에 다른 장부들은 있지만 붉은 장부가 있어야 할 자리는 비어 있다.)
  - EN: (Several ledgers remain on the shelf, but the space for the red ledger is empty.)
  - → ar_shelf_1
- `ar_shelf_1` **빅그베** (neutral): 여기 있었던 모양인데.
  - EN: Looks like it used to be here.
  - → ar_shelf_2
- `ar_shelf_2` **(나레이션)** (neutral): (선반에는 장부를 꺼낸 흔적이 남아 있다.)
  - EN: (There is a clean mark where a book once stood.)
  - → ar_shelf_3
- `ar_shelf_3` **빅그베** (thinking): 누가 가져간 걸까?
  - EN: Did someone take it?
  - ⚑ ar.shelf · 증거+ noledger

### ar_desk

- `ar_desk` **(나레이션)** (neutral): (책상 서랍에서 편지 초안과 빈 봉투가 발견된다.)
  - EN: (A draft letter and an empty envelope are found in the desk drawer.)
  - → ar_desk_1
- `ar_desk_1` **(나레이션)** (neutral): "그날 이후로 저는 선택의 여지가 없었다고 스스로를 설득해 왔습니다."
  - EN: "Ever since that day, I've told myself I had no choice."
  - → ar_desk_2
- `ar_desk_2` **(나레이션)** (neutral): "하지만 23년은 너무 긴 시간이었습니다. 이제는 바로잡으려 합니다."
  - EN: "But twenty-three years is far too long. It's time I made things right."
  - → ar_desk_3
- `ar_desk_3` **빅그베** (thinking): 무슨 선택을 했다는 거지?
  - EN: What choice is he talking about?
  - → ar_desk_4
- `ar_desk_4` **(나레이션)** (neutral): (빈 봉투에는 받는 사람의 이름이 적혀 있지 않다.)
  - EN: (The empty envelope has no recipient's name.)
  - ⚑ ar.drawer · 증거+ draft

### ar_note

- `ar_note` **(나레이션)** (neutral): (책상 아래에서 작은 메모가 발견된다.)
  - EN: (A small note is found beneath the desk.)
  - → ar_note_1
- `ar_note_1` **(나레이션)** (neutral): "자정 공개. 원본 별도 보관. 의회 기록 확인."
  - EN: "Reveal at midnight. Original stored separately. Check council records."
  - → ar_note_2
- `ar_note_2` **빅그베** (thinking): 자정에 뭘 공개하려던 거지?
  - EN: What was he planning to reveal at midnight?
  - ⚑ ar.note · 증거+ mnote

### ar_ph

- `ar_ph` **빅그베** (neutral): 서랍 안쪽에 뭔가 끼어 있어.
  - EN: Something's wedged in the back of the drawer.
  - → ar_ph_1
- `ar_ph_1` **(나레이션)** (neutral): (나무판 사이에 작은 사진 한 장이 끼어 있다. 어린 곰 두 마리가 목도리를 하고 나란히 서 있다.)
  - EN: (A small photograph is wedged between the panels. Two young bears stand side by side in scarves.)
  - → ar_ph_2
- `ar_ph_2` **빅그베** (neutral): 23년 전의 사진이네.
  - EN: It's from twenty-three years ago.
  - ⚑ ar.photo · 증거+ photo2

### dq0

- `dq0` **(나레이션)** (neutral): (필수 단서를 모두 확인했다. 단서를 연결해 보자.)
  - EN: (All the required clues are in. Let's connect them.)
  - → dq1

### dq1

- `dq1` **(나레이션)** (neutral): 질문 1. 23년 전 사고 보고서에서 빠진 것은?
  - EN: Question 1. What's missing from the incident report?
  - 선택 → `dq1w`: A. 피해자의 이름 / A. The victim's name
  - 선택 → `dq1r`: B. 정비 기록 / B. Maintenance records
  - 선택 → `dq1w`: C. 사고 날짜 / C. The date

### dq1w

- `dq1w` **빅그베** (thinking): 아니야. 보고서를 다시 떠올려 보자.
  - EN: No. Let me think back to the report.
  - → dq1

### dq1r

- `dq1r` **빅그베** (worried): 사고 원인은 누군가 종을 망가뜨렸다는 건데, 정작 고장 기록은 빠져 있어.
  - EN: They blamed someone for breaking the bell, but left out the records showing it was already faulty.
  - → dq2

### dq2

- `dq2` **(나레이션)** (neutral): 질문 2. 에드워드가 자정에 공개하려던 것은 무엇과 관련 있을까?
  - EN: Question 2. What was Edward planning to reveal at midnight?
  - 선택 → `dq2r`: A. 23년 전 사고 / A. The accident twenty-three years ago
  - 선택 → `dq2w`: B. 시계탑의 수리비 / B. The clock tower's repair costs
  - 선택 → `dq2w`: C. 새로운 마을 축제 / C. A new village festival

### dq2w

- `dq2w` **빅그베** (thinking): 아니야. 메모와 편지 초안을 다시 떠올려 보자.
  - EN: No. Let me think back to the note and the draft letter.
  - → dq2

### dq2r

- `dq2r` **빅그베** (neutral): 에드워드 아저씨는 그날의 기록을 다시 꺼내고 있었어.
  - EN: Edward had been digging into what happened that day.
  - → dq2r_1
- `dq2r_1` **(나레이션)** (neutral): (빅그베가 사고 보고서를 다시 펼친다.)
  - EN: (Big Green Bear opens the incident report once more.)
  - → dq2r_2
- `dq2r_2` **빅그베** (thinking): 23년 전. 경고 종이 울리지 않았던 날.
  - EN: Twenty-three years ago. The day the warning bell failed.
  - → dq2r_3
- `dq2r_3` **빅그베** (thinking): 그날 무슨 일이 있었는지, 나는 알고 있어.
  - EN: I know what happened that day.
  - → dq2r_4
- `dq2r_4` **(나레이션)** (neutral): (화면이 천천히 어두워진다.)
  - EN: (The screen slowly fades to black.)

### f4a

- `f4a` **(나레이션)** (neutral): (어린 두 곰이 비 내리는 마을 광장에 있다.)
  - EN: (Two young bears stand in the village square as rain begins to fall.)
  - → f4a_1
- `f4a_1` **동생** (surprised): 형! 좀 천천히 가!
  - EN: Green! Slow down!
  - → f4a_2
- `f4a_2` **형** (neutral): 네가 느린 거야.
  - EN: You're the one walking too slowly.
  - → f4a_3
- `f4a_3` **동생** (neutral): 목도리가 자꾸 풀린단 말이야.
  - EN: My scarf keeps coming loose!
  - → f4a_4
- `f4a_4` **형** (neutral): 아까도 묶었잖아.
  - EN: Didn't you just tie it?
  - → f4a_5
- `f4a_5` **동생** (neutral): 이번엔 제대로 묶을 거야.
  - EN: I'll get it right this time.
  - ⚑ f4.intro

### f4s

- `f4s` **(나레이션)** (neutral): (동생이 왼손으로 목도리를 묶는다. 매듭과 꼬리가 왼쪽 어깨에 놓인다.)
  - EN: (Little Green ties his scarf with his left hand. The knot and tail rest on his left shoulder.)
  - 메모+ m1 · → f4s_1
- `f4s_1` **형** (neutral): 넌 꼭 그쪽으로 묶더라.
  - EN: You always tie it on that side.
  - → f4s_2
- `f4s_2` **동생** (neutral): 형은 반대로 묶잖아.
  - EN: You tie yours on the other side.
  - → f4s_3
- `f4s_3` **형** (neutral): 그게 편하니까.
  - EN: It's more comfortable that way.
  - → f4s_4
- `f4s_4` **동생** (neutral): 나도 이게 편해.
  - EN: Well, this is more comfortable for me.
  - → f4s_5
- `f4s_5` **형** (neutral): 그래. 이번엔 안 풀리겠네.
  - EN: Fair enough. Looks like it'll stay put this time.
  - ⚑ f4.scarf

### f4w

- `f4w` **(나레이션)** (neutral): (두 형제가 경고 종 옆을 지나간다.)
  - EN: (The brothers pass the warning bell.)
  - → f4w_1
- `f4w_1` **동생** (thinking): 형, 저 종은 왜 이렇게 커?
  - EN: Why's that bell so big?
  - → f4w_2
- `f4w_2` **형** (neutral): 강이 넘치면 마을 전체에 들려야 하니까.
  - EN: So the whole village can hear it if the river floods.
  - → f4w_3
- `f4w_3` **동생** (thinking): 그럼 누가 울려?
  - EN: Who rings it?
  - → f4w_4
- `f4w_4` **형** (worried): 위험한 걸 먼저 발견한 사람이겠지.
  - EN: Whoever spots the danger first, I guess.
  - → f4w_5
- `f4w_5` **동생** (thinking): 이걸 당기면 울리는 거야?
  - EN: Does pulling this make it ring?
  - → f4w_6
- `f4w_6` **형** (thinking): 아마도. 만지지는 마.
  - EN: Probably. Don't touch it.
  - → f4w_7
- `f4w_7` **동생** (neutral): 보기만 할게.
  - EN: I'm just looking.
  - → f4w_8
- `f4w_8` **(나레이션)** (neutral): (동생이 레버를 살짝 건드린다. 레버가 거의 움직이지 않는다.)
  - EN: (Little Green nudges the lever. It barely moves.)
  - 메모+ m3 · → f4w_9
- `f4w_9` **동생** (surprised): 어? 이거 안 움직이는데?
  - EN: Huh? It won't budge.
  - → f4w_10
- `f4w_10` **형** (neutral): 그럼 더 만지지 마. 어른들한테 말하자.
  - EN: Then leave it alone. We'll tell the adults.
  - → f4w_11
- `f4w_11` **(나레이션)** (neutral): (빗줄기가 거세지고 강물이 제방 가까이 차오른다.)
  - EN: (The rain grows heavier. The river rises toward the embankment.)
  - fx rain · → f4w_12
- `f4w_12` **동생** (neutral): 형, 물이 너무 높아.
  - EN: Green, the water's getting really high.
  - → f4w_13
- `f4w_13` **형** (neutral): 알아. 어서 돌아가자.
  - EN: I know. Come on, let's go.
  - → f4w_14
- `f4w_14` **동생** (thinking): 근데 종은?
  - EN: What about the bell?
  - → f4w_15
- `f4w_15` **형** (neutral): 어른들한테 알려야지.
  - EN: We need to warn the adults.
  - → f4w_16
- `f4w_16` **동생** (surprised): 우리가 먼저 울리면 되잖아!
  - EN: Why don't we ring it ourselves?
  - → f4w_17
- `f4w_17` **형** (neutral): 잠깐, 아까 그거 잘 안 움직였잖아.
  - EN: Wait, it wasn't working earlier.
  - → f4w_18
- `f4w_18` **(나레이션)** (neutral): (동생이 종 쪽으로 달려간다.)
  - EN: (Little Green runs toward the bell.)
  - → f4w_19
- `f4w_19` **형** (surprised): 야! 기다려!
  - EN: Hey! Wait!
  - ⚑ f4.river

### f4p

- `f4p` **(나레이션)** (neutral): (동생이 왼손으로 레버를 당긴다.)
  - EN: (Little Green pulls the lever with his left hand.)
  - → f4p_1
- `f4p_1` **동생** (thinking): 으으, 왜 이렇게 뻑뻑해?
  - EN: Why is this thing so stiff?
  - → f4p_2
- `f4p_2` **(나레이션)** (neutral): (레버가 움직이지 않자 동생이 몸을 기울인다. 왼쪽 어깨의 목도리 꼬리가 장치 틈에 걸린다.)
  - EN: (As the lever resists, Little Green leans forward. The scarf tail on his left shoulder catches in the mechanism.)
  - → f4p_3
- `f4p_3` **동생** (surprised): 어? 잠깐.
  - EN: Huh? Wait.
  - → f4p_4
- `f4p_4` **(나레이션)** (neutral): (동생이 뒤로 물러나려 하지만 목도리가 걸려 움직이지 못한다.)
  - EN: (Little Green tries to step back, but his scarf holds him in place.)
  - → f4p_5
- `f4p_5` **동생** (surprised): 형! 목도리가 안 빠져!
  - EN: Green! My scarf's stuck!
  - → f4p_6
- `f4p_6` **형** (surprised): 움직이지 마! 내가 갈게!
  - EN: Don't move! I'm coming!
  - → f4p_7
- `f4p_7` **(나레이션)** (neutral): (형이 달려와 목도리를 빼려고 한다.)
  - EN: (Green rushes over and tries to free the scarf.)
  - → f4p_8
- `f4p_8` **형** (neutral): 조금만 참아.
  - EN: Hold still. Almost got it.
  - → f4p_9
- `f4p_9` **(나레이션)** (neutral): (금속이 크게 삐걱인다.)
  - EN: (The metal groans loudly.)
  - → f4p_10
- `f4p_10` **동생** (thinking): 형, 무슨 소리야?
  - EN: Green, what's that sound?
  - → f4p_11
- `f4p_11` **(나레이션)** (neutral): (레버 위쪽의 낡은 들보가 흔들린다.)
  - EN: (An old beam above the lever begins to give way.)
  - → f4p_12
- `f4p_12` **형** (surprised): 숙여!
  - EN: Duck!
  - → f4qte

### f4qte

- `f4qte` **(나레이션)** (neutral): (들보가 떨어진다! 어떻게 할까?)
  - EN: (The beam breaks loose! What do you do?)
  - 선택 → `f4ok`: 동생을 밀어낸다 / Shove Little Green out of the way
  - 선택 → `flrw`: 뒤로 물러선다 / Step back

### flrw

- `flrw` **(나레이션)** (neutral): (과거는 바뀌지 않는다. 다시 동생 앞에 서 있다.)
  - EN: (The past does not change. He is standing in front of his brother again.)
  - → f4qte

### f4ok

- `f4ok` **(나레이션)** (neutral): (형이 동생을 밀어낸다. 들보가 형의 왼쪽 귀를 스치며 떨어진다.)
  - EN: (Green shoves Little Green out of the way. The beam tears past Green's left ear.)
  - 메모+ m5 · → f4ok_1
- `f4ok_1` **동생** (surprised): 형!
  - EN: Green!
  - → f4ok_2
- `f4ok_2` **(나레이션)** (neutral): (형이 무릎을 꿇는다. 왼쪽 귀에서 피가 흐른다.)
  - EN: (Green drops to one knee. Blood runs from his left ear.)
  - → f4ok_3
- `f4ok_3` **동생** (worried): 피 나잖아!
  - EN: You're bleeding!
  - → f4ok_4
- `f4ok_4` **형** (thinking): 넌 괜찮아?
  - EN: Are you okay?
  - → f4ok_5
- `f4ok_5` **동생** (thinking): 난 괜찮아. 근데 형 귀가...
  - EN: I'm okay, but your ear...
  - → f4ok_6
- `f4ok_6` **형** (thinking): 그럼 됐어. 일어날 수 있지?
  - EN: That's what matters. Can you stand?
  - → f4ok_7
- `f4ok_7` **동생** (neutral): 응.
  - EN: Yeah.
  - → f4ok_8
- `f4ok_8` **(나레이션)** (neutral): (형이 오른손으로 동생을 일으켜 세운다.)
  - EN: (Green helps Little Green up with his right hand.)
  - → f4ok_9
- `f4ok_9` **형** (worried): 가자. 여기 더 있으면 위험해.
  - EN: Come on. It's not safe here.
  - → f4ok_10
- `f4ok_10` **(나레이션)** (neutral): (두 형제가 비를 피해 처마 아래에 선다.)
  - EN: (The brothers take shelter beneath an awning.)
  - → f4ok_11
- `f4ok_11` **동생** (thinking): 형, 아까 나 때문에 다친 거지?
  - EN: You got hurt because of me, didn't you?
  - → f4ok_12
- `f4ok_12` **형** (worried): 사고였어.
  - EN: It was an accident.
  - → f4ok_13
- `f4ok_13` **동생** (thinking): 내가 종을 안 만졌으면...
  - EN: If I hadn't touched the bell...
  - → f4ok_14
- `f4ok_14` **형** (neutral): 그 종, 처음부터 이상했잖아.
  - EN: There was something wrong with that bell already.
  - → f4ok_15
- `f4ok_15` **동생** (neutral): 그래도 내가 거기 안 갔으면 형도 안 다쳤을 거야.
  - EN: But if I hadn't gone over there, you wouldn't have gotten hurt.
  - → f4ok_16
- `f4ok_16` **형** (neutral): 넌 다치지 않았잖아.
  - EN: But you're not hurt.
  - → f4ok_17
- `f4ok_17` **동생** (neutral): 형은 다쳤잖아.
  - EN: You are.
  - → f4ok_18
- `f4ok_18` **(나레이션)** (neutral): (형이 잠시 동생을 바라본다.)
  - EN: (Green looks at him for a moment.)
  - → f4ok_19
- `f4ok_19` **형** (thinking): 너라면 어떻게 했을 것 같아?
  - EN: What would you have done?
  - → f4ok_20
- `f4ok_20` **동생** (surprised): 뭐?
  - EN: What?
  - → f4ok_21
- `f4ok_21` **형** (neutral): 내가 거기 있었으면.
  - EN: If I'd been the one standing there.
  - → f4ok_22
- `f4ok_22` **동생** (neutral): 당연히 구했지.
  - EN: I'd have saved you. Obviously.
  - → f4ok_23
- `f4ok_23` **형** (neutral): 그럼 됐네.
  - EN: There you go.
  - → f4ok_24
- `f4ok_24` **(나레이션)** (neutral): (동생이 젖은 목도리를 다시 묶는다. 매듭은 왼쪽 어깨에 놓인다.)
  - EN: (Little Green reties his wet scarf. The knot rests on his left shoulder.)
  - → f4ok_25
- `f4ok_25` **동생** (neutral): 형 목도리는 오른쪽인데.
  - EN: Yours is on the right.
  - → f4ok_26
- `f4ok_26` **형** (neutral): 응.
  - EN: Yeah.
  - → f4ok_27
- `f4ok_27` **동생** (neutral): 우리 똑같이 생겼어도 이건 다르네.
  - EN: We look exactly alike, but we tie our scarves differently.
  - → f4ok_28
- `f4ok_28` **형** (neutral): 그러네.
  - EN: Guess we do.
  - → f4ok_29
- `f4ok_29` **(나레이션)** (neutral): (멀리서 마을 사람들의 목소리가 들린다.)
  - EN: (Voices approach from the village.)
  - → f4ok_30
- `f4ok_30` **마을 사람** (thinking): 얘들아! 거기 있니?
  - EN: Boys! Are you there?
  - → f4ok_31
- `f4ok_31` **동생** (neutral): 형, 사람들이 온다.
  - EN: Green, someone's coming.
  - → f4ok_32
- `f4ok_32` **(나레이션)** (neutral): (형이 왼쪽 귀를 가린다.)
  - EN: (Green covers his injured left ear.)
  - → f4ok_33
- `f4ok_33` **(나레이션)** (neutral): (화면이 어두워진다.)
  - EN: (The screen fades to black.)
  - ⚑ f4.end · 메모+ m4

### f5a

- `f5a` **(나레이션)** (neutral): (두 형제가 비를 피해 서 있다. 에드워드가 다가온다.)
  - EN: (The brothers stand out of the rain. Edward approaches.)
  - → f5a_1
- `f5a_1` **에드워드** (thinking): 둘 다 여기 있었구나! 얼마나 찾았는지 아니?
  - EN: There you are! I've been looking everywhere for you two!
  - → f5a_2
- `f5a_2` **동생** (surprised): 에드워드 아저씨!
  - EN: Edward!
  - → f5a_3
- `f5a_3` **에드워드** (thinking): 다친 데는 없니?
  - EN: Are either of you hurt?
  - → f5a_4
- `f5a_4` **형** (neutral): 저는 괜찮아요. 동생부터 봐 주세요.
  - EN: I'm okay. Check on my brother first.
  - → f5a_5
- `f5a_5` **동생** (worried): 형 귀에서 피 나요.
  - EN: His ear's bleeding.
  - → f5a_6
- `f5a_6` **에드워드** (thinking): 어디 보자. 이건 치료를 받아야겠구나.
  - EN: Let me see. That needs treatment.
  - → f5a_7
- `f5a_7` **형** (neutral): 괜찮아요. 별거 아니에요.
  - EN: I'm fine. It's nothing.
  - → f5a_8
- `f5a_8` **에드워드** (neutral): 그런 건 내가 판단하마.
  - EN: I'll be the judge of that.
  - 선택 → `f5q1`: 종에 대해 말한다 / Tell Edward about the bell
  - 선택 → `f5q2`: 형의 귀를 보여 준다 / Show Edward Green's injury
  - 선택 → `f5q3`: 대화 마치기 / End Conversation

### f5q1

- `f5q1` **동생** (neutral): 아저씨, 제가 종을 망가뜨린 것 같아요.
  - EN: Edward, I think I broke the bell.
  - → f5q1_1
- `f5q1_1` **에드워드** (thinking): 무슨 말이니?
  - EN: What do you mean?
  - → f5q1_2
- `f5q1_2` **동생** (neutral): 원래 잘 안 움직였는데, 제가 당기다가 목도리가 걸렸어요.
  - EN: It was already stuck, but I pulled on it and my scarf got caught.
  - → f5q1_3
- `f5q1_3` **형** (neutral): 제가 더 빨리 말렸어야 했어요.
  - EN: I should've stopped him sooner.
  - → f5q1_4
- `f5q1_4` **에드워드** (neutral): 우선 집에 가자. 나머지는 나중에 이야기하자꾸나.
  - EN: Let's get you both home first. We can talk about the rest later.

### f5q2

- `f5q2` **동생** (neutral): 형이 절 구해 줬어요.
  - EN: Green saved me.
  - → f5q2_1
- `f5q2_1` **에드워드** (thinking): 무슨 일이 있었니?
  - EN: What happened?
  - → f5q2_2
- `f5q2_2` **동생** (neutral): 들보가 떨어졌는데 형이 절 밀어냈어요.
  - EN: A beam fell, and he pushed me out of the way.
  - → f5q2_3
- `f5q2_3` **에드워드** (neutral): 그랬구나.
  - EN: I see.
  - → f5q2_4
- `f5q2_4` **형** (neutral): 그냥 가까이 있었어요.
  - EN: I was just standing nearby.
  - → f5q2_5
- `f5q2_5` **에드워드** (neutral): 그래도 동생을 구한 건 네가 맞잖니.
  - EN: You still saved your brother.

### f5q3

- `f5q3` **에드워드** (worried): 둘 다 따라오렴. 오늘은 충분히 무서운 일을 겪었어.
  - EN: Come along, both of you. You've had enough scares for one day.
  - → f5s2

### f5s2

- `f5s2` **(나레이션)** (neutral): (며칠 후. 에드워드의 책상 위에 사고 보고서가 놓여 있다.)
  - EN: (A few days later. An incident report lies on Edward's desk.)
  - → f5s2_1
- `f5s2_1` **(나레이션)** (neutral): 사고 보고서 초안
- 경고 종 장치 파손
  - EN: Draft Incident Report
- Warning bell mechanism damaged
  - → f5s2_2
- `f5s2_2` **(나레이션)** (neutral): - 구조 행위자: 미확인
- 관련 아동 진술 확인 필요
  - EN: - Rescuer: Unconfirmed
- Children's statements pending
  - → f5s2_3
- `f5s2_3` **(나레이션)** (neutral): (에드워드가 붉은 장부를 펼친다.)
  - EN: (Edward opens a red ledger.)
  - → f5s2_4
- `f5s2_4` **에드워드** (neutral): 교체 요청이 있었는데도 보류됐군.
  - EN: There was a replacement request, but it was deferred.
  - → f5s2_5
- `f5s2_5` **(나레이션)** (neutral): (문밖에서 의회 관계자의 목소리가 들린다.)
  - EN: (A council representative speaks from outside.)
  - → f5s2_6
- `f5s2_6` **의회 관계자** (neutral): 보고서는 오늘 안에 마무리해 주십시오.
  - EN: We need that report finalized today.
  - → f5s2_7
- `f5s2_7` **에드워드** (neutral): 아직 확인할 사항이 남았습니다.
  - EN: There are still things I need to verify.
  - → f5s2_8
- `f5s2_8` **의회 관계자** (thinking): 예산 결정까지 문제 삼으실 생각입니까?
  - EN: Are you planning to question the council's budget decision?
  - → f5s2_9
- `f5s2_9` **에드워드** (neutral): 장치에 문제가 있었다는 기록이 있습니다.
  - EN: There's a record showing the mechanism was faulty.
  - → f5s2_10
- `f5s2_10` **의회 관계자** (neutral): 그 기록이 공개되면 마을 전체가 혼란스러워질 겁니다.
  - EN: Releasing that record would throw the whole village into turmoil.
  - → f5s2_11
- `f5s2_11` **에드워드** (neutral): 그렇다고 없던 일이 되지는 않습니다.
  - EN: That doesn't mean it didn't happen.
  - → f5s2_12
- `f5s2_12` **의회 관계자** (neutral): 보호하고 계신 아이들도 생각하셔야죠.
  - EN: You should think about the children in your care.
  - → f5s2_13
- `f5s2_13` **(나레이션)** (neutral): (에드워드가 펜을 내려놓는다.)
  - EN: (Edward sets down his pen.)
  - → f5s2_14
- `f5s2_14` **(나레이션)** (neutral): (에드워드가 두 형제를 부른다.)
  - EN: (Edward calls the twins over.)
  - → f5s2_15
- `f5s2_15` **에드워드** (neutral): 그날 일에 관해 다시 물어볼 게 있단다.
  - EN: I need to ask you about what happened that day.
  - → f5s2_16
- `f5s2_16` **형** (neutral): 제가 종을 망가뜨렸어요.
  - EN: I broke the bell.
  - → f5s2_17
- `f5s2_17` **동생** (thinking): 형?
  - EN: Green?
  - → f5s2_18
- `f5s2_18` **에드워드** (thinking): 그게 사실이니?
  - EN: Is that the truth?
  - → f5s2_19
- `f5s2_19` **형** (neutral): 네.
  - EN: Yes.
  - → f5s2_20
- `f5s2_20` **동생** (thinking): 하지만...
  - EN: But...
  - → f5s2_21
- `f5s2_21` **형** (neutral): 제가 했어요.
  - EN: It was me.
  - → f5s2_22
- `f5s2_22` **(나레이션)** (neutral): (동생은 형의 왼쪽 귀를 바라본다.)
  - EN: (Little Green looks at the injury on Green's left ear.)
  - → f5s2_23
- `f5s2_23` **에드워드** (thinking): 그럼 동생을 구한 것도 네가 맞지?
  - EN: And you were the one who saved your brother?
  - → f5s2_24
- `f5s2_24` **형** (neutral): 네.
  - EN: Yes.
  - → f5s2_25
- `f5s2_25` **(나레이션)** (neutral): (에드워드가 한동안 아무 말도 하지 않는다.)
  - EN: (Edward remains silent for a while.)
  - → f5s2_26
- `f5s2_26` **에드워드** (neutral): 알겠다. 오늘은 그만 가 보렴.
  - EN: I understand. That's all for today.
  - → f5s2_27
- `f5s2_27` **(나레이션)** (neutral): (두 형제가 나간다. 보고서의 일부가 수정되어 있다.)
  - EN: (The twins leave. Several lines of the report have been changed.)
  - → f5s2_28
- `f5s2_28` **(나레이션)** (neutral): 공식 사고 기록
- 경고 종 파손 책임: 형
  - EN: Official Incident Record
- Responsibility for bell damage: Older twin
  - → f5s2_29
- `f5s2_29` **(나레이션)** (neutral): - 구조 공적: 동생
- 관련자 이름: 수정됨
  - EN: - Rescue credit: Younger twin
- Names of involved children: Amended
  - → f5s2_30
- `f5s2_30` **(나레이션)** (neutral): - 정비 요청 기록: 첨부되지 않음
  - EN: - Maintenance request: Not attached
  - → f5s2_31
- `f5s2_31` **(나레이션)** (neutral): (에드워드가 서명을 망설인다.)
  - EN: (Edward hesitates before signing.)
  - → f5s2_32
- `f5s2_32` **에드워드** (worried): 미안하다.
  - EN: I'm sorry.
  - → f5s2_33
- `f5s2_33` **(나레이션)** (neutral): (그가 보고서에 서명한다.)
  - EN: (He signs the report.)
  - 메모+ m6 · → f5s2_34
- `f5s2_34` **(나레이션)** (neutral): (며칠 뒤, 마을 광장.)
  - EN: (A few days later, in the village square.)
  - → f5s2_35
- `f5s2_35` **마을 사람** (thinking): 네가 참 용감한 일을 했다지?
  - EN: I hear you were very brave.
  - → f5s2_36
- `f5s2_36` **동생** (thinking): 네?
  - EN: Me?
  - → f5s2_37
- `f5s2_37` **마을 사람** (surprised): 형을 구했다면서. 정말 착한 아이구나.
  - EN: You saved your brother. What a good boy.
  - 메모+ m7 · → f5s2_38
- `f5s2_38` **(나레이션)** (neutral): (동생이 형을 바라본다.)
  - EN: (Little Green looks at Green.)
  - → f5s2_39
- `f5s2_39` **동생** (thinking): 그게...
  - EN: Well...
  - → f5s2_40
- `f5s2_40` **형** (neutral): 가자.
  - EN: Come on.
  - → f5s2_41
- `f5s2_41` **(나레이션)** (neutral): (형이 동생의 손을 잡는다.)
  - EN: (Green takes his brother's hand.)
  - → f5s2_42
- `f5s2_42` **동생** (worried): 형, 사람들이 잘못 알고 있어.
  - EN: Green, they've got it wrong.
  - → f5s2_43
- `f5s2_43` **형** (neutral): 알아.
  - EN: I know.
  - → f5s2_44
- `f5s2_44` **동생** (neutral): 그럼 말해야지.
  - EN: Then we should tell them.
  - → f5s2_45
- `f5s2_45` **형** (neutral): 지금은 그냥 가자.
  - EN: Let's just go for now.
  - → f5s2_46
- `f5s2_46` **동생** (thinking): 형은 억울하지 않아?
  - EN: Doesn't it bother you?
  - → f5s2_47
- `f5s2_47` **형** (thinking): 넌 괜찮아?
  - EN: Are you okay?
  - → f5s2_48
- `f5s2_48` **동생** (neutral): 응.
  - EN: Yeah.
  - → f5s2_49
- `f5s2_49` **형** (neutral): 그럼 됐어.
  - EN: Then that's enough for me.
  - → f5s2_50
- `f5s2_50` **(나레이션)** (neutral): (동생이 아무 말도 하지 못한다.)
  - EN: (Little Green says nothing.)
  - ⚑ f5.toPresent

### hz50

- `hz50` **(나레이션)** (neutral): (빅그베가 카페에 들어선다.)
  - EN: (Big Green Bear enters the café.)
  - → hz50_1
- `hz50_1` **헤이즐** (neutral): 빅그베! 어서 와.
  - EN: Big Green Bear! Come on in.
  - → hz50_2
- `hz50_2` **빅그베** (neutral): 헤이즐, 어젯밤 일로 물어볼 게 있어.
  - EN: Hazel, I need to ask you about last night.
  - → hz50_3
- `hz50_3` **헤이즐** (thinking): 에드워드 씨 일이지?
  - EN: About Edward?
  - → hz50_4
- `hz50_4` **빅그베** (neutral): 응.
  - EN: Yeah.
  - 선택 → `hq1`: 어젯밤에 대해 / Ask about last night
  - 선택 → `hq2`: 에드워드에 대해 / Ask about Edward
  - 선택 → `hqx`: 대화 마치기 / End Conversation
  - ⚑ hz5.met

### hz5

- `hz5` **헤이즐** (neutral): 더 궁금한 게 있어?
  - EN: Anything else you want to know?
  - 선택 → `hq1`: 어젯밤에 대해 / Ask about last night
  - 선택 → `hq2`: 에드워드에 대해 / Ask about Edward
  - 선택 → `hqx`: 대화 마치기 / End Conversation

### hq1

- `hq1` **빅그베** (thinking): 내가 어제 몇 시에 나갔는지 기억해?
  - EN: Do you remember what time I left yesterday?
  - → hq1_1
- `hq1_1` **헤이즐** (neutral): 11시 42분. 영수증에 시간이 남아 있어.
  - EN: 11:42. It's on your receipt.
  - → hq1_2
- `hq1_2` **빅그베** (neutral): 정확하네.
  - EN: That's pretty precise.
  - → hq1_3
- `hq1_3` **헤이즐** (neutral): 나가면서 목도리가 뒤집혀 있길래 바로잡아 줬잖아.
  - EN: Your scarf was twisted, remember? I straightened it for you on your way out.
  - → hq1_4
- `hq1_4` **빅그베** (neutral): 아, 그랬지.
  - EN: Right. You did.
  - → hq1_5
- `hq1_5` **헤이즐** (neutral): 왼쪽으로 매듭을 두는 게 네 버릇이잖아.
  - EN: You always wear the knot on your left shoulder.
  - ⚑ hz5.night · 증거+ receipt

### hq2

- `hq2` **빅그베** (surprised): 에드워드 아저씨도 요즘 카페에 오셨어?
  - EN: Had Edward been coming by lately?
  - → hq2_1
- `hq2_1` **헤이즐** (neutral): 몇 번. 그런데 예전처럼 오래 앉아 있지는 않으셨어.
  - EN: A few times. But he never stayed as long as he used to.
  - → hq2_2
- `hq2_2` **빅그베** (thinking): 무슨 말씀은 안 하셨고?
  - EN: Did he say anything?
  - → hq2_3
- `hq2_3` **헤이즐** (neutral): 해야 할 일이 있다고만 하셨어.
  - EN: Just that there was something he needed to do.

### hqx

- `hqx` **빅그베** (neutral): 고마워, 헤이즐.
  - EN: Thanks, Hazel.
  - → hqx_1
- `hqx_1` **헤이즐** (neutral): 너도 너무 무리하지 마.
  - EN: Don't push yourself too hard.

### may0

- `may0` **메이** (thinking): 빅그베. 에드워드 씨 때문에 왔지?
  - EN: Big Green Bear. You're here about Edward, aren't you?
  - → may0_1
- `may0_1` **빅그베** (neutral): 사망 시간을 알고 싶어.
  - EN: I need to know when he died.
  - → may0_2
- `may0_2` **메이** (neutral): 정확한 시각까지는 말할 수 없어.
  - EN: I can't give you an exact time.
  - → may0_3
- `may0_3` **빅그베** (neutral): 대략이라도.
  - EN: Even an estimate would help.
  - → may0_4
- `may0_4` **메이** (neutral): 밤 11시 55분에서 12시 15분 사이로 보고 있어.
  - EN: Somewhere between 11:55 p.m. and 12:15 a.m.
  - → may0_5
- `may0_5` **빅그베** (thinking): 추락 때문에?
  - EN: From the fall?
  - → may0_6
- `may0_6` **메이** (worried): 추락으로 크게 다쳤어. 그리고 추위에 오래 노출됐지.
  - EN: The fall caused severe injuries. He was also exposed to the cold for some time.
  - → may0_7
- `may0_7` **빅그베** (thinking): 조금만 더 일찍 발견됐다면?
  - EN: What if someone had found him sooner?
  - → may0_8
- `may0_8` **메이** (neutral): 살릴 수 있었을지는 몰라. 하지만 치료를 시작할 기회는 있었겠지.
  - EN: I can't say whether he would have survived. But he would've had a chance to receive treatment.
  - → may0_9
- `may0_9` **(나레이션)** (neutral): (빅그베가 잠시 침묵한다.)
  - EN: (Big Green Bear falls silent.)
  - → may0_10
- `may0_10` **메이** (thinking): 빅그베?
  - EN: Big Green Bear?
  - → may0_11
- `may0_11` **빅그베** (neutral): 아니야. 고마워.
  - EN: It's nothing. Thank you.
  - ⚑ may.done · 증거+ tod

### may9

- `may9` **메이** (neutral): 무리하지 마, 빅그베.
  - EN: Don't push yourself, Big Green Bear.

### f5_end

- `f5_end` **(나레이션)** (neutral): (수집한 단서를 확인한다.)
  - EN: (He reviews the clues he has collected.)
  - → f5_end_1
- `f5_end_1` **(나레이션)** (neutral): - 23년 전 형이 동생을 구했다.
- 사고 보고서가 바뀌었다.
  - EN: - Twenty-three years ago, Green saved his brother.
- The incident report was changed.
  - → f5_end_2
- `f5_end_2` **(나레이션)** (neutral): - 에드워드는 기록에 서명했다.
- 11:42에 카페를 나왔다.
  - EN: - Edward signed the record.
- Big Green Bear left the café at 11:42.
  - → f5_end_3
- `f5_end_3` **(나레이션)** (neutral): - 에드워드의 추정 사망 시간은 11:55~00:15다.
  - EN: - Edward's estimated time of death is 11:55–00:15.
  - → f5_end_4
- `f5_end_4` **빅그베** (thinking): 기록은 바뀌었어. 하지만 그날 형이 날 구했다는 건 기억해.
  - EN: The records were changed. But I remember my brother saving me.
  - → f5_end_5
- `f5_end_5` **빅그베** (thinking): 에드워드 아저씨는 왜 이제 와서 그 기록을 바로잡으려 했을까?
  - EN: Why did Edward decide to set the record straight after all these years?
  - → f5_end_6
- `f5_end_6` **(나레이션)** (neutral): (빅그베가 오래된 방앗간이 있는 방향을 바라본다.)
  - EN: (Big Green Bear looks toward the old mill.)
  - → f5_end_7
- `f5_end_7` **빅그베** (thinking): 형을 만나야겠어.
  - EN: I need to see my brother.

### mill_d

- `mill_d` **(나레이션)** (neutral): (방앗간 문 앞에 선다.)
  - EN: (Big Green Bear stands at the mill door.)
  - → mill_d_1
- `mill_d_1` **그린** (worried): 돌아가.
  - EN: Go home.
  - → mill_d_2
- `mill_d_2` **빅그베** (neutral): 아직 아무 말도 안 했는데.
  - EN: I haven't said anything yet.
  - → mill_d_3
- `mill_d_3` **그린** (thinking): 무슨 일로 왔는지는 알아.
  - EN: I know why you're here.
  - → mill_d_4
- `mill_d_4` **빅그베** (neutral): 그럼 문 좀 열어 줘.
  - EN: Then open the door.
  - → mill_d_5
- `mill_d_5` **(나레이션)** (neutral): (잠시 후 문이 열린다.)
  - EN: (The door opens.)
  - → mill_d_6
- `mill_d_6` **그린** (neutral): 오래 있을 생각은 하지 마.
  - EN: Don't make yourself comfortable.
  - → mill_d_7
- `mill_d_7` **빅그베** (neutral): 차라도 한 잔 줄 줄 알았는데.
  - EN: I was hoping for a cup of tea.
  - → mill_d_8
- `mill_d_8` **그린** (neutral): 찻잎 없어.
  - EN: No tea leaves.
  - → mill_d_9
- `mill_d_9` **빅그베** (neutral): 예전에도 그랬잖아.
  - EN: You never had any.
  - ⚑ fin.m1

### gm

- `gm` **그린** (neutral): 물어볼 게 있으면 해.
  - EN: If you've got questions, ask.
  - 선택 → `gm1`: 에드워드 아저씨 / Ask About Edward
  - 선택 → `gm2`: 시계탑 / Ask About the Clock Tower
  - 선택 → `gm3`: 23년 전 / Ask About Twenty-Three Years Ago
  - 선택 → `gm4`: 그냥 이야기하기 / Make Small Talk
  - 선택 → `gmx`: 대화 마치기 / End Conversation

### gm1

- `gm1` **빅그베** (surprised): 에드워드 아저씨가 널 만나러 오라고 했어?
  - EN: Did Edward ask you to meet him?
  - → gm1_1
- `gm1_1` **그린** (thinking): 아니. 내가 찾아갔어.
  - EN: No. I went to him.
  - → gm1_2
- `gm1_2` **빅그베** (thinking): 왜?
  - EN: Why?
  - → gm1_3
- `gm1_3` **그린** (worried): 하지 말아 달라고 부탁할 일이 있었거든.
  - EN: There was something I needed him not to do.
  - → gm1_4
- `gm1_4` **빅그베** (surprised): 들어주셨어?
  - EN: Did he agree?
  - → gm1_5
- `gm1_5` **그린** (neutral): 넌 그분 성격 알잖아.
  - EN: You know what he was like.
  - → gm1_6
- `gm1_6` **빅그베** (neutral): 한 번 마음먹으면 안 바꾸셨지.
  - EN: Once he'd made up his mind, that was it.
  - → gm1_7
- `gm1_7` **그린** (worried): 그날도 그랬어.
  - EN: That night was no different.

### gm2

- `gm2` **빅그베** (thinking): 시계탑에 간 건 맞지?
  - EN: You went to the clock tower, didn't you?
  - → gm2_1
- `gm2_1` **그린** (worried): 그래.
  - EN: Yes.
  - → gm2_2
- `gm2_2` **빅그베** (surprised): 거기서 무슨 일이 있었어?
  - EN: What happened up there?
  - → gm2_3
- `gm2_3` **그린** (thinking): 서류를 가져가려고 했어.
  - EN: I tried to take the papers.
  - → gm2_4
- `gm2_4` **빅그베** (thinking): 에드워드 아저씨가 가지고 있던?
  - EN: The ones Edward had?
  - → gm2_5
- `gm2_5` **그린** (worried): 응. 놓으라고 하셨는데, 내가 말을 안 들었어.
  - EN: Yes. He told me to let go. I wouldn't.
  - → gm2_6
- `gm2_6` **빅그베** (thinking): 그리고?
  - EN: And then?
  - → gm2_7
- `gm2_7` **그린** (worried): 종이가 찢어졌어. 그분이 뒤로 물러났고.
  - EN: The paper tore. He stepped backward.
  - → gm2_8
- `gm2_8` **(나레이션)** (neutral): (그린이 손을 내려다본다.)
  - EN: (Green looks down at his hands.)
  - → gm2_9
- `gm2_9` **그린** (worried): 그다음엔 너무 빨랐어.
  - EN: Everything after that happened too fast.
  - → gm2_10
- `gm2_10` **빅그베** (surprised): 떨어지는 걸 봤어?
  - EN: Did you see him fall?
  - → gm2_11
- `gm2_11` **그린** (worried): 끝까지는 못 봤어.
  - EN: Not all the way.
  - → gm2_12
- `gm2_12` **빅그베** (thinking): 아래로 내려가 보지는 않았고?
  - EN: You didn't go down to check?
  - → gm2_13
- `gm2_13` **그린** (worried): 못 했어.
  - EN: I couldn't.
  - → gm2_14
- `gm2_14` **빅그베** (thinking): 왜?
  - EN: Why?
  - → gm2_15
- `gm2_15` **그린** (worried): 그걸 나도 모르겠어.
  - EN: I wish I knew.

### gm3

- `gm3` **그린** (thinking): 그분이 옛날 기록을 다시 꺼냈어.
  - EN: He'd brought out the old records.
  - → gm3_1
- `gm3_1` **빅그베** (neutral): 봤어.
  - EN: I saw them.
  - → gm3_2
- `gm3_2` **그린** (thinking): 뭐가 적혀 있던데?
  - EN: What did they say?
  - → gm3_3
- `gm3_3` **빅그베** (neutral): 우리가 아는 이야기랑 다르더라.
  - EN: A different story from the one we know.
  - → gm3_4
- `gm3_4` **그린** (thinking): 어떤 게 진짜인지는 너도 알잖아.
  - EN: You know which one is true.
  - → gm3_5
- `gm3_5` **빅그베** (neutral): 형도 알지.
  - EN: So do you.
  - → gm3_6
- `gm3_6` **그린** (worried): 나는 네가 잊은 줄 알았어.
  - EN: I thought you'd forgotten.
  - → gm3_7
- `gm3_7` **빅그베** (neutral): 잊으려고 한 거지.
  - EN: I tried to.
  - → gm3_8
- `gm3_8` **그린** (worried): 그게 가능해?
  - EN: Can you do that?
  - → gm3_9
- `gm3_9` **빅그베** (thinking): 형은?
  - EN: Can you?
  - → gm3_10
- `gm3_10` **(나레이션)** (neutral): (그린은 대답하지 않는다.)
  - EN: (Green doesn't answer.)

### gm4

- `gm4` **빅그베** (worried): 여기서 혼자 지내기 힘들지 않아?
  - EN: Isn't it hard living out here alone?
  - → gm4_1
- `gm4_1` **그린** (neutral): 익숙해.
  - EN: I'm used to it.
  - → gm4_2
- `gm4_2` **빅그베** (neutral): 방앗간도 많이 낡았네.
  - EN: This place has seen better days.
  - → gm4_3
- `gm4_3` **그린** (neutral): 너도.
  - EN: So have you.
  - → gm4_4
- `gm4_4` **빅그베** (neutral): 그건 좀 심한데.
  - EN: That's a little harsh.
  - → gm4_5
- `gm4_5` **그린** (neutral): 농담이야.
  - EN: I'm kidding.

### gmx

- `gmx` **빅그베** (neutral): 또 올게.
  - EN: I'll come by again.
  - → gmx_1
- `gmx_1` **그린** (neutral): 마음대로 해.
  - EN: Suit yourself.

### mo_sc

- `mo_sc` **(나레이션)** (neutral): (오래된 목도리가 걸려 있다. 매듭은 오른쪽 어깨 방향으로 묶여 있다.)
  - EN: (An old scarf hangs nearby, tied with the knot on the right.)
  - → mo_sc_1
- `mo_sc_1` **빅그베** (neutral): 아직도 이렇게 묶네.
  - EN: You still tie it that way.
  - → mo_sc_2
- `mo_sc_2` **그린** (neutral): 너도 왼쪽으로 묶잖아.
  - EN: You still tie yours on the left.
  - ⚑ fin.o1

### mo_gl

- `mo_gl` **(나레이션)** (neutral): (작업대 위에는 왼손 장갑만 놓여 있다.)
  - EN: (Only a left glove lies on the workbench.)
  - → mo_gl_1
- `mo_gl_1` **빅그베** (thinking): 오른쪽은?
  - EN: Where's the other one?
  - → mo_gl_2
- `mo_gl_2` **그린** (worried): 잃어버렸어.
  - EN: Lost it.
  - → mo_gl_3
- `mo_gl_3` **빅그베** (thinking): 언제?
  - EN: When?
  - → mo_gl_4
- `mo_gl_4` **그린** (worried): 어젯밤.
  - EN: Last night.
  - → mo_gl_5
- `mo_gl_5` **빅그베** (neutral): 새로 사야겠네.
  - EN: You'll need a new pair.
  - → mo_gl_6
- `mo_gl_6` **그린** (neutral): 한 짝은 멀쩡한데.
  - EN: This one's still perfectly good.
  - → mo_gl_7
- `mo_gl_7` **빅그베** (neutral): 한 짝만으론 소용없잖아.
  - EN: Not much use on its own.
  - → mo_gl_8
- `mo_gl_8` **(나레이션)** (neutral): (그린이 장갑을 서랍에 넣는다.)
  - EN: (Green puts the glove in a drawer.)
  - ⚑ fin.o2 · 메모+ glove

### mo_doc

- `mo_doc` **(나레이션)** (neutral): (탁자 위에 찢어진 서류 조각이 있다.)
  - EN: (A torn piece of paper lies on the table.)
  - → mo_doc_1
- `mo_doc_1` **(나레이션)** (neutral): "경고 종의 결함은 사고 이전부터 보고되었다."
  - EN: "The warning bell's defect had been reported before the accident."
  - → mo_doc_2
- `mo_doc_2` **(나레이션)** (neutral): "관련 기록과 구조자의 신원은 의도적으로 변경되었다."
  - EN: "The records and the rescuer's identity were deliberately altered."
  - → mo_doc_3
- `mo_doc_3` **빅그베** (neutral): 에드워드 아저씨가 공개하려던 내용이네.
  - EN: This is what Edward was going to reveal.
  - → mo_doc_4
- `mo_doc_4` **그린** (thinking): 전부는 아니야.
  - EN: Not all of it.
  - → mo_doc_5
- `mo_doc_5` **빅그베** (thinking): 뭐가 더 있는데?
  - EN: What else?
  - → mo_doc_6
- `mo_doc_6` **그린** (worried): 그날 누가 진실을 알고 있었는지까지 적혀 있었어.
  - EN: He also wrote down who knew the truth that day.
  - ⚑ fin.o3 · 증거+ tdoc

### gs4

- `gs4` **그린** (thinking): 토미가 그분을 발견했다며.
  - EN: Tommy found him, didn't he?
  - → gs4_1
- `gs4_1` **빅그베** (neutral): 그렇게 들었어.
  - EN: That's what I heard.
  - → gs4_2
- `gs4_2` **그린** (worried): 많이 추웠겠지.
  - EN: It must've been cold.
  - → gs4_3
- `gs4_3` **빅그베** (neutral): 눈이 많이 왔으니까.
  - EN: It was snowing pretty hard.
  - → gs4_4
- `gs4_4` **그린** (thinking): 메이 선생님은 뭐래?
  - EN: What did May say?
  - → gs4_5
- `gs4_5` **빅그베** (neutral): 추락한 뒤에도 한동안 살아 계셨을 거래.
  - EN: She thinks he lived for some time after the fall.
  - → gs4_6
- `gs4_6` **(나레이션)** (neutral): (그린이 고개를 든다.)
  - EN: (Green looks up.)
  - → gs4_7
- `gs4_7` **그린** (surprised): 얼마나?
  - EN: How long?
  - → gs4_8
- `gs4_8` **빅그베** (neutral): 정확히는 모른대.
  - EN: She couldn't say exactly.
  - → gs4_9
- `gs4_9` **그린** (worried): 누가 조금만 일찍 발견했으면 달랐을까?
  - EN: Would it have made a difference if someone had found him sooner?
  - → gs4_10
- `gs4_10` **빅그베** (neutral): 그건 아무도 모르지.
  - EN: Nobody knows.
  - → gs4_11
- `gs4_11` **그린** (worried): 적어도 혼자 두지는 않았겠지.
  - EN: At least he wouldn't have been alone.
  - → gs4_12
- `gs4_12` **빅그베** (worried): 혼자는 아니었을 거야.
  - EN: I don't think he was alone.
  - → gs4_13
- `gs4_13` **그린** (surprised): 무슨 뜻이야?
  - EN: What do you mean?
  - → gs4_14
- `gs4_14` **빅그베** (neutral): 아니. 마지막까지 누군가 곁에 있었으면 좋았겠다는 뜻이야.
  - EN: Nothing. I just wish someone had been there with him.
  - → gs4_15
- `gs4_15` **그린** (worried): 그래.
  - EN: Yeah.
  - → gs4_16
- `gs4_16` **빅그베** (thinking): 형은 그분이 떨어지고 바로 떠났다고 했지?
  - EN: You said you left right after he fell?
  - → gs4_17
- `gs4_17` **그린** (neutral): 응.
  - EN: Yes.
  - → gs4_18
- `gs4_18` **빅그베** (thinking): 그럼 마지막에 무슨 말을 하셨는지도 모르겠네.
  - EN: Then you wouldn't know what his last words were.
  - → gs4_19
- `gs4_19` **그린** (surprised): 말을 하셨어?
  - EN: He said something?
  - → gs4_20
- `gs4_20` **(나레이션)** (neutral): (빅그베가 입을 다문다.)
  - EN: (Big Green Bear falls silent.)
  - → gs4_21
- `gs4_21` **빅그베** (neutral): 아니. 그냥.
  - EN: No. I was just wondering.
  - ⚑ fin.s4

### may2

- `may2` **메이** (neutral): 또 왔구나.
  - EN: You're back.
  - → may2_1
- `may2_1` **빅그베** (neutral): 한 가지 더 물어보려고.
  - EN: I have one more question.
  - → may2_2
- `may2_2` **메이** (thinking): 뭔데?
  - EN: What is it?
  - → may2_3
- `may2_3` **빅그베** (thinking): 에드워드 아저씨가 떨어지고도 살아 계셨을 가능성이 있어?
  - EN: Could Edward have survived for a while after the fall?
  - → may2_4
- `may2_4` **메이** (neutral): 충분히 있어. 다만 정확히 얼마나 버티셨는지는 알 수 없어.
  - EN: It's quite possible. I just can't say for how long.
  - → may2_5
- `may2_5` **빅그베** (neutral): 그렇구나.
  - EN: I see.
  - → may2_6
- `may2_6` **메이** (neutral): 한 가지 이상한 게 있어.
  - EN: There's one thing I can't explain.
  - → may2_7
- `may2_7` **빅그베** (thinking): 뭔데?
  - EN: What is it?
  - → may2_8
- `may2_8` **메이** (worried): 에드워드 씨 손에 작은 상처가 있었어. 추락하면서 생긴 상처는 아니야.
  - EN: Edward had a small cut on his hand. It wasn't from the fall.
  - → may2_9
- `may2_9` **빅그베** (thinking): 손에?
  - EN: On his hand?
  - → may2_10
- `may2_10` **메이** (neutral): 손톱 밑에 노란 실도 끼어 있었고.
  - EN: There was yellow thread caught under his fingernails, too.
  - → may2_11
- `may2_11` **(나레이션)** (neutral): (빅그베가 자신의 목도리를 내려다본다.)
  - EN: (Big Green Bear glances at his scarf.)
  - → may2_12
- `may2_12` **빅그베** (neutral): 오래된 목도리라 실이 잘 풀려.
  - EN: It's an old scarf. The threads come loose easily.
  - → may2_13
- `may2_13` **메이** (neutral): 네 목도리 얘긴 안 했는데.
  - EN: I wasn't talking about your scarf.
  - → may2_14
- `may2_14` **(나레이션)** (neutral): (잠시 침묵.)
  - EN: (A brief silence.)
  - → may2_15
- `may2_15` **빅그베** (neutral): 아, 그렇네.
  - EN: Right. You weren't.
  - ⚑ fin.may2 · 증거+ thread

### fr6

- `fr6` **(나레이션)** (neutral): (액자 뒤쪽이 조금 벌어져 있다.)
  - EN: (The back of the picture frame is slightly loose.)
  - → fr6_1
- `fr6_1` **(나레이션)** (neutral): (접힌 편지와 오른손 장갑 한 짝이 있다.)
  - EN: (A folded letter and a right-hand glove are hidden behind it.)
  - → fr6_2
- `fr6_2` **빅그베** (neutral): 아직 여기 있었네.
  - EN: Still here.
  - → fr6_3
- `fr6_3` **(나레이션)** (neutral): "이번에는 누구의 이름도 지우지 않겠습니다."
  - EN: "This time, I will not erase anyone's name."
  - → fr6_4
- `fr6_4` **(나레이션)** (neutral): (편지 아래쪽에는 에드워드의 서명이 있다.)
  - EN: (Edward's signature appears at the bottom.)
  - ⚑ fin.frame · 증거+ hidden

### fr9

- `fr9` **빅그베** (thinking): 편지와 장갑은 그대로 두자.
  - EN: I'll leave the letter and the glove where they are.

### gl7

- `gl7` **(나레이션)** (neutral): (빅그베가 방앗간을 다시 찾는다.)
  - EN: (Big Green Bear returns to the mill.)
  - → gl7_1
- `gl7_1` **그린** (neutral): 또 왔어?
  - EN: Back again?
  - → gl7_2
- `gl7_2` **빅그베** (neutral): 하나만 물어보려고.
  - EN: Just one more question.
  - → gl7_3
- `gl7_3` **그린** (thinking): 뭔데?
  - EN: What is it?
  - → gl7_4
- `gl7_4` **빅그베** (thinking): 그날로 돌아갈 수 있다면 어떻게 할 거야?
  - EN: What would you do if you could go back to that night?
  - → gl7_5
- `gl7_5` **그린** (worried): 아래로 내려갔겠지.
  - EN: I'd have gone downstairs.
  - → gl7_6
- `gl7_6` **빅그베** (thinking): 그다음엔?
  - EN: And then?
  - → gl7_7
- `gl7_7` **그린** (worried): 살아 계셨는지 확인했을 거야.
  - EN: I'd have checked if he was still alive.
  - → gl7_8
- `gl7_8` **빅그베** (thinking): 살아 계셨다면?
  - EN: And if he was?
  - → gl7_9
- `gl7_9` **그린** (neutral): 사람을 불렀겠지. 당연히.
  - EN: I'd have called for help. Of course.
  - → gl7_10
- `gl7_10` **(나레이션)** (neutral): (빅그베가 잠시 그린을 바라본다.)
  - EN: (Big Green Bear looks at Green for a moment.)
  - → gl7_11
- `gl7_11` **그린** (thinking): 넌?
  - EN: What about you?
  - → gl7_12
- `gl7_12` **빅그베** (thinking): 나?
  - EN: Me?
  - → gl7_13
- `gl7_13` **그린** (thinking): 그날로 돌아갈 수 있다면.
  - EN: If you could go back.
  - → gl7_14
- `gl7_14` **빅그베** (thinking): 글쎄.
  - EN: I don't know.
  - → gl7_15
- `gl7_15` **그린** (worried): 넌 항상 답을 잘했잖아.
  - EN: You always had an answer for everything.
  - → gl7_16
- `gl7_16` **빅그베** (neutral): 이번엔 없네.
  - EN: Not this time.
  - ⚑ fin.last · fx recap

### fn0

- `fn0` **(나레이션)** (neutral): (마을 광장. 니니가 빅그베를 기다리고 있다.)
  - EN: (In the village square, Nini waits for Big Green Bear.)
  - → fn0_1
- `fn0_1` **니니** (thinking): 아저씨! 알아내셨어요?
  - EN: Mr. Bear! Did you figure it out?
  - → fn0_2
- `fn0_2` **빅그베** (neutral): 응. 조금은.
  - EN: Yeah. Some of it.
  - → fn0_3
- `fn0_3` **니니** (thinking): 그럼 이제 다 끝난 거예요?
  - EN: So is it all over now?
  - → fn0_4
- `fn0_4` **빅그베** (thinking): 그건 모르겠네.
  - EN: I'm not sure.
  - → fn0_5
- `fn0_5` **니니** (neutral): 에드워드 아저씨가 그러셨는데요.
  - EN: You know what Edward used to say?
  - → fn0_6
- `fn0_6` **빅그베** (thinking): 뭐라고?
  - EN: What?
  - → fn0_7
- `fn0_7` **니니** (neutral): 기록은 잊지 않으려고 남기는 거래요.
  - EN: He said we keep records so we won't forget.
  - → fn0_8
- `fn0_8` **빅그베** (neutral): 그랬지.
  - EN: He did.
  - → fn0_9
- `fn0_9` **니니** (thinking): 그런데 왜 어떤 기록은 없어지는 걸까요?
  - EN: Then why do some records disappear?
  - → fn0_10
- `fn0_10` **(나레이션)** (neutral): (빅그베가 대답하지 않는다.)
  - EN: (Big Green Bear says nothing.)
  - → fn_b

### fn_b

- `fn_b` **니니** (thinking): 아저씨?
  - EN: Mr. Bear?
  - → fn_b_1
- `fn_b_1` **빅그베** (thinking): 응?
  - EN: Yeah?
  - → fn_b_2
- `fn_b_2` **니니** (thinking): 제 말 듣고 계셨어요?
  - EN: Were you listening?
  - → fn_b_3
- `fn_b_3` **빅그베** (neutral): 응. 듣고 있었어.
  - EN: Yeah. I was listening.
  - → fn_ch

### fn_ch

- `fn_ch` **니니** (neutral): 그럼 어떻게 하실 거예요?
  - EN: So what are you going to do?
  - 선택 → `fnA`: 편지를 건넨다 / Hand Over the Letter
  - 선택 → `fnB`: 편지를 간직한다 / Keep the Letter

### fnA

- `fnA` **(나레이션)** (neutral): (빅그베가 니니에게 편지를 건넨다.)
  - EN: (Big Green Bear hands Nini the letter.)
  - → fnA_1
- `fnA_1` **니니** (neutral): 에드워드 아저씨 글씨네요.
  - EN: That's Edward's handwriting.
  - → fnA_2
- `fnA_2` **빅그베** (neutral): 응.
  - EN: Yeah.
  - → fnA_3
- `fnA_3` **니니** (thinking): 이거 기록관에 가져다 놓을까요?
  - EN: Should I take it to the Archive?
  - → fnA_4
- `fnA_4` **빅그베** (neutral): 그래.
  - EN: Yes.
  - → fnA_5
- `fnA_5` **니니** (neutral): 아저씨도 같이 가요.
  - EN: Come with me.
  - → fnA_6
- `fnA_6` **(나레이션)** (neutral): (빅그베가 잠시 머뭇거린다.)
  - EN: (Big Green Bear hesitates.)
  - → fnA_7
- `fnA_7` **빅그베** (neutral): 잠깐만.
  - EN: Just a second.
  - → fnA_8
- `fnA_8` **(나레이션)** (neutral): (그가 주머니에서 오른손 장갑을 꺼낸다.)
  - EN: (He takes the right-hand glove from his pocket.)
  - → fnA_9
- `fnA_9` **니니** (thinking): 이건 뭐예요?
  - EN: What's that?
  - → fnA_10
- `fnA_10` **빅그베** (neutral): 편지랑 같이 있었어.
  - EN: It was with the letter.
  - → fnA_11
- `fnA_11` **니니** (thinking): 어디서요?
  - EN: Where?
  - → fnA_12
- `fnA_12` **(나레이션)** (neutral): (빅그베가 니니를 바라본다.)
  - EN: (Big Green Bear looks at Nini.)
  - → fnA_13
- `fnA_13` **빅그베** (neutral): 그 얘기도 해야겠지.
  - EN: I suppose I should tell you that, too.
  - fx theend1

### fnB

- `fnB` **니니** (thinking): 아저씨?
  - EN: Mr. Bear?
  - → fnB_1
- `fnB_1` **빅그베** (worried): 미안. 무슨 얘기였지?
  - EN: Sorry. What were we talking about?
  - → fnB_2
- `fnB_2` **니니** (surprised): 기록이요!
  - EN: Records!
  - → fnB_3
- `fnB_3` **빅그베** (neutral): 아, 맞다.
  - EN: Right.
  - → fnB_4
- `fnB_4` **니니** (neutral): 아저씨는 에드워드 아저씨처럼 좋은 사람이에요.
  - EN: You're a good person, just like Edward.
  - → fnB_5
- `fnB_5` **빅그베** (thinking): 그렇게 생각해?
  - EN: You think so?
  - → fnB_6
- `fnB_6` **니니** (surprised): 당연하죠!
  - EN: Of course!
  - → fnB_7
- `fnB_7` **(나레이션)** (neutral): (니니가 웃는다.)
  - EN: (Nini smiles.)
  - → fnB_8
- `fnB_8` **니니** (surprised): 안녕하세요! 안녕하세요!
  - EN: Hello! Hello!
  - → fnB_9
- `fnB_9` **빅그베** (surprised): 안녕! 안녕!
  - EN: Hello! Hello!
  - → fnB_10
- `fnB_10` **(나레이션)** (neutral): (니니가 떠난다. 빅그베가 집으로 돌아온다.)
  - EN: (Nini walks away. Big Green Bear returns home.)
  - fx walk · → fnB_11
- `fnB_11` **(나레이션)** (neutral): (그는 액자 뒤에 편지와 장갑을 넣는다. 장갑을 밀어 넣다가 무언가 손끝에 걸린다.)
  - EN: (He hides the letter and glove behind the picture frame. Something catches against his fingertips.)
  - → fnB_12
- `fnB_12` **(나레이션)** (neutral): (작은 황동 단추다. 단추에는 작은 글씨가 새겨져 있다.)
  - EN: (A small brass button. Tiny letters are engraved on it.)
  - 증거+ button · → fnB_13
- `fnB_13` **(나레이션)** (neutral): E. BELL
  - EN: E. BELL
  - → fnB_14
- `fnB_14` **(나레이션)** (neutral): (빅그베가 단추를 손바닥에 올려놓는다.)
  - EN: (Big Green Bear rests the button in his palm.)
  - → fnB_15
- `fnB_15` **(나레이션)** (neutral): (짧은 회상. 눈 덮인 바닥. 에드워드의 손이 빅그베의 노란 목도리를 붙잡는다.)
  - EN: (Brief flashback. Snow-covered ground. Edward's hand grips Big Green Bear's yellow scarf.)
  - → fnB_16
- `fnB_16` **에드워드** (thinking): 잠깐...
  - EN: Wait...
  - → fnB_17
- `fnB_17` **(나레이션)** (neutral): (현재. 빅그베가 단추를 편지 사이에 끼운다. 액자를 다시 세운다.)
  - EN: (Present. Big Green Bear slips the button between the folded pages and puts the picture frame back.)
  - fx theend2

### p_f0

- `p_f0` **빅그베** (thinking): 그분은 항상 내 편이었는데.
  - EN: He was always on my side.
  - 증거+ photo_home · → p_f1

### p_f1

- `p_f1` **빅그베** (worried): 일단 그대로 두자.
  - EN: I'll leave it for now.
  - ⚑ pro.frame

### pf_h

- `pf_h` **(나레이션)** (neutral): (선반에 기대어 선 낡은 사진. 목도리를 두른 두 아기 곰이 나란히 서 있다.)
  - EN: (A worn photograph leans on the shelf. Two small cubs stand close together in scarves.)
  - → pf_h_1
- `pf_h_1` **빅그베** (neutral): 그분은 항상 내 편이었는데.
  - EN: He was always on my side.
  - 증거+ photo_home

### p_f9

- `p_f9` **빅그베** (neutral): 지금은 그럴 때가 아니야.
  - EN: Now's not the time.

### p_n0

- `p_n0` **니니** (worried): 빅그베 아저씨! 안에 계세요?
  - EN: Big Green Bear! Are you in there?
  - → p_n0a

### p_n0a

- `p_n0a` **빅그베** (neutral): 니니? 무슨 일이야?
  - EN: Nini? What's wrong?
  - → p_n0b

### p_n0b

- `p_n0b` **니니** (worried): 에드워드 아저씨가 돌아가셨어요. 다들 시계탑 앞에 모여 있어요.
  - EN: Edward passed away. Everyone's gathered outside the clock tower.
  - → p_n0c

### p_n0c

- `p_n0c` **니니** (worried): 아저씨? 듣고 계세요?
  - EN: Mr. Bear? Are you listening?
  - → p_n1

### p_n1

- `p_n1` **빅그베** (worried): 응. 곧 나갈게.
  - EN: Yeah. I'll be right out.
  - → p_n4

### p_n4

- `p_n4` **니니** (worried): 경찰관 아저씨도 눈 때문에 못 오신대요. 얼른 와 주세요!
  - EN: The constable can't get here because of the snow. Please hurry!
  - → p_n5

### p_n5

- `p_n5` **니니** (neutral): 아, 맞다! 어제 시계탑 뒤에서 아저씨한테 손 흔들었는데 못 보셨어요?
  - EN: Oh, right! I waved at you behind the clock tower yesterday. Didn't you see me?
  - ⚑ pro.greet · 증거+ greet · → p_n6

### p_n6

- `p_n6` **빅그베** (neutral): 어제? 미안. 못 봤나 봐.
  - EN: Yesterday? Sorry. I must've missed you.
  - → p_n9

### p_n9

- `p_n9` **니니** (neutral): 그럼 어제 못 한 인사까지 오늘 두 번 할래요!
  - EN: Then I'll say hello twice today, to make up for yesterday!
  - → p_n9a

### p_n9a

- `p_n9a` **니니** (neutral): 안녕하세요! 안녕하세요!
  - EN: Hello! Hello!
  - → p_n10

### p_n10

- `p_n10` **빅그베** (neutral): 하하, 안녕! 안녕!
  - EN: Haha, hello! Hello!
  - ⚑ pro.done

### tm0

- `tm0` **토미** (): 안녕하십니까, 빅그린베어 씨. 시계탑에 다녀오셨습니까?
  - EN: Good evening, Mr. Big Green Bear. Have you been to the clock tower?
  - → tm0a

### tm0a

- `tm0a` **빅그베** (neutral): 네. 어젯밤 순찰하셨다고 들었습니다.
  - EN: Yes. I heard you were on patrol last night.
  - → tm0b

### tm0b

- `tm0b` **토미** (): 그렇습니다. 늘 그렇듯 다리와 뒷길을 돌았습니다. 기록도 남겨 두었습니다.
  - EN: That's correct. I patrolled the bridge and back lane as usual. I kept a record, too.
  - 선택 → `tm1a`: 어젯밤에 특이한 건 없었습니까? / Was there anything unusual last night?
  - 선택 → `tm3a`: 근무를 시작할 때는요? / What about when you started your shift?
  - 선택 → `tm2a`: 시계탑에는 가 보셨습니까? / Did you go to the clock tower?
  - 선택 → `tm4a`: 감사합니다. / Thank you.
  - ⚑ tm.met

### tm9

- `tm9` **토미** (): 더 필요하신 것이 있습니까?
  - EN: Is there anything more you need?
  - 선택 → `tm1a`: 어젯밤에 특이한 건 없었습니까? / Was there anything unusual last night?
  - 선택 → `tm3a`: 근무를 시작할 때는요? / What about when you started your shift?
  - 선택 → `tm2a`: 시계탑에는 가 보셨습니까? / Did you go to the clock tower?
  - 선택 → `tm4a`: 감사합니다. / Thank you.

### tm1a

- `tm1a` **토미** (): 11시 35분쯤 랜턴 다리를 급히 건너는 분을 봤습니다.
  - EN: Around 11:35, I saw someone hurrying across Lantern Bridge.
  - → tm1b

### tm1b

- `tm1b` **빅그베** (thinking): 기억나는 게 있으세요?
  - EN: Do you remember anything about them?
  - → tm1c

### tm1c

- `tm1c` **토미** (): 겨자색 목도리를 하고 있었습니다. 처음엔 빅그린베어 씨인 줄 알았습니다.
  - EN: They were wearing a mustard-colored scarf. At first, I thought it was you.
  - → tm1d

### tm1d

- `tm1d` **빅그베** (surprised): 저라고요?
  - EN: Me?
  - → tm1e

### tm1e

- `tm1e` **토미** (): 뒷모습만 봤습니다. 일지에도 일단 그렇게 적어 두었지만, 확실한 건 아닙니다.
  - EN: I only saw them from behind. That's what I wrote in my log, but I can't say for certain.
  - ⚑ tm.stmt · 증거+ stmt_tm

### tm3a

- `tm3a` **토미** (): 오후 5시에 순찰을 시작했습니다. 그때 뒷길에서 자루를 들고 가는 분을 봤습니다.
  - EN: I started my patrol at 5:00 p.m. That's when I saw someone carrying a sack down the back lane.
  - → tm3b

### tm3b

- `tm3b` **빅그베** (thinking): 어디로 가던가요?
  - EN: Which way were they going?
  - → tm3c

### tm3c

- `tm3c` **토미** (): 낡은 방앗간 쪽이었습니다. 모자를 깊이 눌러쓰고 있어서 얼굴은 보지 못했습니다.
  - EN: Toward the Old Mill. Their hat was pulled down low, so I couldn't see their face.
  - ⚑ tm.pm

### tm2a

- `tm2a` **토미** (): 아니요. 제 순찰 구역은 다리와 뒷길뿐입니다.
  - EN: No, sir. My patrol only covers the bridge and the back lane.
  - → tm2b

### tm2b

- `tm2b` **토미** (): 종소리는 매일 듣습니다만, 탑 안에 들어갈 일은 없습니다.
  - EN: I hear the bells every day, but I have no reason to go inside the tower.

### tm4a

- `tm4a` **토미** (): 순찰 일지는 저기 가로등 기둥에 걸려 있습니다. 필요하시면 확인하십시오.
  - EN: My patrol log is hanging on that lamppost. You're welcome to check it.

### h0

- `h0` **헤이즐** (): 어머, 빅그린베어 씨. 오셨네요. 따뜻한 차라도 한 잔 드릴까요?
  - EN: Oh, Mr. Big Green Bear. You're here. Would you like some tea?
  - ⚑ hz.met · → h0a

### h0a

- `h0a` **빅그베** (neutral): 괜찮습니다, 헤이즐 씨. 잠깐 여쭤볼 게 있어서요.
  - EN: No, thank you, Hazel. I just have a few questions.
  - → h0b

### h0b

- `h0b` **헤이즐** (): 에드워드 씨 일 때문이죠? 정말 마음이 아파요.
  - EN: About Edward, I suppose? It's just heartbreaking.
  - 선택 → `h1a`: 어젯밤 제가 몇 시에 나갔죠? / What time did I leave last night?
  - 선택 → `h2a`: 에드워드 씨와는 가까우셨나요? / Were you close to Edward?
  - 선택 → `h3a`: 어제 오후에 기억나는 일이 있나요? / Do you remember anything from yesterday afternoon?
  - 선택 → `h4a`: 감사합니다. / Thank you.

### h9

- `h9` **헤이즐** (): 더 궁금한 게 있으세요?
  - EN: Is there anything else you'd like to ask?
  - 선택 → `h1a`: 어젯밤 제가 몇 시에 나갔죠? / What time did I leave last night?
  - 선택 → `h2a`: 에드워드 씨와는 가까우셨나요? / Were you close to Edward?
  - 선택 → `h3a`: 어제 오후에 기억나는 일이 있나요? / Do you remember anything from yesterday afternoon?
  - 선택 → `h4a`: 감사합니다. / Thank you.

### h1a

- `h1a` **헤이즐** (): 11시 42분에 계산하셨어요. 영수증에 시각도 적어 뒀답니다.
  - EN: You paid at 11:42. I wrote the time on the receipt.
  - ⚑ hz.stmt · 증거+ stmt_hz · 메모+ hz · → h1b

### h1b

- `h1b` **빅그베** (neutral): 영수증을 볼 수 있을까요?
  - EN: Could I see it?
  - → h1c

### h1c

- `h1c` **헤이즐** (): 물론이죠. 여기 있어요.
  - EN: Certainly. Here you go.
  - ⚑ hz.done · 증거+ receipt · → h1d

### h1d

- `h1d` **헤이즐** (): 그런데 어젯밤엔 평소보다 오래 계셨어요. 누군가를 기다리시는 줄 알았죠.
  - EN: You stayed longer than usual last night. I thought you were waiting for someone.
  - → h1e

### h1e

- `h1e` **빅그베** (thinking): 그렇게 보였나요?
  - EN: Did it seem that way?
  - → h1f

### h1f

- `h1f` **헤이즐** (): 네. 자꾸 문 쪽을 보셨거든요. 제가 괜한 생각을 했을 수도 있지만요.
  - EN: Yes. You kept looking toward the door. Perhaps I was reading too much into it.

### h2a

- `h2a` **헤이즐** (): 좋은 분이셨죠. 지난겨울엔 카페 지붕을 고칠 돈도 빌려주셨어요.
  - EN: He was a good man. He even lent me money to fix the café roof last winter.
  - → h2b

### h2b

- `h2b` **헤이즐** (): 아직 절반밖에 못 갚았어요. 이제 누구에게 갚아야 할지도 모르겠네요.
  - EN: I've only paid back half. I don't even know who I'm supposed to repay now.
  - ⚑ hz.owed

### h3a

- `h3a` **헤이즐** (): 어제 오후에도 저 창가에 앉아 계셨잖아요. 기억 안 나세요?
  - EN: You were sitting by that window yesterday afternoon. Don't you remember?
  - → h3b

### h3b

- `h3b` **빅그베** (neutral): 네. 차를 마셨죠.
  - EN: Yes. I had some tea.
  - → h3c

### h3c

- `h3c` **헤이즐** (): 4시 55분쯤 차를 더 따라 드렸어요. 신문을 읽고 계셨고요.
  - EN: I brought you a refill around 4:55. You were reading the paper.
  - ⚑ hz.pm · 증거+ tab_pm · → h3d

### h3d

- `h3d` **헤이즐** (): 참, 그 전에 뒷문으로 빵을 사 간 손님이 한 분 있었어요.
  - EN: Come to think of it, someone bought bread at the back door earlier.
  - → h3e

### h3e

- `h3e` **빅그베** (thinking): 몇 시쯤이었나요?
  - EN: Around what time?
  - → h3f

### h3f

- `h3f` **헤이즐** (): 4시 40분쯤이요. 모자를 푹 눌러쓰고 말도 거의 없었어요.
  - EN: Around 4:40. They had their hat pulled low and barely said a word.
  - → h3g

### h3g

- `h3g` **빅그베** (thinking): 누군지는 모르시고요?
  - EN: You didn't recognize them?
  - → h3h

### h3h

- `h3h` **헤이즐** (): 네. 굳이 묻지도 않았어요. 빵만 사서 가셨으니까요.
  - EN: No. I didn't ask, either. They just bought some bread and left.
  - ⚑ hz.bread

### h4a

- `h4a` **헤이즐** (): 언제든 들르세요. 따뜻한 차는 늘 준비되어 있으니까요.
  - EN: Come by anytime. There's always a warm cup of tea waiting for you.

### ld

- `ld` **빅그베** (thinking): 니니가 공책에 적었던 장부인가?
  - EN: Is this the ledger Nini mentioned in her notebook?
  - → ld1

### ld1

- `ld1` **빅그베** (neutral): (표지에는 오래된 금속 잠금장치가 달려 있다.) 잠겨 있어.
  - EN: (An old metal clasp secures the cover.) It's locked.
  - → ld2

### ld2

- `ld2` **빅그베** (thinking): (장부를 뒤집는다. 뒷표지 안쪽에 종이 한 장이 끼어 있다.) 이건 뭐지?
  - EN: (He turns the ledger over. A sheet of paper is tucked inside the back cover.) What's this?
  - → ld3

### ld3

- `ld3` **빅그베** (thinking): 23년 전 기록이네.
  - EN: It's from 23 years ago.
  - → ld4

### ld4

- `ld4` **빅그베** (thinking): '별도 보관'이라.
  - EN: "Kept separately," huh.
  - ⚑ ar.ledger · 증거+ bellrec

### ar_re

- `ar_re` **빅그베** (thinking): 편지 두 통, 잠긴 장부, 그리고 23년 전의 기록.
  - EN: Two letters, a locked ledger, and a record from 23 years ago.
  - → ar_re1

### ar_re1

- `ar_re1` **빅그베** (thinking): 에드워드 아저씨는 왜 이걸 한곳에 모아 두셨을까.
  - EN: Why did Edward keep all of these together?
  - → ar_re2

### ar_re2

- `ar_re2` **빅그베** (neutral): (서랍 안쪽을 조사한다. 나무판 사이에 작은 사진 한 장이 끼어 있다.) 사진이네.
  - EN: (He checks the back of the drawer. A small photograph is wedged between the wooden panels.) A photograph.
  - → ar_re3

### ar_re3

- `ar_re3` **빅그베** (thinking): (사진에는 어린 곰 두 마리가 나란히 서 있다. 두 곰은 목도리를 하고 있다.) ...
  - EN: (It shows two young bears standing side by side, both wearing scarves.) ...
  - → ar_re4

### ar_re4

- `ar_re4` **빅그베** (thinking): (뒷면에는 날짜만 적혀 있다.) 23년 전.
  - EN: (Only a date is written on the back.) Twenty-three years ago.
  - ⚑ ar.photo · 증거+ photo2

### p_w

- `p_w` **빅그베** (neutral): 눈이 꽤 쌓였네. 발자국도 금방 지워지겠어.
  - EN: The snow's really piling up. Footprints won't last long out there.

### p_b

- `p_b` **빅그베** (neutral): 오래된 동화책들이야. 몇 번이나 읽었는지 모르겠네.
  - EN: My old storybooks. I've lost count of how many times I've read them.

### p_s

- `p_s` **빅그베** (neutral): 불이 거의 다 꺼졌네.
  - EN: The fire's almost out.

### p_k

- `p_k` **빅그베** (worried): 주전자도 다 식었네. 지금은 차 마실 기분이 아니야.
  - EN: The kettle's gone cold. I'm not in the mood for tea.

### m_no

- `m_no` **빅그베** (thinking): 다른 곰에 대해 먼저 알아보자.
  - EN: I should look into the other bear first.

### pf_end

- `pf_end` **빅그베** (thinking): 그분은 늘 나를 챙겨 주셨어.
  - EN: He always looked out for me.
  - → ci6_0

### ci6

- `ci6_0` **빅그베** (thinking): 매듭, 오른손, 찢어진 귀. 다 봤어. 이제 모르는 척할 수 없어.
  - EN: The knots, the right hand, the torn ear. I saw all of it, and I cannot unsee it.
  - → ci6_1
- `ci6_1` **빅그베** (neutral): 사람 탭의 신원 보드에서 단서를 맞춰 보자. 그다음엔 낡은 방앗간의 Green을 만나야 해.
  - EN: Compare the clues on the Identity Board under People. After that, I have to see Green at the Old Mill.

### c6_comp

- `c6_comp` **빅그베** (thinking): 두 장의 사진은 말해 줄 수 있는 건 다 말해 줬어.
  - EN: The two photographs have told me everything they can.

### c6_wait

- `c6_wait` **빅그베** (thinking): Green은 나를 보기만 하고 아무 말도 하지 않는다. 먼저 누가 누구인지 정리해야 해. 신원 보드는 사람 탭에 있어.
  - EN: Green watches me and says nothing. I should work out who is who first. The Identity Board is under People.

### g6

- `g6_0` **빅그베** (neutral): Green. 탑 뒷문에서 이 방앗간까지 네 발자국이 이어져 있어. 거기서 무슨 일이 있었는지 말해 줘.
  - EN: Green. Your boot prints lead from the tower's back door to this mill. Tell me what happened up there.
  - → g6_1
- `g6_1` **그린** (neutral): 에드워드는 자정에 진짜 기록을 읽겠다고 했어. 나는 보여 달라고 했고, 그는 거절했지.
  - EN: Edward said he would read the true record at midnight. I demanded to see it. He refused.
  - → g6_2
- `g6_2` **그린** (neutral): 열린 해치 옆에서 몸싸움이 났어. 그러다 에드워드가 그 아래로 사라졌지.
  - EN: We struggled beside the open hatch. Then he was gone through it.
  - → g6_3
- `g6_3` **그린** (neutral): 내려다봤어. 움직이지 않더군. 죽었다고 생각했어. 그래서 달아났지. 뒷문으로 나가 눈길을 걸어 여기까지.
  - EN: I looked down. He did not move. I thought he was dead. So I ran, out the back door and through the snow, to here.
  - ⚑ gr.admit · 증거+ acct_gr · → g6_4
- `g6_4` **빅그베** (worried): 그러니까 Green은 거기 있었고, 에드워드는 Green 때문에 떨어졌어.
  - EN: So Green was there, and Edward fell because of him.

### g6_h

- `g6_h` **빅그베** (thinking): Green은 아는 대로 말했어. 그날 밤 에드워드를 살핀 건 치료사야. 무엇을 찾았는지 물어봐야 해.
  - EN: Green has told me what he knows. The Healer examined Edward that night. I should ask what was found.

### g6_t0

- `g6_t0` **빅그베** (neutral): 치료사가 그러더라. 에드워드는 추락한 뒤에도 최소 15분은 살아 있었대.
  - EN: The Healer says Edward was alive after the fall, for at least 15 minutes.
  - → g6_t1

### g6_t1

- `g6_t1` **그린** (worried): 살아 있었다고? 그럼 누가 곁에 있었지?
  - EN: Alive? Then who was with him?
  - ⚑ c6.turn · 메모+ n_turn · → g6_t2

### g6_t2

- `g6_t2` **빅그베** (thinking): 올리버가 오기 전에 에드워드 곁에 있던 사람은 누구지?
  - EN: Who was with Edward before Oliver came?

### g6

- `g6_9` **그린** (neutral): 누가 곁에 있었는지 알아내. 나는 여기 있을 테니.
  - EN: Find out who was with him. I will be here.

### hl0

- `hl0` **빅그베** (neutral): 실례합니다. 에드워드 일로 왔어요.
  - EN: Excuse me. I came about Edward.
  - → hl1

### hl1

- `hl1` **메이** (): 고관절과 골반이 부러졌고 갈비뼈도 여러 대 나갔습니다. 속에서 출혈도 있었습니다. 추위와 젖은 옷이 쇼크를 더 심하게 만들었습니다.
  - EN: A broken hip and pelvis, broken ribs, and bleeding inside. The cold and his wet clothes made the shock worse.
  - → hl2

### hl2

- `hl2` **메이** (): 추락한 뒤에도 최소 15분은 살아 있었습니다. 목소리가 쉬어 있었어요. 한동안 소리쳐 불렀다는 뜻입니다.
  - EN: He lived at least 15 minutes after the fall. His voice was hoarse. He had been calling out for some time.
  - → hl3

### hl3

- `hl3` **메이** (): 그 정도 추락이라면 살아남을 가능성도 있었습니다. 더 일찍 도움을 받았다면 나아졌을 수도 있고요. 하지만 살았을 거라고는 말할 수 없습니다. 아무도 말할 수 없습니다. 끝난 시각은 자정 5분 전에서 15분 뒤 사이로 짐작합니다. 추위 때문에 그 폭이 넓습니다.
  - EN: The fall was potentially survivable, and earlier help might have improved his chances. I cannot tell you he would have lived. No one can. My estimate for the end is between 11:55 and 12:15, and the cold makes that window wide.
  - 증거+ report · → hl4

### hl4

- `hl4` **메이** (): 그리고 이건 조끼 안에 있던 회중시계입니다. 유리는 갈라졌지만 한 번도 멈추지 않았습니다.
  - EN: And this was in his vest. His pocket watch. It never stopped running, though the glass is cracked.
  - ⚑ c6.hl · 증거+ watch

### hl9

- `hl9` **메이** (): 제가 찾은 건 그게 전부입니다. 더 드릴 수 있으면 좋았을 텐데요.
  - EN: That is all I found. I wish I had more to give you.

### ck6

- `ck6_0` **빅그베** (neutral): 올리버, 돌아왔을 때 보신 걸 다시 말씀해 주세요.
  - EN: Oliver, please tell me again what you saw when you came back.
  - → ck6_1
- `ck6_1` **올리버** (neutral): 당신은 에드워드 곁에 무릎을 꿇고 있었습니다. 외투 단추가 엇갈려 있었습니다. 무언가를 가린 것처럼요. 왼쪽 목도리 끝은 짧게 찢겨 있었고요.
  - EN: You were kneeling by Edward. Your coat was buttoned wrong, as if over something. The left tail of your scarf was torn short.
  - → ck6_2
- `ck6_2` **올리버** (neutral): 종이 울리자마자 최대한 빨리 왔다고 하셨습니다. 하지만 저는 돌아오는 길에 자정 5분 전에 손종 소리를 들었습니다.
  - EN: You told me you came as fast as you could, just as the bell rang. But I heard the handbell at 11:55, on my way back.
  - 증거+ stmt_ck2 · → ck6_3
- `ck6_3` **올리버** (worried): 그리고 에드워드의 주먹은 이미 쥐어져 있었습니다. 그 안에 노란 털실 한 가닥이 있었습니다.
  - EN: And Edward's fist was already closed. There was a strand of yellow wool in it.
  - 증거+ wool · → ck6_4
- `ck6_4` **빅그베** (worried): ...
  - EN: ...
- `ck6_9` **올리버** (neutral): 제가 본 건 그게 전부입니다.
  - EN: That is everything I saw.

### tm6

- `tm6_0` **토미** (): 일지를 다시 보겠습니다. 11시 46분, 광장에 두 번째 곰이 있었습니다. 느리고 서두르지 않았고 탑으로 향했습니다. 버팀벽 뒤에서 놓쳤습니다.
  - EN: My log again. Eleven forty-six, a second bear on the plaza, slow and unhurried, heading for the tower. I lost him behind the buttress.
  - → tm6_1
- `tm6_1` **토미** (): 11시 51분에는 "부르는 소리? 바람?"이라고 적었습니다. 바람 소리라고 생각했습니다. 저는 탑에 들어가지 않습니다.
  - EN: At 11:51 I wrote "calling? wind?" I took it for wind. I do not enter the tower.
  - 증거+ patrol2
- `tm6_9` **토미** (): 제 일지에는 그게 전부입니다.
  - EN: That is all my log says.

### h6

- `h6_0` **빅그베** (neutral): 헤이즐, 그날 밤 제가 어떻게 나갔는지 기억해요?
  - EN: Hazel, do you remember how I left that night?
  - → h6_1
- `h6_1` **헤이즐** (): 11시 42분에 나가셨죠. 문 앞에서 제가 직접 왼쪽 목도리 끝을 정리해 드렸어요. 멀쩡했어요.
  - EN: You left at 11:42. I straightened your left scarf tail at the door myself. It was whole.
  - → h6_2
- `h6_2` **빅그베** (thinking): 그럼 가게 문에서 시계탑까지 천천히 걸으면요?
  - EN: And from your door to the Clocktower, at an easy walk?
  - → h6_3
- `h6_3` **헤이즐** (): 직접 걸어 보고 세어 보세요. 저는 여기서 기다릴게요.
  - EN: Walk it yourself and count. I'll wait here.
  - → h6_4
- `h6_4` **빅그베** (thinking): (천천히 걸으며 센다. 카페 문 11시 42분. 광장 11시 46분. 탑 문 11시 48분.)
  - EN: (He walks it slowly, counting. Café door, 11:42. Plaza, 11:46. Tower door, 11:48.)
  - 증거+ walk · fx walk
- `h6_9` **헤이즐** (): 세어 보신 대로 6분이에요. 더 필요한 게 있으세요?
  - EN: Six minutes, like you counted. Is there anything else?

### p6_f0

- `p6_f0` **빅그베** (thinking): 액자를 뒤집는다. 놋쇠 단추 두 개가 뒷판을 누르고 있다. 그 뒤에 뭐가 있는지 나는 안다.
  - EN: I turn the frame over. Two brass buttons hold the backing. I know what is behind it.
  - → p6_f1

### p6_f1

- `p6_f1` **빅그베** (worried): 깊이 3센티미터쯤의 틈이다.
  - EN: A cavity, three centimeters deep.
  - 증거+ hide · → p6_f2

### p6_f2

- `p6_f2` **빅그베** (worried): 눌린 장갑 한 짝. 오른손용이다.
  - EN: One glove, flattened. A right-hand glove.
  - 증거+ glove · → p6_f3

### p6_f3

- `p6_f3` **빅그베** (worried): 세 번 접힌 편지, 에드워드의 글씨다. "G". 나는 읽지 않았다.
  - EN: A letter folded in thirds, in Edward's hand. "G." I never read it.
  - ⚑ c6.hid · 증거+ letter

### p6_f9

- `p6_f9` **빅그베** (worried): 뒤에 뭐가 있는지는 이미 봤어.
  - EN: I have seen what is behind it.

### c6_pit0

- `c6_pit0` **빅그베** (thinking): 아래에는 아직 새로운 게 없어.
  - EN: Nothing new down there yet.

### c6_n0

- `c6_n0` **니니** (worried): 아저씨. 그날 밤 12시 15분 전부터 자정 사이에 어디 계셨어요?
  - EN: Mr. Bear. Where were you between 11:45 and midnight, that night?
  - 선택 → `c6_n1`: 헤이즐의 카페에 있었어. 11시 42분 조금 전까지. / At Hazel's café, until a little before 11:42.
  - 선택 → `c6_n2`: 탑에 있었어. 내가 발견했을 때 에드워드는 살아 있었어. / At the tower. Edward was alive when I found him.
  - 선택 → `c6_n3`: 대답하고 싶지 않아. / I don't want to answer.

### c6_n1

- `c6_n1` **니니** (worried): 헤이즐도 그렇게 말해요. 그런데 그게 밤 전체는 아니잖아요.
  - EN: Hazel says that too. But that is not the whole night, is it?
  - ⚑ c6.fin

### c6_n2

- `c6_n2` **니니** (worried): ...아저씨가 곁에 있었군요.
  - EN: ...You were with him.
  - ⚑ c6.fin

### c6_n3

- `c6_n3` **니니** (neutral): 그럼 기다릴게요. 저는 어디에도 안 가요.
  - EN: Then I'll wait. I am not going anywhere.
  - ⚑ c6.fin

### ci7

- `ci7_0` **빅그베** (thinking): Green은 에드워드를 떨어뜨렸고, 나는 장갑을 숨기고 5분을 기다렸어. 우리는 저마다 누군가를 지키고 있었고, 아무도 그 값을 누가 치르는지는 묻지 않았어.
  - EN: Green fell on Edward, and I hid the glove and waited 5 minutes. We were each protecting someone, and nobody asked who was paying.
  - → ci7_1
- `ci7_1` **빅그베** (neutral): Green에게 먼저 사실대로 말해야 해. 그다음엔 에드워드가 남긴 걸 찾고, 마을에 무엇을 알릴지 정해야 해.
  - EN: I owe Green the truth first. Then I have to find what Edward left behind, and decide what the village will be told.

### g7

- `g7_0` **빅그베** (worried): Green. 올리버가 오기 전에 내가 에드워드 곁에 있었어. 살아 있었어.
  - EN: Green. I was with Edward before Oliver came. He was alive.
  - → g7_1
- `g7_1` **그린** (worried): 살아 있었다고. 나는 죽은 줄 알고 달아났는데.
  - EN: Alive. I ran because I thought he was dead.
  - → g7_2
- `g7_2` **빅그베** (worried): 난간 위에 있던 네 장갑이랑 편지를 내가 가져갔어. 사진 뒤에 숨겼어. 읽지는 않았어.
  - EN: I took your glove and your letter from the gallery. I hid them behind the photograph. I never read it.
  - → g7_3
- `g7_3` **그린** (neutral): 나를 위해 숨긴 거로군. 그래, 그랬겠지. 우리는 늘 서로에게 이래 왔어.
  - EN: You hid them for me. Of course you did. We have always done this to each other.
  - → g7_4
- `g7_4` **빅그베** (thinking): 왜 탑에 갔어, Green? 왜 그 사람이랑 싸웠어?
  - EN: Why did you go to the tower, Green? Why did you fight him?
  - → g7_5
- `g7_5` **그린** (neutral): 에드워드가 자정에 모두가 보는 앞에서 진짜 기록을 읽겠다고 했어. 이름도, 회의도, 전부.
  - EN: Edward told me he would read the true record at midnight, in front of everyone. The names, the council, all of it.
  - → g7_6
- `g7_6` **그린** (worried): 내가 이름을 되찾고 싶어서 그랬다고 생각해? 그 사람이 네 삶을 통째로 흔들어 놓았을 거야.
  - EN: You think I wanted the name back? He'd have taken your life apart.
  - → g7_7
- `g7_7` **그린** (neutral): 나는 그 사람을 막고 싶었을 뿐이야. 떨어뜨릴 생각은 없었어.
  - EN: I wanted to stop him. I did not mean for him to fall.
  - ⚑ c7.green · 증거+ motive · → g7_8
- `g7_8` **빅그베** (thinking): 에드워드의 마지막 말은 시계에 대한 거였어. 멈춘 그 시계가 아닐지도 몰라. 내가 이미 아는 것들을 다시 맞춰 보자.
  - EN: Edward's last words were about a clock. Not the one that stopped, maybe. I should look at what I already know.
- `g7_9` **그린** (neutral): 가서 그 사람이 남긴 걸 찾아. 나는 여기 있을게.
  - EN: Go and find what he left. I will be here.

### rec0

- `rec0` **빅그베** (thinking): 추 뒤에 좁은 상자가 있다. 안에는 접힌 장부와 에드워드의 글씨로 쓴 종이들이 있다.
  - EN: Behind the pendulum there is a narrow case. Inside, a folded register and pages in Edward's hand.
  - 증거+ record · → r0

### r0

- `r0` **에드워드 (적어 둔 목소리)** (): 나는 벨 의회의 서기이자 기록관인 에드워드 벨이다. 이 종이의 첫 이름은 내 것이고, 책임도 내가 가장 먼저 진다.
  - EN: My name is Edward Bell, Archivist and Clerk of the Bell Council. I am the first name on this page, and I am the first to blame.
  - → r1

### r1

- `r1` **에드워드 (적어 둔 목소리)** (): 23년 전, 아이의 목도리가 경보 종을 막았고 강이 뱃사공 한 사람을 데려갔다. 사흘째 밤, 시장과 종지기 어른, 그때의 치료사, 몰리, 그리고 나는 닫힌 문 뒤에 앉아 있었다.
  - EN: 23 years ago a child's scarf jammed the warning bell, and the river took a boatman. On the third night the Mayor, the Bell-warden, the Healer of that time, Molly and I sat behind a closed door.
  - → r2

### r2

- `r2` **에드워드 (적어 둔 목소리)** (): 마을은 종이 울리지 않은 일에 이름을 붙이길 원했다. 그 목도리가 누구 것인지는 나만 알았다. 몸이 약한 동생의 것이었고, 그 아이는 성벽 밖에서 살아남지 못할 것이었다.
  - EN: The village wanted a name for the silence of the bell. Only I knew whose scarf it was: the younger boy's, the sick one, who would not survive being put outside the walls.
  - → r3

### r3

- `r3` **에드워드 (적어 둔 목소리)** (): 그래서 우리는 두 아이의 이름을 맞바꿨다. 군중이 영웅이라 부른 아이는 빅그린베어가 되었고, 다른 아이는 Green이 되었다. 장부는 내가 썼다. 내 손이 없으면 어떤 기록도 효력이 없다. 나는 거절할 수 있었지만 하지 않았다.
  - EN: So we exchanged their names. The cub the crowd called a hero became Big Green Bear, and the other became Green. I wrote the entries. No entry is valid without my hand. I could have refused, and I did not.
  - → r4

### r4

- `r4` **에드워드 (적어 둔 목소리)** (): 나는 큰아이에게 마을이 가라앉을 때까지만이라고 약속했다. 바로잡겠다고 약속했다. 23년 동안 그러지 않았다.
  - EN: I promised the elder it was only until the village calmed. I promised to put it right. I did not, for 23 years.
  - → r5

### r5

- `r5` **에드워드 (적어 둔 목소리)** (): 시장은 죄를 질 사람을 요구했다. 종지기 어른은 종지기들이 책임질까 두려워했다. 치료사는 동생이 추방되면 죽는다고 했다. 몰리는 "그럼 그대로 믿게 두자"고 했다. 나는 동의했고, 썼다. 이름은 여기에 적었고, 내 이름이 첫째다.
  - EN: The Mayor demanded a culprit. The Bell-warden feared for the wardens. The Healer said the younger would die in exile. Molly said, "Then let them go on believing it." I consented, and I wrote. Their names are here, and mine is first.
  - → r6

### r6

- `r6` **에드워드 (적어 둔 목소리)** (): 니니, 열쇠는 이제 네 것이다. 자정에 진짜 기록을 읽어라. 늙은 겁쟁이를 용서해라. E.
  - EN: Nini, the keys are yours. Read the true entry at midnight. Forgive an old coward. E.
  - ⚑ c7.rec · → rec1

### rec1

- `rec1` **빅그베** (worried): 그분은 우리 둘에게 먼저 이 탑에서 말하고, 자정에 모두 앞에서 읽으려 했어. 편지 두 통은 그래서 쓴 거였어.
  - EN: He wanted to tell us both first, here at the tower, and read it aloud at midnight. That is what the two letters were for.
  - → rec2

### rec2

- `rec2` **빅그베** (thinking): 오늘 밤 추모의 종이 울리기 전에 마을 사람들이 탑 광장에 모여. 이걸 들고 거기로 가야 해.
  - EN: Tonight, before the Remembrance Bell, the village gathers at the tower plaza. I have to bring this there.

### rec9

- `rec9` **빅그베** (thinking): 상자는 비어 있어. 에드워드가 남긴 건 이제 다 기록에 있어.
  - EN: The case is empty now. Everything Edward left is in the Record.

### c7_nocase

- `c7_nocase` **빅그베** (thinking): 여기서는 아직 더 찾을 게 없어.
  - EN: There is nothing more to find here yet.

### acc_open

- `acc_open` **니니** (worried): 모두 모였어요. 에드워드 아저씨의 기록에 쓰인 대로이지만, 마을은 아저씨가 어떻게 아는지 알고 싶어 할 거예요. 보여 주세요, 아저씨.
  - EN: Everyone is here. Edward's Record says what it says, but the village will want to know how you know. Show us, Mr. Bear.

### acc_q1

- `acc_q1` **니니** (neutral): 먼저요. 누가 에드워드 아저씨를 떨어뜨렸나요? 무엇이 증명하는지 보여 주세요.
  - EN: First. Who caused Edward's fall? Show us what proves it.

### acc_q2

- `acc_q2` **니니** (neutral): 올리버 씨가 오기 전에 누가 에드워드 아저씨 곁에 있었나요? 보여 주세요.
  - EN: Who was with Edward before Oliver arrived? Show us.

### acc_q3

- `acc_q3` **니니** (neutral): 탑에 장갑도 편지도 없었던 건 왜인가요?
  - EN: Why were there no glove and no letter at the tower?

### acc_q4

- `acc_q4` **니니** (worried): 종이 울리기 전까지 에드워드 아저씨는 얼마나 혼자였나요?
  - EN: How long was Edward alone before the bell?

### acc_q5

- `acc_q5` **니니** (worried): 그리고 이 모든 일은 왜 시작됐나요? 장부에 무슨 문제가 있나요?
  - EN: And why did any of this begin? What is wrong with the register?

### acc_r1a

- `acc_r1a` **니니** (worried): 그럼 Green 씨가 탑에 있었군요.
  - EN: Then Green was at the tower.
  - → acc_r1b

### acc_r1b

- `acc_r1b` **그린** (neutral): 있었어. 떨어뜨린 건 나야. 죽은 줄 알고 달아났어.
  - EN: I was. I caused the fall. I thought he was dead, and I ran.
  - ⚑ c7.p1

### acc_r2a

- `acc_r2a` **올리버** (worried): 제가 왔을 때 당신이 그의 곁에 무릎을 꿇고 있었습니다. 그의 주먹에는 이미 노란 털실이 쥐어져 있었어요.
  - EN: I found you kneeling by him, Mr. Bear, with yellow wool already in his fist.
  - → acc_r2b

### acc_r2b

- `acc_r2b` **빅그베** (worried): 나였어요. 그는 살아 있었고, 내가 곁에 있었어요.
  - EN: It was me. He was alive, and I was with him.
  - ⚑ c7.p2

### acc_r3a

- `acc_r3a` **빅그베** (worried): 내가 가져갔어요. Green의 장갑과 에드워드의 편지를요. 집의 사진 뒤에 숨겼어요.
  - EN: I took them. Green's glove and Edward's letter. I hid them behind the photograph at home.
  - ⚑ c7.p3

### acc_r4a

- `acc_r4a` **토미** (): 11시 51분에 "부르는 소리? 바람?"이라고 적었습니다. 바람 소리라고 생각했습니다.
  - EN: At 11:51 I wrote "calling? wind?" I took it for wind.
  - → acc_r4b

### acc_r4b

- `acc_r4b` **빅그베** (worried): 5분쯤이요. 11시 55분에 손종을 울렸어요.
  - EN: About 5 minutes. I rang the handbell at 11:55.
  - → acc_r4c

### acc_r4c

- `acc_r4c` **올리버** (neutral): 치료사는 5분이 무언가를 바꿨을지 아무도 말할 수 없다고 합니다. 아무도 알 수 없는 일을 적지는 않겠습니다.
  - EN: The Healer says no one can tell whether 5 minutes would have changed anything. We will not write what no one can know.
  - ⚑ c7.p4

### acc_r5a

- `acc_r5a` **니니** (worried): 에드워드 아저씨는 회의가 두 아이의 이름을 맞바꿨고, 자신이 그걸 적었다고 써 놓았어요.
  - EN: Edward writes that the council exchanged the twins' names, and that he wrote it down.
  - → acc_r5b

### acc_r5b

- `acc_r5b` **몰리** (): 내가 말했어. "그럼 그대로 믿게 두자"고. 23년 동안 입을 다물고 있었지.
  - EN: I said it. "Then let them go on believing it." I have kept quiet for 23 years.
  - ⚑ c7.p5

### cc0

- `cc0` **니니** (worried): 이제 기록이에요. 아저씨, 무엇을 적을까요?
  - EN: Now the Record. Mr. Bear, what goes into it?
  - 선택 → `e1_go`: 전부 적어 줘. 우리가 각자 한 일과 이름이 바뀐 일까지. / Everything. What each of us did, and the swap.
  - 선택 → `e2_0`: 사고로 적어 줘. / Record it as an accident.
  - 선택 → `e3_0`: Green이 했어. Green 혼자. / Green did it. Only Green.
  - 선택 → `e4_0`: 태워 버려. / Burn it.

### e1_go

- `e1_go` **빅그베** (neutral): 전부 기록에 남기고 싶어.
  - EN: I want all of it in the Record.
  - fx e1check · → e1_0

### e1_no

- `e1_no` **니니** (worried): 보여 줄 수 없는 건 적을 수 없어요. 아직 보여 주지 못한 게 있어요. 사건 파일을 다시 살펴봐요.
  - EN: We cannot write what we cannot show. There is still something we have not shown. Look through the Case File again.

### e1

- `e1_0` **빅그베** (worried): 11시 50분에 살아 있는 에드워드를 발견했어요. 장갑과 편지를 숨겼고, 종을 울리기까지 5분을 기다렸어요.
  - EN: I found Edward alive at 11:50. I hid the glove and the letter, and I waited 5 minutes before I rang the bell.
  - → e1_1
- `e1_1` **그린** (neutral): 떨어뜨린 건 나야. 죽은 줄 알고 달아났어.
  - EN: I caused the fall. I believed he was dead, and I ran.
  - → e1_2
- `e1_2` **니니** (worried): 이름은 23년 전에 바뀌었어요. 제가 원래대로 되돌려 적을게요.
  - EN: The names were exchanged 23 years ago. I will write them back as they were.
  - → e1_3
- `e1_3` **니니** (neutral): 기록에는 두 분이 각자 한 일을 적을 거예요. 그리고 11시 50분에 도움이 있었다면 살았을지는 아무도 알 수 없다는 것도 적을 거예요.
  - EN: The Record will say what each of you did. It will also say that no one can know whether help at 11:50 would have saved him.
  - fx end1

### e2

- `e2_0` **빅그베** (neutral): 사고로 적어 줘. 그분은 종을 지킨 사람으로 기억되게 해 줘.
  - EN: Record it as an accident. Let him be remembered as the man who kept the bell.
  - → e2_1
- `e2_1` **니니** (worried): ...아저씨가 그렇게 원하신다면요.
  - EN: ...If that is what you ask, Mr. Bear.
  - fx end2

### e3

- `e3_0` **빅그베** (worried): Green이 했어. 그의 이름만 적어 줘.
  - EN: Green did it. Write his name, and only his.
  - → e3_1
- `e3_1` **그린** (neutral): ...그렇군. 그럼 마을이 늘 말하던 그대로네.
  - EN: ...I see. Then it is as the village always said.
  - fx end3

### e4

- `e4_0` **빅그베** (worried): 태워 버려. 전부.
  - EN: Burn it. All of it.
  - → e4_1
- `e4_1` **니니** (worried): ...아저씨.
  - EN: ...Mr. Bear.
  - fx end4

### f4no

- `f4no` **형** (neutral): 동생 목도리부터 봐 줘야겠어.
  - EN: I should deal with my brother's scarf first.

### ce6

- `ce6_0` **빅그베** (thinking): 11시 50분에 에드워드를 찾았을 때 그는 살아 있었어. 나는 장갑과 편지를 숨겼고, 종은 5분 뒤에 울렸어.
  - EN: When I found Edward at 11:50, he was alive. I hid the glove and the letter, and the bell rang 5 minutes later.
  - → ce6_1
- `ce6_1` **빅그베** (worried): 도움이 있었다면 살았을지는 아무도 말할 수 없어. 하지만 내가 한 일은 내가 알아.
  - EN: No one can say whether help would have saved him. But I know what I did.

### ce7_1

- `ce7_1_0` **빅그베** (thinking): 다 적혔어. 에드워드의 이름, 내 이름, Green의 이름도 제자리에. 되돌릴 수 있는 건 없어.
  - EN: It is all written down: Edward's name, mine, Green's, each in its place. Nothing can be undone.
  - → ce7_1_1
- `ce7_1_1` **빅그베** (neutral): 그래도 이제 사실은 남아 있어.
  - EN: But now the truth stays with us.

### ce7_2

- `ce7_2_0` **빅그베** (thinking): 사고로 적혔어. 마을은 조용해졌고, 나는 여전히 영웅이야.
  - EN: It is recorded as an accident. The village is quiet, and I am still the hero.
  - → ce7_2_1
- `ce7_2_1` **빅그베** (worried): 사진은 뒤집어 보지 않은 채 선반에 기대어 있어.
  - EN: The photograph still leans on the shelf, unturned.

### ce7_3

- `ce7_3_0` **빅그베** (worried): 장부에는 Green의 이름만 남았어. 그가 끌려가는 걸 보며 내 손이 목도리 매듭을 더듬었어.
  - EN: Only Green's name is left on the page. I watched him go, and my hand found the knot of my scarf.

### ce7_4

- `ce7_4_0` **빅그베** (worried): 종이는 재가 됐어. 이름은 바뀐 채 남고, 진실은 사라졌어.
  - EN: The page turned to ash. The names stay swapped, and the truth is gone.

## 메모 (NOTES)

- `glove`: 그린에게는 왼손 장갑 한 짝뿐이다. 오른쪽은 어젯밤에 잃어버렸다고 한다.
  - EN: Green has only a left glove. He says he lost the right one last night.
- `regret`: 에드워드는 몰리에게 오래된 잘못을 이제 와서 바로잡는 것이 무슨 소용이냐고 물었다. 몰리는 늦었다고 해서 하지 말아야 할 이유는 없다고 답했다.
  - EN: Edward asked Molly whether there was any point in making up for an old wrong. She told him being late was no reason not to try.
- `family`: 오래전 에드워드의 부인은 많이 아팠다. 에드워드는 치료비 때문에 기록관 일을 계속했을 것이다.
  - EN: Edward's wife was gravely ill years ago. He kept working at the Archive, probably to pay for her treatment.
- `t1`: 에드워드를 가장 먼저 발견한 사람은 새벽 순찰 중이던 토미다.
  - EN: Tommy was the first to find Edward, during his early-morning patrol.
- `snowtrack`: 토미가 에드워드를 발견했을 때는 눈이 발자국을 덮은 뒤였다. 시계탑 안에는 뭔가 남아 있을지도 모른다.
  - EN: Snow covered the footprints before Tommy found Edward. Something may remain inside the tower.
- `midbell`: 에드워드는 자정 종을 확인하러 온다고 했지만 종은 울리지 않았다. 올리버가 기억하는 한 이런 적은 없었다.
  - EN: Edward planned to check the midnight bell, but the bell never rang. Oliver knows of no earlier time that happened.
- `twopen`: 올리버가 시계탑 안을 살펴봐도 좋다고 했다.
  - EN: Oliver let BGB look inside the clock tower.
- `m5`: 기억: 아이가 동생을 끌어낼 때 떨어진 들보가 왼쪽 귀를 찢는다.
  - EN: Memory: a falling beam tears the child's left ear while he drags his brother free.
- `m5b`: 기억: 아이가 비상 손종을 울린다. 언덕 위 창문들에 불이 켜진다. 아무도 그를 보지 못했다.
  - EN: Memory: the child rings the emergency handbell. Up the hill, windows light up. Nobody sees him do it.
- `m6`: 기억: 에드워드는 망설이다가 수정된 기록에 서명한다.
  - EN: Memory: Edward hesitates, then signs the altered record.
- `m7`: 기억: 마을 사람이 동생에게 형을 구했다며 칭찬한다. 형은 아무 말도 하지 않는다.
  - EN: Memory: a villager praises the younger twin for saving his brother. The older twin says nothing.
- `m1`: 기억: 동생은 왼손으로 목도리를 묶어 매듭이 왼쪽 어깨에 놓인다. 형은 오른쪽으로 묶는다.
  - EN: Memory: Little Green ties his scarf with his left hand, the knot on his left shoulder. Green ties his on the right.
- `m2`: 기억: 아이는 오른손으로 문을 연다.
  - EN: Memory: the child opens the gate with his right hand.
- `m3`: 기억: 홍수가 나기 전부터 경고 종 레버는 뻑뻑해서 거의 움직이지 않았다.
  - EN: Memory: the warning bell lever was stiff and barely moved, before the flood.
- `m4`: 기억: 동생의 목도리가 레버에 걸렸고, 형이 그를 구하다 다친다.
  - EN: Memory: Little Green's scarf catches in the lever, and the older brother is hurt freeing him.
- `nw`: 니니는 뒷길의 곰이 빅그베보다 걸음이 빨랐고, 어디 급하게 가는 것 같았다고 기억한다.
  - EN: Nini remembers that the bear on the back lane walked faster than BGB, as if he had somewhere to be.
- `mo`: 몰리 할머니는 마을이 Green 이야기를 하지 않는다고 했다. 그녀의 말로는 종이 울리지 않게 한 쪽은 Green이다.
  - EN: Molly says the village does not talk about Green. In her telling he is the one who let the bell fail.
- `gr`: Green은 낡은 방앗간에서 혼자 산다. 왼쪽 귀에 희미한 흉터가 있다. 주전자는 오른손으로 들고, 그 손은 추위 속에서 맨손이다.
  - EN: Green lives alone at the Old Mill. A faded scar marks his left ear. He lifts the kettle with his right hand, and that hand is bare in the cold.
- `hz`: 헤이즐: 빅그베는 12시 15분 전이 조금 못 되도록 카페에 있었다. 누군가를 기다리는 것 같았다.
  - EN: Hazel: BGB stayed at the café until a little before 11:45. He looked like he was waiting for someone.
- `hand`: 당신의 손: 당신은 물건을 왼손으로 든다.
  - EN: Your own hand: you hold things in your LEFT hand.
- `nini`: 니니가 에드워드를 마지막으로 본 것은 9시. 그는 편지 두 통을 봉하고 있었다.
  - EN: Nini last saw Edward at 9:00. He was sealing two letters.
- `bear`: 시계지기 올리버는 11시 40분쯤 계단을 오르는 곰을 보았다. 빅그베가 도착하기 전이다.
  - EN: Clockkeeper Oliver saw a bear on the stairs around 11:40, before BGB arrived.
- `watch`: 시계지기 올리버는 매일 아침 에드워드의 회중시계를 탑시계에 맞춘다.
  - EN: Clockkeeper Oliver sets Edward's pocket watch to the tower clock every morning.
- `n_dd04`: 이름이 뒤바뀌었다. 기억 속에서 조종한, 귀에 흉터가 있고 오른손을 쓰는 아이는 지금의 Green이다.
  - EN: The names were swapped. The boy you played in the memories, with the scarred ear and the right hand, is the Green of today.
- `n_dd06`: Green이 에드워드를 떨어뜨렸다. 그는 에드워드가 죽었다고 믿고 달아났다.
  - EN: Green caused the fall. He fled believing Edward was dead.
- `n_turn`: 치료사는 에드워드가 최소 15분은 살아 있었다고 한다. Green이 묻는다. 그럼 누가 곁에 있었지?
  - EN: The Healer says Edward was alive for at least 15 minutes. Green asks: then who was with him?
- `n_nogl`: 탑에서는 장갑도 편지도 발견되지 않았다. 누군가 가져갔다.
  - EN: No glove and no letter were found at the tower. Someone took them.
- `n_k1`: 11시 50분. 빅그베는 살아 있는 에드워드를 발견했다.
  - EN: 11:50. BGB found Edward alive.
- `n_k2`: 에드워드는 도움을 청했다. 그는 소리쳐 불렀고, 목도리를 붙잡았다.
  - EN: Edward asked for help. He called out, and he held on to a scarf.
- `n_k3`: 빅그베는 에드워드에게 곧바로 도움이 필요하다는 것을 알아보았다.
  - EN: BGB saw that Edward needed help at once.
- `n_k4`: 11시 51분. 빅그베는 장갑과 편지를 읽지 않은 채 외투 속에 단추로 잠가 넣었다. 11시 53분, 뒷문에 안쪽에서 빗장을 걸었다.
  - EN: 11:51. BGB took the glove and the letter, unread, and buttoned them into his coat. 11:53, he bolted the back door from the inside.
- `n_k5`: 11시 55분. 빅그베가 손종을 울렸다. 약 5분 동안 그는 도움을 부르지 않았다.
  - EN: 11:55. BGB rang the handbell. For about 5 minutes he did not call for help.
- `n_k6`: 빅그베는 그 뒤로 자신이 한 일을 숨겼다. 올리버에게는 종이 울리자마자 왔다고 말했다.
  - EN: BGB then hid his own part in it. He told Oliver he came just as the bell rang.
- `n_dd05`: 빅그베는 11시 50분에 살아 있는 에드워드를 발견했고, Green을 가리키는 장갑과 편지를 숨겼고, 11시 55분까지 경보를 울리지 않았다.
  - EN: BGB found Edward alive at 11:50, hid the glove and the letter that pointed to Green, and did not raise the alarm until 11:55.
- `n_last`: 빅그베가 기억하는 에드워드의 마지막 말: "추워... 제발..." 그리고 "...Green... 시계..." 빅그베는 두 마디를 모두 들었다.
  - EN: Edward's last words, as BGB remembers them: "Cold... please..." and then, "...Green... the clock..." BGB heard both.
- `n_dd10`: 에드워드는 다치고 젖고 추운 채로 누워 있었다. 멈춘 탑시계와 계속 간 회중시계를 함께 보면, 어떤 시계도 그가 죽은 시각을 정해 주지 못한다.
  - EN: Edward lay injured, wet and cold. The stopped tower clock and the running watch together show that no clock fixes his time of death.
- `n_dd11`: 11시 50분에 도움이 있었다면 에드워드가 살았을지는 아무도 말할 수 없다.
  - EN: No one can say whether help at 11:50 would have saved Edward.
- `n_dd01`: 11시 47분은 시계가 고장 난 때이지, 에드워드가 죽은 때가 아니다.
  - EN: 11:47 is when the clock broke, not when Edward died.
- `n_dd12`: 추락에 대한 책임은 Green에게 있다. 증거를 숨기고 도움을 늦춘 책임은 빅그베에게 있다.
  - EN: Green is responsible for the fall. BGB is responsible for hiding evidence and delaying help.
- `n_dd07`: 장부는 여럿이 함께, 에드워드의 손으로 고쳐졌다. 두 가지 잉크, 회의의 봉인, 다섯 사람의 서명이 있고, 마지막 기록이 그것을 확인한다.
  - EN: The register was altered by a group, with Edward's hand: two inks, council seals, five signatures, and the Final Record confirms it.
- `n_dd08`: Green은 이름을 되찾으려는 게 아니라 빅그베를 지키려고 싸웠다.
  - EN: Green fought to protect BGB, not to take back his name.
- `n_dd09`: 에드워드는 진실을 시계 속에 숨겼다. 추 상자다.
  - EN: Edward hid the truth in the clock: the pendulum case.

## 증거

- `notice` [plaza/document/live] **추모의 종 공고** / Remembrance Bell notice
  - 표지판에 붙은 공고. 추모의 종이 자정에 울리며, 벨 마을 모두가 시계탑으로 모여 달라는 내용이다. 'E'라고 서명되어 있다.
  - EN: A notice pinned to the signpost: the Remembrance Bell rings at midnight, and everyone in Bell Village is asked to come to the Clocktower. Signed with an E.
- `clock` [clock/physical/live] **멈춰 선 시계** / The stopped clock
  - 탑시계가 11시 47분에 멈춰 있다. 시계가 멈춘 시각일 뿐, 에드워드가 죽은 시각은 아니다.
  - EN: The tower clock is frozen at 11:47. That is when the clock stopped. It does not say when Edward died.
- `hatch` [tower/physical/dormant] **기어 해치** / The gear hatch
  - 바퀴 구덩이 위의 바닥 해치가 열려 있고, 사다리가 어둠 속으로 내려간다. 걸쇠는 헐겁게 늘어져 있고 판자에는 새로 긁힌 자국이 있다. 에드워드는 탑 안, 이곳에서 떨어졌다.
  - EN: A floor hatch above the wheel pit stands open, a ladder running down into the dark. The latch hangs loose, with a fresh scrape on the boards. Edward fell here, inside the tower.
- `pendulum` [clock/physical/dormant] **구부러진 추 막대** / The bent pendulum rod
  - 추 막대가 구부러졌고 크러치 핀이 부러져 있다. 막대에 짧은 가시 몇 가닥이 걸려 있다. 무언가 무거운 것이 부딪혔고, 시계는 11시 47분에 멈췄다.
  - EN: The pendulum rod is bent and the crutch pin is sheared. A few short quills are caught on the rod. Something heavy struck it, and the clock stopped at 11:47.
- `handbell` [tower/physical/dormant] **비상 손종** / The emergency handbell
  - 계단 옆에 비상 손종이 걸려 있다. 시계지기 올리버는 그날 밤 한 번 울리는 소리를 들었다. 정확한 시각은 말하지 않는다.
  - EN: An emergency handbell hangs by the stairs. Clockkeeper Oliver heard it ring once that night. He does not say exactly when.
- `chute` [tower/physical/dormant] **뒷문** / The back door
  - 뒤쪽의 작은 정비용 문이다. 안쪽에서 빗장이 걸려 있다. 바깥 눈 위에는 이 문에서 멀어지는 발자국이 있다.
  - EN: A small maintenance door at the back, bolted from the inside. Outside in the snow, boot prints lead away from it.
- `register` [past23/document/dormant] **홍수 연도 장부** / The flood-year register
  - 큰 장부가 독서대 위에 펼쳐져 있다. 홍수가 난 해의 항목은 두 가지 잉크로 쓰여 있다. 오래된 갈색과, 더 새롭고 짙은 색이다. 쪽 아래에는 인장과 서명이 빽빽하다.
  - EN: A large register lies open on the reading stand. The entries for the flood year are written in two inks: an older brown, and a newer, darker one. Seals and signatures crowd the foot of the page.
- `drawers` [letters/physical/dormant] **잠긴 서랍장** / The locked drawers
  - 놋쇠 손잡이가 달린 작은 서랍이 줄지어 있고, 모두 잠겨 있다. 열쇠는 니니가 가지고 있다.
  - EN: A cabinet of small brass-handled drawers, every one locked. Nini keeps the key.
- `melt` [tower/trace/dormant] **눈 녹은 물 자국** / Puddles of meltwater
  - 눈 녹은 물이 세 곳에 고여 있다. 사다리 옆, 해치 곁, 그리고 뒷문 앞이다.
  - EN: Meltwater has pooled in three places: by the ladder, beside the hatch, and at the back door.
- `letters` [letters/document/dormant] **봉인된 편지 두 통** / Two sealed letters
  - 에드워드의 책상 서랍에서 나온 봉인된 봉투 두 개다. 하나에는 빅그베의 이름이 적혀 있다. 다른 하나는 글씨가 번졌고 가장자리가 물에 젖은 흔적이 있다. 빅그베는 어느 쪽도 열지 않았다.
  - EN: Two sealed envelopes from Edward's desk drawer. One is addressed to BGB. The writing on the other is smudged, and its edge is water-stained. BGB has not opened either.
- `bellrec` [past23/document/dormant] **오래된 종 관리 기록** / Old Bell Maintenance Record
  - 종 관리 기록. 23년 전, 겨울. 경보 종 작동 중단. 강변 사고 발생. 관련 기록은 의회 결정에 따라 별도 보관한다. 기록 담당: 에드워드 벨.
  - EN: Bell Maintenance Record. Winter, 23 years ago. Warning bell malfunction. Incident at the river. Related records are to be kept separately by order of the Council. Recorded by: Edward Bell.
- `torn_page` [letters/document/dormant] **찢어진 공책 한 장** / Torn notebook page
  - "붉은 장부 옮겨졌나? 에드워드 아저씨께 확인할 것. 자정 전에 서랍 정리." 니니의 글씨로, 그녀의 공책에서 없어진 장이다.
  - EN: "Was the red ledger moved? Ask Edward. Tidy the drawer before midnight." Nini's handwriting, on the page missing from her notebook.
- `notebook` [letters/document/live] **니니의 공책** / Nini's notebook
  - 니니의 공책. 한 줄이 적혀 있다. "붉은 장부 옮겨졌나?" 에드워드가 찾던 장부인데, 어디에 두었는지 기억하지 못했다고 한다.
  - EN: Nini's notebook. One entry reads: "Red ledger moved?" Edward was looking for it and could not remember where he had put it.
- `patrol` [patrol/document/dormant] **야간 경비 토미의 순찰 일지** / Night Guard Tommy's patrol log
  - 랜턴 다리 가로등에 걸린 야간 경비 토미의 일지. 17:08 "뒷길에 자루를 든 곰, 방앗간 길 쪽으로." 11:35 "B.G.B.가 랜턴 다리를 서둘러 건넘. 양손에 장갑, 오른손에 종이 한 장." 11:46 "기록실 계단에 곰 한 마리, 탑 쪽으로 천천히 걸어감." 11:51 "탑 쪽에서 누군가 부르는 소리. 바람에 묻힘."
  - EN: Night Guard Tommy's logbook, hung on the lamp post by Lantern Bridge. 17:08: "A bear with a sack on the back lane, heading toward the Mill road." 11:35: "B.G.B. crossed Lantern Bridge, hurrying. Both hands gloved, a paper in the right hand." 11:46: "A bear on the Archive steps, walking slowly toward the tower." 11:51: "Someone calling out, toward the tower. The wind took it."
- `key` [letters/physical/dormant] **에드워드의 서랍 열쇠** / Edward's drawer key
  - 붉은 실에 꿰인 작은 놋쇠 열쇠. 니니가 에드워드가 죽은 뒤로 간직해 왔고, 당신에게 건넸다.
  - EN: A small brass key on a loop of red thread. Nini has kept it since Edward's death, and she gave it to you.
- `photo2` [photos/photo/dormant] **두 번째 사진** / The second photograph
  - 에드워드의 서랍에서 나온 사진. 같은 두 아기 곰, 두 귀 모두 멀쩡하고 목도리 매듭이 또렷하다. 뒷면에 에드워드의 글씨: "큰 초록 곰(오른쪽)과 그린."
  - EN: A photograph from Edward's drawer: the same two cubs, both ears whole, their scarf knots clearly visible. On the back, in Edward's hand: "Big Green Bear (right) and Green."
- `stmt_ck` [statements/statement/live] **진술: 올리버** / Statement: Oliver
  - 시계지기 올리버: "11시 40분쯤 목도리를 두른 누군가가 계단을 올라갔습니다. 얼굴은 못 봤습니다. 오른손에 뭔가 들고 있었던 것 같은데, 어두워서 뭔지는 모르겠습니다."
  - EN: Clockkeeper Oliver: "Around 11:40 someone in a scarf went up the stairs. I didn't see their face. I think they were carrying something in their right hand. It was too dark to tell what."
- `stmt_hz` [statements/statement/live] **진술: 헤이즐** / Statement: Hazel
  - 카페 주인 헤이즐: "12시 15분 전이 조금 못 되도록 여기 계셨어요. 누군가를 기다리는 것 같았죠."
  - EN: Café owner Hazel: "You were here until a little before 11:45. You looked like you were waiting for someone."
- `stmt_nini` [statements/statement/live] **진술: 니니** / Statement: Nini
  - 니니: "에드워드 아저씨는 기록관에서 편지를 쓰고 계셨어요. 두 통이요. 제가 아홉 시쯤 나올 때도 책상에 앉아 계셨고, 자꾸 쓰다가 멈추셨어요."
  - EN: Nini: "Edward was writing letters at the Archive. Two of them. He was still at his desk when I left around nine, and he kept stopping in the middle of writing."
- `photo_home` [photos/photo/dormant] **사진(집에 둔 것)** / The photograph (home copy)
  - 목도리를 두른 두 아기 곰이 나란히 선 낡은 사진. 액자는 오래되고 깊어서, 걸려 있지 않고 선반에 기대어 서 있다.
  - EN: A worn photograph of two small cubs in scarves, standing close. The frame is old and deep, and it leans on the shelf instead of hanging.
- `stmt_tm` [statements/statement/live] **진술: 토미** / Statement: Tommy
  - 야간 경비 토미: "밤 11시 35분쯤 다리 근처에서 덩치가 큰 사람을 봤습니다. 뒷모습뿐이었고 목도리를 하고 있었습니다. 시계탑 쪽으로 가더군요."
  - EN: Night Guard Tommy: "Around 11:35, near the bridge, I saw a pretty big fellow wearing a scarf. Only from behind. They were heading toward the clock tower."
- `stmt_gr` [statements/statement/dormant] **진술: Green** / Statement: Green
  - 방앗간의 Green: "밤새 집에서 물레바퀴의 얼음을 깼어. 탑에는 가지 않았어. 네 기억을 떠올려 봐."
  - EN: Green, at the Old Mill: "I was at home all night, chipping ice off the wheel. I was not at the tower. Ask yourself what you remember."
- `greet` [statements/statement/live] **진술: 니니의 인사** / Statement: Nini's greeting
  - 니니는 어제 해 질 무렵 시계탑 뒤쪽 길에서 곰 한 마리를 당신인 줄 알고 손을 흔들며 불렀지만, 그 곰은 돌아보지 않았다고 한다.
  - EN: Nini says that yesterday, around dusk, she waved at a bear on the back lane behind the Clocktower and called out to him, thinking he was you. He did not turn around.
- `tab_pm` [cafe/document/live] **카페 계산서(오후)** / Café tab (afternoon)
  - 헤이즐이 쓴 빅그베의 오후 계산서. 16:15 차 주문, 16:55 창가 자리에 리필, 17:32 계산. 시각은 헤이즐이 직접 적었다.
  - EN: Hazel's afternoon tab for BGB: tea ordered 16:15, a refill brought to the window table at 16:55, paid 17:32. Hazel wrote the times herself.
- `bread` [cafe/trace/dormant] **카페 빵 봉투와 찻잎 통** / Café bread bag and tea tin
  - 낡은 방앗간 탁자 위에 헤이즐의 카페 찻잔 도장이 찍힌 빵 봉투와 작은 찻잎 통이 있다. 봉투에는 들고 다닌 주름이 남아 있다.
  - EN: On the Old Mill table: a paper bread bag and a small tea tin, both stamped with the teacup mark of Hazel's Café. The bag is still creased from being carried.
- `boots` [tower/trace/dormant] **계단의 발자국** / Footprints on the stairs
  - 탑 계단에 눈이 묻어 있다. 올라가는 발자국이 한 줄, 간격이 넓다.
  - EN: Snow tracked onto the tower stairs. One set of prints leads up, spaced wide apart.
- `receipt` [cafe/document/live] **카페 영수증** / Café receipt
  - 헤이즐의 카페 영수증. 11시 42분에 계산되었고, 헤이즐이 직접 시각을 적어 두었다.
  - EN: A receipt from Hazel's Café, settled at 11:42. Hazel wrote the time on it herself.
- `acct_gr` [statements/statement/dormant] **Green의 진술: 그날 밤** / Green's account
  - Green은 그날 밤 탑에 있었다고 말한다. 에드워드가 기록을 내주지 않았고, 열린 해치 옆에서 몸싸움이 벌어졌고, 에드워드가 그 아래로 떨어졌다고 한다. Green은 에드워드가 죽었다고 믿고 뒷문으로 달아났다고 말한다.
  - EN: Green says he was at the tower. Edward would not hand over the record, they struggled beside the open hatch, and Edward fell through it. Green says he believed Edward was dead and fled by the back door.
- `report` [medical/medical/dormant] **치료사의 소견** / The Healer's report
  - 고관절과 골반이 부러졌고 갈비뼈도 여러 대 나갔으며 속에서 출혈이 있었다. 추위와 젖은 옷이 쇼크를 더 심하게 만들었다. 에드워드는 추락한 뒤에도 최소 15분은 살아 있었고, 목소리가 쉬어 있었다. 한동안 소리쳐 불렀다는 뜻이다. 그 추락은 살아남을 가능성이 있었고, 더 일찍 도움을 받았다면 나아졌을 수도 있다. 치료사는 도움이 있었다면 살았을 거라고 말할 수 없다고 한다. 추정 시간대는 밤 11시 55분에서 0시 15분이고, 추위 때문에 정확하지 않다.
  - EN: A broken hip and pelvis, broken ribs, bleeding inside. Cold and wet clothes made the shock worse. Edward lived at least 15 minutes after the fall, and his voice was hoarse, as if he had been calling out for some time. The fall was potentially survivable, and earlier help might have improved his chances. The Healer cannot say help would have saved him. Estimated window: 11:55 PM to 12:15 AM, and the cold makes that unreliable.
- `watch` [clock/physical/dormant] **에드워드의 회중시계** / Edward's pocket watch
  - 시계는 멈추지 않고 계속 갔다. 유리가 갈라졌고, 에드워드가 왼쪽 고관절로 떨어진 자리가 찌그러졌다. 올리버가 매일 아침 탑시계에 맞춰 놓기 때문에 시각이 정확하다. 일이 벌어진 때는 알려 주지만, 그가 죽은 때를 알려 주지는 않는다.
  - EN: The watch kept running. The crystal is cracked and the case is dented where Edward landed on his left hip. Oliver sets it by the tower clock every morning, so it keeps true time. It shows when things happened. It does not show when he died.
- `pit` [tower/physical/dormant] **바퀴 구덩이** / The wheel pit
  - 돌바닥에 눈 녹은 물이 고였고, 배수구는 얼음으로 막혀 있고, 바닥에는 서리가 끼어 있다. 에드워드가 발견되었을 때 조끼와 바지가 흠뻑 젖어 있었다. 토미의 일지에는 그날 밤이 영하 9도였다고 적혀 있다.
  - EN: Meltwater has pooled on the stones, the drain is choked with ice, and there is frost on the floor. Edward's vest and trousers were soaked through when he was found. Tommy's log puts the night at minus nine degrees.
- `found_loc` [place/scene/live] **에드워드가 발견된 곳** / Where Edward was found
  - 시계탑 뒤편, 눈에 거의 파묻힌 채였다. 토미는 눈 위로 삐져나온 외투 자락을 보았다. 메이 선생님을 불렀지만 이미 늦었다.
  - EN: Behind the clock tower, almost buried in snow. Tommy noticed a piece of Edward's coat sticking out. He sent for May, but it was too late.
- `mech` [clock/physical/live] **시계 장치의 긁힌 자국** / Scratches on the clock mechanism
  - 톱니바퀴는 멈춰 있지만 태엽은 아직 풀리지 않았다. 장치 옆 금속판에 긁힌 자국이 있다.
  - EN: The gears are motionless, but the spring has not run down. A metal plate beside the mechanism is scratched.
- `hatch2` [tower/physical/live] **열린 정비구** / The open maintenance hatch
  - 정비구 덮개가 열려 있고 아래로 눈 덮인 지면이 보인다. 가장자리에는 무언가에 쓸린 흔적이 있다.
  - EN: The maintenance hatch stands open, with snow-covered ground below. There are scuff marks along its edge.
- `pwatch` [clock/physical/live] **에드워드의 깨진 회중시계** / Edward's cracked pocket watch
  - 정비 도구 옆에 에드워드의 회중시계가 있었다. 유리는 깨졌지만 초침은 아직 움직인다. 탑 시계는 멈췄는데도.
  - EN: Edward's pocket watch lay beside the maintenance tools. The glass is cracked, but the second hand is still moving, though the tower clock has stopped.
- `bellinc` [past23/history/live] **23년 전 경고 종 사고** / The warning bell incident
  - 23년 전 큰비로 강이 넘쳤는데 경고 종이 울리지 않았다. 배를 몰던 사람이 돌아오지 못했다. 고장이라는 말도, 누군가 망가뜨렸다는 말도 있었고, 마을이 공식으로 택한 것은 후자였다.
  - EN: Twenty-three years ago a storm flooded the river and the warning bell never rang. A boatman never made it back. Some said the bell broke down; others said someone damaged it. The village officially chose the second story.
- `oldrep` [past23/document/live] **23년 전 사고 보고서** / Old Incident Report
  - 벨 마을 수해 사고 보고서. 홍수 당시 경고 종 미작동. 선원 1명 사망. 공식 원인: 외부 충격에 의한 종 장치 파손. 관련자의 진술에 따라 종결. 정비 기록 첨부란이 비어 있다.
  - EN: Bell Village Flood Incident Report. Warning bell failed during the flood. One boatman deceased. Official cause: bell mechanism damaged by external force. Closed following witness testimony. The maintenance records section is empty.
- `mreq` [past23/document/live] **보류된 정비 요청서** / Deferred Maintenance Request
  - 시설: 경고 종. 문제: 작동 레버의 움직임이 원활하지 않음. 요청: 레버 부품 교체. 처리: 예산 검토 후 보류.
  - EN: Facility: Warning Bell. Issue: operating lever stiff and unreliable. Request: replacement of lever components. Status: deferred pending budget review.
- `noledger` [past23/document/live] **사라진 붉은 장부** / The missing red ledger
  - 서류장에 다른 장부들은 있지만 붉은 장부가 있어야 할 자리는 비어 있다. 선반에는 장부를 꺼낸 흔적이 남아 있다.
  - EN: Several ledgers remain on the shelf, but the space for the red ledger is empty. There is a clean mark where a book once stood.
- `draft` [letters/document/live] **에드워드의 편지 초안** / Edward's draft letter
  - "그날 이후로 저는 선택의 여지가 없었다고 스스로를 설득해 왔습니다. 하지만 23년은 너무 긴 시간이었습니다. 이제는 바로잡으려 합니다." 빈 봉투에는 받는 사람의 이름이 없다.
  - EN: "Ever since that day, I've told myself I had no choice. But twenty-three years is far too long. It's time I made things right." The empty envelope carries no recipient's name.
- `mnote` [letters/document/live] **자정 공개 메모** / Midnight disclosure note
  - "자정 공개. 원본 별도 보관. 의회 기록 확인." 에드워드의 책상 아래에서 나왔다.
  - EN: "Reveal at midnight. Original stored separately. Check council records." Found beneath Edward's desk.
- `tod` [medical/medical/live] **추정 사망 시간** / Estimated time of death
  - 메이: 밤 11시 55분에서 12시 15분 사이. 추락으로 크게 다쳤고 추위에 오래 노출되었다. 살릴 수 있었을지는 알 수 없지만, 치료를 시작할 기회는 있었을 것이다.
  - EN: May: between 11:55 p.m. and 12:15 a.m. The fall caused severe injuries, and he was exposed to the cold for some time. She cannot say whether he would have survived, but he would have had a chance to receive treatment.
- `tdoc` [past23/document/live] **찢어진 서류** / The torn document
  - "경고 종의 결함은 사고 이전부터 보고되었다. 관련 기록과 구조자의 신원은 의도적으로 변경되었다." 그린은 에드워드가 그날 누가 진실을 알고 있었는지도 적어 두었다고 한다.
  - EN: "The warning bell's defect had been reported before the accident. The records and the rescuer's identity were deliberately altered." Green says Edward also wrote down who knew the truth that day.
- `thread` [medical/trace/live] **노란 실** / Yellow thread
  - 메이는 에드워드의 손에서 추락으로 생기지 않은 작은 상처를 발견했고, 손톱 밑에는 노란 실이 끼어 있었다.
  - EN: May found a small cut on Edward's hand that did not come from the fall, and yellow thread caught under his fingernails.
- `hidden` [hiding/document/live] **숨겨진 편지와 장갑** / The hidden letter and glove
  - 액자 뒤에 접힌 편지와 오른손 장갑 한 짝이 있었다. 에드워드의 서명이 있는 편지에는 "이번에는 누구의 이름도 지우지 않겠습니다."라고 적혀 있다.
  - EN: Behind the picture frame: a folded letter signed by Edward, "This time, I will not erase anyone's name," and a right-hand glove.
- `button` [trace/trace/live] **황동 단추, E. BELL** / Brass button, E. BELL
  - E. BELL이라고 새겨진 작은 황동 단추.
  - EN: A small brass button engraved E. BELL.
- `stmt_ck2` [statements/statement/dormant] **진술: 올리버의 두 번째 증언** / Statement: Oliver, again
  - 빅그베는 올리버에게 "종이 울리자마자", "최대한 빨리 왔어요"라고 말했다. 올리버가 왔을 때 빅그베는 에드워드 곁에 무릎을 꿇고 있었고, 외투 단추는 무언가를 가린 채 엇갈려 있었고, 왼쪽 목도리 끝은 짧게 찢겨 있었다. 올리버는 돌아오는 길에 자정 5분 전에 손종 소리를 들었다.
  - EN: BGB told Oliver he came "just as the bell rang" and "as fast as I could." Oliver found him kneeling by Edward, coat buttoned wrong over something, the left tail of his scarf torn short. He heard the handbell at 11:55 on his way back.
- `wool` [trace/trace/dormant] **에드워드의 주먹 속 겨자색 털실** / Mustard wool in Edward's fist
  - 올리버가 도착했을 때, 아무도 에드워드를 덮기 전에, 그의 손가락 사이에 눈에 젖은 겨자색 털실 한 뼘이 쥐어져 있었다. 빅그베의 찢어진 왼쪽 목도리 끝과 같은 털실이다. 그 끝은 11시 42분에 헤이즐이 멀쩡하게 정리해 준 것이다.
  - EN: A hand's width of mustard knit, snow-damp, was clenched in Edward's fingers when Oliver arrived, before anyone covered him. It matches BGB's torn left scarf tail. Hazel had straightened that tail whole at 11:42.
- `patrol2` [patrol/document/dormant] **토미의 일지, 밤 늦은 기록** / Tommy's log, later entries
  - 23시 46분, 광장의 두 번째 곰. 느리고 서두르지 않으며 탑으로 향하다 버팀벽 뒤에서 사라졌다. 23시 51분, "부르는 소리? 바람?" 토미는 탑에 들어가지 않는다. 그날 밤은 영하 9도였다.
  - EN: 23:46, a second bear on the plaza, slow and unhurried, heading for the tower, lost behind the buttress. 23:51, "calling? wind?" Tommy never enters the tower. The night was minus nine.
- `walk` [cafe/scene/dormant] **카페에서 탑까지의 걸음** / The walk from the café
  - 빅그베처럼 천천히 걸으면 카페 문 11시 42분, 광장 11시 46분, 탑 문 11시 48분이다. 6분이 걸린다. 헤이즐은 방금 그의 왼쪽 목도리 끝을 정리해 주었고 그때는 멀쩡했다고 덧붙인다.
  - EN: Walking slowly, the way BGB does: café door 11:42, plaza 11:46, tower door 11:48. Six minutes. Hazel adds that she had just straightened his left scarf tail, and that it was whole.
- `hide` [hiding/physical/dormant] **사진 뒤의 틈** / Behind the photograph
  - 기념 액자의 뒷판은 경첩이 달려 있고 놋쇠 단추 두 개로 잠긴다. 그 뒤에는 깊이 3센티미터쯤의 틈이 있다. 액자는 빅그베의 선반에 기대어 놓여 있을 뿐 벽에 걸린 적이 없다.
  - EN: The keepsake frame has a hinged backing board with two brass turn-buttons. Behind it is a cavity about three centimeters deep. It leans on BGB's shelf and has never hung on the wall.
- `glove` [hiding/physical/dormant] **오른손 장갑 한 짝** / A right glove
  - 오른손용 털장갑 한 짝이 납작하게 눌려 있고 눈에 젖어 있다. 토미의 일지에는 11시 35분의 곰이 장갑을 양손에 끼고 있었다고 적혀 있다.
  - EN: A wool glove for the right hand, flattened and snow-damp. Tommy's log says the bear at 11:35 wore both gloves.
- `letter` [hiding/document/dormant] **"G"에게 쓴 편지** / A letter addressed to "G."
  - 세 번 접혀 구겨진 편지로, 에드워드의 글씨이고 받는 사람은 "G"다. 토미의 일지에는 11시 35분의 곰이 오른손에 종이 한 장을 들고 있었다고 적혀 있다. 빅그베는 이것을 읽지 않았다.
  - EN: A letter folded in thirds, crumpled, in Edward's hand and addressed to "G." Tommy's log says the bear at 11:35 carried a paper in his right hand. BGB has not read it.
- `motive` [statements/statement/dormant] **Green의 이유** / Green's reason
  - Green은 에드워드가 자정에 모두가 보는 앞에서 진짜 기록을 읽으려 했다고 말한다. Green은 동생을 지키려고 그를 막으러 갔다. "내가 이름을 되찾고 싶어서 그랬다고 생각해? 그 사람이 네 삶을 통째로 흔들어 놓았을 거야."
  - EN: Green says Edward meant to read the true record aloud at midnight, in front of everyone. Green went to stop him, to protect his brother. "You think I wanted the name back? He'd have taken your life apart."
- `record` [past23/document/dormant] **에드워드의 마지막 기록** / Edward's Final Record
  - 추 상자 속에 숨겨 둔 바로잡은 장부와 손으로 쓴 고백이다. 에드워드는 자기 이름을 가장 먼저 적고, 이어 시장, 종지기 어른, 그때의 치료사, 몰리를 적었다. 이름이 바뀐 일과 누가 무엇을 했는지를 밝히고, 열쇠를 니니에게 넘긴다.
  - EN: The corrected register and a handwritten confession, hidden in the pendulum case. Edward names himself first, then the Mayor, the Bell-warden, the Healer of that time and Molly. He states the swap and who did what, and hands Nini the keys.

## 사건 파일: 시간 줄, 질문, 장소

- 16:50 (claim, 증거 ['greet']): 니니는 해 질 무렵 뒷길의 곰에게 손을 흔들었다고 한다.
  - EN: Nini says she waved at a bear on the back lane around dusk.
- 17:08 (claim, 증거 ['patrol']): 순찰 일지: 뒷길에 자루를 든 곰이 방앗간 길 쪽으로 갔다.
  - EN: Patrol log: a bear with a sack on the back lane, heading for the Mill road.
- 11:35 (claim, 증거 ['stmt_tm']): 토미: 다리 근처에서 목도리를 한 사람이 시계탑 쪽으로 갔다.
  - EN: Tommy: a scarfed figure near the bridge, heading for the clock tower.
- 11:40 (claim, 증거 ['stmt_ck']): 올리버: 목도리를 두른 누군가가 계단을 올랐다.
  - EN: Oliver: someone in a scarf went up the stairs.
- 11:42 (fact, 증거 ['receipt']): 카페에서 계산했다. 시각은 헤이즐이 영수증에 적었다.
  - EN: The tab was settled at the café. Hazel wrote the time on the receipt.
- 11:47 (fact, 증거 ['clock']): 탑시계가 11:47을 가리킨 채 멈춰 있다.
  - EN: The tower clock stands stopped at 11:47.
- 11:55 ~ 12:15 (est, 증거 ['tod']): 메이의 소견: 에드워드는 이 사이에 숨진 것으로 추정된다. 추위 때문에 정확하지 않다.
  - EN: May's estimate: Edward died somewhere in this window. The cold makes it unreliable.
- 질문 q1: 다리 근처에서 목격된 인물과 계단에서 목격된 인물은 같은 사람을 가리키는가?
  - EN: Do the figure seen near the bridge and the figure seen on the stairs point to the same person?
  - 단서: ['stmt_tm', 'stmt_ck']
  - 선택 `same`: 같은 사람을 가리킨다 / They point to the same person
  - 선택 `diff`: 다른 사람을 가리킨다 / They point to different people
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 질문 q2: 11:47은 무엇을 의미하는가?
  - EN: What does 11:47 mean?
  - 단서: ['clock', 'mech', 'pwatch', 'tod']
  - 선택 `stop`: 탑시계가 멈춘 시각이다 / It is when the tower clock stopped
  - 선택 `death`: 에드워드가 숨진 시각이다 / It is when Edward died
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 질문 q3: 계단에서 목격된 인물에 대해 무엇을 알 수 있는가?
  - EN: What can be known about the person seen on the stairs?
  - 단서: ['stmt_ck', 'stmt_tm']
  - 선택 `known`: 누구인지 특정할 수 있다 / They can be identified
  - 선택 `unknown`: 누구인지 특정할 수 없다 / They cannot be identified
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 질문 q4: 에드워드의 편지 두 통은 누구에게 쓴 것인가?
  - EN: Who were Edward's two letters written to?
  - 단서: ['stmt_nini', 'notebook', 'draft']
  - 선택 `both`: 두 통 모두 수신자를 짐작할 수 있다 / I can guess both recipients
  - 선택 `one`: 한 통의 수신자만 짐작할 수 있다 / I can guess only one recipient
  - 선택 `none`: 수신자를 짐작할 수 없다 / I can't guess either
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 질문 q5: 23년 전 경보 종은 왜 울리지 않았는가?
  - EN: Why did the warning bell not ring 23 years ago?
  - 단서: ['bellinc', 'oldrep', 'mreq', 'noledger', 'bellrec']
  - 선택 `fault`: 장치가 고장 났다 / The mechanism failed
  - 선택 `sabotage`: 누군가 망가뜨렸다 / Someone damaged it
  - 선택 `other`: 다른 이유가 있다 / There is another reason
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 질문 q6: 23년 전 기록에는 어떤 일이 있었는가?
  - EN: What happened to the records from 23 years ago?
  - 단서: ['mnote', 'oldrep', 'bellrec', 'tdoc']
  - 선택 `changed`: 기록이 바뀌었다고 본다 / I think the records were changed
  - 선택 `same`: 기록은 있는 그대로라고 본다 / I think the records are as they were
  - 선택 `unk`: 아직 판단할 수 없다 / I can't tell yet
- 장소 `cottage`: 빅그베의 오두막 / BGB's cottage
- 장소 `plaza`: 마을 광장 / Village square
- 장소 `healer`: 치료실 / Healer's office
- 장소 `tower`: 시계탑 / Clocktower
- 장소 `archive`: 기록관 / Archive
- 장소 `cafe`: 카페 / Café
- 장소 `mill`: 낡은 방앗간 / Old Mill

## 결말

### E1: 결말 E1 · 마지막 기록 / ENDING E1 · The Final Record
- p1: 이름이 제자리로 돌아간다. 기록에는 두 사람이 각자 한 일이 적히고, 아무도 알 수 없는 일은 알 수 없다고 적힌다.
  - EN: The names go back where they belong. The Record states what each of them did, and says plainly what no one can know.
- p2: 탑시계는 11시 48분에 다시 움직인다. 니니가 기록을 쓴다. 사진 속 두 아이의 이름이 바르게 적힌다.
  - EN: The tower clock is restarted at 11:48. Nini writes the Record. In the photograph, the two cubs carry the right names.
### E2: 결말 E2 · 영웅의 침묵 / ENDING E2 · The Hero's Silence
- p1: 마을은 조용히 애도한다. Green은 방앗간으로 돌아간다.
  - EN: The village mourns calmly. Green goes back to the Mill.
- p2: 시계는 고쳐지고 종은 울린다. 계단의 얼룩만은 남는다. 사진은 그대로 선반에 기대어 있다.
  - EN: The clock is repaired and the bell rings. Only a stain on the stair stays. The photograph still leans on the shelf.
### E3: 결말 E3 · 틀린 곰 / ENDING E3 · The Wrong Bear
- p1: Green은 끌려간다. 장부는 마을에 유리하게 고쳐진다.
  - EN: Green is taken away. The register is corrected in the village's favor.
- p2: 마지막 장면은 빅그베의 목도리 매듭이다.
  - EN: The last frame is the knot of BGB's scarf.
### E4: 결말 E4 · 불탄 페이지 / ENDING E4 · The Burned Page
- p1: 진실은 사라진다. 이름은 바뀐 채로 남는다.
  - EN: The truth is lost. The names stay exchanged.
- p2: 니니는 한 장만 몰래 간직한다.
  - EN: Nini keeps a single page.

## 지목 질문 (ACC)

- `p1` 질문 `acc_q1`
  - 정답: Green이에요. 본인의 진술과 뒷문에서 이어진 발자국, 구부러진 추 막대가 모두 그를 가리켜요.
    - EN: Green. His own account, the boot prints from the back door and the bent pendulum all point to him.
  - 오답: 올리버 씨예요. 그날 밤 탑에 있던 건 그분뿐이잖아요.
    - EN: Oliver. He was the only one in the tower that night.
  - 오답: 아무도 아니에요. 걸쇠가 헐거웠으니 그냥 사고예요.
    - EN: No one. The latch was loose, so it was just an accident.
- `p2` 질문 `acc_q2`
  - 오답: Green이에요. 떨어진 뒤에 사다리로 내려갔어요.
    - EN: Green. He climbed down the ladder after the fall.
  - 정답: 빅그베 아저씨예요. 에드워드의 주먹 속 털실이 그의 목도리였고, 녹은 물 자국이 그가 아래로 내려갔다고 말해 줘요.
    - EN: BGB. His scarf wool was in Edward's fist, and the meltwater trail shows he went down to him.
  - 오답: 아무도 없었어요. 올리버 씨가 올 때까지 혼자였어요.
    - EN: No one. Edward was alone until Oliver came.
- `p3` 질문 `acc_q3`
  - 오답: Green이 달아나면서 도로 가져갔어요.
    - EN: Green took them back when he ran.
  - 오답: 처음부터 없었어요. 토미 씨의 일지가 틀렸어요.
    - EN: They were never there. Tommy's log is wrong.
  - 정답: 빅그베 아저씨가 가져갔어요. 11:35에 Green은 장갑을 둘 다 끼고 종이를 들고 있었는데, 사진 뒤에서 그 장갑과 편지가 나왔어요.
    - EN: BGB took them. Green wore both gloves and carried a paper at 11:35, and the pair was found hidden behind the photograph.
- `p4` 질문 `acc_q4`
  - 정답: 약 5분이에요. 빅그베 아저씨가 11:50에 곁에 닿았고, 손종은 11:55에 울렸어요.
    - EN: About 5 minutes. BGB reached him at 11:50, and the handbell rang at 11:55.
  - 오답: 한 시간이 넘어요. 치료사가 올 때까지 아무도 없었어요.
    - EN: More than an hour. Nobody came until the Healer.
  - 오답: 전혀요. 아저씨는 도착하자마자 종을 울렸어요.
    - EN: No time at all. BGB rang the bell the moment he arrived.
- `p5` 질문 `acc_q5`
  - 오답: 문제없어요. 잉크가 두 가지인 건 옛 서기의 습관이에요.
    - EN: Nothing is wrong. Two inks were just an old clerk's habit.
  - 정답: 회의가 쌍둥이의 이름을 맞바꿨고 에드워드가 그걸 적었어요. 두 가지 잉크와 봉인, 그의 기록이 그걸 보여 줘요.
    - EN: The council swapped the twins' names and Edward wrote it down. The two inks, the seals and his Record show it.
  - 오답: 에드워드 혼자 자기 실수를 덮으려고 꾸몄어요.
    - EN: Edward alone made it up to cover his own mistakes.

## 모순 목록 (KCON)

- `k1` 빅그베는 살아 있는 에드워드를 발견했다. / BGB found Edward alive. (필요 증거 ['wool', 'report', 'melt'])
- `k2` 에드워드는 도움을 청했다. / Edward asked for help. (필요 증거 ['report', 'patrol2', 'wool'])
- `k3` 빅그베는 에드워드에게 곧바로 도움이 필요하다는 것을 알아보았다. / BGB saw that Edward needed help at once. (필요 증거 ['report', 'handbell', 'wool'])
- `k4` 빅그베는 장갑과 편지를 숨겼다. / BGB hid the glove and the letter. (필요 증거 ['patrol', 'glove', 'letter', 'stmt_ck2'])
- `k5` 빅그베는 종을 울리기까지 약 5분을 기다렸다. / BGB waited about 5 minutes before ringing the bell. (필요 증거 ['receipt', 'walk', 'patrol2', 'handbell', 'chute'])
- `k6` 빅그베는 그 뒤로 자신이 한 일을 숨겼다. / BGB then hid his own part in it. (필요 증거 ['stmt_ck2', 'hide'])

## 잡담 (SMALL)

- `tm`
  - 안녕하십니까. 오늘도 눈이 많이 옵니다. / Evening. Snow again tonight.
  - 추운 밤입니다. 다리는 제가 지키겠습니다. / A cold night for a walk. I'll keep watch on the bridge.
  - 다리 위 얼음을 조심하십시오. / Mind the ice on the bridge.
- `hz`
  - 또 오셨네요. 주전자는 늘 불 위에 있어요. / Hello again. The kettle's on if you need it.
  - 오늘도 눈이 많이 오네요. / Snowing hard again, isn't it?
  - 언제든 들르세요. 차는 따뜻하게 준비해 둘게요. / Come by any time. I'll keep a cup warm.
- `ck`
  - 음. 오늘도 눈이 많이 옵니다. / Mm. More snow tonight.
  - 음. 바람이 또 덧문 사이로 웁니다. / Mm. The wind is up in the louvres again.
- `nini`
  - 안녕하세요, 아저씨! 얼음 조심하세요. / Hello, Mr. Bear! Mind the ice.
  - 으, 오늘도 정말 추워요! / Brr, it's so cold today!
- `mo`
  - 흥, 오늘도 눈이 많이 왔군. / Hmph. Another snowy day.
  - 쯧쯧. 이런 데 서 있다간 얼어 죽겠다. / Tsk. You'll catch your death out here.

## 대화 끝 인사 (FOLLOW)

- `ck`
  - 음. 더 물어보실 것이 있습니까? / Mm. Is there anything else you wish to ask?
  - 음. 더 하실 말씀이 있습니까? / Mm. Anything more?
- `hz`
  - 더 궁금한 게 있으세요? / Is there anything else you'd like to ask?
  - 더 얘기할 게 있으신가요? / Anything else on your mind?
- `tm`
  - 더 필요하신 것이 있습니까? / Is there anything more you need?
  - 더 물어보실 것이 있습니까? / Anything else you would like to know?
- `nini`
  - 더 물어볼 게 있어요? / Is there anything else you want to ask?
  - 더 얘기할 게 있으세요, 아저씨? / Anything else, Mr. Bear?
- `mo`
  - 늙은이한테 더 들을 게 있나? / Anything else you want from an old woman?
- `gr`
  - 물어볼 건 그게 다야? / Is that all you came to ask?
- `hl`
  - 더 물으실 것이 있습니까? / Is there anything else you would like to ask?
- `ed`
  - 더 할 말이 있니? / Anything more?
- `def`
  - 더 있어? / Anything else?

## 막힌 길 안내 (GATE)

- `ck1`: 아직 이곳은 들어갈 수 없다. 에드워드를 발견한 상황에 대해 토미와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Tommy about how Edward was found.
- `ck1b`: 아직 이곳은 들어갈 수 없다. 어젯밤에 본 사람에 대해 토미와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Tommy about the person he saw last night.
- `tw2`: 아직 이곳은 들어갈 수 없다. 시계가 멈춘 이유에 대해 시계지기 올리버와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Clockkeeper Oliver about why the clock stopped.
- `tw3`: 아직 이곳은 들어갈 수 없다. 멈춘 시계에 대해 시계탑 안을 살펴보면 힌트를 찾을 수 있을 것 같다.
  - EN: I can't go in there yet. Looking around inside the clock tower might give me a hint about the stopped clock.
- `arre`: 아직 서랍 안쪽을 살펴볼 수 없다. 붉은 장부와 종이 더미를 살핀 뒤, 기록관에 대해 몰리와 더 이야기를 나눠 보자.
  - EN: I can't look inside the drawer yet. Let me go through the red ledger and the papers, then talk with Molly about the Archive.
- `mill3`: 아직 이곳은 들어갈 수 없다. 에드워드의 기록에 대해 기록관을 살펴보면 힌트를 찾을 수 있을 것 같다.
  - EN: I can't go in there yet. The Archive might have a hint about Edward's records.
- `arkey`: 아직 이곳은 들어갈 수 없다. 23년 전 종 사고에 대해 몰리 할머니와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Grandma Molly about the old bell accident.
- `ck`: 아직 이곳은 들어갈 수 없다. 계단의 곰에 대해 시계지기 올리버와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Clockkeeper Oliver about the bear on the stairs.
- `tower`: 아직 이곳은 들어갈 수 없다. 계단의 곰에 대해 시계탑으로 가 보면 단서를 더 찾을 수 있을 것 같다.
  - EN: I can't go in there yet. Going back to the clock tower might turn up more clues about the bear on the stairs.
- `rcpt2`: 아직 이곳은 들어갈 수 없다. 어젯밤 곰이 한 마리였는지에 대해 헤이즐과 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Hazel about whether there was only one bear last night.
- `rcpt`: 아직 이곳은 들어갈 수 없다. 곰이 한 마리였는지에 대해 헤이즐의 카페로 가 보면 힌트를 찾을 수 있을 것 같다.
  - EN: I can't go in there yet. Whether there was only one bear might be answered at Hazel's café.
- `logb`: 아직 이곳은 들어갈 수 없다. 다리를 건넌 곰에 대해 마을의 순찰 초소로 가 보면 힌트를 찾을 수 있을 것 같다.
  - EN: I can't go in there yet. The patrol post in the village might tell me about the bear on the bridge.
- `hand`: 아직 이곳은 들어갈 수 없다. 오른손에 든 물건에 대해 시계지기 올리버와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Clockkeeper Oliver about what the bear carried in his right hand.
- `nini`: 아직 이곳은 들어갈 수 없다. 낡은 방앗간의 열쇠에 대해 니니와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Nini about the key to the Old Mill.
- `home00`: 아직 이곳은 들어갈 수 없다. 에드워드의 죽음에 대해 마을 사람들과 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with the villagers about Edward's death.
- `home0`: 아직 이곳은 들어갈 수 없다. 에드워드의 손에 대해 메이와 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with May about Edward's hand.
- `home1`: 아직 이곳은 들어갈 수 없다. 에드워드가 쓰러진 순간에 대해 Green과 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Green about the moment Edward fell.
- `heal0`: 아직 이곳은 들어갈 수 없다. 에드워드의 마지막 모습에 대해 헤이즐과 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Hazel about Edward's last night.
- `heal1`: 아직 이곳은 들어갈 수 없다. 에드워드가 쓰러진 순간에 대해 Green과 더 이야기를 나눠 보자.
  - EN: I can't go in there yet. Let me talk more with Green about the moment Edward fell.

## 화면 문구 (UI)

- `leave`: 시계탑을 나간다 / Leave the Clocktower
- `leaveA`: 기록실을 나간다 / Leave the archive
- `lReg`: 장부를 살핀다 / Examine the register
- `lLedger`: 붉은 장부를 살핀다 / Examine the red ledger
- `lPapers`: 종이 더미를 살핀다 / Look through the papers
- `lDraw`: 서랍을 열어 본다 / Try the drawers
- `locA`: 기록실 / Archive
- `lHatch`: 해치를 살핀다 / Examine the hatch
- `lPend`: 추 막대를 살핀다 / Examine the pendulum
- `lBell`: 손종을 살핀다 / Examine the handbell
- `lChute`: 뒷문을 살핀다 / Examine the back door
- `lMelt`: 물 자국을 살핀다 / Look at the puddles
- `lClk`: 시계를 살핀다 / Examine the clock
- `locT`: 시계탑 / Clocktower
- `enterA`: 기록실에 들어간다 / Enter the archive
- `enterC`: 헤이즐의 카페에 들어간다 / Enter Hazel's café
- `locP`: 빅그베의 오두막 / BGB's cottage
- `lFrame`: 사진을 본다 / Look at the photograph
- `lDoor`: 문을 연다 / Open the door
- `lDoorNo`: 누군가 문을 두드린다 / Someone is knocking
- `askBear`: 계단의 곰은 누구인가? / Who was the bear on the stairs?
- `askStop`: 시계는 11시 47분에 멈췄다. 그것이 에드워드가 죽은 시각이라는 뜻은 아니다. / The clock stopped at 11:47. That is not necessarily when Edward died.
- `locM`: 낡은 방앗간 / The Old Mill
- `talkMo`: 몰리 할머니와 이야기한다 / Talk to Molly
- `talkGr`: Green과 이야기한다 / Talk to Green
- `toMill`: 낡은 방앗간으로 간다 / Walk to the Old Mill
- `leaveM`: 마을로 돌아간다 / Walk back to the village
- `lComp`: 사진을 맞춰 본다 / Compare the photographs
- `lBag`: 탁자 위 봉투를 살핀다 / Look at the bag on the table
- `lWin`: 창밖을 본다 / Look out the window
- `lBook`: 책들을 살핀다 / Look at the books
- `lStove`: 난로를 살핀다 / Look at the stove
- `lKettle`: 주전자를 살핀다 / Look at the kettle
- `locF`: 벨 마을, 23년 전 / Bell Village, 23 years earlier
- `capF`: 23년 전 · 벨 마을 / 23 YEARS EARLIER · BELL VILLAGE
- `talkEd`: 에드워드에게 말한다 / Talk to Edward
- `lGate`: 문을 연다 / Open the gate
- `toTowerF`: 시계탑에 몰래 들어간다 / Slip into the Clocktower
- `lLever`: 레버를 지켜본다 / Watch the lever
- `leaveF`: 밖으로 나간다 / Go back outside
- `rewind`: 그렇게 된 게 아니야. / That's not how it happened.
- `mem`: 기억 / Memory
- `locFl`: 물에 잠긴 계단통 / The flooded stairwell
- `lBrother`: 동생에게 손을 뻗는다 / Reach for your brother
- `lHandbell`: 손종을 울린다 / Ring the handbell
- `lUp`: 위로 올라간다 / Climb out
- `lEar`: 왼쪽 귀를 살핀다 / Examine your left ear
- `lScarfF`: 목도리를 살핀다 / Examine your scarf
- `lTowerF`: 시계탑을 올려다본다 / Look at the clock tower
- `lNotice`: 안내판을 읽는다 / Read the notice
- `lWinF`: 강을 내다본다 / Look at the river
- `lWatchEd`: 에드워드를 지켜본다 / Watch Edward
- `lVill`: 귀를 기울인다 / Listen
- `talkTm`: 토미와 이야기한다 / Talk to Tommy
- `lPost`: 토미의 일지를 읽는다 / Read Tommy's logbook
- `conHead`: 모순과 추리 / Contradictions and deductions
- `askNext`: 다른 곰이 있는가? / Is there another bear?
- `leaveC`: 카페를 나간다 / Leave the café
- `talkHz`: 헤이즐과 이야기한다 / Talk to Hazel
- `locC`: 헤이즐의 카페 / Hazel's Café
- `lBoots`: 계단의 발자국을 살핀다 / Look at the prints on the stairs
- `subBoard`: 책임 보드 / Responsibility Board
- `subId`: 신원 보드 / Identity Board
- `subOver`: 내가 놓친 것 / What I overlooked
- `subBack`: 돌아가기 / Back
- `pv`: 미리보기: 완성된 보드 보기 (스포일러 포함) / Preview: show the finished board (contains spoilers)
- `pvOff`: 미리보기 끄기 / Hide preview
- `page`: 쪽 / Page
- `talk`: 니니와 이야기한다 / Talk to Nini
- `talkCk`: 올리버와 이야기한다 / Talk to Oliver
- `read`: 표지판을 읽는다 / Read the signpost
- `look`: 시계를 올려다본다 / Look up at the clock
- `enter`: 시계탑에 들어간다 / Enter the Clocktower
- `resume`: 계속하기 / Resume
- `restart`: 처음부터 / Restart
- `langBtn`: 언어: 한국어 / Language: English
- `paused`: 일시정지 / PAUSED
- `tabs`: ['인물', '증거', '지도', '추리 노트'] / ['People', 'Evidence', 'Map', 'Deduction']
- `got`: 증거 추가 / Evidence added
- `newnote`: 노트 추가 / Note added
- `case`: 에드워드의 죽음 / The Death of Edward
- `loc`: 벨 마을 / Bell Village
- `objHead`: 할 일 / What to do
- `objs`: ['니니와 이야기하기', '표지판 읽기', '탑시계 올려다보기', '올리버와 이야기하기', '시계탑에 들어가기', '태엽실 살펴보기'] / ['Talk to Nini', 'Read the signpost', 'Look up at the tower clock', 'Talk to Oliver', 'Enter the Clocktower', 'Search the winding room']
- `evHead`: 증거 / Evidence
- `tlHead`: 타임라인 / Timeline
- `peopleHead`: 인물 / People
- `notesHead`: 노트 / Notes
- `mapHead`: 지도 / Map
- `empty`: 아직 아무것도 없다. / Nothing here yet.
- `unmet`: 아직 만나지 못함 / Not met yet
- `close`: 닫기 / Close
- `back`: 마을로 돌아가기 / Back to the village
- `end`: ['1장', '멈춰 선 시계', '문이 태엽실로 이어진다. 그 장면이 다음에 만들 장면이다.', '필요: 시계탑 내부 배경, 빅그베 걷기 프레임, 올리버 초상.'] / ['CHAPTER 1', 'The Clock That Stopped', 'The door opens onto the winding room. That scene is the next one to build.', 'Needs: Clocktower interior background, BGB walk frames, Oliver portrait.']
- `rot`: 더 크게 보려면 폰을 가로로 돌리세요 / Rotate your phone for a larger view
- `legend`: ['W 목격: 누군가 본 시각', 'E 사건: 일어난 시각', 'C 시계: 시계가 가리키는 시각', 'D 사망: 추정 사망 시각'] / ['W Witness: when someone saw it', 'E Event: when it happened', 'C Clock: what a clock shows', 'D Death: estimated time of death']
- `tlNote`: 멈춘 시계는 시계가 멈춘 시각을 알려줄 뿐, 에드워드가 죽은 시각은 알려주지 않는다. / A stopped clock tells you when the clock stopped. It does not tell you when Edward died.
- `here`: 현재 위치 / You are here
- `tower`: 시계탑 / Clocktower
- `toHome`: 집으로 들어간다 / Go home
- `toHeal`: 치료사의 집으로 들어간다 / Enter the Healer's house
- `talkHl`: 메이와 이야기한다 / Talk to May
- `locH`: 치료사의 집 / The Healer's house
- `leaveH`: 나간다 / Leave
- `lPit`: 바퀴 구덩이를 살핀다 / Look into the wheel pit
- `askFall`: 누가 에드워드를 떨어뜨렸는가? / Who caused Edward's fall?
- `askWith`: 시계지기보다 먼저 에드워드 곁에 있던 사람은 누구인가? / Who was with Edward before the Clockkeeper?
- `concl`: 결론 / Conclusions
- `confirm`: 확정 / Confirm
- `compare`: 단서를 맞춰 본다 / Compare the clues
- `pickWho`: 누구의 이름을 적을까? / Whose name goes here?
- `noName`: 이름을 정한다 / Choose a name
- `lOldScarf`: 오래된 목도리를 살펴본다 / Examine the old scarf
- `lGlove`: 장갑을 살펴본다 / Examine the glove
- `lTorn`: 찢어진 서류를 살펴본다 / Examine the torn document
- `lScarfK`: 목도리를 살펴본다 / Examine the scarf
- `lRep`: 사고 기록철을 살펴본다 / Examine the incident report
- `lReq`: 정비 요청서를 살펴본다 / Examine the maintenance request
- `lShelf`: 서류장을 살펴본다 / Examine the empty ledger shelf
- `lNoteU`: 책상 아래를 살펴본다 / Look beneath the desk
- `lDesk`: 에드워드의 책상을 살펴본다 / Examine Edward's desk
- `lPw`: 회중시계를 살펴본다 / Examine the pocket watch
- `lHatch2`: 정비구를 살펴본다 / Examine the maintenance hatch
- `lMech`: 시계 장치를 살펴본다 / Examine the clock mechanism
- `toGather`: 광장의 모임에 간다 / Join the gathering
- `lCase`: 추 상자를 연다 / Open the pendulum case
- `presentH`: 무엇이 그것을 증명하는지 보여 주자. / Show the village what proves it.
- `presentOk`: 제시한다 / Present
- `askRecord`: 에드워드는 진실을 어디에 숨겼는가? / Where did Edward hide the truth?
- `askChoose`: 마지막 기록에는 무엇을 적을 것인가? / What goes into the Final Record?