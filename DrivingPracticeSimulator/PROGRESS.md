# 운전 연습 시뮬레이터: 진행 현황 (Handoff)

작성 기준: 브랜치 `ccr-21c0ed33-uzs8xd` (저장소 `jaellie/jellie`, 폴더 `DrivingPracticeSimulator/`)
이 문서가 프로젝트 상태의 기준 문서(source of truth)입니다. 변경할 때마다 아래 "변경 기록"에 추가합니다.

## 0. 가장 중요한 전제

- **Unity 코드(C#)는 한 번도 컴파일하거나 실행하지 않았습니다.** 작업 환경에 Unity Editor와 C# 컴파일러가 없었습니다. C# 약 9,000줄(72개 파일)은 모두 "작성만 된" 상태입니다.
- 실제로 동작을 확인한 것은 **브라우저 미리보기(three.js)** 뿐입니다. C#과 같은 로직과 같은 설정값으로 포팅했고, headless Chromium 자동 테스트 **82/82 통과**. 마우스, 키보드, 터치는 모두 시뮬레이션 입력입니다.
- 실제 폰, 실제 터치스크린, 바닥에 둔 실제 키보드(발 사용)는 **테스트하지 않았습니다**.
- 그래서 다음 단계 1순위는 **Unity에서 프로젝트를 열어 컴파일 오류를 잡고 EditMode 테스트를 돌리는 것**입니다.
- **현재 Claude 작업 환경 점검 결과:** Unity Editor, .NET SDK, Mono 모두 없고, Unity 다운로드 서버는 네트워크 정책으로 차단되며 Unity 라이선스도 없습니다. **이 환경에서는 Unity 컴파일과 테스트가 불가능합니다.**
- **검증 방법 (결정됨):** A) GitHub Actions + GameCI가 기본, B) 사용자 로컬 Unity가 대안.
  - **GameCI 요구사항 재확인 (2026-10-31, 소스 코드 기준):** 문서가 아니라 실제로 실행되는 코드를 읽어 확인했습니다.
    - unity-test-runner v4.4.0은 직접 활성화하지 않고 `game-ci/cli`(v0.1.72로 고정)를 실행하며, 자격 증명은 CLI가 환경 변수에서 읽습니다.
    - CLI의 라이선스 방식 선택 순서: 라이선스 파일 → 시리얼 → 플로팅 서버 → **personal**. `UNITY_EMAIL` + `UNITY_PASSWORD`만 있으면 **personal** 방식으로 결정됩니다.
    - **Unity Personal에 필요한 Secrets는 2개: `UNITY_EMAIL`, `UNITY_PASSWORD`.** 계정 자격 증명은 **필요합니다**(무료 Personal 좌석은 Unity 계정으로 로그인해 활성화하는 방식이라, 자격 증명 없이 활성화하는 방법이 없음).
    - **`UNITY_LICENSE`(.ulf)는 쓰지 않습니다.** Personal `.ulf`는 만든 기기에 묶여 있어 CI 컨테이너에서 "Machine bindings don't match"로 실패합니다(CLI 소스 주석). Unity는 Personal의 수동(오프라인) 활성화도 없앴습니다.
    - **2단계 인증(2FA)은 꺼져 있어야 합니다.** 자동 활성화는 인증 코드를 입력할 수 없습니다. 그래서 **개인 계정이 아닌 CI 전용 Unity 계정**을 권장합니다.
    - Pro/Plus는 `UNITY_SERIAL` 추가. `.ulf`는 Enterprise/Industry용.
    - 참고: GameCI 문서 페이지(2026-10-24)는 아직 Secrets 3개로 안내하지만, 실제 코드와 맞지 않는 오래된 안내입니다. game-ci.com은 이 세션에서 차단되어 원본 저장소(문서, unity-test-runner, cli)를 받아 확인했습니다.
    - 남은 불확실성: 실제 계정으로 활성화되는지는 첫 CI 실행에서만 확인됩니다.
  - **Unity 버전:** `6000.0.85f1`. GameCI Docker 이미지(Linux base, Android)가 있는 가장 최신 6000.0 패치입니다(Docker Hub 확인, 이미지 갱신일 2026-10-20). `ProjectVersion.txt`와 CI에 고정했습니다.
  - **워크플로:** `.github/workflows/unity-tests.yml` (unity-test-runner v4.4.0, 커밋 SHA 고정, 개발 브랜치 push와 수동 실행에서만 동작, 최소 권한). Secrets가 없으면 Unity 단계를 건너뜁니다.
  - **현재 상태:** Secrets 미설정. 워크플로 실행 #1은 "성공"이지만 **Secrets 없음 → Unity 단계 건너뜀**이었습니다. **Unity 컴파일·테스트는 아직 한 번도 실행되지 않음.**

미리보기 링크(비공개): https://claude.ai/artifact/GSutqJuo2tSdP6aj9yFxaP
(저장소 사본: `Tools/browser-preview/index.html`, 테스트: `Tools/browser-preview/run-tests.js`)

---

## 0-1. 기능별 상태: 구현 / 테스트 / 미검증 (2026-10-31)

용어:
- **구현** = C# 코드 작성 완료. **Unity에서 컴파일한 적 없음.**
- **테스트(미리보기)** = 같은 로직을 옮긴 브라우저 미리보기에서 자동 테스트 통과. Unity 동작을 증명하지는 않음.
- **테스트(정적)** = Python 스크립트로 파일 내용 검사(JSON, 키, 괄호 균형 등). 실행 테스트 아님.
- **미검증** = 어떤 실행 환경에서도 확인하지 않음.

