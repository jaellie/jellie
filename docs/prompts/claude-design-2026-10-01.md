# Claude Design에 붙여넣을 프롬프트 (2026-10-01)

```
엔진 파일을 첨부한 새 lovesim-engine.js로 통째로 교체해줘. (지난 프롬프트 내용은 그대로 유지하고, 아래만 추가/수정)

1. "지금 두 사람, 사귀고 있나요?" 선택지가 4개로 늘었어 — LoveSim.fatedOptions(lang).statuses 그대로 보여주면 돼
   - 응, 사귀는 중이야 (dating)
   - 아니, 썸 타는 중 (talking)
   - 아니, 아직 그냥 아는 사이야 (acquaintance) ← 새로 추가: 서로 이름은 아는 사이에서 시작, 운명의 해에 고백 순간이 와
   - 아니, 아직 서로 몰라 (stranger)
   - 고른 id 를 fated.status 로 넘기기.

2. 상대가 "다른 도시" 또는 "다른 나라"에 살 때만 도시 입력칸 보여주기
   - 라벨: fatedOptions(lang).cityLabel ("그 사람이 사는 도시")
   - 입력칸 바로 아래 작은 안내 문구: fatedOptions(lang).cityHint ("목록에 없다면 가장 가까운 지역을 선택하세요")
   - 자동완성은 태어난 곳과 같은 목록 (LoveSim.birthplaceOptions(lang)). 고른 값을 fated.city 로 넘기기.
   - "같은 동네"를 고르면 도시 칸은 숨기기.

3. 설정 탭에서 [사람들 / People] 탭 삭제
   - 남은 탭: 인생(lifeLog), 나(hud) 등 기존 것만. game.people() 은 더 이상 안 불러도 돼.
```
