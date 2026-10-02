"""데이터 수집: 공공기관 채용정보 API(JSON) + 정책브리핑 보도자료 API(XML)."""

from __future__ import annotations

import hashlib
import html
import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from . import http

RECRUIT_URL = "https://apis.data.go.kr/1051000/recruitment/list"
PRESS_URL = "https://apis.data.go.kr/1371000/pressReleaseService/pressReleaseList"
ALIO_JOB_HOME = "https://job.alio.go.kr"


@dataclass(frozen=True)
class Job:
    id: str
    title: str
    institution: str
    region: str
    employment_type: str
    job_field: str
    start: date | None
    deadline: date | None
    url: str


@dataclass(frozen=True)
class Press:
    id: str
    title: str
    department: str
    approved: str
    url: str
    excerpt: str


def _date(value: object) -> date | None:
    text = re.sub(r"[^0-9]", "", str(value or ""))[:8]
    try:
        return datetime.strptime(text, "%Y%m%d").date()
    except ValueError:
        return None


def _text(value: object) -> str:
    return re.sub(r"\s+", " ", html.unescape(str(value or ""))).strip()


# --- 채용공고 -------------------------------------------------------------

def parse_recruit(payload: bytes | str | dict) -> list[Job]:
    data = payload if isinstance(payload, dict) else json.loads(payload)
    code = str(data.get("resultCode", "200"))
    if code not in ("200", "00", "0"):
        raise http.FetchError(f"채용정보 API 오류: {code} {data.get('resultMsg', '')}")
    jobs = []
    for raw in data.get("result") or []:
        title = _text(raw.get("recrutPbancTtl"))
        institution = _text(raw.get("instNm"))
        job_id = str(raw.get("recrutPblntSn") or "").strip() or hashlib.sha1(
            f"{institution}|{title}".encode()
        ).hexdigest()[:16]
        jobs.append(
            Job(
                id=job_id,
                title=title,
                institution=institution,
                region=_text(raw.get("workRgnNmLst")),
                employment_type=_text(raw.get("hireTypeNmLst")),
                job_field=_text(raw.get("ncsCdNmLst")),
                start=_date(raw.get("pbancBgngYmd")),
                deadline=_date(raw.get("pbancEndYmd")),
                url=_text(raw.get("srcUrl")) or ALIO_JOB_HOME,
            )
        )
    return jobs


def fetch_recruit(service_key: str, max_pages: int = 5) -> list[Job]:
    jobs: list[Job] = []
    for page in range(1, max_pages + 1):
        body = http.get(
            RECRUIT_URL,
            {
                "serviceKey": http.normalize_service_key(service_key),
                "resultType": "json",
                "pageNo": str(page),
                "numOfRows": "100",
            },
        )
        batch = parse_recruit(body)
        jobs.extend(batch)
        if len(batch) < 100:
            break
    return jobs


# --- 보도자료 -------------------------------------------------------------

def _excerpt(contents: str, limit: int = 160) -> str:
    plain = _text(re.sub(r"<[^>]+>", " ", html.unescape(contents or "")))
    return plain if len(plain) <= limit else plain[:limit].rstrip() + "…"


def parse_press(payload: bytes | str) -> list[Press]:
    root = ET.fromstring(payload)
    code = (root.findtext("./header/resultCode") or "0").strip()
    if code not in ("0", "00"):
        msg = (root.findtext("./header/resultMsg") or "").strip()
        raise http.FetchError(f"보도자료 API 오류: {code} {msg}")
    items = []
    for node in root.findall("./body/NewsItem"):
        title = _text(node.findtext("Title"))
        url = _text(node.findtext("OriginalUrl"))
        news_id = _text(node.findtext("NewsItemId")) or hashlib.sha1(
            f"{title}|{url}".encode()
        ).hexdigest()[:16]
        items.append(
            Press(
                id=news_id,
                title=title,
                department=_text(node.findtext("MinisterCode")),
                approved=_text(node.findtext("ApproveDate")),
                url=url,
                excerpt=_excerpt(node.findtext("DataContents") or ""),
            )
        )
    return items


def fetch_press(service_key: str, today: date) -> list[Press]:
    # 어제~오늘을 조회하고, 이미 보낸 건 state로 걸러낸다 (밤늦게 올라온 자료 누락 방지).
    body = http.get(
        PRESS_URL,
        {
            "serviceKey": http.normalize_service_key(service_key),
            "startDate": (today - timedelta(days=1)).strftime("%Y%m%d"),
            "endDate": today.strftime("%Y%m%d"),
        },
    )
    return parse_press(body)
