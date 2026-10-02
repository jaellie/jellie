# 💬 디스코드에서 `/moa` 명령으로 실행하기

채널에 `/moa`를 입력하면 1~2분 뒤 그 채널에 구매요청 엑셀이 올라오게 만드는 설정입니다. 설치할 프로그램은 없고, 웹사이트 4곳(GitHub, Cloudflare, Discord Developer Portal, 디스코드)에서 설정만 합니다. 약 30분 걸립니다.

## 동작 방식

```
① 디스코드에서 /moa 입력
② 디스코드 → Cloudflare Worker (무료, 24시간 대기하는 접수 창구)
      - 요청이 진짜 디스코드에서 왔는지 서명 확인
      - 날짜 형식 확인
      - "집계를 시작해요" 바로 답장
③ Worker → GitHub에 "Moa 구매요청 집계" 실행 요청 (그 채널 ID로)
④ GitHub Actions에서 Moa가 채널을 읽고 엑셀 생성 → 채널에 업로드
   (실패하면 채널에 "⚠️ 실패" 메시지와 실행 기록 링크를 남김)
```

Worker는 요청을 접수만 하고, 무거운 일은 GitHub Actions가 합니다. 디스코드는 명령에 3초 안에 답해야 해서 이렇게 나눴습니다.

## 시작 전 확인
- [ ] 저장소 Secret `DISCORD_BOT_TOKEN` 등록 완료
- [ ] Actions 탭에서 **Moa 구매요청 집계**를 **Run workflow**로 한 번 성공시켜 봄

위 두 가지가 먼저 되어 있어야 합니다. 안 되어 있으면 [상위 README](../README.md)의 "③-2"부터 하세요.

---

## 1단계: GitHub 토큰 만들기 (Worker가 GitHub에 실행을 요청할 때 씀)

1. GitHub 오른쪽 위 **프로필 사진 → Settings**
2. 왼쪽 메뉴 맨 아래 **Developer settings**
3. **Personal access tokens → Fine-grained tokens → Generate new token**
4. 아래처럼 입력
   - **Token name**: `moa-worker`
   - **Expiration**: 90 days (만료되면 새로 만들어서 4단계 값만 바꾸면 됨)
   - **Repository access**: **Only select repositories** → `jaellie/jellie`
   - **Permissions → Repository permissions → Actions**: **Read and write**
     (다른 권한은 건드리지 않음. Metadata: Read-only는 자동으로 붙음)
5. **Generate token** → 나온 토큰(`github_pat_...`)을 복사해서 메모장에 임시 저장

🔒 이 토큰은 "이 저장소의 Actions 실행"만 할 수 있게 최소 권한으로 만든 것입니다.

## 2단계: Cloudflare Worker 만들기