| 기능 | 구현 | 테스트한 방법 | Unity 컴파일 | Unity 테스트 | 실기기 |
|---|---|---|---|---|---|
| 차량 물리 (WheelCollider, 크리프, 제동, 저항) | ✅ | 미리보기(단순 모델) | ❌ 미검증 | EditMode·PlayMode 작성, 미실행 | ❌ |
| 변속기 P/R/N/D, 인터록 | ✅ | 미리보기 | ❌ | EditMode·PlayMode 작성, 미실행 | ❌ |
| 사실적 조향 (±540°, 35°, 애커먼) | ✅ | 미리보기 | ❌ | EditMode·PlayMode 작성, 미실행 | ❌ |
| 원 조향 (어디서나, 떨림 제거) | ✅ | 미리보기 (에뮬레이션 터치) | ❌ | EditMode 작성, 미실행 | ❌ 실제 터치 미확인 |
| 가운데 마우스 = 터치 | ✅ | 미리보기 | ❌ | 없음 | ❌ |
| 발 페달 키보드 + 보정 마법사 | ✅ | 미리보기 (시뮬레이션 키) | ❌ | EditMode 작성, 미실행 | ❌ 실제 키보드 미확인 |
| 1인칭 운전석, 거울, 카메라 전환 | ✅ | 미리보기 (일부) | ❌ | 없음 | ❌ |
| HUD, 세로 기어 선택기, (P) 버튼 | ✅ | 미리보기 | ❌ | 없음 | ❌ |
| 현지화 (한국어/영어, 저장, 변경 이벤트) | ✅ | 정적 (키 143개, 중복 0, 자리표시자 불일치 0, 코드 키 139개 존재) | ❌ | EditMode 작성, 미실행 | ❌ |
| 첫 실행 고지 + 언어 선택 (임시 화면) | ✅ | 없음 (미리보기에 미포함) | ❌ | PlayMode `StartupFlowPlayModeTests` 7개 작성, 미실행 | ❌ |
| CI 워크플로 (GameCI): 설정 → 테스트 → Android APK | ✅ | YAML 문법 검사, GitHub 실행 #1·#2 (Unity 건너뜀) | - | - | - |
| 프로젝트 설정 스크립트 (`DrivingSim → Configure Project`) | ✅ | 없음 | ❌ | 없음 | - |
| 스크린샷 캡처 테스트 (1인칭, 3인칭) | ✅ | 없음 | ❌ | PlayMode 작성, 미실행 | - |
| URP Mobile 설정 (Configure Project에서 생성·적용) | ✅ | 없음 | ❌ | 없음 | ❌ |
| 씬 흐름: 메인 메뉴 → 환경 선택 → 자유 주행 → Test Town (임시 메뉴 화면) | ✅ | 없음 | ❌ | EditMode 카탈로그 테스트 작성, 미실행 | ❌ |
| Codex UI 브랜치 병합 (기능 참고용, 디자인은 새로 제작 예정) | ✅ 병합 | 정적 검사(Codex) | ❌ | Codex UI 테스트 6개 미실행 | ❌ |
| AI 교통 (Phase C~F) | ❌ 미착수 (기준선 검증 후) | - | - | - | - |
| 맵 선택 + 맵별 자유 주행/연습 미션 | ❌ 미착수 (계획만, 기준선 검증 후) | - | - | - | - |

---

## 1. 프로젝트 개요

- 목표: 한국 2종 보통(자동변속기) 운전 연습용 Android 시뮬레이터. 레이싱 게임이 아님.
- 엔진: Unity 6 LTS(6000.0.x 가정), C#, URP 패키지 포함(아직 URP 에셋 미설정, 현재 Built-in으로 렌더링), Input System, Rigidbody + WheelCollider.
- 화면: 가로, UI는 한국어.
- 아트: 지금은 전부 코드로 만든 기본 도형과 placeholder.
- 비주얼 방향(2026-10-31 승인, Codex 담당): Minimal Automotive 기반, 세련된 현대 자동차 UI, 은은한 글래스 효과, 절제된 아이스 블루 포인트, 실제와 같은 운전석 시야, 깔끔한 계기판. 과한 네온·아케이드 느낌 금지. **Claude는 비주얼 작업을 하지 않습니다.**
- 씬은 코드로 생성: Unity 메뉴 **DrivingSim → Create Scenes (Main Menu + Test Town)**.

### 원래 계획한 마일스톤과 현재 위치
| 단계 | 내용 | 상태 |
|---|---|---|
| M1 | 차량 물리 프로토타입 | 작성 완료 (미검증) |
| Phase B | 1인칭 운전석, 거울, 카메라 전환 | 작성 완료 (미검증) |
| 입력/HUD | 포인터·터치 조향, 발 페달 키보드, 세로 기어, HUD | 작성 완료 (미검증) |
| 조향 개편 | 3바퀴 핸들, 원 그리기 조향, 떨림 제거 | 작성 완료, 미리보기에서 검증 |
| **기준선 검증** | Unity 컴파일, EditMode 테스트, Play Mode 기본 주행 확인 | **진행 필요 (Phase C 이전 필수 관문)** |
| 언어 선택·면책 고지 | 한국어/영어, 첫 실행 필수 고지 (기능은 Claude, 화면은 Codex) | **기능 계층 작성 완료 (Unity 미검증)**, 최종 화면은 Codex |
| Phase C | 한국식 교차로 1개 (신호등, 횡단보도, 정지선, 차선 그래프) | **미착수 (기준선 검증 후)** |
| Phase D | AI 차량 3대: 차선 주행, 신호·정지선 준수, 차간거리, 회전, 방향지시등, 플레이어 반응 | **미착수** |
| Phase E | 연결된 소규모 도로망, AI 5~10대, 양보, 차선 변경, 표지판, 주차 차량 | **미착수** |
| Phase F | 복잡한 교통 상호작용 + 운전 평가 (AI 잘못은 감점 제외) | **미착수** |
| 맵 시스템 (향후) | 맵 선택(연습장, 도심+AI 교통, 주택가·골목, 교외·굽은 길), 맵마다 자유 주행과 연습 미션 분리. 차량·입력은 하나, 환경만 교체 (`ROADMAP.md`) | **미착수 (기준선 검증 후)** |
| 기타 | 메인 메뉴, 설정, 완료 화면 등 | **미착수** |

