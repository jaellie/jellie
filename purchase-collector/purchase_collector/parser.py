"""카카오톡 '대화 내보내기' 파일 파싱.

지원 형식
- PC(Windows) txt : "--------------- 2026년 10월 2일 금요일 ---------------" + "[홍길동] [오후 3:15] 메시지"
- Android txt     : "2026년 10월 2일 오후 3:15, 홍길동 : 메시지"
- iPhone txt      : "2026. 10. 2. 오후 3:15, 홍길동 : 메시지"
- Mac csv         : Date,User,Message
여러 줄 메시지는 앞 메시지에 이어 붙인다.
"""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path


@dataclass(frozen=True)
class Message:
    time: datetime
    sender: str
    text: str


_PC_DATE = re.compile(r"^-+\s*(\d{4})년 (\d{1,2})월 (\d{1,2})일 .*?-+$")
_PC_MSG = re.compile(r"^\[(?P<sender>[^\]]+)\] \[(?P<ampm>오전|오후) (?P<h>\d{1,2}):(?P<m>\d{2})\] (?P<text>.*)$")
_MOBILE_MSG = re.compile(
    r"^(?:(?P<y1>\d{4})년 (?P<mo1>\d{1,2})월 (?P<d1>\d{1,2})일|(?P<y2>\d{4})\. (?P<mo2>\d{1,2})\. (?P<d2>\d{1,2})\.)"
    r" (?P<ampm>오전|오후) (?P<h>\d{1,2}):(?P<m>\d{2}), (?P<sender>.+?) : (?P<text>.*)$"
)
# 모바일 형식에서 메시지가 아닌 날짜/시스템 줄 (예: "2026년 10월 2일 금요일", "..., 홍길동님이 들어왔습니다.")
_MOBILE_SYSTEM = re.compile(r"^(?:\d{4}년 \d{1,2}월 \d{1,2}일|\d{4}\. \d{1,2}\. \d{1,2}\.)")


def _to_24h(ampm: str, hour: int) -> int:
    hour %= 12
    return hour + 12 if ampm == "오후" else hour


def _read_text(path: Path) -> str:
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "cp949"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"{path.name}: 파일 인코딩을 읽을 수 없습니다.")


def parse_csv(text: str) -> list[Message]:
    out = []
    for row in csv.DictReader(io.StringIO(text)):
        try:
            when = datetime.fromisoformat(row["Date"].strip())
        except (KeyError, ValueError):
            continue
        out.append(Message(when, row.get("User", "").strip(), row.get("Message", "")))
    return out


def parse_txt(text: str) -> list[Message]:
    messages: list[Message] = []
    current_day: date | None = None
    last_was_message = False

    for line in text.splitlines():
        if m := _PC_DATE.match(line):
            current_day = date(int(m[1]), int(m[2]), int(m[3]))
            last_was_message = False
            continue
        if (m := _PC_MSG.match(line)) and current_day:
            when = datetime.combine(current_day, datetime.min.time()).replace(
                hour=_to_24h(m["ampm"], int(m["h"])), minute=int(m["m"])
            )
            messages.append(Message(when, m["sender"].strip(), m["text"]))
            last_was_message = True
            continue
        if m := _MOBILE_MSG.match(line):
            y, mo, d = (m["y1"], m["mo1"], m["d1"]) if m["y1"] else (m["y2"], m["mo2"], m["d2"])
            when = datetime(int(y), int(mo), int(d), _to_24h(m["ampm"], int(m["h"])), int(m["m"]))
            messages.append(Message(when, m["sender"].strip(), m["text"]))
            last_was_message = True
            continue
        if _MOBILE_SYSTEM.match(line):
            last_was_message = False
            continue
        # 여러 줄 메시지의 다음 줄
        if last_was_message and messages:
            prev = messages[-1]
            messages[-1] = Message(prev.time, prev.sender, prev.text + "\n" + line)
    return messages


def load(path: str | Path) -> list[Message]:
    path = Path(path)
    text = _read_text(path)
    if path.suffix.lower() == ".csv" or text.lstrip().startswith("Date,User,Message"):
        return parse_csv(text)
    return parse_txt(text)
