"""(선택) Gemini 무료 티어로 3줄 요약. 실패해도 브리핑 발송에는 영향 없음.

공개 데이터(공고 제목, 보도자료 제목)만 보내므로 개인정보가 외부로 나가지 않는다.
"""

from __future__ import annotations

import json
import urllib.request

from .sources import Job, Press

ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

PROMPT = """너는 공공기관 취업 준비생을 돕는 비서야. 아래는 오늘 새로 올라온 공공기관 채용공고와 정부 보도자료 제목이야.
취준생 입장에서 오늘 꼭 알아야 할 것을 한국어로 정확히 3줄로 요약해줘.

규칙:
- 각 줄은 "- "로 시작하고 60자 이내
- 목록에 없는 사실은 절대 추가하지 말 것
- "혁신적", "획기적", "주목할 만한" 같은 과장 표현 금지
- 숫자는 목록에서 직접 셀 수 있는 것만

[채용공고]
{jobs}

[보도자료]
{press}
"""


def build_prompt(jobs: list[Job], press: list[Press]) -> str:
    job_lines = "\n".join(f"- {j.institution}: {j.title} (마감 {j.deadline})" for j in jobs[:40]) or "- 없음"
    press_lines = "\n".join(f"- [{p.department}] {p.title}" for p in press[:30]) or "- 없음"
    return PROMPT.format(jobs=job_lines, press=press_lines)


def summarize(jobs: list[Job], press: list[Press], *, api_key: str, model: str) -> str:
    body = json.dumps({"contents": [{"parts": [{"text": build_prompt(jobs, press)}]}]}).encode()
    request = urllib.request.Request(
        ENDPOINT.format(model=model),
        data=body,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read())
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