---

## 1-1. 협업 방식 (Claude Code + Codex)

| 담당 | 범위 |
|---|---|
| **Claude Code (주 개발)** | 게임플레이 시스템, Unity 통합, 물리, 입력, AI 교통, 테스트, 도로망 데이터·차선 경로, 기능 계층(언어 서비스, 고지 확인 저장 등) |
| **Codex** | UI/UX 디자인, 비주얼 다듬기, 현지화 문구, 장식용 환경 에셋 |

- Claude는 `ccr-21c0ed33-uzs8xd`에서 작업하고, Codex는 별도 디자인 브랜치에서 작업합니다(브랜치 이름 확인 필요, 2026-10-31 기준 원격에 없음).
- Codex 작업을 덮어쓰지 않습니다. 검토하지 않은 변경은 병합하지 않습니다. Codex 변경은 병합 전에 호환성(API, 문자열 키, 레이어, 도로 형상)을 검토합니다.
- 두 쪽이 공유하는 규칙은 `INTEGRATION.md`에 둡니다.
  - 언어·고지 API와 문자열 키
  - 시작 화면 순서
  - 도로 형상 계약: 단위·축, 차선 데이터는 `RoadNetwork`가 기준, 장식물 금지 구역, 레이어·태그, 신호등·표지판 프리팹 인터페이스

## 1-2. 새 요구사항

### 구현 상태 (2026-10-31, 모두 Unity 미검증)
- 현지화: `Core/Localization.cs`(Language, StringTable, DisclaimerPolicy), `Runtime/Localization/LocalizationService.cs`(Loc.T, SetLanguage, LanguageChanged, LocalizedText), `Resources/Localization/strings.json`(143개 키).
- 기존 하드코딩 한국어 137개를 모두 키로 이동(HUD, 변속 메시지, 차량 장치, 카메라 버튼, 페달 보정 마법사). Core의 검증 실패 사유는 문장 대신 enum(`PedalValidationFailure`)으로 바꿈.
- 고지: `Runtime/Startup/DisclaimerService.cs`(버전·시각·언어 저장), `StartupFlow`(언어 → 고지 → 게임, 그 전까지 입력 차단), 화면 인터페이스 `ILanguageSelectionView`·`IDisclaimerView`, 임시 화면 `PlaceholderStartupViews.cs`. 일시정지 메뉴에서 언어와 고지를 다시 열 수 있음.
- 연동 계약: `INTEGRATION.md`.
- 테스트(미실행): EditMode `LocalizationTests`(키 누락, 번역 누락, 자리표시자 일치, 승인 문구 고정), PlayMode `DrivingBaselinePlayModeTests`(P 유지, 변속 거부, D/R 크리프, 주행 중 P 거부, 25 km/h 제동, 풀락 조향, 정지 중 조향 유지), PlayMode `StartupFlowPlayModeTests`(첫 실행 순서와 입력 차단, Required 모드 닫기 불가, 확인 기록 버전·시각·언어, 디스크 저장, 재방문 시 화면 없음, 고지만 미확인, 설정에서 고지 다시 보기, 언어 변경 취소·저장, 디자인 미지정 시 임시 화면).
- 보완(2026-10-31): 시작 화면이 열려 있을 때 다른 시작 화면을 열면 무시(모달 하나만). 테스트용 `LocalizationService.ClearSavedChoice()`, `DisclaimerService.Reload()` 추가.
- 이 환경에서 Python으로 확인한 것: strings.json 키 143개, 중복 0, 자리표시자 불일치 0, 코드에서 쓰는 키 139개 모두 존재. (Unity 실행이 아닌 정적 검사)

### 요구사항 원문

**언어 선택**
- 한국어와 영어(미국). 선택은 로컬에 저장하고 설정에서 바꿀 수 있습니다.
- 언어를 바꾸면 열려 있는 화면이 즉시 갱신됩니다(이벤트 방식).
- 역할 분담(제안, 확인 필요): Claude가 문자열 테이블·저장·변경 이벤트를 만들고 기존 하드코딩 한국어 문자열을 키로 옮깁니다. Codex가 영어 표현과 화면 배치를 맡습니다.

**첫 실행 필수 고지 (면책)**
- 한국어: "이 게임은 실제 운전 감각을 익히기 위한 연습용 시뮬레이터이며, 실제 도로에서의 안전한 운전 능력을 검증하는 도구가 아닙니다. 차량 조작감과 주행 환경은 실제 차량과 다를 수 있습니다."
- English: "This simulator is intended for driving practice. It does not assess your ability to drive safely on real roads. Vehicle controls and driving conditions may differ from those of a real car."
- 처음 게임에 들어가기 전에 반드시 확인해야 하고, 확인 여부·고지 버전·시각을 저장합니다. 고지 문구가 바뀌면 다시 확인받습니다. 설정에서 다시 볼 수 있습니다.
- 시작 순서(안): 언어 선택 → 고지 확인 → 게임.
- 화면 디자인은 Codex 담당입니다. Claude는 기능과 연동 계약을 맡고, 필요하면 Codex 화면이 오기 전까지 기능만 하는 임시 화면을 둡니다(확인 필요).

**AI 교통 (마을에 실제로 움직이는 AI 차량, 정적 장식 아님)** (상세: `ROADMAP.md`)
- 최종 목표 기능:
  - 차선과 도로망 주행
  - 신호등·정지선 준수
  - 안전 차간거리 유지, 앞차가 있으면 감속·정지
  - 교차로 회전과 방향지시등 사용
  - 플레이어 차량에 반응, 필요할 때 양보
  - 허용된 곳에서만 기본 차선 변경
  - 가능한 범위의 충돌 회피
- 진행 순서:
  1. 한국식 교차로 1개를 만들고 검증
  2. AI 3대 도입 후 행동 검증
  3. 연결된 소규모 도로망과 AI 5~10대
  4. 더 복잡한 교통 상호작용과 운전 평가
