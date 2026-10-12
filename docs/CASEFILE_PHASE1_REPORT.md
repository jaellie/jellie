# Case File Phase 1 제출물 (Thor → Loki)

상태: Phase 1 구현 완료. 금지 사항(ID 삭제·통합, c6/c7 플래그 교체, 엔딩·챕터 진행 변경, 새 스토리 사실, 미승인 추리 결론)은 하나도 하지 않았다.

## 1. 변경 파일 및 함수 목록

파일: `prototype/bell_village_web/index.html` 한 개.

| 변경 | 내용 |
|---|---|
| 추가 `EV_META` | 증거 55개 전부에 `[group, kind, reach, why, holder]`를 붙이는 표시 전용 표. 적용 코드가 각 `EV[id]`에 `group/kind/reach/why/holder`를 덧붙임 (기존 필드 변경 없음) |
| 추가 `evGroups()` | 가진 증거를 묶음별로 보여 주는 파생 데이터. 소유 상태는 바꾸지 않음 |
| 추가 `evStatements(person)` | 인물별 진술 목록. 추리 노트에서 증거처럼 고를 수 있도록 같은 ID를 그대로 사용 |
| 추가 `PEOPLE`, `personView(id)`, `metPeople()` | 인물 8명 데이터 구조. 만나지 않은 인물은 카드, 칸, 개수 모두 없음(`null`). 아직 화면에는 연결하지 않음 |
| 추가 `autoNotes()` | 자동 노트를 노트 탭 본문 대신 접힌 「보관된 자동 기록 (N)」으로 표시. `S.notes`는 그대로 |
| 수정 `renderEvGrid()` | 모르는 증거 ID(손상·신규 저장)는 `S.ev`에 남기되 그리지 않음. 기존에는 증거 탭이 오류로 멈췄다 |
| 수정 `window.__bv` | 테스트용으로 위 함수 노출 |

변경하지 않은 것: `S.ev`, `S.notes`, `S.flags` 구조와 값, 모든 `c6.*`, `c7.*`, `dd*` 플래그, 상호작용 목록(IA), 대사, 엔딩.

## 2. 증거 55개 메타데이터 매핑

`reach: dormant`는 내부 상태 전용이며 화면에 회색 카드로 보이지 않는다. 이전 저장에서 얻은 증거는 지금처럼 증거 탭에서 그대로 읽을 수 있다. (why: gate=상호작용 게이트, old=옛 대사 사슬, jump=연출 점프 전용, none=참조 없음)

| ID | group | kind | reach | holder |
|---|---|---|---|---|
| `notice` | plaza | document | live | null |
| `found_loc` | place | scene | live | tm |
| `stmt_tm` | statements | statement | live | tm |
| `stmt_nini` | statements | statement | live | nini |
| `notebook` | letters | document | live | nini |
| `greet` | statements | statement | live | nini |
| `stmt_ck` | statements | statement | live | ck |
| `clock` | clock | physical | live | null |
| `mech` | clock | physical | live | null |
| `hatch2` | tower | physical | live | null |
| `pwatch` | clock | physical | live | ed |
| `bellinc` | past23 | history | live | mo |
| `oldrep` | past23 | document | live | null |
| `mreq` | past23 | document | live | null |
| `noledger` | past23 | document | live | null |
| `draft` | letters | document | live | ed |
| `mnote` | letters | document | live | ed |
| `receipt` | cafe | document | live | hz |
| `stmt_hz` | statements | statement | live | hz |
| `tab_pm` | cafe | document | live | hz |
| `tod` | medical | medical | live | hl |
| `thread` | medical | trace | live | hl |
| `tdoc` | past23 | document | live | gr |
| `hidden` | hiding | document | live | null |
| `button` | trace | trace | live | null |
| `photo2` | photos | photo | dormant (gate) | null |
| `bellrec` | past23 | document | dormant (gate) | ed |
| `register` | past23 | document | dormant (gate) | ed |
| `photo_home` | photos | photo | dormant (gate) | null |
| `hatch` | tower | physical | dormant (gate) | null |
| `pendulum` | clock | physical | dormant (gate) | null |
| `handbell` | tower | physical | dormant (gate) | null |
| `chute` | tower | physical | dormant (gate) | null |
| `melt` | tower | trace | dormant (gate) | null |
| `boots` | tower | trace | dormant (gate) | null |
| `pit` | tower | physical | dormant (gate) | null |
| `patrol` | patrol | document | dormant (gate) | tm |
| `acct_gr` | statements | statement | dormant (old) | gr |
| `report` | medical | medical | dormant (old) | hl |
| `watch` | clock | physical | dormant (old) | ed |
| `stmt_ck2` | statements | statement | dormant (old) | ck |
| `wool` | trace | trace | dormant (old) | null |
| `patrol2` | patrol | document | dormant (old) | tm |
| `walk` | cafe | scene | dormant (old) | null |
| `hide` | hiding | physical | dormant (old) | null |
| `glove` | hiding | physical | dormant (old) | null |
| `letter` | hiding | document | dormant (old) | ed |
| `motive` | statements | statement | dormant (old) | gr |
| `record` | past23 | document | dormant (old) | ed |
| `letters` | letters | document | dormant (jump) | ed |
| `torn_page` | letters | document | dormant (jump) | nini |
| `key` | letters | physical | dormant (jump) | nini |
| `bread` | cafe | trace | dormant (jump) | hz |
| `drawers` | letters | physical | dormant (none) | null |
| `stmt_gr` | statements | statement | dormant (none) | gr |

