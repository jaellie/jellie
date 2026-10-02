#!/usr/bin/env bash
# 실패하면 디스코드 채널에 알린다. 조용히 실패해서 아무 소식이 없는 상황을 막기 위함.
# 사용: notify-failure.sh "<작업 이름>"   (환경변수 DISCORD_BOT_TOKEN, CHANNEL_ID, RUN_URL 필요)
set -u
if [ -z "${DISCORD_BOT_TOKEN:-}" ] || [ -z "${CHANNEL_ID:-}" ]; then exit 0; fi
body=$(TASK="$1" python3 -c 'import json, os; print(json.dumps({"content": "⚠️ Blueberry " + os.environ["TASK"] + "에 실패했어요. 실행 기록: <" + os.environ["RUN_URL"] + ">"}))')
curl -sS -X POST "https://discord.com/api/v10/channels/$CHANNEL_ID/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" -H "Content-Type: application/json" --data "$body"
