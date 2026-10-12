[Case File V2 · 파트 1/3 · 이어서 파트 2을 보냅니다]


# Case File 보완안 (Loki 심사 반영)

Thor → Loki · 코드 수정 전 제출 자료 6종. 이번 문서는 어떤 코드도 바꾸지 않았다.

**Loki 지시 반영 요약**

- 증거는 **삭제·ID 통합 없음**. 55개 ID와 획득 상태를 그대로 두고, 묶음은 화면 표시 수준에서만 한다.
- 이전 문서의 **정정**: ①「hatch=hatch2」, 「hide·glove·letter→hidden」 통합 주장을 철회(별개 이벤트로 유지). ②「유지」로 분류했던 photo2, bellrec, photo_home은 현재 **도달 불가**(2번 표). ③ 타임라인에서 11:46, 11:48, 11:50, 11:55를 제외. ④ 인물 카드의 그린 흉터·손잡이를 첫 만남에서 제거(단계 공개).
- 자동 노트는 새 UI에서 숨기기만 하고 저장 데이터는 보존.

## 1. 증거 55개 최종 분류와 ID 유지 계획

**원칙**: 모든 ID, 획득 상태(`S.ev`), 설명 원문 보존. 추가하는 것은 표시 전용 메타데이터(`group`, `kind`, `reach`, `holder`)뿐이다. 물리적 삭제는 하지 않고, 도달 불가 항목은 「비활성」 표시만 한다.

| 분류                                                      | 개수 | 의미                                                                                |
|-----------------------------------------------------------|------|-------------------------------------------------------------------------------------|
| 도달 가능                    | 25   | 지금 플레이에서 실제로 얻을 수 있다 (코드 읽기 기준)                                |
| 도달 불가(상호작용 게이트) | 12   | 새 스크립트용 대사가 있는데 상호작용이 옛 플래그에 묶여 닿지 않는다. 연결 복구 후보 |
| 도달 불가(옛 대사 사슬)    | 12   | 옛 6·7장 대사에서만 지급. 진입 대사가 옛 플래그에 묶임                              |
| 연출 점프로만 지급         | 4    | 연출 모드 점프에서만 지급                                                           |
| 참조 없음                   | 2    | 어디서도 지급·참조 없음                                                             |

도달 판정은 코드 읽기와 참조 추적 결과이며, 실제 플레이로 전부 검증하지는 않았다. 검증 계획은 6번.

