# Bell Village · 6장과 마지막 엔딩 대본 (한국어 / English)

Loki 검토용. 게임에 들어 있는 최신 대본(V198) 그대로 뽑았어요. 노드 ID는 코드의 대사 식별자예요. `(표정)`은 화면에 나오는 빅그베·그린 등의 표정이에요.

**읽는 법**: 화자 옆 괄호는 그 줄에서 화면에 나오는 표정이에요. `▶`는 선택지, `연출`은 화면 효과, `증거+`/`메모+`는 일지에 기록되는 것이에요. 파트 사이의 빅그베 혼잣말(`tr_2`~`tr_7`)은 한 파트가 끝나면 자동으로 나와요.

**6장 흐름 요약**: 5장 끝 → 방앗간(그린) → 방앗간 조사 → 그린 재대화 → 메이 치료실 → 집(액자) → 방앗간(마지막 질문) → 광장(니니) → 마지막 선택 → 엔딩 A 또는 B.


## 0. 6장 시작 · 5장 마무리 → 방앗간으로

_5장 끝에서 빅그베가 모은 단서를 정리하고 형(그린)을 만나러 간다._

- `f5_end` **나레이션 / Narration** (neutral): (수집한 단서를 확인한다.)
  - EN: (He reviews the clues he has collected.)
- `f5_end_1` **나레이션 / Narration** (neutral): - 23년 전 형이 동생을 구했다. ⏎ - 사고 보고서가 바뀌었다.
  - EN: - Twenty-three years ago, Green saved his brother. ⏎ - The incident report was changed.
- `f5_end_2` **나레이션 / Narration** (neutral): - 에드워드는 기록에 서명했다. ⏎ - 11:42에 카페를 나왔다.
  - EN: - Edward signed the record. ⏎ - Big Green Bear left the café at 11:42.
- `f5_end_3` **나레이션 / Narration** (neutral): - 에드워드의 추정 사망 시간은 11:55~00:15다.
  - EN: - Edward's estimated time of death is 11:55–00:15.
- `f5_end_4` **빅그베 / BGB** (sad): 기록은 바뀌었어. 하지만 그날 형이 날 구했다는 건 기억해.
  - EN: The records were changed. But I remember my brother saving me.
- `f5_end_5` **빅그베 / BGB** (thinking): 에드워드 아저씨는 왜 이제 와서 그 기록을 바로잡으려 했을까?
  - EN: Why did Edward decide to set the record straight after all these years?
- `f5_end_6` **나레이션 / Narration** (neutral): (빅그베가 오래된 방앗간이 있는 방향을 바라본다.)
  - EN: (Big Green Bear looks toward the old mill.)
- `f5_end_7` **빅그베 / BGB** (sad): 형을 만나야겠어.
  - EN: I need to see my brother.

## 1. 낡은 방앗간 첫 방문 (그린과의 첫 대화)

_문 앞에서 그린이 밀어내는 장면. 이어서 그린과 자유 대화(허브)._

- `mill_d` **나레이션 / Narration** (neutral): (방앗간 문 앞에 선다.)
  - EN: (Big Green Bear stands at the mill door.)
- `mill_d_1` **그린 / Green** (neutral): 돌아가.
  - EN: Go home.
- `mill_d_2` **빅그베 / BGB** (worried): 아직 아무 말도 안 했는데.
  - EN: I haven't said anything yet.
- `mill_d_3` **그린 / Green** (neutral): 무슨 일로 왔는지는 알아.
  - EN: I know why you're here.
- `mill_d_4` **빅그베 / BGB** (neutral): 그럼 문 좀 열어 줘.
  - EN: Then open the door.
- `mill_d_5` **나레이션 / Narration** (neutral): (잠시 후 문이 열린다.)
  - EN: (The door opens.)
- `mill_d_6` **그린 / Green** (neutral): 오래 있을 생각은 하지 마.
  - EN: Don't make yourself comfortable.
- `mill_d_7` **빅그베 / BGB** (neutral): 차라도 한 잔 줄 줄 알았는데.
  - EN: I was hoping for a cup of tea.
- `mill_d_8` **그린 / Green** (neutral): 찻잎 없어.
  - EN: No tea leaves.
- `mill_d_9` **빅그베 / BGB** (neutral): 예전에도 그랬잖아.
  - EN: You never had any.
- `gm` **그린 / Green** (neutral): 물어볼 게 있으면 해.
  - EN: If you've got questions, ask.
  - ▶ 선택 `gm1`: 에드워드 아저씨 / Ask About Edward
  - ▶ 선택 `gm2`: 시계탑 / Ask About the Clock Tower
  - ▶ 선택 `gm3`: 23년 전 / Ask About Twenty-Three Years Ago
  - ▶ 선택 `gm4`: 그냥 이야기하기 / Make Small Talk
  - ▶ 선택 `gmx`: 대화 마치기 / End Conversation
