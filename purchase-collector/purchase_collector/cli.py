"""사용법:

    # 카카오톡: 내보내기 파일
    python -m purchase_collector 대화내보내기.txt --since 2026-09-28 --until 2026-10-03

    # 디스코드: 채널을 직접 읽기 (환경변수 DISCORD_BOT_TOKEN 필요)
    python -m purchase_collector --discord 123456789012345678 --since 2026-09-28 --post

    # 디스코드 릴스 채널: 지난 정리 이후 새 영상 링크를 #태그별 메시지로 정리
    python -m purchase_collector --mode reels --discord 123456789012345678 --post
"""

from __future__ import annotations

import argparse
import os
from datetime import datetime, timedelta
from pathlib import Path

from . import KST, collect, discord_source, export, parser, reels

BOT_NAME = "Blueberry"
REELS_MARKER = f"🫐 **{BOT_NAME} 릴스 정리**"


def _now() -> datetime:
    return datetime.now(KST).replace(tzinfo=None)


def _day(text: str) -> datetime:
    return datetime.strptime(text, "%Y-%m-%d")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="purchase_collector", description=f"대화 속 링크 정리 봇 ({BOT_NAME})")
    ap.add_argument("--mode", choices=["purchase", "reels"], default="purchase",
                    help="purchase: 구매요청 엑셀 (기본) / reels: 릴스·쇼츠 링크를 #태그별 메시지로")
    ap.add_argument("chat", nargs="?", help="카카오톡 '대화 내보내기' 파일 (.txt 또는 .csv)")
    ap.add_argument("--discord", metavar="CHANNEL_ID", help="디스코드 채널 ID (카톡 파일 대신)")
    ap.add_argument("--post", action="store_true", help="(디스코드) 결과 엑셀을 같은 채널에 올리기")
    ap.add_argument("--last-days", type=int, metavar="N", help="최근 N일만 집계 (--since 대신)")
    ap.add_argument("--only-if-new", type=int, metavar="HOURS",
                    help="(디스코드) 최근 HOURS시간 안에 새 요청이 없으면 올리지 않음 (자동 실행용)")
    ap.add_argument("-o", "--output", help="결과 파일 (.xlsx 또는 .csv)")
    ap.add_argument("--since", type=_day, help="이 날짜부터 (YYYY-MM-DD)")
    ap.add_argument("--until", type=_day, help="이 날짜까지, 당일 포함 (YYYY-MM-DD)")
    ap.add_argument("--all-links", action="store_true", help="쇼핑몰이 아닌 링크도 구매요청에 포함")
    ap.add_argument("--mask-names", action="store_true", help="이름을 김*수처럼 가려서 저장 (공유·포트폴리오용)")
    args = ap.parse_args(argv)

    if bool(args.chat) == bool(args.discord):
        ap.error("카카오톡 파일 경로 또는 --discord 채널 ID 중 하나만 지정하세요.")
    if args.post and not args.discord:
        ap.error("--post는 --discord와 함께 쓸 때만 동작합니다.")
    if args.last_days is not None:
        if args.since:
            ap.error("--since와 --last-days는 함께 쓸 수 없습니다.")
        today = _now().replace(hour=0, minute=0, second=0, microsecond=0)
        args.since = today - timedelta(days=args.last_days - 1)

    if args.mode == "reels":
        return run_reels(args)

    token = ""
    if args.discord:
        token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
        if not token:
            print("환경변수 DISCORD_BOT_TOKEN이 없습니다. README의 '디스코드 설정'을 확인하세요.")
            return 1
        try:
            messages = discord_source.fetch_messages(args.discord, token, since=args.since)
        except discord_source.DiscordError as e:
            print(f"디스코드에서 메시지를 가져오지 못했습니다: {e}")
            return 1
        source_name = f"디스코드 채널 {args.discord}"
        default_out = Path(f"discord_{args.discord}_구매요청.xlsx")
    else:
        chat = Path(args.chat)
        messages = parser.load(chat)
        source_name = chat.name
        default_out = chat.with_name(chat.stem + "_구매요청.xlsx")

    if not messages:
        if args.discord:
            print("채널에 메시지가 없습니다.")
            return 0
        print("메시지를 하나도 읽지 못했습니다. 카카오톡 '대화 내보내기'로 저장한 파일인지 확인해 주세요.")
        return 1

    until = args.until + timedelta(days=1) if args.until else None
    result = collect.collect(messages, since=args.since, until=until, all_links=args.all_links)

    out = Path(args.output) if args.output else default_out
    period = f"{messages[0].time:%Y-%m-%d} ~ {messages[-1].time:%Y-%m-%d}"
    if out.suffix.lower() == ".csv":
        export.to_csv(result, out, args.mask_names)
    else:
        try:
            export.to_xlsx(result, out, args.mask_names, title=f"구매 요청 집계 ({source_name})")
        except ImportError:
            out = out.with_suffix(".csv")
            export.to_csv(result, out, args.mask_names)
            print("openpyxl이 없어 CSV로 저장했습니다 (엑셀로 열 수 있어요). 엑셀 서식이 필요하면: pip install openpyxl")

    merged = sum(1 for r in result.requests if len(r.asks) > 1)
    summary = (
        f"구매 요청 {len(result.requests)}건 (같은 상품 중복 {merged}건 합침), "
        f"쇼핑몰 외 링크 {len(result.other_links)}개"
    )
    print(f"대화 기간: {period} · 읽은 메시지 {result.scanned}개")
    print(summary)
    print(f"저장: {out}")

    if args.post and args.only_if_new is not None:
        cutoff = _now() - timedelta(hours=args.only_if_new)
        fresh = sum(1 for r in result.requests if any(a.time >= cutoff for a in r.asks))
        if not fresh:
            print(f"최근 {args.only_if_new}시간 동안 새 구매 요청이 없어 디스코드에 올리지 않습니다.")
            return 0
        summary = f"새 요청 {fresh}건 · " + summary

    if args.post:
        text = f"🛒 **{BOT_NAME} 구매 요청 집계**\n{summary}\n단가를 입력하면 금액과 합계가 자동 계산돼요."
        try:
            message_id = discord_source.post_file(args.discord, token, out, text)
        except discord_source.DiscordError as e:
            print(f"디스코드 전송 실패: {e}")
            return 1
        print(f"디스코드 전송 확인 (메시지 ID {message_id})")
    return 0


