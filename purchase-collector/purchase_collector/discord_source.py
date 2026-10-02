"""디스코드 채널에서 메시지 가져오기 + 결과 파일 올리기 (공식 Bot API, 표준 라이브러리만 사용).

봇 설정에서 'Message Content Intent'를 켜야 메시지 본문을 읽을 수 있다.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path

from . import KST
from .parser import Message

API = "https://discord.com/api/v10"
USER_AGENT = "DiscordBot (https://github.com/jaellie/jellie, 1.0)"
PAGE_SIZE = 100
MAX_PAGES = 50  # 최대 5,000개 메시지
USER_MESSAGE_TYPES = {0, 19}  # 일반 메시지, 답장


class DiscordError(RuntimeError):
    pass


def _request(method: str, path: str, token: str, *, body: bytes | None = None,
             content_type: str | None = None, retries: int = 3) -> object:
    headers = {"Authorization": f"Bot {token}", "User-Agent": USER_AGENT}
    if content_type:
        headers["Content-Type"] = content_type
    req = urllib.request.Request(API + path, data=body, headers=headers, method=method)
    for _ in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read() or b"null")
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")
            if e.code == 429:  # 요청이 너무 많음 → 디스코드가 알려준 시간만큼 기다렸다가 재시도
                time.sleep(float(json.loads(detail or "{}").get("retry_after", 1)))
                continue
            hint = {
                401: "봇 토큰이 잘못됐습니다.",
                403: "봇이 이 채널을 볼 권한이 없습니다 (채널 권한: 채널 보기, 메시지 기록 보기, 파일 첨부).",
                404: "채널 ID를 찾을 수 없습니다.",
            }.get(e.code, "")
            raise DiscordError(f"HTTP {e.code} {hint} {detail[:200]}".strip()) from e
    raise DiscordError("요청 한도 초과로 재시도에 실패했습니다.")


def _display_name(author: dict) -> str:
    return author.get("global_name") or author.get("username") or "알 수 없음"


def to_message(raw: dict) -> Message | None:
    """디스코드 메시지 JSON → 공통 Message. 봇·시스템 메시지는 제외."""
    if raw.get("type", 0) not in USER_MESSAGE_TYPES or raw.get("author", {}).get("bot"):
        return None
    when = datetime.fromisoformat(raw["timestamp"]).astimezone(KST).replace(tzinfo=None)
    return Message(when, _display_name(raw["author"]), raw.get("content", ""))


def fetch_messages(channel_id: str, token: str, since: datetime | None = None) -> list[Message]:
    """채널의 메시지를 최신부터 거슬러 올라가며 가져온다. since보다 오래된 메시지가 나오면 멈춘다."""
    out: list[Message] = []
    before = None
    saw_content = False
    for _ in range(MAX_PAGES):
        query = f"?limit={PAGE_SIZE}" + (f"&before={before}" if before else "")
        page = _request("GET", f"/channels/{channel_id}/messages{query}", token)
        if not page:
            break
        for raw in page:
            saw_content = saw_content or bool(raw.get("content"))
            msg = to_message(raw)
            if msg:
                out.append(msg)
        before = page[-1]["id"]
        oldest = datetime.fromisoformat(page[-1]["timestamp"]).astimezone(KST).replace(tzinfo=None)
        if len(page) < PAGE_SIZE or (since and oldest < since):
            break
    if out and not saw_content:
        raise DiscordError(
            "메시지 본문이 모두 비어 있습니다. Developer Portal → Bot → 'Message Content Intent'를 켜 주세요."
        )
    out.sort(key=lambda m: m.time)
    return out


def post_file(channel_id: str, token: str, path: Path, text: str) -> str:
    """결과 파일을 채널에 올리고, 올라간 메시지 ID를 돌려준다 (전송 성공 확인용)."""
    boundary = uuid.uuid4().hex
    payload = json.dumps({"content": text, "attachments": [{"id": 0, "filename": path.name}]})
    body = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"payload_json\"\r\n"
        f"Content-Type: application/json\r\n\r\n{payload}\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"files[0]\"; filename=\"{path.name}\"\r\n"
        f"Content-Type: application/octet-stream\r\n\r\n".encode(),
        path.read_bytes(),
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    result = _request("POST", f"/channels/{channel_id}/messages", token, body=body,
                      content_type=f"multipart/form-data; boundary={boundary}")
    if not isinstance(result, dict) or not result.get("id") or not result.get("attachments"):
        raise DiscordError("파일 전송 응답에 첨부파일이 없습니다. 전송에 실패했을 수 있습니다.")
    return result["id"]
