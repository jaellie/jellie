# Claude Design에 붙여넣을 프롬프트 (2026-09-27 · 2차)

```
엔진 파일을 첨부한 새 lovesim-engine.js로 통째로 교체해줘. (지난번 프롬프트 내용은 그대로 유지하고, 아래만 추가/수정)

1. 시작 화면 — "태어난 곳" 추가 (점성술은 태어난 장소가 있어야 정확해)
   - "태어난 시간" 바로 아래에 "태어난 곳" 입력칸. 기본값 "서울".
   - 자동완성 목록: LoveSim.birthplaceOptions("ko") → [{ id, name, country }] (한국 도시 먼저, 그다음 해외 도시). <datalist>나 드롭다운으로.
   - 입력할 때마다 LoveSim.findPlace(입력값) 확인:
     찾으면 작은 초록 글씨 "✓ 부산 (Busan)", 못 찾으면 작은 빨간 글씨 "목록에 없는 곳이에요 — 가장 가까운 도시를 골라주세요".
   - "운명의 상대"에도 "그 사람이 태어난 곳 (선택, 비우면 나와 같은 곳)" 입력칸 추가 (같은 자동완성).
   - 넘기는 방법:
     LoveSim.createGame({ ..., birthplace: "부산", fated: { ..., birthplace: "도쿄" } })

2. 인생 이벤트 팝업 (새로 생긴 약 300개의 이벤트)
   - popup.source === "event" 인 팝업도 다른 팝업과 똑같이 처리해줘.
   - popup.big === true 면 지금의 "인생의 큰 사건" 팝업(파란 배너 popup.title + 가운데 그림 popup.scene)과 똑같이.
   - 선택 후 결과(choose())가 여러 문장일 수 있어 (예: 커밍아웃 후 가족 한 명 한 명의 반응). 결과 영역이 길어지면 팝업이 세로로 늘어나게.

3. 새 말하는 사람(popup.who) — 이름은 늘 popup.name 을 그대로 쓰면 돼
   - 사람: police(경찰), lawyer(변호사), fortune(점집 할머니), neighbor(이웃), loanShark(사채업자), cultist(포교하던 사람), landlord(집주인), reporter(기자), scout(캐스팅 담당자), teacher(담임 선생님), counselor(상담 선생님), sibling(형제), kid(아이), ex(전 연인)
     → 얼굴은 popup.gender + popup.seed 로 그리는 일반 캐릭터.
   - 사람이 아닌 것: app(알림), bank(은행), card(카드사), insurer(보험사), tax(세무서), officer(병무청), unknown(모르는 번호)
     → 얼굴 대신 작은 픽셀 아이콘 (📱 🏦 💳 📄 ✉️ 느낌).

4. "시간이 흐른다…" 화면
   - endDay() 결과의 r.notes = 그 사이에 (화면 밖에서) 일어난 일들.
     예) "사채 — 불법 이자는 무효라고 했다. 원금만 갚기로 했다."
   - 카드 위에 작은 글씨로 한 줄씩 보여줘 (앞에 "· ").
   - 카드 kind "EVENT" 는 인생 이벤트의 기념 카드야. caption 과 scene 이 이미 들어 있으니 다른 카드와 똑같이 그리면 돼.

5. HUD 직업 표시
   - game.hud().job 이 이제 진짜 직업명이야 (회사원 L3 / 사장님 / 공무원 9급 / 크리에이터 / 무속인 …). 그대로 보여주기.

6. (선택) 진짜 픽셀아트 느낌 내기 — 에셋이 오기 전에도 할 수 있는 것
   - 장면(배경+캐릭터)을 작은 내부 해상도(예: 180×170)의 <canvas>에 그리고, CSS로 정수배(×2, ×3) 확대 + image-rendering: pixelated.
   - 폰트는 한글 픽셀 폰트 "Galmuri" (https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css, SIL OFL 무료).
   - 그라데이션, 둥근 모서리, 부드러운 그림자, 반투명 블러는 빼고 → 단색 면 + 1~2px 딱딱한 테두리/그림자.
   - 애니메이션도 부드러운 이동 대신 2~4프레임 스텝(steps())으로.
```