- 결정론과 테스트:
  - 고정 timestep, 시드 고정 난수
  - 판단 로직은 Core에 두고 EditMode 테스트
  - 시나리오 PlayMode 테스트를 CI에서 자동 실행(적신호 정지, 앞차 대기, 플레이어가 교차로를 막는 경우, 차선 변경 간격)
  - 장시간 soak 테스트(충돌·교착 0 확인)
- Codex와의 호환: 도로 형상, 차선 경로, 교차로 경계는 게임플레이 쪽 `RoadNetwork` 데이터가 기준입니다. 장식 에셋은 금지 구역 밖에 두고, 겹침을 검사하는 에디터 도구를 둡니다.
- **기준선 검증 전에는 착수하지 않습니다.**

## 2. 차량 물리 (M1)

파일: `Core/*`(엔진 독립 로직, 단위 테스트 대상), `Runtime/Vehicle/*`

- **구조:** Rigidbody 1,300 kg + WheelCollider 4개, 앞바퀴 굴림(FWD/RWD/AWD 선택 가능).
- **속도 제어:** 속도를 직접 넣지 않고 토크와 힘만으로 움직입니다.
- **변속기 P/R/N/D (`AutomaticTransmissionLogic`):**
  - P에서 나가기, P로 넣기: 브레이크 ≥ 0.2 필요. P는 1 km/h 이하에서만.
  - 진행 방향 반대로 R↔D: 2 km/h 이하.
  - 정지 상태에서 D·R 넣기: 브레이크 필요.
  - 주행 중 N↔D: 자유.
  - 거부될 때는 한국어 안내 메시지.
- **크리프 (`PowertrainModel`):**
  - D/R에서 페달을 안 밟아도 450 N의 토크컨버터식 힘이 9 km/h까지 선형으로 줄어듭니다.
  - 평지 정상 크리프 속도: 계산상 D 약 5.9 km/h, R 약 5.1 km/h. 브라우저 측정값 약 4.5 km/h.
- **가속:** 최대 구동력 4,400 N, 85 kW 출력 제한, 가속 응답 곡선 지수 1.7. 후진은 0.6배, 최고 20 km/h.
- **브레이크:** 총 3,400 Nm, 앞 65%, 응답 곡선 지수 1.4. ABS는 없음.
- **P와 주차 브레이크:** P는 구동륜에 5,000 Nm(파킹 폴 근사), 주차 브레이크는 뒷바퀴에 1,600 Nm씩.
- **저항:** 구름저항 0.012, 공기저항 Cd 0.30 × 2.2 m².
- **계산 예측치 (참고용):**
  - 0→100 km/h 약 9.4초
  - 30 km/h에서 풀브레이크 시 약 4 m
- **충돌:** 0.5 m/s 이상 충돌 시 횟수를 셉니다.
- **설정:** 모든 값은 `VehiclePhysicsConfig` ScriptableObject에 있습니다. 실제 차량 보정값이 아닌 시작용 값입니다.
- **테스트 지형:** 직선 차선(5 m 표시), 2.5 × 5.0 m 주차칸 6개, 회전원, 6% 경사로, 콘, 벽, 건물.
- **진단 도구:** 개발용 텔레메트리(F1)와 측정 도구(크리프, 제동거리, 0→30 km/h, 회전반경).

## 3. 조향 (최신)

파일: `Core/SteeringModel.cs`, `Core/TraceSteeringGesture.cs`, `Core/CircularSteeringGesture.cs`, `Core/SteeringInputSmoother.cs`, `Runtime/Controls/TouchSteeringController.cs`

- **핸들 범위:** ±540°, 끝에서 끝까지 3바퀴.
- **앞바퀴 각도:** 핸들 ÷ 540 × 35°(선형, 조향비 15.4:1). 35°는 안쪽 바퀴 기준이고 Ackermann 적용.
- **회전반경:** 뒤 차축 중심 4.56 m, 바깥 앞바퀴 5.96 m. 실제 준중형은 약 5.3 m라 약간 넓습니다. 최대 앞바퀴 각도를 38~40°로 올리면 비슷해집니다.
- **속도 감응:** 100 km/h에서 조향 반응이 0.45배로 줄어듭니다.
- **자동 복원(self-centering):**
  - 2 km/h 미만에서는 없음. 30 km/h에서 최대(gain 1.0/s, 최대 240°/s). 후진은 0.3배.
  - 손을 뗀 뒤 0.6초는 복원하지 않습니다(핸들을 손으로 넘겨 잡는 동작 고려).
  - 끌 수 있습니다.
- **조향 방식 (`TouchSteeringController.mode`):**
  1. **CircularAnywhere (기본)**
     - 버튼이 아닌 화면 어디서든 원을 그리면, 움직이는 방향이 돈 만큼 핸들이 돕니다.
     - 원 한 바퀴 = 핸들 한 바퀴. 크기와 위치는 상관없고, 직선은 0°입니다.
     - 떨림 방지:
       - 최소 이동 거리: 화면 높이의 1.9%
       - 방향 평균(EMA) 0.6
       - 핸들이 70 ms에 걸쳐 따라감
       - 손을 뗄 때 남은 지연분 반영
     - 첫 짧은 구간은 방향만 잡아서 한 바퀴를 그리면 약 353°가 됩니다.
  2. **Circular**: 고정된 링 중심을 기준으로 `atan2` 각도를 잽니다. ±180° 처리, 데드존(반지름의 22%), 한 번에 90° 넘게 튀면 무시. 링 안에서 시작해야 합니다.
  3. **HorizontalDrag (이전 방식)**: 화면 높이만큼 드래그하면 100°.
- **화면 표시:** 중앙(가로 50%, 아래에서 43%)에 반지름이 화면 높이의 27%인 흐린 링이 있고, 그 안의 작은 핸들 그림이 현재 핸들 각도를 보여 줍니다. 위치는 고정이고 그림은 숨길 수 있습니다.
- **입력 수단:** 터치, 마우스 휠 클릭(가운데 버튼, 터치처럼 처리), 왼쪽 마우스(옵션, 기본 꺼짐). 스크롤은 쓰지 않습니다.
- **키보드:** A/D로 초당 270°, C로 핸들 풀기.