## 3. S1~S10 테스트 결과

방법: Playwright로 저장 픽스처를 주입하고, 변경 전(HEAD) 버전과 변경 후 버전을 각각 불러 4개 탭과 서브뷰를 모두 연 뒤 `S.ev`, `S.notes`, `S.flags`를 비교했다.

| 픽스처 | 결과 | S.ev | S.notes 개수 (전 → 후) | 인물·증거 탭에 그린 텍스트 |
|---|---|---|---|---|
| S1 new game | 통과 | 0 | 0 → 0 | 없음 |
| S2 ch1 mid | 통과 | 4 | 1 → 1 | 없음 |
| S3 ch2 clocks | 통과 | 9 | 2 → 2 | 없음 |
| S4 ch3 quiz | 통과 | 10 | 1 → 1 | 없음 |
| S5 flashback | 통과 | 1 | 0 → 0 | 없음 |
| S6 ch6 final | 통과 | 5 | 1 → 1 | 없음 |
| S7 ending | 통과 | 2 | 1 → 1 | 없음 |
| S8 old save | 통과 | 7 | 80 → 80 | 없음 |
| S9 broken | 통과 | 2 | 1 → 1 | 없음 |
| S10 english | 통과 | 3 | 1 → 1 | 없음 |

합격 조건 점검:
- `S.ev`, `S.notes` 내용과 순서가 HEAD와 동일 (전체 픽스처 통과). S9는 HEAD가 오류를 내서 비교 대신 「저장한 값과 동일」로 확인.
- 그린이 공개되기 전(S1~S5, S7)에 인물·증거 탭 화면에 「그린/Green」 글자, 빈 슬롯, 인원수가 나오지 않음. `personView('gr')`는 `fin.m1` 전까지 null.
- 한국어·영어 모두 오류 없음(S10). 증거 ID는 언어와 무관하게 같은 키를 사용.
- 옛 결론 로직이 숨겨진 UI 뒤에서 진행 상태를 바꾸는지: 모든 픽스처에서 `S.flags` 목록이 HEAD와 동일.

한계: 픽스처는 코드의 플래그 구성을 흉내 낸 합성 저장이다. 실제 플레이로 만든 저장은 아니다. 「도달 가능 25개」도 여전히 코드 분석 결과이며 플레이 검증 완료가 아니다.

발견: 손상된 저장(알 수 없는 증거 ID)에서 기존 증거 탭이 오류로 멈추는 문제가 있었고, 위 `renderEvGrid()` 수정으로 고쳤다.

## 4. 신규·기존 저장 호환성 결과

- 기존 저장 10종 + 새 게임: 불러오기 오류 0, 저장 키 `bgb2.bellvillage.proto.v2` 형식 변경 없음.
- 롤백: 메타데이터와 표시 변경뿐이라 이전 버전으로 되돌려도 저장이 깨지지 않는다.

## 5. Phase 2용 챕터별 공개 조건표 초안 (코드에서 읽은 값)

