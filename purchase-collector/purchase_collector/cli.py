"""사용법:

    python -m purchase_collector 대화내보내기.txt
    python -m purchase_collector 대화내보내기.txt --since 2026-09-28 --until 2026-10-03 -o 10월행사_구매요청.xlsx
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta
from pathlib import Path

from . import collect, export, parser


def _day(text: str) -> datetime:
    return datetime.strptime(text, "%Y-%m-%d")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="purchase_collector", description="카톡 대화에서 구매 요청 링크를 엑셀로 집계")
    ap.add_argument("chat", help="카카오톡 '대화 내보내기' 파일 (.txt 또는 .csv)")
    ap.add_argument("-o", "--output", help="결과 파일 (.xlsx 또는 .csv). 기본: <대화파일>_구매요청.xlsx")
    ap.add_argument("--since", type=_day, help="이 날짜부터 (YYYY-MM-DD)")
    ap.add_argument("--until", type=_day, help="이 날짜까지, 당일 포함 (YYYY-MM-DD)")
    ap.add_argument("--all-links", action="store_true", help="쇼핑몰이 아닌 링크도 구매요청에 포함")
    ap.add_argument("--mask-names", action="store_true", help="이름을 김*수처럼 가려서 저장 (공유·포트폴리오용)")
    args = ap.parse_args(argv)

    chat = Path(args.chat)
    messages = parser.load(chat)
    if not messages:
        print("메시지를 하나도 읽지 못했습니다. 카카오톡 '대화 내보내기'로 저장한 파일인지 확인해 주세요.")
        return 1

    until = args.until + timedelta(days=1) if args.until else None
    result = collect.collect(messages, since=args.since, until=until, all_links=args.all_links)

    out = Path(args.output) if args.output else chat.with_name(chat.stem + "_구매요청.xlsx")
    period = f"{messages[0].time:%Y-%m-%d} ~ {messages[-1].time:%Y-%m-%d}"
    if out.suffix.lower() == ".csv":
        export.to_csv(result, out, args.mask_names)
    else:
        try:
            export.to_xlsx(result, out, args.mask_names, title=f"구매 요청 집계 ({chat.name})")
        except ImportError:
            out = out.with_suffix(".csv")
            export.to_csv(result, out, args.mask_names)
            print("openpyxl이 없어 CSV로 저장했습니다 (엑셀로 열 수 있어요). 엑셀 서식이 필요하면: pip install openpyxl")

    merged = sum(1 for r in result.requests if len(r.asks) > 1)
    print(f"대화 기간: {period} · 읽은 메시지 {result.scanned}개")
    print(f"구매 요청 {len(result.requests)}건 (같은 상품 중복 {merged}건 합침), 쇼핑몰 외 링크 {len(result.other_links)}개")
    print(f"저장: {out}")
    return 0