- `gm1` **빅그베 / BGB** (surprised): 에드워드 아저씨가 널 만나러 오라고 했어?
  - EN: Did Edward ask you to meet him?
- `gm1_1` **그린 / Green** (thinking): 아니. 내가 찾아갔어.
  - EN: No. I went to him.
- `gm1_2` **빅그베 / BGB** (thinking): 왜?
  - EN: Why?
- `gm1_3` **그린 / Green** (neutral): 하지 말아 달라고 부탁할 일이 있었거든.
  - EN: There was something I needed him not to do.
- `gm1_4` **빅그베 / BGB** (surprised): 들어주셨어?
  - EN: Did he agree?
- `gm1_5` **그린 / Green** (neutral): 넌 그분 성격 알잖아.
  - EN: You know what he was like.
- `gm1_6` **빅그베 / BGB** (neutral): 한 번 마음먹으면 안 바꾸셨지.
  - EN: Once he'd made up his mind, that was it.
- `gm1_7` **그린 / Green** (neutral): 그날도 그랬어.
  - EN: That night was no different.
- `gm2` **빅그베 / BGB** (thinking): 시계탑에 간 건 맞지?
  - EN: You went to the clock tower, didn't you?
- `gm2_1` **그린 / Green** (neutral): 그래.
  - EN: Yes.
- `gm2_2` **빅그베 / BGB** (surprised): 거기서 무슨 일이 있었어?
  - EN: What happened up there?
- `gm2_3` **그린 / Green** (neutral): 서류를 가져가려고 했어.
  - EN: I tried to take the papers.
- `gm2_4` **빅그베 / BGB** (thinking): 에드워드 아저씨가 가지고 있던?
  - EN: The ones Edward had?
- `gm2_5` **그린 / Green** (neutral): 응. 놓으라고 하셨는데, 내가 말을 안 들었어.
  - EN: Yes. He told me to let go. I wouldn't.
- `gm2_6` **빅그베 / BGB** (thinking): 그리고?
  - EN: And then?
- `gm2_7` **그린 / Green** (neutral): 종이가 찢어졌어. 그분이 뒤로 물러났고.
  - EN: The paper tore. He stepped backward.
- `gm2_8` **나레이션 / Narration** (neutral): (그린이 손을 내려다본다.)
  - EN: (Green looks down at his hands.)
- `gm2_9` **그린 / Green** (neutral): 그다음엔 너무 빨랐어.
  - EN: Everything after that happened too fast.
- `gm2_10` **빅그베 / BGB** (surprised): 떨어지는 걸 봤어?
  - EN: Did you see him fall?
- `gm2_11` **그린 / Green** (neutral): 끝까지는 못 봤어.
  - EN: Not all the way.
- `gm2_12` **빅그베 / BGB** (thinking): 아래로 내려가 보지는 않았고?
  - EN: You didn't go down to check?
- `gm2_13` **그린 / Green** (neutral): 못 했어.
  - EN: I couldn't.
- `gm2_14` **빅그베 / BGB** (thinking): 왜?
  - EN: Why?
- `gm2_15` **그린 / Green** (neutral): 그걸 나도 모르겠어.
  - EN: I wish I knew.
- `gm3` **그린 / Green** (thinking): 그분이 옛날 기록을 다시 꺼냈어.
  - EN: He'd brought out the old records.
- `gm3_1` **빅그베 / BGB** (neutral): 봤어.
  - EN: I saw them.
- `gm3_2` **그린 / Green** (thinking): 뭐가 적혀 있던데?
  - EN: What did they say?
- `gm3_3` **빅그베 / BGB** (neutral): 우리가 아는 이야기랑 다르더라.
  - EN: A different story from the one we know.
- `gm3_4` **그린 / Green** (thinking): 어떤 게 진짜인지는 너도 알잖아.
  - EN: You know which one is true.
- `gm3_5` **빅그베 / BGB** (neutral): 형도 알지.
  - EN: So do you.
- `gm3_6` **그린 / Green** (worried): 나는 네가 잊은 줄 알았어.
  - EN: I thought you'd forgotten.
- `gm3_7` **빅그베 / BGB** (neutral): 잊으려고 한 거지.
  - EN: I tried to.
- `gm3_8` **그린 / Green** (worried): 그게 가능해?
  - EN: Can you do that?
- `gm3_9` **빅그베 / BGB** (thinking): 형은?
  - EN: Can you?
