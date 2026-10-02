"""대화에서 구매 요청을 모으고, 같은 상품 링크는 한 줄로 합친다."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

from . import links
from .parser import Message

# 링크를 보낸 뒤 같은 사람이 이 시간 안에 덧붙인 말("이거 3개요")은 같은 요청으로 본다
FOLLOW_UP_WINDOW = timedelta(minutes=3)
FOLLOW_UP_MAX = 2


@dataclass
class Ask:
    sender: str
    time: datetime
    qty: int | None
    memo: str


@dataclass
class Request:
    key: str
    url: str
    shop: str
    asks: list[Ask] = field(default_factory=list)

    @property
    def first(self) -> Ask:
        return self.asks[0]

    @property
    def total_qty(self) -> int | None:
        known = [a.qty for a in self.asks if a.qty is not None]
        return sum(known) if known else None

    @property
    def memo(self) -> str:
        return " / ".join(dict.fromkeys(a.memo for a in self.asks if a.memo))


@dataclass
class Result:
    requests: list[Request]
    other_links: list[tuple[Message, str]]
    scanned: int


def _follow_ups(messages: list[Message], i: int) -> list[str]:
    """i번째 메시지 직후, 같은 사람이 링크 없이 덧붙인 말."""
    base = messages[i]
    out = []
    for nxt in messages[i + 1 : i + 1 + FOLLOW_UP_MAX]:
        if nxt.sender != base.sender or nxt.time - base.time > FOLLOW_UP_WINDOW:
            break
        if links.extract_urls(nxt.text):
            break
        out.append(nxt.text.strip())
    return out


def collect(
    messages: list[Message],
    *,
    since: datetime | None = None,
    until: datetime | None = None,
    all_links: bool = False,
) -> Result:
    scoped = [m for m in messages if (not since or m.time >= since) and (not until or m.time < until)]
    by_key: dict[str, Request] = {}
    other: list[tuple[Message, str]] = []

    for i, msg in enumerate(scoped):
        urls = links.extract_urls(msg.text)
        if not urls:
            continue
        own_text = links.strip_urls(msg.text)
        extra = _follow_ups(scoped, i)
        memo = " ".join([own_text, *extra]).strip()
        qty, _ = links.quantity(memo)
        for url in urls:
            shop = links.shop_of(url)
            if shop is None and not all_links:
                other.append((msg, url))
                continue
            key = links.normalize(url)
            req = by_key.setdefault(key, Request(key=key, url=url, shop=shop or "기타"))
            # 같은 사람이 같은 링크를 다시 올린 건 한 번만 센다
            if any(a.sender == msg.sender for a in req.asks):
                continue
            req.asks.append(Ask(msg.sender, msg.time, qty, memo))

    requests = sorted(by_key.values(), key=lambda r: r.first.time)
    return Result(requests, other, len(scoped))
