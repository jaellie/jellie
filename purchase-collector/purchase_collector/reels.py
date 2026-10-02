"""릴스 · 쇼츠 · 틱톡 링크를 #태그별로 정리해서 디스코드 메시지로 만든다 (Blueberry).

- 분류는 사람이 단 #태그로만 한다 (AI 없음). 태그가 없으면 '미분류'.
- 제목은 디스코드 미리보기 카드에서 가져온다 (없으면 링크만).
- 같은 영상은 공유 링크 꼬리표(igsh, si 등)를 지우고 하나로 합친다.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import parse_qs, urlsplit

from . import links
from .collect import follow_ups
from .parser import Message

DISCORD_LIMIT = 2000
UNTAGGED = "미분류"
HASHTAG_RE = re.compile(r"(?<![<\w&])#([^\s#<>]+)")


@dataclass
class Clip:
    key: str
    url: str
    platform: str
    title: str = ""
    tags: list[str] = field(default_factory=list)
    memo: str = ""
    sharers: list[str] = field(default_factory=list)
    first_time: datetime | None = None


def identify(url: str) -> tuple[str, str] | None:
    """링크 → (플랫폼, 같은 영상이면 같은 키). 영상 링크가 아니면 None."""
    parts = urlsplit(url)
    host = (parts.hostname or "").lower().removeprefix("www.").removeprefix("m.")
    segs = [s for s in parts.path.split("/") if s]

    if host == "youtu.be" and segs:
        return "유튜브", f"youtube:{segs[0]}"
    if host == "youtube.com":
        if len(segs) >= 2 and segs[0] == "shorts":
            return "유튜브 쇼츠", f"youtube:{segs[1]}"
        video = parse_qs(parts.query).get("v", [""])[0]
        if segs[:1] == ["watch"] and video:
            return "유튜브", f"youtube:{video}"
        return None
    if host == "instagram.com" and len(segs) >= 2 and segs[0] in ("reel", "reels", "p"):
        return "인스타", f"instagram:{segs[1]}"
    if host == "tiktok.com" and "video" in segs:
        i = segs.index("video")
        if i + 1 < len(segs):
            return "틱톡", f"tiktok:{segs[i + 1]}"
    if host in ("vt.tiktok.com", "vm.tiktok.com") and segs:
        return "틱톡", f"tiktok-short:{segs[0]}"
    return None


def hashtags(text: str) -> list[str]:
    """'#요리 #자취' → ['요리', '자취']. 링크 안의 #, 디스코드 채널 멘션(<#123>)은 제외."""
    plain = links.strip_urls(text)
    tags = [t.rstrip(".,!?~") for t in HASHTAG_RE.findall(plain)]
    return list(dict.fromkeys(t for t in tags if t and not t.isdigit()))


def _memo(text: str) -> str:
    plain = HASHTAG_RE.sub(" ", links.strip_urls(text))
    return re.sub(r"\s+", " ", plain).strip()


def collect(messages: list[Message], since: datetime | None = None) -> list[Clip]:
    titles: dict[str, str] = {}
    for m in messages:
        for url, title in m.link_titles:
            hit = identify(url)
            if hit:
                titles.setdefault(hit[1], title)

    scoped = [m for m in messages if not since or m.time > since]
    clips: dict[str, Clip] = {}
    for i, msg in enumerate(scoped):
        urls = links.extract_urls(msg.text)
        if not urls:
            continue
        text = " ".join([msg.text, *follow_ups(scoped, i)])
        tags, memo = hashtags(text), _memo(text)
        for url in urls:
            hit = identify(url)
            if not hit:
                continue
            platform, key = hit
            clip = clips.setdefault(key, Clip(key=key, url=url, platform=platform, first_time=msg.time))
            clip.title = clip.title or titles.get(key, "")
            clip.tags.extend(t for t in tags if t not in clip.tags)
            if memo and memo not in clip.memo:
                clip.memo = f"{clip.memo} / {memo}" if clip.memo else memo
            if msg.sender not in clip.sharers:
                clip.sharers.append(msg.sender)
    return sorted(clips.values(), key=lambda c: c.first_time)


def group_by_tag(clips: list[Clip]) -> dict[str, list[Clip]]:
    """태그별로 묶는다. 태그가 여러 개인 영상은 첫 번째 태그에만 넣는다 (같은 영상이 여러 번 보이지 않게)."""
    groups: dict[str, list[Clip]] = {}
    for c in clips:
        groups.setdefault(c.tags[0] if c.tags else UNTAGGED, []).append(c)
    ordered = sorted((k for k in groups if k != UNTAGGED), key=lambda k: (-len(groups[k]), k))
    if UNTAGGED in groups:
        ordered.append(UNTAGGED)
    return {k: groups[k] for k in ordered}


def _line(c: Clip) -> str:
    label = c.title or c.memo or c.platform
    extra_tags = " ".join(f"#{t}" for t in c.tags[1:])
    who = ", ".join(c.sharers)
    parts = [f"• [{c.platform}] {label}"]
    if c.title and c.memo:
        parts.append(f"_{c.memo}_")
    if extra_tags:
        parts.append(extra_tags)
    # <링크> : 디스코드가 미리보기 카드를 또 만들지 않게
    return " · ".join(parts) + f" — {who} <{c.url}>"


def format_digest(clips: list[Clip], header: str) -> list[str]:
    """디스코드 메시지 목록. 한 메시지가 2,000자를 넘지 않게 나눈다."""
    lines = [header, ""]
    for tag, items in group_by_tag(clips).items():
        title = f"**{UNTAGGED}** ({len(items)})" if tag == UNTAGGED else f"**#{tag}** ({len(items)})"
        lines += [title, *(_line(c) for c in items), ""]
    if any(not c.tags for c in clips):
        lines.append("_태그를 달면 다음부터 분류돼요. 예: 링크 #요리_")

    messages, current = [], ""
    for line in lines:
        line = line if len(line) <= DISCORD_LIMIT else line[: DISCORD_LIMIT - 1] + "…"
        if len(current) + len(line) + 1 > DISCORD_LIMIT:
            messages.append(current.rstrip())
            current = ""
        current += line + "\n"
    if current.strip():
        messages.append(current.rstrip())
    return messages
