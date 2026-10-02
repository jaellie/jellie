"""메시지에서 링크·수량 뽑기, 쇼핑몰 구분, 같은 상품 링크 판별."""

from __future__ import annotations

import re
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

URL_RE = re.compile(r"https?://[^\s<>\"'\]\)]+")

# 도메인 끝부분 → 쇼핑몰 이름 (위에서부터 먼저 맞는 것)
SHOPS = [
    ("coupang.com", "쿠팡"), ("coupa.ng", "쿠팡"),
    ("smartstore.naver.com", "네이버 스마트스토어"), ("brand.naver.com", "네이버 브랜드스토어"),
    ("shopping.naver.com", "네이버쇼핑"), ("naver.me", "네이버(단축링크)"),
    ("11st.co.kr", "11번가"), ("gmarket.co.kr", "G마켓"), ("auction.co.kr", "옥션"),
    ("ssg.com", "SSG"), ("emart.ssg.com", "이마트몰"), ("lotteon.com", "롯데ON"),
    ("kurly.com", "컬리"), ("oliveyoung.co.kr", "올리브영"), ("musinsa.com", "무신사"),
    ("tmon.co.kr", "티몬"), ("wemakeprice.com", "위메프"), ("aliexpress.com", "알리익스프레스"),
    ("temu.com", "테무"), ("daiso.co.kr", "다이소몰"), ("baemin.com", "배민"),
    ("costco.co.kr", "코스트코"), ("homeplus.co.kr", "홈플러스"), ("kyobobook.co.kr", "교보문고"),
    ("yes24.com", "YES24"), ("aladin.co.kr", "알라딘"), ("ohou.se", "오늘의집"),
    ("29cm.co.kr", "29CM"), ("kakao.com", "카카오(선물하기 등)"),
]

# 같은 상품인데 링크만 다르게 보이게 만드는 추적용 파라미터
TRACKING_PARAMS = re.compile(
    r"^(utm_.*|fbclid|gclid|n_.*|nv_.*|NaPm|src|spec|ctag|lptag|itime|traceid|wPcid|wRef|wTime|"
    r"redirect|isAddedCart|addtag|q|searchId|sourceType|clickEventId|pageType|pageValue|rank)$"
)

QTY_RE = re.compile(r"(\d+)\s*(개|박스|box|BOX|세트|set|봉지|봉|팩|병|캔|묶음|통|장|권|EA|ea|인분)")


def extract_urls(text: str) -> list[str]:
    return [u.rstrip(".,!?~") for u in URL_RE.findall(text)]


def shop_of(url: str) -> str | None:
    host = (urlsplit(url).hostname or "").lower()
    for domain, name in SHOPS:
        if host == domain or host.endswith("." + domain):
            return name
    return None


def normalize(url: str) -> str:
    """추적 파라미터와 #조각을 지워서, 같은 상품이면 같은 문자열이 되게 한다."""
    parts = urlsplit(url)
    query = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if not TRACKING_PARAMS.match(k)]
    host = (parts.hostname or "").lower().removeprefix("www.").removeprefix("m.")
    return urlunsplit(("https", host, parts.path.rstrip("/"), urlencode(sorted(query)), ""))


def quantity(text: str) -> tuple[int | None, str]:
    """'이거 3개요' → (3, '3개'). 수량 표현이 없으면 (None, '')."""
    m = QTY_RE.search(text)
    return (int(m[1]), m[0]) if m else (None, "")


def strip_urls(text: str) -> str:
    return re.sub(r"\s+", " ", URL_RE.sub(" ", text)).strip()
