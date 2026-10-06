# 빅그린베어의 모험 II — THE OTHER BEAR (Unity)

1탄(`big-green-bear-unity`)과 같은 방식이에요. **`TwinBootstrap` 하나만 붙이면** 코드가 전부 조립해요.
캐릭터는 1탄 그림 그대로이고, 배경의 입체 소품은 KayKit(CC0) 3D low-poly 모델이에요.

> ⚠️ 이 코드는 Unity 없이 작성했어요. 문법 검사(tree-sitter)만 통과했고 **아직 Unity에서 컴파일해 보지 않았어요.**
> Console의 빨간 줄을 알려주시면 바로 고쳐요.

## 설치

1. Unity 6 프로젝트를 새로 만들어요 (템플릿: **Universal 3D** 또는 3D (URP)).
2. 이 브랜치의 `big-green-bear-2-unity/Assets/BigGreenBear2` 폴더를 프로젝트의 `Assets/`에 복사해요.
3. 빈 씬에서 빈 GameObject를 만들고 → Add Component → **`TwinBootstrap`** → ▶
4. `Enter`로 시작해요.

## 조작

| 키 | 동작 |
|---|---|
| `←` `→` / `A` `D` | 이동 |
| `E` | 말 걸기 (Nini 가까이) |
| `Tab` | 케이스 파일 열기/닫기 |
| 좌측 탭 클릭 | PEOPLE / EVIDENCE / STATEMENTS / TIMELINE / IDENTITY |
| 카드 드래그 | IDENTITY 증거판: 왼쪽(Big Green Bear) / 오른쪽(Green)에 붙이기. 같은 칼럼에서 모순되면 `CONFLICT` |
| `P` | (개발용) PEOPLE 단계 전환: 곰 1마리 → 쌍둥이 → IDENTITY UNCERTAIN |
| `Esc` | 케이스 파일 닫기 |

## 구조

```
Assets/BigGreenBear2/
├── Scripts/
│   ├── TwinBootstrap.cs   ← 이것 하나만 붙이면 전부 조립
│   ├── SeasonTheme.cs     시즌 룩 (색, 안개, 소품 배치) — season.json을 읽음
│   ├── StageBuilder.cs    3D 소품 + 배경 + 달빛 + 안개 (그림자 없음, 가벼움)
│   ├── TwinActor.cs       곰/Green 공용. Green = 같은 그림을 좌우반전 + 습관(오른손/왼손)
│   ├── MirrorWindow.cs    오른쪽 거울 창: 반전, 0.4초 지연, 장면당 작은 차이 1개
│   ├── GameUI.cs          종이 액자, 왼쪽 폴더 탭, 케이스 파일, 증거판(드래그)
│   ├── GameState.cs       증거판 상태 저장, CONFLICT 계산
│   ├── Data.cs            증거/진술 데이터 (중립적인 관찰 문장만)
│   ├── Mats.cs, Input2.cs, Sfx.cs
└── Resources/BGB2/
    ├── Seasons/02-twins/  season.json + backdrop.png   ← 시즌 하나 = 폴더 하나
    ├── Props/             KayKit FBX 11종 + forest_texture.png
    ├── Characters/        1탄 곰 / Nini PNG
    └── Fonts/             Pretendard
```

## 시즌마다 새 테마
엔진 코드는 색, 소품, 배경을 직접 알지 못해요. 새 시즌은 `Resources/BGB2/Seasons/<id>/season.json`을 만들고
`TwinBootstrap.seasonId`를 바꾸면 돼요. (소품 FBX는 `Resources/BGB2/Props/`에 추가)

## 문제가 생기면

| 증상 | 해결 |
|---|---|
| 나무가 분홍/마젠타색 | Shader를 못 찾은 거예요. URP 프로젝트인지 확인하세요 (Universal 3D 템플릿). |
| 화면이 거의 검은색 | Console의 `[BigGreenBear2] Missing ...` 노란 줄 확인 (Resources 폴더 위치) |
| `Input` 관련 빨간 에러 | Project Settings → Player → Active Input Handling = `Both` |
| 거울 창이 비어 있음 | URP가 아닌 Built-in이면 `MirrorWindow`의 Camera 콜백 경로로 동작해요. 그래도 비면 알려주세요. |
| 빌드(.exe)에서 소품이 보라색 | `Mats.cs` 주석 참고: Project Settings → Graphics → Always Included Shaders에 `Universal Render Pipeline/Simple Lit`, `Unlit` 추가 |