1. [dash.cloudflare.com](https://dash.cloudflare.com)에 가입하고 로그인 (무료 플랜)
2. 왼쪽 메뉴 **Compute (Workers) → Workers & Pages** → **Create**
3. **Start with Hello World!** (또는 Create Worker) 선택
4. 이름을 `moa`로 하고 **Deploy**
5. 배포가 끝나면 **Edit code** 클릭
6. 왼쪽 코드 창의 내용을 **전부 지우고**, 이 폴더의 [`worker.js`](worker.js) 내용을 전부 복사해서 붙여넣기
   - GitHub에서 `worker.js`를 열고 오른쪽 위 **복사 아이콘(Copy raw file)**을 누르면 편합니다.
7. 오른쪽 위 **Deploy** 클릭
8. Worker 주소를 복사해 둠: `https://moa.<내계정이름>.workers.dev`

## 3단계: Worker에 비밀값 넣기

Worker 화면 → **Settings → Variables and Secrets → + Add**

| Type | Variable name | Value |
|---|---|---|
| **Secret** | `DISCORD_PUBLIC_KEY` | Discord Developer Portal → Moa → **General Information → Public Key** |
| **Secret** | `GITHUB_TOKEN` | 1단계에서 만든 `github_pat_...` |
| Text | `GITHUB_REPO` | `jaellie/jellie` |
| Text (선택) | `ALLOWED_CHANNEL_IDS` | `#구매요청` 채널 ID. 넣으면 그 채널에서만 `/moa`가 동작 |

다 넣고 **Deploy** (또는 Save and deploy).

## 4단계: 디스코드에 Worker 주소 알려주기

1. [Discord Developer Portal](https://discord.com/developers/applications) → **Moa** → **General Information**
2. **Interactions Endpoint URL**에 2단계의 Worker 주소 붙여넣기
3. **Save Changes**
   - 저장할 때 디스코드가 Worker에 확인 요청을 보냅니다. 초록색으로 저장되면 성공입니다.
   - ❌ *"could not be verified"*가 나오면 3단계의 `DISCORD_PUBLIC_KEY` 값을 다시 확인하고 Worker를 다시 Deploy하세요.

## 5단계: `/moa` 명령 등록

1. GitHub 저장소 → **Settings → Secrets and variables → Actions → Variables** 탭에 두 개 추가

   | Name | Value |
   |---|---|
   | `DISCORD_APPLICATION_ID` | Developer Portal → General Information → **Application ID** |
   | `DISCORD_GUILD_ID` | 디스코드에서 서버 아이콘 우클릭 → **서버 ID 복사** (넣으면 바로 반영됨) |

2. **Actions** 탭 → 왼쪽 **Moa /moa 명령 등록** → **Run workflow**
3. 초록 체크 ✅가 뜨면 등록 완료

## 6단계: 써 보기 🎉

`#구매요청` 채널에 `/moa` (한국어 디스코드에서는 `/모아`로도 보임)를 입력합니다.

| 입력 | 결과 |
|---|---|
| `/moa` | 채널 전체 기간 집계 |
| `/moa 시작일:2026-09-28` | 9월 28일부터 |
| `/moa 시작일:2026-09-28 종료일:2026-10-03` | 기간 지정 |
| `/moa 이름가리기:True` | 엑셀에서 이름을 김*수처럼 가림 |

바로 "🛒 집계를 시작해요" 답장이 오고, 1~2분 뒤 Moa가 엑셀을 올립니다.

## 문제 해결

| 증상 | 원인과 해결 |
|---|---|
| `/moa`가 목록에 안 보임 | 5단계 실행 여부 확인. `DISCORD_GUILD_ID` 없이 등록했다면 반영에 시간이 걸릴 수 있음. 디스코드 앱 재시작 |
| "애플리케이션이 응답하지 않았어요" | 4단계 주소가 틀렸거나 Worker 코드가 Deploy되지 않음 |
| "⚠️ 집계를 시작하지 못했어요" | GitHub 토큰 문제. 만료 여부, 저장소 선택, Actions: Read and write 권한 확인. Cloudflare Worker → **Logs**에서 자세한 원인 확인 |
| "⚠️ Moa 집계에 실패했어요" + 링크 | 링크를 눌러 GitHub 실행 기록의 오류 확인 (401: 봇 토큰, 403: 채널 권한, Message Content Intent 등) |
| "이 채널에서는 Moa를 쓸 수 없어요" | `ALLOWED_CHANNEL_IDS`에 채널 ID 추가 |

## 비용

| 구성 | 무료 한도 | 실제 사용량 |
|---|---|---|
| Cloudflare Workers | 하루 10만 요청 | `/moa` 한 번에 1요청 |
| GitHub Actions | 공개 저장소 무제한, 비공개 월 2,000분 | 한 번에 1~2분 |

## 테스트

```bash
cd purchase-collector/discord-worker
node --test
```

실제 디스코드·GitHub 없이, 테스트용 서명 키와 가짜 GitHub 응답으로 서명 검증 · 날짜 확인 · 채널 제한 · 실패 안내를 확인합니다.
