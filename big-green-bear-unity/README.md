# 큰초록곰의 모험: Unity 비주얼 프로토타입

HTML 버전 게임의 스토리와 로직을 참고해서 만든 **작은 Unity 6 vertical slice**예요.
**Bellflower Winter Night** 장면 하나만 있어요. 3~5분 정도 플레이할 수 있어요.

들어 있는 것:
- **캐릭터:** 큰초록곰, 니니 (표정 바뀜, 눈 깜빡임, 숨쉬기)
- **배경:** 축제 광장 (2.5D 레이어, 마우스에 따라 깊이감)
- **날씨:** 맑음 → 비 (빗줄기, 물방울 파문, 젖은 바닥)
- **조명:** 따뜻한 가로등과 전구 → 비가 오면 차가워짐 (URP 2D Light, 색보정)
- **대사:** 영어/한국어, 선택지
- **작은 초록 종:** 니니에게 주고 → 웅덩이에서 다시 찾음
- **11:47:** 시청 시계 → 오른쪽 위 시계
- **첫 번째 memory distortion:** 철문 앞에서 색이 식고, 시계가 11:47에 멈추고, 문장이 겹치고, 있을 리 없는 차가운 형광등 빛과 아주 작은 병원 모니터 소리가 났다가 사라짐

**모든 그림과 소리는 코드로 직접 만들었어요.** 구매한 에셋, 폰트, 플러그인은 하나도 없어요 ($0).

---

## 설치 (5분)

### 1. 파일 받기
1. GitHub `jaellie/jellie` 저장소에서 브랜치를 **`claude/affectionate-bohr-cr0vb0`**로 바꾸세요.
2. **Code → Download ZIP**을 누르고 압축을 푸세요.
3. 압축 푼 폴더 안에 있는 `big-green-bear-unity/Assets/BigGreenBear` 폴더를 찾으세요.

### 2. Unity 프로젝트에 넣기
`BigGreenBear` 폴더를 통째로 Unity 프로젝트의 `Assets` 폴더 안에 복사하세요.
- 예: `C:\Users\ag928\UnityProjects\BigGreenBear\Assets\BigGreenBear\`
- Unity로 돌아가면 자동으로 import돼요. 잠깐 기다리세요.

### 3. 장면 만들기
1. Unity에서 `Assets/Scenes/SampleScene`을 여세요. 새 Scene을 만들어도 돼요.
2. **Hierarchy 빈 곳 우클릭 → Create Empty**로 빈 오브젝트를 만들고, 이름을 `Slice`로 바꾸세요.
3. `Slice`를 선택하고 Inspector에서 **Add Component → `SliceBootstrap`**을 검색해서 추가하세요.
4. **▶ Play**를 누르세요.

나머지(카메라, 배경, 캐릭터, 비, 조명, 소리, UI)는 Play를 누르는 순간 코드가 알아서 만들어요.

**Game 창 비율**은 상단에서 `16:9`나 `Full HD (1920x1080)`으로 맞추면 의도한 구도로 보여요.

## 조작

| 키 | 동작 |
|---|---|
| `Enter` / `Space` / 클릭 | 다음 문장 (글자가 나오는 중이면 한 번에 다 보여줌) |
| `1`~`4` / 클릭 | 선택지 고르기 |
| `L` | 한국어 ↔ English |
| `M` | 움직임 줄이기 (카메라 흔들림, 빗줄기 속도, 깜빡임 줄임) |

컴퓨터 언어가 한국어면 한국어로 시작해요. 항상 한국어로 시작하려면 `SliceBootstrap`의 **Force Korean**을 체크하세요.

---

## 문제가 생기면

| 증상 | 해결 |
|---|---|
| **화면이 거의 검은색** | `Slice` 오브젝트의 `SliceBootstrap`에서 **Use 2D Lights 체크 해제** 후 다시 Play. 조명 없이 색보정만으로 보여요. 됐다면 스크린샷 보내주세요. 조명을 고쳐 드릴게요 |
| **Console에 `Input` 관련 빨간 에러** | Edit → Project Settings → Player → **Active Input Handling**을 `Both`로 바꾸기 |
| **한글이 안 보이거나 □로 나옴** | Windows의 "맑은 고딕"을 쓰고 있어요. 그래도 안 되면 알려주세요 |
| **`SliceBootstrap`이 검색이 안 됨** | Console에 컴파일 에러가 있는지 확인하고, 그 빨간 줄을 복사해서 보내주세요 |
| **Console에 노란 경고** | 대부분 괜찮아요. `[BigGreenBear]`로 시작하는 경고만 알려주세요 |

**스크린샷과 Console 내용을 보내주시면** 그걸 보고 바로 고칠게요. 저는 Unity를 직접 열 수 없어서, 실제 화면은 직접 보여주셔야 해요.

---

## 화면 비율 (16:9 고정)
창이 어떤 모양이든 게임은 항상 **16:9 액자 안에** 보여요. 남는 곳은 검은 띠가 채워요.
그래서 컴퓨터, 웹 브라우저, 휴대폰 어디서든 같은 구도로 보여요.

## 폰트 넣기 (웹 빌드에 꼭 필요)
웹 브라우저에서는 컴퓨터에 깔린 폰트를 쓸 수 없어서, 그냥 빌드하면 한글이 □로 나와요.
1. 한글이 들어 있는 폰트 파일(`.ttf` 또는 `.otf`)을 **하나만** `Assets/BigGreenBear/Resources/BGB/Fonts/` 폴더에 넣으세요.
2. 끝이에요. 게임이 자동으로 그 폰트를 써요.

게임에 넣어 배포해도 되는 라이선스(예: SIL Open Font License)인지 꼭 확인하세요.

## 웹(WebGL) 빌드
1. **Unity Hub → 설치 → (Unity 6 옆) ⚙ → 모듈 추가 → `Web Build Support`** 를 체크하고 설치하세요.
2. **File → Build Profiles → `Web`** 을 고르고 **Switch Platform** 을 누르세요.
3. **Player Settings → Resolution and Presentation** 에서 **Default Canvas Width `1280`, Height `720`** 으로 맞추세요 (16:9).
4. **Build** 를 누르고 빈 폴더를 고르세요.
5. 만들어진 폴더를 통째로 zip으로 묶어서 itch.io에 올리면 돼요. ("HTML" 프로젝트로 업로드, 크기는 1280x720)

참고: 웹에서는 음악이 물속처럼 먹먹해지는 효과(low-pass filter)가 동작하지 않아요. Unity 웹 빌드가 이 기능을 지원하지 않거든요. 나머지는 똑같아요.

---

## 구조 (어디를 고치면 뭐가 바뀌나)

```
Assets/BigGreenBear/
├── Scripts/
│   ├── SliceBootstrap.cs   ← 이것 하나만 붙이면 됨. 전부 조립
│   ├── SliceDirector.cs    스토리 진행 (slice.json 실행)
│   ├── Stage.cs            2.5D 배치: 레이어를 깊이(z)별로 놓아 원근감 만들기
│   ├── Actor.cs            캐릭터: 표정, 깜빡임, 숨쉬기, 퇴장
│   ├── CameraRig.cs        카메라: 장면 전환, 마우스 깊이감, 기억이 흔들릴 때 흐름
│   ├── RainSystem.cs       비 (빗줄기 420개 재사용 + 파문)
│   ├── Atmosphere.cs       조명 + 색보정: dusk / rain / heavy / title + distortion
│   ├── SliceAudio.cs       소리 전부 합성: 테마, 비, 군중, 종, 병원 모니터
│   ├── SliceUI.cs          대사, 선택지, 시계, 타이틀, 챕터 카드
│   ├── SliceInput.cs       키보드/마우스 (새/옛 Input System 둘 다 지원)
│   └── SliceData.cs        JSON 구조 정의
└── Resources/BGB/
    ├── Art/                PNG 그림 (tools/로 다시 만들 수 있음)
    └── Data/
        ├── slice.json      ★ 스토리: 대사, 선택지, 효과
        └── layout.json     ★ 구도: 레이어 위치, 캐릭터 위치, 카메라 시점, 조명