## 4. 입력 구조

- **`VehicleInputRouter`:** 모든 입력을 합쳐서 차량에 전달합니다.
  - 페달은 입력 중 최댓값을 씁니다.
  - 브레이크 ≥ 0.05면 가속을 차단합니다(brake override).
  - 일시정지나 보정 화면 중에는 브레이크만 유지합니다.
- **`PointerInputHub`:** 터치, 왼쪽 마우스, 가운데 마우스를 같은 형태의 포인터로 정리합니다.
- **`MiddleMouseUIRouter`:** Unity UI는 가운데 클릭을 무시하므로 가운데 클릭을 왼쪽 클릭처럼 전달합니다. 버튼은 한 번만 눌리게 처리했습니다.
- **UI와의 충돌 방지:** 버튼 위에서 시작한 포인터는 조향하지 않고, 조향 중에 지나간 버튼은 눌리지 않습니다.
- **키보드 단축키:**

| 키 | 기능 |
|---|---|
| 1~4 | P/R/N/D |
| Q/E | 기어 레버 한 칸씩 |
| Space | 주차 브레이크 |
| , / . | 방향지시등 |
| H / L / K | 비상등 / 전조등 / 와이퍼 |
| V / T | 1인칭 / 위에서 보기 |
| Z / X | 좌우 보기 |
| [ ] | 시야각 |
| Esc | 일시정지 |
| Backspace | 리셋 |

  발 페달로 등록된 키는 단축키로 동작하지 않습니다.

## 5. 발 페달 키보드 (상세: `PEDALS.md`)

- **개념:** 바닥에 둔 키보드의 가운데는 브레이크, 오른쪽은 가속. 각 페달에 등록된 키 중 하나만 눌려도 동작합니다(키보드가 일부 동시 입력을 놓쳐도 동작).
- **구조:**
  - `KeyboardPedalDevice`: 키보드 읽기. 나중에 USB 풋스위치나 아날로그 페달로 교체할 수 있는 인터페이스(`IPedalDevice`)입니다.
  - `PedalInputManager`: 상태, 저장, 안전 처리 담당.
  - `PedalStateMachine` (Core): 브레이크 우선, 누른 시간 기반 페달 깊이, 끊김 대응.
- **페달 깊이:** 키보드는 힘을 측정하지 못해서 누른 시간으로 흉내 냅니다.
  - 가속: 0→1까지 2.5초, 떼면 0.25초.
  - 브레이크: 누르는 즉시 0.3, 1.2초 후 1.0, 떼면 0.1초.
- **두 페달 동시:** 브레이크가 우선하고 가속은 0. 겹쳤다가 떼면 가속은 0.12초 뒤 0부터 다시 올라갑니다.
- **안전:** 키보드가 끊기거나 앱 포커스를 잃으면 가속을 즉시 차단하고 0.6으로 자동 제동합니다. 입력이 돌아와도 브레이크를 한 번 밟아야 다시 동작합니다.
- **보정 마법사 (일시정지 → 페달 보정):**
  1. 브레이크 5회, 가속 5회 밟기. 떼고 0.2초가 지나야 한 번으로 셉니다. 3초 이상 눌린 키는 떼기 누락으로 처리합니다.
  2. 키 확인 표: 키별 감지 횟수와 누른 횟수를 보여 줍니다. 5회 중 2회 이상 나온 키를 제안합니다.
  3. 양쪽에서 모두 감지된 키는 표시하고, 한쪽이 2회 이상 많을 때만 그쪽에 넣습니다.
  4. 키를 눌러 직접 추가하거나 뺄 수 있습니다.
  5. **실제 테스트(필수):** 브레이크 3회, 가속 3회. 반대 페달이 감지되면 실패입니다. 통과해야 저장할 수 있습니다.
  6. 저장: `persistentDataPath/pedal_key_mapping.json`. 다른 키보드가 연결되면 재검증을 권합니다.
  7. 기본값 초기화: 가운데 글자 키 = 브레이크, 방향키·숫자패드 = 가속. 검증 전에는 사용되지 않습니다.
- **주차 브레이크:** Space가 페달 키가 될 수 있어서 화면에 (P) 버튼을 추가했습니다.

## 6. 카메라, 운전석, HUD

- **카메라:** 3인칭(추적), 1인칭 운전석(왼쪽 좌석), 위에서 보기. 1인칭은 시야각 50~85°(저장됨)이고, 좌우 보기 버튼을 누르고 있으면 70° 돌아봅니다.
- **운전석:** 대시보드, 계기판(바늘·숫자 속도, P R N D, (P) 등), 핸들(실제 각도로 몇 바퀴든 회전), A필러, 와이퍼.
- **거울:** 룸미러 256×72, 좌우 사이드미러 160×112(RenderTexture). 1인칭에서만, 프레임당 하나씩 렌더링하고 좌우 반전합니다.
- **차량 장치:** 방향지시등(핸들을 풀면 자동 해제), 비상등, 전조등(스포트라이트 옵션), 와이퍼(간헐/저속/고속).
- **HUD (`DrivingHUDController`, uGUI, 1920×1080 기준, Safe Area 적용):**

| 위치 | 요소 |
|---|---|
| 왼쪽 위 | 일시정지, 속도·기어 |
| 위 가운데 | 방향지시등, 내비게이션(지금은 주차 구역까지 거리와 화살표만) |
| 오른쪽 위 | 1인칭/3인칭, 시야각, 미니맵 |
| 오른쪽 | 세로 P/R/N/D(선택된 기어는 파란색), 그 아래 (P) 주차 브레이크 |
| 오른쪽 아래 | 터치 페달 |
| 왼쪽 아래 | 전조등·비상등·와이퍼, 브레이크·가속 막대와 표시등, 입력 상태 문구 |
| 아래 가운데 | 좌우 보기, 핸들 각도 표시 |

