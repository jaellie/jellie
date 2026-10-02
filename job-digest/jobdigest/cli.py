"""실행 진입점.

    python -m jobdigest run            # 수집 → 필터 → 메일 발송 → state 저장 → 로그
    python -m jobdigest run --dry-run  # 실제 수집, 메일 대신 out/preview.html 저장
    python -m jobdigest run --demo     # API 키 없이 샘플 데이터로 미리보기
    python -m jobdigest probe recruit  # API 원본 응답 첫 항목 출력 (필드명 확인용)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tomllib
from datetime import date, datetime
from pathlib import Path

from . import KST, filters, mailer, render, sources, summarize
from .http import FetchError
from .state import State

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures"
DEMO_TODAY = date(2026, 10, 2)


def _env(name: str, required: bool = True) -> str:
    value = os.environ.get(name, "").strip()
    if required and not value:
        raise SystemExit(f"환경변수 {name}가 없습니다. README의 '설정' 단계를 확인하세요.")
    return value


def _log(path: Path, record: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def run(args: argparse.Namespace) -> int:
    cfg = tomllib.loads(Path(args.config).read_text(encoding="utf-8"))
    today = (
        date.fromisoformat(args.today) if args.today
        else DEMO_TODAY if args.demo
        else datetime.now(KST).date()
    )
    state_path = Path(args.state)
    state = State() if args.demo else State.load(state_path)
    errors: list[str] = []

    # 1) 수집 — 한 소스가 실패해도 나머지는 계속 진행하고, 실패 사실은 메일에 표시한다.
    jobs: list[sources.Job] = []
    press: list[sources.Press] = []
    if cfg["recruit"].get("enabled", True):
        try:
            jobs = (
                sources.parse_recruit((FIXTURES / "recruit.json").read_bytes()) if args.demo
                else sources.fetch_recruit(_env("DATA_GO_KR_KEY"), cfg["recruit"].get("max_pages", 5))
            )
        except (FetchError, ValueError, OSError) as e:
            errors.append(f"채용공고: {e}")
    if cfg["press"].get("enabled", True):
        try:
            press = (
                sources.parse_press((FIXTURES / "press.xml").read_bytes()) if args.demo
                else sources.fetch_press(_env("DATA_GO_KR_KEY"), today)
            )
        except (FetchError, ValueError, OSError) as e:
            errors.append(f"보도자료: {e}")

    # 2) 내 조건으로 필터 + 이미 보낸 것 제외
    matched = [j for j in jobs if filters.match_job(j, cfg["recruit"], today)]
    new_jobs = filters.by_deadline(state.new_jobs(matched))
    closing = state.closing_soon(
        today, cfg["recruit"].get("deadline_alert_days", 3), exclude={j.id for j in new_jobs}
    )
    new_press = state.new_press([p for p in press if filters.match_press(p, cfg["press"])])
    new_press = new_press[: cfg["press"].get("max_items", 15)]

    # 3) (선택) AI 요약 — 실패해도 진행
    summary = None
    if cfg.get("ai", {}).get("enabled") and (new_jobs or new_press) and not args.demo:
        key = _env("GEMINI_API_KEY", required=False)
        if key:
            try:
                summary = summarize.summarize(new_jobs, new_press, api_key=key, model=cfg["ai"]["model"])
            except Exception as e:  # noqa: BLE001 — 요약은 부가 기능
                errors.append(f"AI 요약 생략: {e}")

    digest = render.Digest(today, new_jobs, closing, new_press, summary, errors)
    subject = render.subject(digest, cfg["mail"]["subject_prefix"])
    record = {
        "date": today.isoformat(),
        "fetched_jobs": len(jobs),
        "matched_jobs": len(matched),
        "new_jobs": len(new_jobs),
        "closing": len(closing),
        "fetched_press": len(press),
        "new_press": len(new_press),
        "errors": errors,
    }

    # 4) 미리보기 모드: 파일만 쓰고 끝
    if args.dry_run or args.demo:
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render.html(digest), encoding="utf-8")
        print(subject)
        print(render.text(digest))
        print(f"미리보기 저장: {out}")
        return 0

    if digest.is_empty and not cfg["mail"].get("send_when_empty", True):
        _log(Path(args.log), {**record, "sent": False, "reason": "empty"})
        print("새 소식 없음 — 발송 생략")
        return 0

    # 5) 발송 → 성공했을 때만 state 갱신 (실패하면 내일 다시 보냄)
    user = _env("GMAIL_USER")
    try:
        mailer.send(
            user=user,
            app_password=_env("GMAIL_APP_PASSWORD"),
            to=_env("MAIL_TO", required=False) or user,
            subject=subject,
            text=render.text(digest),
            html=render.html(digest),
        )
    except Exception as e:
        _log(Path(args.log), {**record, "sent": False, "reason": f"mail: {e}"})
        print(f"메일 발송 실패: {e}", file=sys.stderr)
        return 1

    state.mark_sent(new_jobs, new_press, today)
    state.prune(today)
    state.save(state_path)
    _log(Path(args.log), {**record, "sent": True})
    print(f"발송 완료: {subject}")
    return 0


def probe(args: argparse.Namespace) -> int:
    """실제 API 응답의 첫 항목을 그대로 보여준다. 필드명이 바뀌었는지 확인할 때 사용."""
    key = _env("DATA_GO_KR_KEY")
    from . import http

    if args.source == "recruit":
        body = http.get(sources.RECRUIT_URL, {
            "serviceKey": http.normalize_service_key(key), "resultType": "json",
            "pageNo": "1", "numOfRows": "1",
        })
    else:
        today = datetime.now(KST).date().strftime("%Y%m%d")
        body = http.get(sources.PRESS_URL, {
            "serviceKey": http.normalize_service_key(key), "startDate": today, "endDate": today,
        })
    print(body.decode("utf-8", "replace")[:4000])
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="jobdigest", description="공공기관 취준 데일리 브리핑")
    sub = parser.add_subparsers(dest="command", required=True)

    p_run = sub.add_parser("run", help="브리핑 생성 및 발송")
    p_run.add_argument("--config", default=str(ROOT / "config.toml"))
    p_run.add_argument("--state", default=str(ROOT / "state.json"))
    p_run.add_argument("--log", default=str(ROOT / "logs" / "runs.jsonl"))
    p_run.add_argument("--out", default=str(ROOT / "out" / "preview.html"))
    p_run.add_argument("--today", help="기준 날짜 YYYY-MM-DD (테스트용)")
    p_run.add_argument("--dry-run", action="store_true", help="메일 대신 미리보기 파일 저장")
    p_run.add_argument("--demo", action="store_true", help="샘플 데이터로 실행 (API 키 불필요)")
    p_run.set_defaults(func=run)

    p_probe = sub.add_parser("probe", help="API 원본 응답 확인")
    p_probe.add_argument("source", choices=["recruit", "press"])
    p_probe.set_defaults(func=probe)

    args = parser.parse_args(argv)
    return args.func(args)