- `gm3_10` **나레이션 / Narration** (neutral): (그린은 대답하지 않는다.)
  - EN: (Green doesn't answer.)
- `gm4` **빅그베 / BGB** (worried): 여기서 혼자 지내기 힘들지 않아?
  - EN: Isn't it hard living out here alone?
- `gm4_1` **그린 / Green** (neutral): 익숙해.
  - EN: I'm used to it.
- `gm4_2` **빅그베 / BGB** (neutral): 방앗간도 많이 낡았네.
  - EN: This place has seen better days.
- `gm4_3` **그린 / Green** (neutral): 너도.
  - EN: So have you.
- `gm4_4` **빅그베 / BGB** (neutral): 그건 좀 심한데.
  - EN: That's a little harsh.
- `gm4_5` **그린 / Green** (laugh): 농담이야.
  - EN: I'm kidding.
- `gmx` **빅그베 / BGB** (neutral): 또 올게.
  - EN: I'll come by again.
- `gmx_1` **그린 / Green** (laugh): 마음대로 해.
  - EN: Suit yourself.

## 2. 방앗간 조사 (목도리 · 장갑 · 서류)

_방앗간 안의 단서 세 개를 조사한다. 끝나면 빅그베의 혼잣말이 다음 목적지를 알려 준다._

- `mo_sc` **나레이션 / Narration** (neutral): (오래된 목도리가 걸려 있다. 매듭은 오른쪽 어깨 방향으로 묶여 있다.)
  - EN: (An old scarf hangs nearby, tied with the knot on the right.)
- `mo_sc_1` **빅그베 / BGB** (neutral): 아직도 이렇게 묶네.
  - EN: You still tie it that way.
- `mo_sc_2` **그린 / Green** (neutral): 너도 왼쪽으로 묶잖아.
  - EN: You still tie yours on the left.
- `mo_gl` **나레이션 / Narration** (neutral): (작업대 위에는 왼손 장갑만 놓여 있다.)
  - EN: (Only a left glove lies on the workbench.)
- `mo_gl_1` **빅그베 / BGB** (thinking): 오른쪽은?
  - EN: Where's the other one?
- `mo_gl_2` **그린 / Green** (worried): 잃어버렸어.
  - EN: Lost it.
- `mo_gl_3` **빅그베 / BGB** (thinking): 언제?
  - EN: When?
- `mo_gl_4` **그린 / Green** (worried): 어젯밤.
  - EN: Last night.
- `mo_gl_5` **빅그베 / BGB** (neutral): 새로 사야겠네.
  - EN: You'll need a new pair.
- `mo_gl_6` **그린 / Green** (neutral): 한 짝은 멀쩡한데.
  - EN: This one's still perfectly good.
- `mo_gl_7` **빅그베 / BGB** (neutral): 한 짝만으론 소용없잖아.
  - EN: Not much use on its own.
- `mo_gl_8` **나레이션 / Narration** (neutral): (그린이 장갑을 서랍에 넣는다.)
  - EN: (Green puts the glove in a drawer.)
  - 메모+ 그린에게는 왼손 장갑 한 짝뿐이다. 오른쪽은 어젯밤에 잃어버렸다고 한다.
- `mo_doc` **나레이션 / Narration** (neutral): (탁자 위에 찢어진 서류 조각이 있다.)
  - EN: (A torn piece of paper lies on the table.)
- `mo_doc_1` **나레이션 / Narration** (neutral): "경고 종의 결함은 사고 이전부터 보고되었다."
  - EN: "The warning bell's defect had been reported before the accident."
- `mo_doc_2` **나레이션 / Narration** (neutral): "관련 기록과 구조자의 신원은 의도적으로 변경되었다."
  - EN: "The records and the rescuer's identity were deliberately altered."
- `mo_doc_3` **빅그베 / BGB** (neutral): 에드워드 아저씨가 공개하려던 내용이네.
  - EN: This is what Edward was going to reveal.
- `mo_doc_4` **그린 / Green** (thinking): 전부는 아니야.
  - EN: Not all of it.
- `mo_doc_5` **빅그베 / BGB** (thinking): 뭐가 더 있는데?
  - EN: What else?
- `mo_doc_6` **그린 / Green** (worried): 그날 누가 진실을 알고 있었는지까지 적혀 있었어.
  - EN: He also wrote down who knew the truth that day.
  - 증거+ tdoc
- `tr_2` **빅그베 / BGB** (thinking): 방앗간 안을 둘러보자. 목도리, 장갑, 서류. 그린이 말하지 않은 게 여기 있을 거야.
  - EN: Let's look around the mill. The scarf, the glove, the papers. What Green hasn't said must be here.
- `tr_3` **빅그베 / BGB** (thinking): 이제 그린에게 다시 말을 걸어 보자. 물어볼 게 생겼어.
  - EN: Time to talk to Green again. I have questions now.

## 3. 그린과 두 번째 대화 (토미·메이가 본 것)

_단서가 모인 뒤 그린에게 다시 말을 건다. 끝나면 혼잣말: 메이의 치료실로._

- `gs4` **그린 / Green** (thinking): 토미가 그분을 발견했다며.
  - EN: Tommy found him, didn't he?
- `gs4_1` **빅그베 / BGB** (neutral): 그렇게 들었어.
  - EN: That's what I heard.
- `gs4_2` **그린 / Green** (neutral): 많이 추웠겠지.
  - EN: It must've been cold.
- `gs4_3` **빅그베 / BGB** (neutral): 눈이 많이 왔으니까.
  - EN: It was snowing pretty hard.
- `gs4_4` **그린 / Green** (thinking): 메이 선생님은 뭐래?
  - EN: What did May say?
- `gs4_5` **빅그베 / BGB** (neutral): 추락한 뒤에도 한동안 살아 계셨을 거래.
  - EN: She thinks he lived for some time after the fall.
- `gs4_6` **나레이션 / Narration** (neutral): (그린이 고개를 든다.)
  - EN: (Green looks up.)
- `gs4_7` **그린 / Green** (surprised): 얼마나?
  - EN: How long?
- `gs4_8` **빅그베 / BGB** (neutral): 정확히는 모른대.
  - EN: She couldn't say exactly.
- `gs4_9` **그린 / Green** (worried): 누가 조금만 일찍 발견했으면 달랐을까?
  - EN: Would it have made a difference if someone had found him sooner?
- `gs4_10` **빅그베 / BGB** (neutral): 그건 아무도 모르지.
  - EN: Nobody knows.
- `gs4_11` **그린 / Green** (neutral): 적어도 혼자 두지는 않았겠지.
  - EN: At least he wouldn't have been alone.
- `gs4_12` **빅그베 / BGB** (neutral): 혼자는 아니었을 거야.
  - EN: I don't think he was alone.
- `gs4_13` **그린 / Green** (surprised): 무슨 뜻이야?
  - EN: What do you mean?
- `gs4_14` **빅그베 / BGB** (neutral): 아니. 마지막까지 누군가 곁에 있었으면 좋았겠다는 뜻이야.
  - EN: Nothing. I just wish someone had been there with him.
- `gs4_15` **그린 / Green** (neutral): 그래.
  - EN: Yeah.
- `gs4_16` **빅그베 / BGB** (thinking): 형은 그분이 떨어지고 바로 떠났다고 했지?
  - EN: You said you left right after he fell?
- `gs4_17` **그린 / Green** (neutral): 응.
  - EN: Yes.
- `gs4_18` **빅그베 / BGB** (thinking): 그럼 마지막에 무슨 말을 하셨는지도 모르겠네.
  - EN: Then you wouldn't know what his last words were.
- `gs4_19` **그린 / Green** (surprised): 말을 하셨어?
  - EN: He said something?
- `gs4_20` **나레이션 / Narration** (neutral): (빅그베가 입을 다문다.)
  - EN: (Big Green Bear falls silent.)
- `gs4_21` **빅그베 / BGB** (neutral): 아니. 그냥.
  - EN: No. I was just wondering.
- `tr_4` **빅그베 / BGB** (neutral): 이제 메이의 치료실로 가 보자. 메이와 해야 할 말이 있어.
  - EN: Now to May's clinic. I need to talk to May.

## 4. 메이의 치료실

_에드워드의 손과 목도리 실에 대해 묻는다. 끝나면 혼잣말: 집으로._

- `may9h` **메이 / May** (neutral): 무리하지 마, 빅그베.
  - EN: Don't push yourself, Big Green Bear.
- `may9h_1` **빅그베 / BGB** (neutral): 그린에게 다시 말을 걸어 보자.
  - EN: I should talk to Green again.
- `may2` **메이 / May** (neutral): 또 왔구나.
  - EN: You're back.
- `may2_1` **빅그베 / BGB** (neutral): 한 가지 더 물어보려고.
  - EN: I have one more question.
- `may2_2` **메이 / May** (thinking): 뭔데?
  - EN: What is it?
- `may2_3` **빅그베 / BGB** (thinking): 에드워드 아저씨가 떨어지고도 살아 계셨을 가능성이 있어?
  - EN: Could Edward have survived for a while after the fall?
- `may2_4` **메이 / May** (neutral): 충분히 있어. 다만 정확히 얼마나 버티셨는지는 알 수 없어.
  - EN: It's quite possible. I just can't say for how long.
- `may2_5` **빅그베 / BGB** (neutral): 그렇구나.
  - EN: I see.
- `may2_6` **메이 / May** (neutral): 한 가지 이상한 게 있어.
  - EN: There's one thing I can't explain.
- `may2_7` **빅그베 / BGB** (thinking): 뭔데?
  - EN: What is it?
- `may2_8` **메이 / May** (worried): 에드워드 씨 손에 작은 상처가 있었어. 추락하면서 생긴 상처는 아니야.
  - EN: Edward had a small cut on his hand. It wasn't from the fall.
- `may2_9` **빅그베 / BGB** (thinking): 손에?
  - EN: On his hand?
- `may2_10` **메이 / May** (neutral): 손톱 밑에 노란 실도 끼어 있었고.
  - EN: There was yellow thread caught under his fingernails, too.
- `may2_11` **나레이션 / Narration** (neutral): (빅그베가 자신의 목도리를 내려다본다.)
  - EN: (Big Green Bear glances at his scarf.)
- `may2_12` **빅그베 / BGB** (neutral): 오래된 목도리라 실이 잘 풀려.
  - EN: It's an old scarf. The threads come loose easily.
- `may2_13` **메이 / May** (neutral): 네 목도리 얘긴 안 했는데.
  - EN: I wasn't talking about your scarf.
- `may2_14` **나레이션 / Narration** (neutral): (잠시 침묵.)
  - EN: (A brief silence.)
- `may2_15` **빅그베 / BGB** (neutral): 아, 그렇네.
  - EN: Right. You weren't.
  - 증거+ thread
- `may9` **메이 / May** (neutral): 무리하지 마, 빅그베.
  - EN: Don't push yourself, Big Green Bear.
- `tr_5` **빅그베 / BGB** (thinking): 이제 집으로 돌아가자. 액자를 다시 봐야겠어.
  - EN: Now home. I need another look at that picture frame.

## 5. 빅그베의 집 · 액자

_액자 뒤에 숨긴 장갑과 편지. 끝나면 혼잣말: 방앗간으로._

- `fr6` **나레이션 / Narration** (neutral): (액자 뒤쪽이 조금 벌어져 있다.)
  - EN: (The back of the picture frame is slightly loose.)
- `fr6_1` **나레이션 / Narration** (neutral): (접힌 편지와 오른손 장갑 한 짝이 있다.)
  - EN: (A folded letter and a right-hand glove are hidden behind it.)
- `fr6_2` **빅그베 / BGB** (neutral): 아직 여기 있었네.
  - EN: Still here.
- `fr6_3` **나레이션 / Narration** (neutral): "이번에는 누구의 이름도 지우지 않겠습니다."
  - EN: "This time, I will not erase anyone's name."
- `fr6_4` **나레이션 / Narration** (neutral): (편지 아래쪽에는 에드워드의 서명이 있다.)
  - EN: (Edward's signature appears at the bottom.)
  - 증거+ hidden
- `fr9` **빅그베 / BGB** (thinking): 편지와 장갑은 그대로 두자.
  - EN: I'll leave the letter and the glove where they are.
- `tr_6` **빅그베 / BGB** (neutral): 이제 낡은 방앗간으로 가 보자. 그린과 해야 할 말이 있어.
  - EN: Now to the Old Mill. I have something to say to Green.

## 6. 방앗간 · 그린에게 마지막 질문

_마지막 질문. 끝나면 혼잣말: 광장의 니니에게._

- `gl7` **나레이션 / Narration** (neutral): (빅그베가 방앗간을 다시 찾는다.)
  - EN: (Big Green Bear returns to the mill.)
- `gl7_1` **그린 / Green** (neutral): 또 왔어?
  - EN: Back again?
- `gl7_2` **빅그베 / BGB** (neutral): 하나만 물어보려고.
  - EN: Just one more question.
- `gl7_3` **그린 / Green** (thinking): 뭔데?
  - EN: What is it?
- `gl7_4` **빅그베 / BGB** (thinking): 그날로 돌아갈 수 있다면 어떻게 할 거야?
  - EN: What would you do if you could go back to that night?
- `gl7_5` **그린 / Green** (worried): 아래로 내려갔겠지.
  - EN: I'd have gone downstairs.
- `gl7_6` **빅그베 / BGB** (thinking): 그다음엔?
  - EN: And then?
- `gl7_7` **그린 / Green** (worried): 살아 계셨는지 확인했을 거야.
  - EN: I'd have checked if he was still alive.
- `gl7_8` **빅그베 / BGB** (thinking): 살아 계셨다면?
  - EN: And if he was?
- `gl7_9` **그린 / Green** (neutral): 사람을 불렀겠지. 당연히.
  - EN: I'd have called for help. Of course.
- `gl7_10` **나레이션 / Narration** (neutral): (빅그베가 잠시 그린을 바라본다.)
  - EN: (Big Green Bear looks at Green for a moment.)
- `gl7_11` **그린 / Green** (thinking): 넌?
  - EN: What about you?
- `gl7_12` **빅그베 / BGB** (thinking): 나?
  - EN: Me?
- `gl7_13` **그린 / Green** (thinking): 그날로 돌아갈 수 있다면.
  - EN: If you could go back.
- `gl7_14` **빅그베 / BGB** (neutral): 글쎄.
  - EN: I don't know.
- `gl7_15` **그린 / Green** (neutral): 넌 항상 답을 잘했잖아.
  - EN: You always had an answer for everything.
- `gl7_16` **빅그베 / BGB** (stern): 이번엔 없네.
  - EN: Not this time.
  - 연출 recap
- `tr_7` **빅그베 / BGB** (neutral): 이제 광장으로 가 보자. 니니와 해야 할 말이 있어.
  - EN: Now to the square. I have something to say to Nini.

## 6-2. 방앗간 직후의 긴 독백 (검은 화면 위, 한 단락씩)

_그린과의 마지막 대화(`gl7_16`)가 끝나면 화면이 어두워지고 빅그베의 독백이 한 단락씩 나온다. 이 독백이 끝나면 `tr_7`이 나오고 광장으로 간다._

1. 23년 전, 강이 넘치던 날. 마을의 경고 종은 울리지 않았다.
   - EN: Twenty-three years ago, when the river flooded, the village warning bell never rang.
2. 종은 이미 고장 나 있었다. 여러 번 수리를 요청했지만, 의회는 번번이 미뤘다.
   - EN: The bell had been faulty for some time. Despite repeated repair requests, the council kept putting them off.
3. 그날 형은 나를 구하다 왼쪽 귀를 다쳤다. 하지만 의회는 종을 방치한 책임을 피하려 했고, 결국 형이 종을 망가뜨리고 내가 형을 구한 것으로 기록을 바꿨다.
   - EN: My brother injured his left ear saving me that day. But the council wanted to avoid responsibility for the faulty bell. So they changed the story: my brother was blamed for breaking it, and I was credited with saving him.
4. 에드워드 아저씨는 진실을 알고 있었다. 하지만 의회의 압박에 못 이겨 거짓 기록에 서명했고, 그 선택을 23년 동안 후회했다.
   - EN: Edward knew the truth. But under pressure from the council, he signed the false report, a decision he regretted for twenty-three years.
5. 이제라도 바로잡으려 했던 거겠지. 자정이 되면 모든 걸 밝히려고 했으니까.
   - EN: I suppose he wanted to make things right, even after all these years. He'd planned to tell everyone the truth at midnight.
6. 11시 35분, 다리. 11시 40분, 시계탑 계단. 형은 에드워드 아저씨를 만나러 갔다. 23년 전처럼, 이번에도 나를 지키려 했던 거겠지.
   - EN: 11:35, the bridge. 11:40, the clock tower stairs. My brother went to see Edward. I suppose he was trying to protect me again, just as he had twenty-three years ago.
7. 하지만 에드워드 아저씨는 더 이상 진실을 숨기려 하지 않았다. 형은 그 서류를 빼앗으려 했고, 두 사람은 몸싸움을 벌였다.
   - EN: But Edward refused to bury the truth again. My brother tried to take the papers from him, and they struggled.
8. 서류가 찢어지고, 아저씨는 뒤로 물러나다 열린 정비구 아래로 떨어졌다. 11시 47분, 시계가 멈췄다.
   - EN: The papers tore, and Edward stumbled backward through the open maintenance hatch. At 11:47, the clock stopped.
9. 형은 아래로 내려가 보지 못했다. 아저씨가 살아 있었는지도 모른 채 그곳을 떠났다.
   - EN: My brother couldn't bring himself to go down and check. He left without knowing whether Edward was still alive.
10. 11시 42분, 나는 카페를 나왔다.
   - EN: I left the café at 11:42.
11. 11시 50분. 나는 에드워드 아저씨를 발견했다.
   - EN: 11:50. I found Edward.
   - 연출: 화면에서는 앞부분만 선명하고 나머지 글자는 흐려서 읽히지 않는다.
12. 11시 55분, 비상 종이 울렸다. 그 사이에 무슨 일이 있었는지는 어떤 기록에도 남아 있지 않다.
   - EN: At 11:55, the emergency bell rang. What happened in between was never recorded.
13. 메이 선생님은 조금만 일찍 발견했더라면 결과가 달라졌을지 알 수 없다고 했다. 아마 그건 누구도 끝내 알 수 없을 것이다.
   - EN: May said she couldn't know whether finding him sooner would have changed anything. Perhaps no one ever will.
14. 에드워드 아저씨는 기록을 남기는 이유가 잊지 않기 위해서라고 했다. 하지만 기록되지 않은 일까지 사라지는 건 아니다.
   - EN: Edward used to say we keep records so we won't forget. But something doesn't cease to exist just because it was never written down.
15. 23년 전, 아저씨는 한 가지 진실을 지웠다. 그리고 지금, 내게도 아직 말하지 않은 이야기가 있다.
   - EN: Twenty-three years ago, Edward erased a truth. And now there's a part of this story I haven't told.

## 7. 광장 · 니니 (마지막 선택 직전)

_니니가 묻는다. "그럼 어떻게 하실 거예요?" → 선택지 두 개._

- `fn0` **나레이션 / Narration** (neutral): (마을 광장. 니니가 빅그베를 기다리고 있다.)
  - EN: (In the village square, Nini waits for Big Green Bear.)
- `fn0_1` **니니 / Nini** (thinking): 아저씨! 알아내셨어요?
  - EN: Mr. Bear! Did you figure it out?
- `fn0_2` **빅그베 / BGB** (neutral): 응. 조금은.
  - EN: Yeah. Some of it.
- `fn0_3` **니니 / Nini** (thinking): 그럼 이제 다 끝난 거예요?
  - EN: So is it all over now?
- `fn0_4` **빅그베 / BGB** (thinking): 그건 모르겠네.
  - EN: I'm not sure.
- `fn0_5` **니니 / Nini** (neutral): 에드워드 아저씨가 그러셨는데요.
  - EN: You know what Edward used to say?
- `fn0_6` **빅그베 / BGB** (thinking): 뭐라고?
  - EN: What?
- `fn0_7` **니니 / Nini** (neutral): 기록은 잊지 않으려고 남기는 거래요.
  - EN: He said we keep records so we won't forget.
- `fn0_8` **빅그베 / BGB** (neutral): 그랬지.
  - EN: He did.
- `fn0_9` **니니 / Nini** (thinking): 그런데 왜 어떤 기록은 없어지는 걸까요?
  - EN: Then why do some records disappear?
- `fn0_10` **나레이션 / Narration** (neutral): (빅그베가 대답하지 않는다.)
  - EN: (Big Green Bear says nothing.)
- `fn_b` **니니 / Nini** (thinking): 아저씨?
  - EN: Mr. Bear?
- `fn_b_1` **빅그베 / BGB** (thinking): 응?
  - EN: Yeah?
- `fn_b_2` **니니 / Nini** (thinking): 제 말 듣고 계셨어요?
  - EN: Were you listening?
- `fn_b_3` **빅그베 / BGB** (neutral): 응. 듣고 있었어.
  - EN: Yeah. I was listening.
- `fn_ch` **니니 / Nini** (neutral): 그럼 어떻게 하실 거예요?
  - EN: So what are you going to do?
  - ▶ 선택 `fnA`: 편지를 건넨다 / Hand Over the Letter
  - ▶ 선택 `fnB`: 편지를 간직한다 / Keep the Letter

## 엔딩 A: 편지를 건넨다

- `fnA` **나레이션 / Narration** (neutral): (빅그베가 니니에게 편지를 건넨다.)
  - EN: (Big Green Bear hands Nini the letter.)
- `fnA_1` **니니 / Nini** (neutral): 에드워드 아저씨 글씨네요.
  - EN: That's Edward's handwriting.
- `fnA_2` **빅그베 / BGB** (neutral): 응.
  - EN: Yeah.
- `fnA_3` **니니 / Nini** (thinking): 이거 기록관에 가져다 놓을까요?
  - EN: Should I take it to the Archive?
- `fnA_4` **빅그베 / BGB** (neutral): 그래.
  - EN: Yes.
- `fnA_5` **니니 / Nini** (neutral): 아저씨도 같이 가요.
  - EN: Come with me.
- `fnA_6` **나레이션 / Narration** (neutral): (빅그베가 잠시 머뭇거린다.)
  - EN: (Big Green Bear hesitates.)
- `fnA_7` **빅그베 / BGB** (neutral): 잠깐만.
  - EN: Just a second.
- `fnA_8` **나레이션 / Narration** (neutral): (그가 주머니에서 오른손 장갑을 꺼낸다.)
  - EN: (He takes the right-hand glove from his pocket.)
- `fnA_9` **니니 / Nini** (thinking): 이건 뭐예요?
  - EN: What's that?
- `fnA_10` **빅그베 / BGB** (neutral): 편지랑 같이 있었어.
  - EN: It was with the letter.
- `fnA_11` **니니 / Nini** (thinking): 어디서요?
  - EN: Where?
- `fnA_12` **나레이션 / Narration** (neutral): (빅그베가 니니를 바라본다.)
  - EN: (Big Green Bear looks at Nini.)
- `fnA_13` **빅그베 / BGB** (relieved): 그 얘기도 해야겠지.
  - EN: I suppose I should tell you that, too.
  - 연출 theend1

## 엔딩 B: 편지를 간직한다

- `fnB` **니니 / Nini** (thinking): 아저씨?
  - EN: Mr. Bear?
- `fnB_1` **빅그베 / BGB** (worried): 미안. 무슨 얘기였지?
  - EN: Sorry. What were we talking about?
- `fnB_2` **니니 / Nini** (surprised): 기록이요!
  - EN: Records!
- `fnB_3` **빅그베 / BGB** (neutral): 아, 맞다.
  - EN: Right.
- `fnB_4` **니니 / Nini** (neutral): 아저씨는 에드워드 아저씨처럼 좋은 사람이에요.
  - EN: You're a good person, just like Edward.
- `fnB_5` **빅그베 / BGB** (thinking): 그렇게 생각해?
  - EN: You think so?
- `fnB_6` **니니 / Nini** (surprised): 당연하죠!
  - EN: Of course!
- `fnB_7` **나레이션 / Narration** (neutral): (니니가 웃는다.)
  - EN: (Nini smiles.)
- `fnB_8` **니니 / Nini** (neutral): 안녕하세요! 안녕하세요!
  - EN: Hello! Hello!
- `fnB_9` **빅그베 / BGB** (laugh): 안녕! 안녕!
  - EN: Hello! Hello!
- `fnB_10` **나레이션 / Narration** (neutral): (니니가 떠난다. 빅그베가 집으로 돌아온다.)
  - EN: (Nini walks away. Big Green Bear returns home.)
  - 연출 walk
- `fnB_11` **나레이션 / Narration** (neutral): (그는 액자 뒤에 편지와 장갑을 넣는다. 장갑을 밀어 넣다가 무언가 손끝에 걸린다.)
  - EN: (He hides the letter and glove behind the picture frame. Something catches against his fingertips.)
- `fnB_12` **나레이션 / Narration** (neutral): (작은 황동 단추다. 단추에는 작은 글씨가 새겨져 있다.)
  - EN: (A small brass button. Tiny letters are engraved on it.)
  - 증거+ button
- `fnB_13` **나레이션 / Narration** (neutral): E. BELL
  - EN: E. BELL
- `fnB_14` **나레이션 / Narration** (neutral): (빅그베가 단추를 손바닥에 올려놓는다.)
  - EN: (Big Green Bear rests the button in his palm.)
- `fnB_15` **나레이션 / Narration** (neutral): (짧은 회상. 눈 덮인 바닥. 에드워드의 손이 빅그베의 노란 목도리를 붙잡는다.)
  - EN: (Brief flashback. Snow-covered ground. Edward's hand grips Big Green Bear's yellow scarf.)
- `fnB_16` **에드워드 / Edward** (thinking): 잠깐...
  - EN: Wait...
- `fnB_17` **나레이션 / Narration** (neutral): (현재. 빅그베가 단추를 편지 사이에 끼운다. 액자를 다시 세운다.)
  - EN: (Present. Big Green Bear slips the button between the folded pages and puts the picture frame back.)
  - 연출 theend2

## 엔딩 연출 · 타이틀 (화면 문구)

**엔딩 A: 남겨진 기록 / The Record That Remained**
- 마지막 줄 이후: 시계탑 스틸(11:48, 니니가 기록)이 천천히 나타남 → 약 5초 유지 → 검은 화면 → "엔딩 A / 남겨진 기록" (EN: ENDING A / The Record That Remained) → "빅그베의 모험 2 · *은폐*" (EN: Big Green Bear's Adventure II · *The Cover-Up*) → 크레딧

**엔딩 B: 좋은 사람 / A Good Person**
- 마지막 줄 이후: 사진 스틸(액자 속 두 곰, 편지, 장갑) 약 3.5초 → 검은 화면 → "엔딩 B / 좋은 사람" (EN: ENDING B / A Good Person) → 같은 타이틀 → 크레딧