- **일시정지 메뉴:** 계속하기, 다시 시작, 페달 보정, 메인 메뉴(준비 중).
- **교체용 디자인 틀:** `HudTheme` ScriptableObject에서 색과 스프라이트를 바꿀 수 있습니다. 비워 두면 코드로 만든 기본 도형을 씁니다.
- **한국어 폰트:** 아직 없습니다. OS 폰트에 의존하고 있어서 Noto Sans KR + TextMeshPro 도입이 필요합니다.

## 7. 테스트 현황

| 종류 | 상태 |
|---|---|
| Unity EditMode 단위 테스트 (Core 로직: 변속기, 조향, 파워트레인, 브레이크, 페달 보정·상태기계·검증, 원 조향, 떨림 제거, 방향지시등, 계기판) | **작성만 함, 미실행** |
| 브라우저 미리보기 자동 테스트 82개 (Unity↔미리보기 설정값 일치, 조향, 페달, 보정, UI 충돌, 가운데 마우스, 에뮬레이션 터치) | **82/82 통과** |
| Unity Play Mode 수동 테스트 목록 (`TESTING.md`, `PEDALS.md`) | 미실행 |
| 실제 Android, 실제 터치, 바닥 키보드 | 미실행 |

### 미리보기와 Unity의 차이 (알고 있어야 할 점)
- 미리보기는 타이어 미끄러짐이나 서스펜션이 없는 간단한 자전거 모델이고, 대신 understeer 0.0025를 넣었습니다. Unity는 WheelCollider입니다.
- 경사로는 미리보기에서 평평합니다.
- 브라우저는 키보드 연결 해제를 감지하지 못해서 포커스를 잃는 것으로 대신 시험했습니다.

## 8. 알려진 문제와 위험

1. C# 컴파일 오류 가능성: 72개 파일이 한 번도 빌드되지 않았습니다.
2. `ProjectSettings`가 거의 비어 있습니다(`ProjectVersion.txt`만 있음). Active Input Handling을 수동으로 Input System으로 설정해야 합니다.
3. `manifest.json`의 패키지 버전은 추정치입니다.
4. URP 에셋이 없어서 Built-in으로 렌더링됩니다. 휴대폰 빌드에서는 `Shader.Find`로 찾는 셰이더(`Unlit/Texture` 등)를 Always Included Shaders에 넣어야 합니다.
5. 레이어 설정이 없어 운전석을 켜고 끄는 방식으로 숨깁니다. `TextMesh` 계기판 글자가 다른 물체 위에 그려집니다.
6. 씬을 코드로 생성하므로 메뉴를 다시 실행하면 수동으로 편집한 내용이 사라집니다.
7. ABS가 없어 고속에서 풀브레이크를 밟으면 바퀴가 잠길 수 있습니다.
8. 회전반경이 실제 준중형(약 5.3 m)보다 약 0.7 m 넓습니다.
9. 원 조향은 시작할 때 첫 구간 손실이 있어 한 바퀴에 약 7°가 빠집니다. 아주 빠른 플릭은 무시됩니다.
10. 성능(30 FPS 목표)을 측정한 적이 없습니다. 거울 3개, 미니맵 카메라, 스포트라이트 비용 확인이 필요합니다.

## 9. 다음 단계 (순서 고정)

1. **기준선 검증 (Phase C 이전 필수 관문)**
   - 검증 방법 A(CI) 또는 B(로컬) 결정 → 컴파일 오류 수정(확인된 오류만) → EditMode 테스트 통과.
   - PlayMode 스모크 테스트 추가(CI에서 자동 실행):
     - D·R 크리프 속도
     - 브레이크로 정지
     - P 유지
     - 변속 거부 시 기어 유지
     - 조향 입력 → 바퀴 각도·진행 방향 변화
   - 사람이 확인할 항목: 터치·원 조향 감도, 발 페달(실제 키보드), 1인칭·거울, Android FPS.
   - 결과는 "자동(CI)"과 "수동(사용자)"을 구분해 이 문서에 기록합니다.
2. **언어 선택·첫 실행 고지 기능 계층 + `INTEGRATION.md`** (Codex 화면과 연동). 기존 한국어 문자열을 키로 옮기기.
3. **Phase C**: 한국식 교차로 1개와 차선 그래프. Codex와 도로 형상 계약을 먼저 맞춥니다.
4. **Phase D**: AI 3대, 시나리오 테스트로 검증.
5. **Phase E**: 도로망과 AI 5~10대, 양보·차선 변경, LOD, 성능.
6. **Phase F**: 복잡한 상호작용과 운전 평가(AI 잘못 감점 제외).
7. **맵 시스템** (`ROADMAP.md` "Future feature: map selection"): 먼저 차량·입력 코어와 환경을 분리(동작 변화 없음), 그다음 연습장 자유 주행 → 미션 → 도심(AI 교통) → 주택가·교외. 연습장 맵은 AI가 필요 없어 Phase C~E와 순서 조정 가능(결정 필요).
8. **나머지 UI**(Codex 중심): 메인 메뉴, 맵·모드 선택 화면, 설정, 튜토리얼, 완료 화면, 한국어 폰트, 최종 에셋.

### 결정된 사항 (2026-10-31)
- 검증: A(GameCI) 기본, B(로컬) 대안. Unity `6000.0.85f1`.
- 현지화 분담: Claude가 구조·문자열 테이블·저장·이벤트·기존 문자열 이동·API, Codex가 한국어·영어 문구·타이포그래피·화면 디자인.
- 임시 고지 화면 허용(필수·기능 동작, 로직 변경 없이 교체 가능).
- Codex 브랜치: `codex/ui-visual-polish` (2026-10-31 확인 시점에는 Claude 브랜치와 같은 커밋 `69692df`, 검토할 변경 없음). Claude는 UI 비주얼 작업을 중복하지 않습니다.
- 맵 선택 요구사항 확정(향후 기능): 4개 맵, 맵마다 자유 주행·연습 미션 분리, 차량 물리·입력 중복 금지.