| 챕터 | 열리는 것 | 코드 조건 | 비고 |
|---|---|---|---|
| 프롤로그 | 니니의 인사 | 프롤로그 니니 대화 | `greet` |
| 1장 | 토미·니니 질문, 공고 | `nin.met`, `nini.done`, `tm.stmt`, `c1.found` → `q1`, `ch.2` | |
| 2장 | 올리버, 시계탑 4개 조사 | `ck.bear`, `!c6.on` 오브젝트(pw, hatch2, mech, clock) → `dd02`, `ch.3` | `!c6.on`이 현재 기능을 켬 |
| 3장 | 몰리, 기록관 5개 오브젝트, 퀴즈 | `mol.met`, `mol.bell`, `ar.rep/req/shelf/drawer/note` → `c3.qz` | |
| 4~5장 | 회상 | `f4.*`, `f5.*` | |
| 6장 | 방앗간·치료사·오두막·마지막 선택 | `fin.on`, `fin.m1`, `fin.o1~o3`, `fin.s4`, `fin.may2`, `fin.frame`, `fin.last`, `fn_ch` | 그린은 `fin.m1` 이후에만 만남 |

c6.on 긍정/부정 분석:
- 부정형 `!c6.on` (현재 작동 중): 시계탑 `pw`, `hatch2`, `mech`, 기록관 `orep`, `oreq`, `oshelf`, `onote`, `odesk`.
- 긍정형 `c6.on` (도달 불가): 시계탑 `bell/boots/hatch/pend/melt/chute`, 광장 `post`, `clock` 점검, 기록관 `reg/ledger/draw`, 사건 파일의 정체 보드·책임 보드.

## 6. 복구 3종 설계와 테스트 케이스 (코드 변경 없음, 별도 승인 대기)

중요: 설계 중에 승인 전에 풀어야 할 충돌 2건을 발견했다.

### photo2 (두 번째 사진)
- 현재: 기록관 「서랍(draw)」 상호작용이 `c6.on`에 묶여 닿지 않음. 대사 `ar_ph`/`ar_re4`는 이미 새 스크립트 문장이다.
- 설계안: `ar.drawer`(책상 조사) 이후에만 보이는 새 상호작용 하나를 추가하고 `ar_ph`로 연결. 퀴즈 조건(`ar.*` 5개)에는 포함하지 않아 3장 진행을 건드리지 않는다.
- 해설 금지: `ar_re4`는 날짜만 적힌 사실 서술이라 의미를 해설하지 않는다. 확인 필요.
- 테스트: ① 서랍 조사 전에는 상호작용이 안 보임 ② 조사 후 1회 획득, 재조사 시 중복 지급 없음 ③ 퀴즈 트리거 시점 변화 없음 ④ 기존 저장에서 `ar.photo` 있는 경우 재지급 안 됨.

### bellrec (오래된 종 관리 기록)
- 현재: 「장부(ledger)」 상호작용(`ld`~`ld4`)이 `c6.on`에 묶임.
- **충돌**: 새 스크립트에서는 붉은 장부가 사라졌다(`noledger`: 「서류장에서 붉은 장부가 사라졌다」). 옛 `ld` 사슬은 잠긴 장부 안에서 기록을 꺼내는 이야기라 새 설정과 모순된다. 그대로 복구하면 안 된다.
- 필요한 결정: 23년 전 관리 기록을 어디서 찾을지(다른 기록관 오브젝트, 방앗간 등). 새 스토리 사실이 되므로 제작자 승인이 필요하다.

### photo_home (오두막의 사진)
- 현재: 오두막 액자 대사 `p_f0`가 어떤 상호작용으로도 닿지 않는다(액자는 6장 `fin.may2` 이후에만 열림).
- **충돌**: 제작자가 앞서 「프롤로그에서 사진 보는 상호작용을 없애 달라」고 요청했다. Loki의 「프롤로그에서 다시 살펴볼 기회」와 반대 방향이다.
- 필요한 결정: ① 프롤로그 복구(제작자 이전 요청 번복), ② 다른 시점(예: 3장 이후 귀가 때)에 획득, ③ 비활성 유지. 액자 뒤 숨김 물건(`hidden`) 획득과는 별개 이벤트로 유지한다.

## 7. 다음 단계
- Loki 확인 후 Phase 2 대상: 공개 조건표 확정, 복구 3종 중 충돌 2건 결정, 4탭 UI 개편, 질문 Q1~Q6 구현(Q2·Q3·Q6 중립 문구, Q7②는 비활성).
