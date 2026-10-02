"""내 조건에 맞는 항목만 남기는 규칙 기반 필터 (LLM 불필요)."""

from __future__ import annotations

from datetime import date

from .sources import Job, Press


def _any_in(words: list[str], text: str) -> bool:
    return any(w and w in text for w in words)


def match_job(job: Job, cfg: dict, today: date) -> bool:
    if job.deadline and job.deadline < today:
        return False
    if _any_in(cfg.get("exclude_keywords", []), job.title):
        return False
    keywords = cfg.get("keywords", [])
    if keywords and not _any_in(keywords, f"{job.title} {job.job_field}"):
        return False
    regions = cfg.get("regions", [])
    if regions and not _any_in(regions, job.region):
        if not (cfg.get("include_nationwide", True) and "전국" in job.region):
            return False
    institutions = cfg.get("institutions", [])
    if institutions and not _any_in(institutions, job.institution):
        return False
    return True


def match_press(item: Press, cfg: dict) -> bool:
    if _any_in(cfg.get("exclude_keywords", []), item.title):
        return False
    departments = cfg.get("departments", [])
    if departments and not _any_in(departments, item.department):
        return False
    keywords = cfg.get("keywords", [])
    if keywords and not _any_in(keywords, item.title):
        return False
    return True


def by_deadline(jobs: list[Job]) -> list[Job]:
    return sorted(jobs, key=lambda j: (j.deadline or date.max, j.institution))