```

### 스토리 고치기: `slice.json`
`tools/build-slice.py`를 고친 다음 `python3 tools/build-slice.py`를 실행하세요. 깨진 연결이 있으면 이 스크립트가 알려줘요.

노드 하나는 이렇게 생겼어요.
```json
{ "id": "gate_03", "speaker": "",
  "text": { "en": "It isn't nine yet. Is it?", "ko": "아직 아홉 시도 안 됐다. 그렇지?" },
  "effects": [ { "type": "distort", "num": 1 } ],
  "fx": [ "clock1147", "echo", "fluorescent", "beep", "drift" ],
  "next": "gate_04" }
```

**효과(effects)**
- `mood`: 분위기 (`dusk` / `rain` / `heavy`)
- `focus`: 카메라 시점 (`wide` / `bear` / `nini` / `clock` / `gate` / `puddle`)
- `face`: 표정 바꾸기
- `exit`: 캐릭터 퇴장
- `bell`: 종 위치 (`nini` / `bear` / `puddle` / `none`)
- `clock`: 시계 시간 바꾸기
- `stuck`: 시계를 11:47에 멈추기
- `distort`: memory distortion 세기 (0~1)
- `memory`: 기억 신뢰도
- `sound`: 소리 재생
- `wait`: 잠깐 멈춤
- `end`: 슬라이스 끝

**한 줄짜리 연출(fx)**
- `clock1147`: 시계가 11:47로 바뀜
- `echo`: 문장이 겹쳐 보임
- `fluorescent`: 차가운 형광등 빛
- `beep`: 병원 모니터 소리
- `drift`: 카메라가 천천히 흐름

### 구도 고치기: `layout.json`
- 레이어 위치와 깊이: `z`가 클수록 멀리 있고 덜 움직여요.
- 캐릭터 위치와 크기
- 카메라 시점(`focus`): `x`, `y`는 이동, `zoom`은 앞으로 다가가기
- 조명 위치와 세기

Unity 없이 미리보기도 할 수 있어요. `node tools/simulate.js`를 실행하면 시점별 이미지가 `ArtSource/sim_*.png`로 나와요.

### 그림 고치기
1. `tools/art.js`를 고치세요. 모든 그림이 SVG 코드로 들어 있어요.
2. `node tools/render-art.js`를 실행하면 PNG가 다시 만들어져요.
3. 원본 SVG는 `ArtSource/`에 있어요. Inkscape나 Figma에서 열어서 손으로 다듬어도 돼요.

---

## 이 프로토타입이 일부러 안 하는 것
- 저장/불러오기, 단서판, 힌트, NG+는 HTML 버전에만 있어요. 이번 목적은 **"Unity로 하면 분위기가 더 좋아지나?"**를 확인하는 것뿐이에요.
- 다른 NPC, 다른 장소, 2장 이후는 없어요.

**판단 기준:**
- 3~5분 안에 끝까지 플레이할 수 있는가?
- 스크린샷 한 장만 봐도 이 게임인 줄 알겠는가?
- 비 오기 전과 후의 광장이 확실히 다르게 느껴지는가?