### 결정 대기 사항
- **사용자 작업:** GitHub Secrets 2개 등록(아래 "검증 절차"). 등록 후 Claude가 CI를 실행하고 결과를 이 문서에 기록.
- 원 조향 감도(1:1)와 반응 속도(70 ms)가 실제 기기에서 괜찮은지.
- 앞바퀴 최대 각도 35° 유지 또는 38~40°로 상향.
- 발 페달 응답과 자동 제동 값.
- 첫 미션 "출발과 정지" 흐름과 채점 기준.
- 교차로 형태(실제 시험장 참고 여부), 좌회전 신호 방식(보호/비보호), 지원할 Android 최소 사양.

## 10. 주요 문서

| 문서 | 내용 |
|---|---|
| `README.md` | 설정 방법, 조작, 구조, 알려진 문제 |
| `TESTING.md` | Unity Play Mode 테스트 표(M1, 운전석, 컨트롤, 조향) |
| `PEDALS.md` | 발 페달 기술 검토(10가지 질문 답변), 설정값, 설치 방법, 테스트 계획 |
| `ROADMAP.md` | Phase A 점검 결과, Phase C~F 계획, AI 교통 요구사항·수용 기준, Codex 호환 계약, 맵 시스템(향후) |
| `INTEGRATION.md` | Codex와의 연동 계약 (시작 화면 인터페이스, 문자열 키, HUD 규칙, 도로 계약) |
| `Tools/browser-preview/` | 미리보기 HTML과 자동 테스트(Node + Playwright) |

## 검증 절차 (사용자 1회 작업)

Unity Personal + game-ci/cli v0.1.72 기준(소스 코드로 확인). **비밀번호는 채팅에 붙여넣지 말고 GitHub 설정 화면에만 입력하세요.**
1. **CI 전용 Unity 계정**을 새로 만듭니다(개인 계정과 분리하면 노출 시 피해가 작음). 이 계정은 **2단계 인증을 켜지 마세요**(CI가 인증 코드를 입력할 수 없음). 비밀번호는 다른 곳에서 쓰지 않는 길고 고유한 것으로.
2. 그 계정으로 Unity에 한 번 로그인해 Personal 이용 약관에 동의합니다(Unity Hub 또는 id.unity.com). `.ulf` 파일은 **필요 없습니다**.
3. GitHub `jaellie/jellie` → Settings → Secrets and variables → Actions → New repository secret:
   - `UNITY_EMAIL`: CI 전용 계정 이메일
   - `UNITY_PASSWORD`: 그 비밀번호
   - `UNITY_LICENSE`는 등록하지 않습니다(등록하면 CLI가 파일 방식을 먼저 시도하고, 기기 바인딩 불일치로 실패한 뒤 계정 방식으로 넘어감).
4. 등록했다고 알려주면 Claude가 워크플로를 실행하고, 로그를 읽고, 확인된 오류만 고칩니다.
- 보안: 워크플로는 개발 브랜치 push와 수동 실행에서만 돌고(포크 PR 없음), 외부 액션은 커밋 SHA로 고정, 토큰 권한은 읽기 + 테스트 결과 체크 쓰기뿐입니다. GitHub는 로그에서 Secret 값을 가립니다. Personal 좌석은 CLI가 작업 끝에 반납합니다.
- 참고: Unity Personal 사용 조건(매출 기준 등)은 계정 소유자가 확인해야 합니다.
- 대안 B(로컬, PC 필요): Unity Hub로 6000.0.85f1 + Android Build Support 설치 → `DrivingPracticeSimulator/` 열기 → **DrivingSim → Configure Project**(재시작 요청 시 재시작) → **DrivingSim → Create Scenes (Main Menu + Test Town)** → Play. 테스트: Window → General → Test Runner → EditMode·PlayMode Run All. APK: File → Build Profiles → Android → Build. Console 빨간 오류와 테스트 결과를 전달.

## 검증 결과 (확인된 것만 기록)

| 항목 | 방법 | 결과 | 날짜 |
|---|---|---|---|
| Unity 컴파일 | CI 또는 로컬 | **미실행** | - |
| EditMode 테스트 | CI | **미실행** | - |
| PlayMode 스모크 테스트 | CI | **미실행** | - |
| PlayMode 시작 흐름 테스트 | CI | **미실행** | - |
| 브라우저 미리보기 자동 테스트 | headless Chromium | 82/82 통과 (Unity 아님) | 2026-10-31 |
| CI 워크플로 동작 (Secrets 없음 경로) | GitHub Actions 실행 #1 (a5c5a5b) | 성공: 안내 출력 후 Unity 단계 건너뜀. **Unity는 실행되지 않음** | 2026-10-31 |
| strings.json 정적 검사 | Python | 키 143, 중복 0, 자리표시자 불일치 0, 코드 키 139개 모두 존재 | 2026-10-31 |

## 변경 기록

