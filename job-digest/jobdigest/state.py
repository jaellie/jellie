"""이미 보낸 항목 기록. 메일 발송이 '성공한 뒤에만' 갱신해서, 실패한 날의 소식이 사라지지 않게 한다."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

from .sources import Job, Press

PRESS_RETENTION_DAYS = 30
JOB_RETENTION_AFTER_DEADLINE_DAYS = 7
OPEN_ENDED_JOB_RETENTION_DAYS = 90


@dataclass
class State:
    seen_jobs: dict[str, dict] = field(default_factory=dict)
    seen_press: dict[str, str] = field(default_factory=dict)
    last_sent: str | None = None

    @classmethod
    def load(cls, path: Path) -> "State":
        if not path.exists():
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        return cls(
            seen_jobs=data.get("seen_jobs", {}),
            seen_press=data.get("seen_press", {}),
            last_sent=data.get("last_sent"),
        )

    def save(self, path: Path) -> None:
        data = {
            "last_sent": self.last_sent,
            "seen_jobs": dict(sorted(self.seen_jobs.items())),
            "seen_press": dict(sorted(self.seen_press.items())),
        }
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def new_jobs(self, jobs: list[Job]) -> list[Job]:
        return [j for j in jobs if j.id not in self.seen_jobs]

    def new_press(self, items: list[Press]) -> list[Press]:
        return [p for p in items if p.id not in self.seen_press]

    def closing_soon(self, today: date, days: int, exclude: set[str]) -> list[dict]:
        """예전에 알려준 공고 중 마감이 days일 이내로 다가온 것."""
        out = []
        for job_id, job in self.seen_jobs.items():
            if job_id in exclude or not job.get("deadline"):
                continue
            left = (date.fromisoformat(job["deadline"]) - today).days
            if 0 <= left <= days:
                out.append({**job, "id": job_id, "days_left": left})
        return sorted(out, key=lambda j: (j["days_left"], j.get("institution", "")))

    def mark_sent(self, jobs: list[Job], press: list[Press], today: date) -> None:
        for j in jobs:
            self.seen_jobs[j.id] = {
                "title": j.title,
                "institution": j.institution,
                "deadline": j.deadline.isoformat() if j.deadline else None,
                "url": j.url,
                "first_seen": today.isoformat(),
            }
        for p in press:
            self.seen_press[p.id] = today.isoformat()
        self.last_sent = today.isoformat()

    def prune(self, today: date) -> None:
        job_cutoff = today - timedelta(days=JOB_RETENTION_AFTER_DEADLINE_DAYS)
        open_ended_cutoff = (today - timedelta(days=OPEN_ENDED_JOB_RETENTION_DAYS)).isoformat()

        def keep(job: dict) -> bool:
            if job.get("deadline"):
                return date.fromisoformat(job["deadline"]) >= job_cutoff
            return job.get("first_seen", "") >= open_ended_cutoff  # 상시채용 등 마감일 없는 공고

        self.seen_jobs = {k: v for k, v in self.seen_jobs.items() if keep(v)}
        press_cutoff = (today - timedelta(days=PRESS_RETENTION_DAYS)).isoformat()
        self.seen_press = {k: v for k, v in self.seen_press.items() if v >= press_cutoff}