def run_reels(args: argparse.Namespace) -> int:
    """릴스 모드: 엑셀 없이 디스코드 메시지로 정리한다."""
    now = _now()
    if args.discord:
        token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
        if not token:
            print("환경변수 DISCORD_BOT_TOKEN이 없습니다.")
            return 1
        # 처음 실행이면 --last-days(없으면 최근 1일)만 본다
        fallback = args.since or now - timedelta(days=1)
        try:
            messages, since = discord_source.fetch_since_last_post(args.discord, token, REELS_MARKER, fallback)
        except discord_source.DiscordError as e:
            print(f"디스코드에서 메시지를 가져오지 못했습니다: {e}")
            return 1
        print(f"{since:%Y-%m-%d %H:%M} 이후 메시지 {len(messages)}개를 확인합니다.")
    else:
        token = ""
        messages = parser.load(Path(args.chat))
        since = args.since

    clips = reels.collect(messages, since=since)
    if not clips:
        print("새 영상 링크가 없어 정리 메시지를 보내지 않습니다.")
        return 0

    tagged = sum(1 for c in clips if c.tags)
    header = f"{REELS_MARKER} · {now:%m/%d} · 새 영상 {len(clips)}개 (태그 {tagged} · 미분류 {len(clips) - tagged})"
    chunks = reels.format_digest(clips, header)
    if not args.post:
        print("\n\n".join(chunks))
        return 0
    try:
        ids = [discord_source.post_message(args.discord, token, chunk) for chunk in chunks]
    except discord_source.DiscordError as e:
        print(f"디스코드 전송 실패: {e}")
        return 1
    print(f"디스코드 전송 확인 (메시지 {len(ids)}개)")
    return 0
