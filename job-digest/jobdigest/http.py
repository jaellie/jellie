"""공공데이터포털 호출용 최소 HTTP 클라이언트 (표준 라이브러리만 사용)."""

from __future__ import annotations

import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


class FetchError(RuntimeError):
    pass


def normalize_service_key(key: str) -> str:
    """포털의 'Encoding' 키를 넣어도 이중 인코딩되지 않게 원래 키로 되돌린다."""
    key = (key or "").strip()
    return urllib.parse.unquote(key) if "%" in key else key


def gateway_error(body: bytes) -> str | None:
    """data.go.kr 게이트웨이 오류(인증키 미등록 등)는 HTTP 200이어도 XML로 온다."""
    head = body.lstrip()[:200]
    if b"OpenAPI_ServiceResponse" not in head and b"cmmMsgHeader" not in body[:500]:
        return None
    try:
        root = ET.fromstring(body)
    except ET.ParseError:
        return body[:200].decode("utf-8", "replace")
    msg = root.findtext(".//returnAuthMsg") or root.findtext(".//errMsg") or "unknown"
    code = root.findtext(".//returnReasonCode") or "?"
    return f"{msg} (code {code})"


def get(url: str, params: dict[str, str], *, timeout: int = 20, retries: int = 2) -> bytes:
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{url}?{query}", headers={"User-Agent": "job-digest/1.0"}
    )
    last: Exception | None = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = response.read()
        except urllib.error.HTTPError as e:
            detail = gateway_error(e.read() or b"")
            raise FetchError(f"HTTP {e.code} {url}" + (f" — {detail}" if detail else "")) from e
        except (urllib.error.URLError, TimeoutError) as e:
            last = e
            time.sleep(2 ** attempt)
            continue
        detail = gateway_error(body)
        if detail:
            raise FetchError(f"{url} — {detail}")
        return body
    raise FetchError(f"{url} — 재시도 실패: {last}")