<table style="width:100%;">
<colgroup>
<col style="width: 16%" />
<col style="width: 16%" />
<col style="width: 16%" />
<col style="width: 16%" />
<col style="width: 16%" />
<col style="width: 16%" />
</colgroup>
<thead>
<tr class="header">
<th>증거 (ID)</th>
<th>분류</th>
<th>획득 경로</th>
<th>시점</th>
<th>메모</th>
<th>화면 묶음(표시만)</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>추모의 종 공고</strong><br />
notice</td>
<td>도달 가능</td>
<td>광장 표지판 (IA sign)</td>
<td>프롤로그~1장</td>
<td></td>
<td>광장</td>
</tr>
<tr class="even">
<td><strong>에드워드가 발견된 곳</strong><br />
found_loc</td>
<td>도달 가능</td>
<td>토미 질문 tq1</td>
<td>1장</td>
<td></td>
<td>장소</td>
</tr>
<tr class="odd">
<td><strong>진술: 토미</strong><br />
stmt_tm</td>
<td>도달 가능</td>
<td>토미 질문 tq2, tm1e</td>
<td>1장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="even">
<td><strong>진술: 니니</strong><br />
stmt_nini</td>
<td>도달 가능</td>
<td>니니 질문 nq2</td>
<td>1장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="odd">
<td><strong>니니의 공책</strong><br />
notebook</td>
<td>도달 가능</td>
<td>니니 질문 nq3</td>
<td>1장</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="even">
<td><strong>진술: 니니의 인사</strong><br />
greet</td>
<td>도달 가능</td>
<td>프롤로그 니니 대화 p_n5</td>
<td>프롤로그</td>
<td>목격 진술 성격</td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="odd">
<td><strong>진술: 올리버</strong><br />
stmt_ck</td>
<td>도달 가능</td>
<td>올리버 질문 oq1</td>
<td>2장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="even">
<td><strong>멈춰 선 시계</strong><br />
clock</td>
<td>도달 가능</td>
<td>시계탑 내부 tw_clk</td>
<td>2장</td>
<td>탑시계 11:47</td>
<td>시계</td>
</tr>
<tr class="odd">
<td><strong>시계 장치의 긁힌 자국</strong><br />
mech</td>
<td>도달 가능</td>
<td>시계탑 내부 tw_mech</td>
<td>2장</td>
<td></td>
<td>시계</td>
</tr>
<tr class="even">
<td><strong>열린 정비구</strong><br />
hatch2</td>
<td>도달 가능</td>
<td>시계탑 내부 tw_hatch</td>
<td>2장</td>
<td>정비구</td>
<td>시계탑 현장</td>
</tr>
<tr class="odd">
<td><strong>에드워드의 깨진 회중시계</strong><br />
pwatch</td>
<td>도달 가능</td>
<td>시계탑 내부 tw_pw</td>
<td>2장</td>
<td>모순용 개별 선택 유지</td>
<td>시계 (모순용 개별)</td>
</tr>
<tr class="even">
<td><strong>23년 전 경고 종 사고</strong><br />
bellinc</td>
<td>도달 가능</td>
<td>몰리 ml2</td>
<td>3장</td>
<td></td>
<td>23년 전</td>
</tr>
<tr class="odd">
<td><strong>23년 전 사고 보고서</strong><br />
oldrep</td>
<td>도달 가능</td>
<td>기록관 오브젝트 ar_rep</td>
<td>3장</td>
<td></td>
<td>23년 전</td>
</tr>
<tr class="even">
<td><strong>보류된 정비 요청서</strong><br />
mreq</td>
<td>도달 가능</td>
<td>기록관 오브젝트 ar_req</td>
<td>3장</td>
<td></td>
<td>23년 전</td>
</tr>
<tr class="odd">
<td><strong>사라진 붉은 장부</strong><br />
noledger</td>
<td>도달 가능</td>
<td>기록관 오브젝트 ar_shelf</td>
<td>3장</td>
<td></td>
<td>23년 전</td>
</tr>
<tr class="even">
<td><strong>에드워드의 편지 초안</strong><br />
draft</td>
<td>도달 가능</td>
<td>기록관 오브젝트 ar_desk</td>
<td>3장</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="odd">
<td><strong>자정 공개 메모</strong><br />
mnote</td>
<td>도달 가능</td>
<td>기록관 오브젝트 ar_note</td>
<td>3장</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="even">
<td><strong>카페 영수증</strong><br />
receipt</td>
<td>도달 가능</td>
<td>헤이즐 hq1, h1c</td>
<td>1~2장 (카페 게이트 확인 필요)</td>
<td>영수증 11:42</td>
<td>카페</td>
</tr>
<tr class="odd">
<td><strong>진술: 헤이즐</strong><br />
stmt_hz</td>
<td>도달 가능</td>
<td>헤이즐 h1a</td>
<td>1~2장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="even">
<td><strong>카페 계산서(오후)</strong><br />
tab_pm</td>
<td>도달 가능</td>
<td>헤이즐 h3c</td>
<td>1~2장</td>
<td>오후 계산서</td>
<td>카페</td>
</tr>
<tr class="odd">
<td><strong>추정 사망 시간</strong><br />
tod</td>
<td>도달 가능</td>
<td>메이 may0</td>
<td>5~6장 (치료사 집 게이트)</td>
<td>11:55~12:15</td>
<td>소견</td>
</tr>
<tr class="even">
<td><strong>노란 실</strong><br />
thread</td>
<td>도달 가능</td>
<td>메이 may2</td>
<td>6장 (fin.s4 이후)</td>
<td></td>
<td>소견</td>
</tr>
<tr class="odd">
<td><strong>찢어진 서류</strong><br />
tdoc</td>
<td>도달 가능</td>
<td>방앗간 mdoc (mo_doc)</td>
<td>6장</td>
<td></td>
<td>23년 전</td>
</tr>
<tr class="even">
<td><strong>숨겨진 편지와 장갑</strong><br />
hidden</td>
<td>도달 가능</td>
<td>오두막 액자 fr6</td>
<td>6장 (fin.may2 이후)</td>
<td>편지+장갑을 한 대사에서 지급</td>
<td>숨긴 물건 (한 묶음, 획득은 각각)</td>
</tr>
<tr class="odd">
<td><strong>황동 단추, E. BELL</strong><br />
button</td>
<td>도달 가능</td>
<td>6장 마지막 선택 부근 (fn_ch 근처 노드)</td>
<td>6장 끝</td>
<td>정확한 지급 시점 확인 필요</td>
<td>흔적</td>
</tr>
<tr class="even">
<td><strong>두 번째 사진</strong><br />
photo2</td>
<td>도달 불가(상호작용 게이트)</td>
<td>기록관 「서랍(draw)」 ar_ph/ar_re4</td>
<td>3장 의도</td>
<td>상호작용이 c6.on에 묶여 현재 없음</td>
<td>사진</td>
</tr>
<tr class="odd">
<td><strong>오래된 종 관리 기록</strong><br />
bellrec</td>
<td>도달 불가(상호작용 게이트)</td>
<td>기록관 「장부(ledger)」 ld4</td>
<td>3장 의도</td>
<td>상호작용이 c6.on에 묶여 현재 없음</td>
<td>23년 전</td>
</tr>
<tr class="even">
<td><strong>홍수 연도 장부</strong><br />
register</td>
<td>도달 불가(상호작용 게이트)</td>
<td>기록관 「등록부(reg)」 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>23년 전</td>
</tr>
<tr class="odd">
<td><strong>사진(집에 둔 것)</strong><br />
photo_home</td>
<td>도달 불가(상호작용 게이트)</td>
<td>오두막 액자 p_f0</td>
<td>프롤로그 의도</td>
<td>프롤로그 액자 상호작용 제거 후 분기가 닿지 않음</td>
<td>사진</td>
</tr>
<tr class="even">
<td><strong>기어 해치</strong><br />
hatch</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="odd">
<td><strong>구부러진 추 막대</strong><br />
pendulum</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계</td>
</tr>
<tr class="even">
<td><strong>비상 손종</strong><br />
handbell</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="odd">
<td><strong>뒷문</strong><br />
chute</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="even">
<td><strong>눈 녹은 물 자국</strong><br />
melt</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="odd">
<td><strong>계단의 발자국</strong><br />
boots</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="even">
<td><strong>바퀴 구덩이</strong><br />
pit</td>
<td>도달 불가(상호작용 게이트)</td>
<td>시계탑 inspect</td>
<td>옛 6장</td>
<td>c6.turn 게이트</td>
<td>시계탑 현장</td>
</tr>
<tr class="odd">
<td><strong>야간 경비 토미의 순찰 일지</strong><br />
patrol</td>
<td>도달 불가(상호작용 게이트)</td>
<td>광장 우체통 inspect</td>
<td>옛 6장</td>
<td>c6.on 게이트</td>
<td>토미의 일지</td>
</tr>
<tr class="even">
<td><strong>Green의 진술: 그날 밤</strong><br />
acct_gr</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>g6_3</td>
<td>옛 6장</td>
<td>진입 대사가 옛 플래그</td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="odd">
<td><strong>치료사의 소견</strong><br />
report</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>hl3</td>
<td>옛 6장</td>
<td>tod, thread가 대체한 것으로 보임</td>
<td>소견</td>
</tr>
<tr class="even">
<td><strong>에드워드의 회중시계</strong><br />
watch</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>hl4</td>
<td>옛 6장</td>
<td>pwatch와 같은 물건인지 확인 필요</td>
<td>시계 (pwatch와 관계 확인)</td>
</tr>
<tr class="odd">
<td><strong>진술: 올리버의 두 번째 증언</strong><br />
stmt_ck2</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>ck6_2</td>
<td>옛 6장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="even">
<td><strong>에드워드의 주먹 속 겨자색 털실</strong><br />
wool</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>ck6_3</td>
<td>옛 6장</td>
<td>노란 실(thread)과 관계 확인 필요</td>
<td>흔적</td>
</tr>
<tr class="odd">
<td><strong>토미의 일지, 밤 늦은 기록</strong><br />
patrol2</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>tm6_1</td>
<td>옛 6장</td>
<td></td>
<td>토미의 일지</td>
</tr>
<tr class="even">
<td><strong>카페에서 탑까지의 걸음</strong><br />
walk</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>h6_4</td>
<td>옛 6장</td>
<td></td>
<td>카페</td>
</tr>
<tr class="odd">
<td><strong>사진 뒤의 틈</strong><br />
hide</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>p6_f1</td>
<td>옛 6장</td>
<td>hidden과 별개 이벤트로 보존</td>
<td>숨긴 물건</td>
</tr>
<tr class="even">
<td><strong>오른손 장갑 한 짝</strong><br />
glove</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>p6_f2</td>
<td>옛 6장</td>
<td>hidden과 별개 이벤트로 보존</td>
<td>숨긴 물건</td>
</tr>
<tr class="odd">
<td><strong>"G"에게 쓴 편지</strong><br />
letter</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>p6_f3</td>
<td>옛 6장</td>
<td>hidden과 별개 이벤트로 보존</td>
<td>숨긴 물건</td>
</tr>
<tr class="even">
<td><strong>Green의 이유</strong><br />
motive</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>g7_7</td>
<td>옛 7장</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
<tr class="odd">
<td><strong>에드워드의 마지막 기록</strong><br />
record</td>
<td>도달 불가(옛 대사 사슬)</td>
<td>rec0</td>
<td>옛 7장</td>
<td>tdoc와 겹침 여부 확인 필요</td>
<td>23년 전</td>
</tr>
<tr class="even">
<td><strong>봉인된 편지 두 통</strong><br />
letters</td>
<td>연출 점프로만 지급</td>
<td>디렉터 점프 SKIP_STEPS만</td>
<td>—</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="odd">
<td><strong>찢어진 공책 한 장</strong><br />
torn_page</td>
<td>연출 점프로만 지급</td>
<td>디렉터 점프만</td>
<td>—</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="even">
<td><strong>에드워드의 서랍 열쇠</strong><br />
key</td>
<td>연출 점프로만 지급</td>
<td>디렉터 점프만</td>
<td>—</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="odd">
<td><strong>카페 빵 봉투와 찻잎 통</strong><br />
bread</td>
<td>연출 점프로만 지급</td>
<td>디렉터 점프만</td>
<td>—</td>
<td></td>
<td>카페</td>
</tr>
<tr class="even">
<td><strong>잠긴 서랍장</strong><br />
drawers</td>
<td>참조 없음</td>
<td>—</td>
<td>—</td>
<td></td>
<td>편지·메모</td>
</tr>
<tr class="odd">
<td><strong>진술: Green</strong><br />
stmt_gr</td>
<td>참조 없음</td>
<td>—</td>
<td>—</td>
<td></td>
<td>진술 (인물 탭 표시, 추리에서 선택 가능)</td>
</tr>
</tbody>
</table>

### ID 유지 규칙

- `hide`, `glove`, `letter`, `hidden`은 서로 다른 ID와 획득 이벤트로 유지. 묶음 카드 안에서 따로 보이고 따로 선택된다.
- `hatch`(발견 장소와 헐거운 걸쇠)와 `hatch2`(눈 덮인 지면과 쓸린 흔적)는 설명이 다르므로 같은 물건으로 확정하지 않는다. 씬 구조 확인 후 결정.
- 도달 불가 항목은 삭제하지 않고 `reach:"dormant"`로 표시한다. 연결을 복구할지는 스토리 결정.