| 날짜 | 내용 |
|---|---|
| 2026-10-31 | 최초 작성 (M1 ~ 원 조향 떨림 제거까지) |
| 2026-10-31 | Claude/Codex 협업 방식, 언어 선택·면책 고지 요구사항, AI 교통 요구사항과 Phase C~F 순서·결정론 원칙, 기준선 검증 관문, Claude 환경에서 Unity 실행 불가 확인 추가 |
| 2026-10-31 | GameCI 요구사항 확인(Personal: Secrets 3개), Unity 6000.0.85f1 고정, CI 워크플로·PlayMode 스모크 테스트 추가, 현지화 기능 계층·문자열 이동·첫 실행 고지(임시 화면)·INTEGRATION.md 작성. Unity 미검증 |
| 2026-10-31 | GameCI 라이선스 재확인(소스 코드): Personal은 `UNITY_EMAIL`+`UNITY_PASSWORD` 2개, `.ulf` 불필요(CI에서 기기 바인딩으로 실패), 2FA 끈 CI 전용 계정. 워크플로를 2개 Secrets와 CLI v0.1.72 고정으로 수정. 기능별 구현/테스트/미검증 표 추가. CI 실행 #1(건너뜀 경로) 기록 |
| 2026-10-31 | 맵 선택 요구사항(4개 맵, 자유 주행/미션 분리, 코어 하나·환경 교체 구조)을 ROADMAP에 향후 기능으로 추가(구현 안 함). 비주얼 방향과 Codex 브랜치 기록. 시작 흐름 PlayMode 테스트 7개, 시작 화면 중복 열기 방지, 테스트용 API 2개 추가. Unity 미검증 |
| 2026-10-31 | 첫 플레이 가능 3D 프로토타입 범위 승인. 1단계: `ProjectConfigurator`(입력 Both, 가로 화면, IL2CPP ARM64, 패키지 ID, 런타임 셰이더), `CIEntryPoints`(Configure, BuildAndroid), CI를 설정 → 테스트 → APK 3단계로 확장(unity-builder v6.0.0 SHA 고정), 스크린샷 캡처 PlayMode 테스트. 3D 마을·운전석 개선은 컴파일 기준선 확인 후. Unity 미검증 |

> **기록용 (2026-10-31):** 역할 변경 전 Codex가 작성한 내용입니다. UI/UX는 이제 Claude 담당이며 처음부터 새로 디자인합니다. Codex UI 코드는 기능 참고용입니다.


## Codex UI branch handoff — 2026-10-31

- Branch: `codex/ui-visual-polish`, based on `69692df`. GitHub integration access is confirmed; the earlier access-blocked note above is historical.
- Implemented (written, **Unity unverified**): Minimal Automotive HUD presentation, Premium Simulation menu/settings/environment selection with separate Free Driving/Missions views, styled startup views, Korean font, original UI sprites, responsive/safe-area presentation and calibration layout polish.
- User approved 34 additive menu/environment localization keys; total 177, original 143 preserved. Approved notice bodies unchanged.
- No changes to vehicle physics, steering, transmission, calibration algorithms, input routing, camera behavior, StartupFlow or localization system. No city/AI work. No gameplay branch update or merge.
- Menus are presentation-only; map/mission launch host remains for Claude integration. The isolated UI harness deliberately disables every environment/mission launch.
- Static checks passed for 63 unchanged protected files, key/placeholder/notice consistency, current glyph coverage and all modern Hangul syllables, theme GUIDs, and preservation of non-presentation methods. This is **not** a Unity compile.
- Six UI presentation tests added to existing PlayMode assembly, **not run**. Unity compilation, all Unity tests, importer behavior, Android touch/readability/performance remain **not run/unverified**.
- Full inventory, new assets/dependencies, key list, review steps and host API: `UI_HANDOFF.md`. Static preview images are labeled **not Unity**.


### Codex integration handoff clarification — 2026-10-31

- Minimal Automotive UI approved as a **foundation**, not final visual art. Preserve premium menus; prioritize the actual 3D cockpit and Korean roads. Further HUD refinement waits for in-Unity cockpit review; no more standalone flat mockups are scheduled.
- Documentation-only handoff review: implemented-versus-illustrative inventory, complete A/M file list, and all 34 added localization keys with Korean/English values. See INTEGRATION.md, UI_HANDOFF.md and Tools/ui-design/localization-additions.md.
- Read-only three-way comparison found one textual conflict each in INTEGRATION.md and PROGRESS.md with Claude's c143105; no other changed-path overlaps at the reviewed commits. No merge was applied. Preserve Claude's newer protected services/startup tests and ROADMAP plan during separately approved integration.
- Host integration must hide the menu (canvas 60) before opening calibration (canvas 50). Scene loading, mission running, concurrency, availability and return navigation remain host responsibilities.
- Static preservation checks rerun; Unity compilation/runtime, test execution and Android behavior remain **unverified**. This update changes no gameplay, UI implementation or asset files.
| 2026-10-31 | 역할 변경: UI/UX 전체와 문구는 Claude, 3D 아트는 Codex. Codex UI 브랜치(1c3a9b8) 검토 후 병합(문서 충돌 2건 수동 해결). URP Mobile 설정, 메인 메뉴 → Test Town 씬 흐름과 환경 카탈로그(테스트 타운만 플레이 가능, 나머지 4개 맵은 계획), 일시정지 메뉴의 메인 메뉴 연결, INTEGRATION.md §9 3D 에셋 계약. 새 UI 디자인은 사용자 승인 대기. Unity 미검증 |
| 2026-10-31 | 새 UI/UX 디자인 제안 "Cabin Light" 인터랙티브 프로토타입(`Tools/ui-prototype/cabin-light.html`, 브라우저용, Unity 아님). 사용자 승인 전에는 Unity UI 재구현을 시작하지 않음 |
| 2026-10-31 | 3D 에셋 파이프라인(Blender → FBX → Unity) 승인. ASSET_SPEC.md v1, 권위 있는 테스트 타운 배치 데이터(TestTownLayout.json + 생성기 + 평면도), 아트 임포트 설정 자동화·머티리얼 매니페스트 빌더·임포트 테스트 검증기, 레이어·Linear 색 공간 설정, EditMode 테스트(배치 불변식, 임포트 키트). Codex 브랜치 codex/3d-environment. Unity 미검증 |
| 2026-10-31 | Codex 임포트 테스트 키트(codex/3d-environment @ e8ed2d1) 검토: Unity 검증은 BLOCKED(시크릿 없음). FBX 정적 사전 검사는 전 항목 PASS(스케일, 방향, 피벗, 앵커, 법선, 머티리얼, 텍스처). 블록아웃 진행 가능, 상세 작업은 Unity PASS 후. 리포트: Tools/asset-spec/reports/ |
