# Added UI localization keys — Korean / English (US)

Approved additive namespaces: `menu.*` and `environments.*`. These 34 keys extend the original 143 keys to 177. No original key was removed or renamed. `<br>` below represents an actual newline in strings.json, not markup consumed by Unity. Source: `Assets/DrivingSim/Resources/Localization/strings.json`.

These are presentation labels/sample catalog labels; they are not scene names or gameplay identifiers. Claude's future map/mode/mission namespaces require adapter/coordination rather than silent key changes.

| Key | Korean (`ko`) | English (US) (`en`) |
|---|---|---|
| `environments.city.title` | 도심 도로 | City roads |
| `environments.empty` | 연습 환경 없음 | No environments available |
| `environments.emptyDescription` | 이용 가능한 연습 환경을 준비 중입니다. | Practice environments are being prepared. |
| `environments.freeDescription` | 정해진 경로와 시간 제한 없이,<br>원하는 조작을 자유롭게 연습하세요. | Explore the controls at your own pace,<br>without a set route or time limit. |
| `environments.freeDriving` | 자유 주행 | Free Driving |
| `environments.launchPending` | 시작 요청 중… | Requesting launch… |
| `environments.mission.parking` | 주차 기초 | Parking basics |
| `environments.mission.parkingDetail` | 공간 확인 · 후진 주차 | Check clearance · Reverse park |
| `environments.mission.startStop` | 출발과 정지 | Start &amp; stop |
| `environments.mission.startStopDetail` | 출발 · 제동 · 정지 유지 | Pull away · Brake · Hold |
| `environments.mission.turns` | 기본 회전 | Basic turns |
| `environments.mission.turnsDetail` | 저속 회전 · 조향 연습 | Low-speed turns · Steering |
| `environments.missions` | 미션 | Missions |
| `environments.noMissions` | 이 환경의 미션은 준비 중입니다. | Missions for this environment are coming later. |
| `environments.parking.title` | 주차 연습장 | Parking area |
| `environments.planned` | 준비 중 | Planned |
| `environments.plannedDescription` | 이 연습 환경은 준비 중입니다. | This practice environment is in development. |
| `environments.preview` | 연습 환경 미리보기 | Environment preview |
| `environments.ready` | 이용 가능 | Available |
| `environments.skills.description` | 조작을 익히고, 기본기를 다지는 공간. | Learn the controls. Build the basics. |
| `environments.skills.details` | 직선 주행 · 회전 · 주차 연습 | Straight driving · Turning · Parking |
| `environments.skills.title` | 기초 주행 연습장 | Driving skills ground |
| `environments.startFreeDriving` | 자유 주행 시작 | Start Free Driving |
| `environments.startMission` | 미션 시작 | Start Mission |
| `environments.suburban.title` | 외곽 도로 | Suburban roads |
| `environments.title` | 어디에서 연습할까요? | Where would you like to practice? |
| `environments.unavailable` | 아직 시작할 수 없습니다 | Not available yet |
| `menu.back` | 메인 메뉴 | Main menu |
| `menu.brand` | JELLIE · 운전 연습 | JELLIE · DRIVING PRACTICE |
| `menu.chooseEnvironment` | 연습 환경 선택 | Choose environment |
| `menu.environments` | 연습 환경 | PRACTICE ENVIRONMENTS |
| `menu.intro` | 나만의 속도로 익히는 운전 연습.<br>연습 환경을 고르고 시작하세요. | Practice at your own pace.<br>Choose an environment to begin. |
| `menu.settings` | 설정 | Settings |
| `menu.tagline` | 운전의 기본을,<br>차분하게. | Find your rhythm.<br>Build confidence. |

## Exact notice text — unchanged

**Korean:** 이 게임은 실제 운전 감각을 익히기 위한 연습용 시뮬레이터이며, 실제 도로에서의 안전한 운전 능력을 검증하는 도구가 아닙니다. 차량 조작감과 주행 환경은 실제 차량과 다를 수 있습니다.

**English (US):** This simulator is intended for driving practice. It does not assess your ability to drive safely on real roads. Vehicle controls and driving conditions may differ from those of a real car.

The notice body key and DisclaimerPolicy.CurrentVersion were not changed. The view never writes acknowledgment/language persistence directly; StartupFlow still owns them. Required mode exposes only explicit acknowledgment; review mode exposes close only. This is source-review confirmation, not runtime verification.
