"""브리핑 이메일 본문(HTML + 텍스트) 생성."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from html import escape

from .sources import Job, Press

WEEKDAYS = "월화수목금토일"


@dataclass
class Digest:
    today: date
    new_jobs: list[Job]
    closing: list[dict]
    press: list[Press]
    summary: str | None = None
    errors: list[str] = field(default_factory=list)

    @property
    def is_empty(self) -> bool:
        return not (self.new_jobs or self.closing or self.press)


def _left_label(days_left: int) -> str:
    return "오늘 마감" if days_left == 0 else f"D-{days_left}"


def d_day(deadline: date | None, today: date) -> str:
    return "상시" if deadline is None else _left_label((deadline - today).days)


def subject(d: Digest, prefix: str) -> str:
    day = f"{d.today:%m/%d}({WEEKDAYS[d.today.weekday()]})"
    if d.is_empty:
        return f"{prefix} {day} 새 소식 없음"
    parts = [f"새 공고 {len(d.new_jobs)}"]
    if d.closing:
        parts.append(f"마감임박 {len(d.closing)}")
    parts.append(f"보도자료 {len(d.press)}")
    return f"{prefix} {day} " + " · ".join(parts)


# --- HTML -----------------------------------------------------------------

_TABLE = 'style="border-collapse:collapse;width:100%;font-size:14px"'
_TH = 'style="text-align:left;padding:6px 8px;border-bottom:2px solid #333;white-space:nowrap"'
_TD = 'style="padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top"'
_BADGE = 'style="font-weight:bold;color:{color};white-space:nowrap"'


def _badge(label: str) -> str:
    urgent = label == "오늘 마감" or label in ("D-1", "D-2", "D-3")
    return f'<span {_BADGE.format(color="#c0392b" if urgent else "#555")}>{escape(label)}</span>'


def _link(text: str, url: str) -> str:
    return f'<a href="{escape(url, quote=True)}">{escape(text)}</a>' if url else escape(text)


def _jobs_table(jobs: list[Job], today: date) -> str:
    rows = "".join(
        f"<tr><td {_TD}>{_badge(d_day(j.deadline, today))}</td>"
        f"<td {_TD}><b>{escape(j.institution)}</b><br>{_link(j.title, j.url)}</td>"
        f"<td {_TD}>{escape(j.region or '-')}<br><small>{escape(j.employment_type)}</small></td></tr>"
        for j in jobs
    )
    return (
        f"<table {_TABLE}><tr><th {_TH}>마감</th><th {_TH}>기관 / 공고</th>"
        f"<th {_TH}>지역 / 고용형태</th></tr>{rows}</table>"
    )


def html(d: Digest) -> str:
    out = [
        '<div style="font-family:sans-serif;max-width:720px;margin:auto;color:#222">',
        f"<h2>📮 공공기관 취준 브리핑 · {d.today:%Y.%m.%d}</h2>",
    ]
    if d.summary:
        out.append(
            '<div style="background:#f4f6f8;padding:12px 16px;border-radius:6px">'
            f"<b>🤖 AI 3줄 요약</b><br>{escape(d.summary).replace(chr(10), '<br>')}"
            '<br><small style="color:#777">AI 요약은 틀릴 수 있어요. 원문 링크로 꼭 확인하세요.</small></div>'
        )
    if d.closing:
        rows = "".join(
            f"<tr><td {_TD}>{_badge(_left_label(c['days_left']))}</td>"
            f"<td {_TD}><b>{escape(c.get('institution', ''))}</b><br>"
            f"{_link(c.get('title', ''), c.get('url', ''))}</td></tr>"
            for c in d.closing
        )
        out.append(f"<h3>⏰ 마감 임박 ({len(d.closing)})</h3><table {_TABLE}>{rows}</table>")
    out.append(f"<h3>🎯 새 채용공고 ({len(d.new_jobs)})</h3>")
    out.append(_jobs_table(d.new_jobs, d.today) if d.new_jobs else "<p>조건에 맞는 새 공고가 없어요.</p>")
    out.append(f"<h3>📰 관심 부처 보도자료 ({len(d.press)})</h3>")
    if d.press:
        out.append("<ul>")
        for p in d.press:
            out.append(
                f"<li style='margin-bottom:10px'><small>[{escape(p.department)}]</small> "
                f"{_link(p.title, p.url)}"
                + (f"<br><small style='color:#555'>{escape(p.excerpt)}</small>" if p.excerpt else "")
                + "</li>"
            )
        out.append("</ul>")
    else:
        out.append("<p>새 보도자료가 없어요.</p>")
    if d.errors:
        items = "".join(f"<li>{escape(e)}</li>" for e in d.errors)
        out.append(
            '<div style="border:1px solid #e67e22;padding:8px 12px;margin-top:16px">'
            f"<b>⚠️ 수집 실패 (오늘 브리핑이 불완전할 수 있어요)</b><ul>{items}</ul></div>"
        )
    out.append(
        '<hr><small style="color:#777">출처: 공공데이터포털 공공기관 채용정보 · 정책브리핑 보도자료 API. '
        "자동 생성된 메일입니다.</small></div>"
    )
    return "\n".join(out)


# --- 텍스트 (HTML을 못 보는 메일 앱용) --------------------------------------

def text(d: Digest) -> str:
    lines = [f"공공기관 취준 브리핑 {d.today:%Y.%m.%d}", ""]
    if d.summary:
        lines += ["[AI 3줄 요약]", d.summary, ""]
    if d.closing:
        lines.append(f"[마감 임박 {len(d.closing)}]")
        lines += [f"- {_left_label(c['days_left'])} {c.get('institution')} | {c.get('title')} {c.get('url')}" for c in d.closing]
        lines.append("")
    lines.append(f"[새 채용공고 {len(d.new_jobs)}]")
    lines += [f"- {d_day(j.deadline, d.today)} {j.institution} | {j.title} ({j.region}) {j.url}" for j in d.new_jobs]
    lines += ["", f"[보도자료 {len(d.press)}]"]
    lines += [f"- [{p.department}] {p.title} {p.url}" for p in d.press]
    if d.errors:
        lines += ["", "[수집 실패]"] + [f"- {e}" for e in d.errors]
    return "\n".join(lines) + "\n"
