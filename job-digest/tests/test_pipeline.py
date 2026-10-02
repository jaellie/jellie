import dataclasses
import json
import tempfile
import tomllib
import unittest
from datetime import date
from pathlib import Path
from unittest import mock

from jobdigest import cli, filters, http, render, sources
from jobdigest.state import State

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "tests" / "fixtures"
TODAY = date(2026, 10, 2)
CFG = tomllib.loads((ROOT / "config.toml").read_text(encoding="utf-8"))


def load_jobs():
    return sources.parse_recruit((FIXTURES / "recruit.json").read_bytes())


def load_press():
    return sources.parse_press((FIXTURES / "press.xml").read_bytes())


class ParseTest(unittest.TestCase):
    def test_recruit_fields(self):
        jobs = load_jobs()
        self.assertEqual(len(jobs), 6)
        first = jobs[0]
        self.assertEqual(first.id, "S1001")
        self.assertEqual(first.institution, "한국샘플공단")
        self.assertEqual(first.deadline, date(2026, 10, 10))
        open_ended = next(j for j in jobs if j.id == "S1005")
        self.assertIsNone(open_ended.deadline)
        self.assertEqual(open_ended.url, sources.ALIO_JOB_HOME)

    def test_press_strips_html(self):
        item = load_press()[0]
        self.assertEqual(item.department, "행정안전부")
        self.assertNotIn("<", item.excerpt)
        self.assertIn("한 번에", item.excerpt)

    def test_api_error_codes_raise(self):
        with self.assertRaises(http.FetchError):
            sources.parse_recruit({"resultCode": 500, "resultMsg": "오류"})
        bad = b"<response><header><resultCode>99</resultCode><resultMsg>x</resultMsg></header></response>"
        with self.assertRaises(http.FetchError):
            sources.parse_press(bad)

    def test_gateway_error_detected(self):
        body = (
            b"<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg>"
            b"<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>"
            b"<returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>"
        )
        self.assertIn("NOT_REGISTERED", http.gateway_error(body))
        self.assertIsNone(http.gateway_error(b'{"resultCode":200}'))

    def test_encoding_key_is_decoded_once(self):
        self.assertEqual(http.normalize_service_key("abc%2Bdef%3D%3D"), "abc+def==")
        self.assertEqual(http.normalize_service_key("abc+def=="), "abc+def==")


class FilterTest(unittest.TestCase):
    def test_job_filter(self):
        ids = {j.id for j in load_jobs() if filters.match_job(j, CFG["recruit"], TODAY)}
        # S1003(전기), S1006(IT)은 키워드 불일치, S1004는 마감 지남
        self.assertEqual(ids, {"S1001", "S1002", "S1005"})

    def test_region_filter_keeps_nationwide(self):
        cfg = {**CFG["recruit"], "regions": ["서울"]}
        ids = {j.id for j in load_jobs() if filters.match_job(j, cfg, TODAY)}
        self.assertEqual(ids, {"S1001", "S1002"})
        cfg["include_nationwide"] = False
        ids = {j.id for j in load_jobs() if filters.match_job(j, cfg, TODAY)}
        self.assertEqual(ids, {"S1001"})

    def test_exclude_keywords(self):
        cfg = {**CFG["recruit"], "exclude_keywords": ["인턴"]}
        ids = {j.id for j in load_jobs() if filters.match_job(j, cfg, TODAY)}
        self.assertNotIn("S1002", ids)

    def test_press_filter(self):
        ids = {p.id for p in load_press() if filters.match_press(p, CFG["press"])}
        self.assertEqual(ids, {"P2001", "P2002"})


class StateTest(unittest.TestCase):
    def test_new_items_and_closing_soon(self):
        state = State()
        jobs = [j for j in load_jobs() if filters.match_job(j, CFG["recruit"], TODAY)]
        state.mark_sent(jobs, load_press(), TODAY)
        self.assertEqual(state.new_jobs(jobs), [])
        self.assertEqual(state.new_press(load_press()), [])
        # 이틀 뒤: S1002(10/3 마감)는 지났고, S1001(10/10)은 아직 멀다
        self.assertEqual(state.closing_soon(date(2026, 10, 4), 3, set()), [])
        soon = state.closing_soon(date(2026, 10, 8), 3, set())
        self.assertEqual([(s["id"], s["days_left"]) for s in soon], [("S1001", 2)])

    def test_prune_and_roundtrip(self):
        state = State()
        state.mark_sent(load_jobs(), load_press(), TODAY)
        state.prune(date(2026, 11, 30))
        self.assertEqual(state.seen_press, {})
        self.assertEqual(set(state.seen_jobs), {"S1005"})  # 마감일 없는 공고는 90일 보관
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "state.json"
            state.save(path)
            self.assertEqual(State.load(path).seen_jobs, state.seen_jobs)


class RenderTest(unittest.TestCase):
    def test_html_escapes_and_labels(self):
        jobs = load_jobs()
        evil = dataclasses.replace(jobs[0], title="<script>x</script>")
        d = render.Digest(TODAY, [evil, jobs[1]], [], [], errors=["보도자료: timeout"])
        out = render.html(d)
        self.assertNotIn("<script>", out)
        self.assertIn("D-1", out)
        self.assertIn("수집 실패", out)
        self.assertIn("새 공고 2", render.subject(d, "[T]"))

    def test_empty_subject(self):
        d = render.Digest(TODAY, [], [], [])
        self.assertIn("새 소식 없음", render.subject(d, "[T]"))


class CliTest(unittest.TestCase):
    def run_cli(self, d, *extra):
        return cli.main([
            "run", "--state", f"{d}/state.json", "--log", f"{d}/runs.jsonl",
            "--out", f"{d}/preview.html", *extra,
        ])

    def test_demo_writes_preview_without_state(self):
        with tempfile.TemporaryDirectory() as d:
            self.assertEqual(self.run_cli(d, "--demo"), 0)
            self.assertIn("한국샘플공단", Path(d, "preview.html").read_text(encoding="utf-8"))
            self.assertFalse(Path(d, "state.json").exists())

    def _fake_sources(self):
        return (
            mock.patch.object(sources, "fetch_recruit", return_value=load_jobs()),
            mock.patch.object(sources, "fetch_press", return_value=load_press()),
        )

    def test_state_saved_only_after_successful_send(self):
        env = {"DATA_GO_KR_KEY": "k", "GMAIL_USER": "me@example.com", "GMAIL_APP_PASSWORD": "p"}
        r, p = self._fake_sources()
        with tempfile.TemporaryDirectory() as d, r, p, mock.patch.dict("os.environ", env):
            with mock.patch("jobdigest.mailer.send", side_effect=OSError("smtp down")):
                self.assertEqual(self.run_cli(d, "--today", "2026-10-02"), 1)
            self.assertFalse(Path(d, "state.json").exists())

            with mock.patch("jobdigest.mailer.send") as send:
                self.assertEqual(self.run_cli(d, "--today", "2026-10-02"), 0)
                self.assertIn("새 공고 3", send.call_args.kwargs["subject"])
            state = json.loads(Path(d, "state.json").read_text(encoding="utf-8"))
            self.assertEqual(set(state["seen_jobs"]), {"S1001", "S1002", "S1005"})

            # 다음 날 다시 돌리면 같은 공고는 다시 안 보낸다
            with mock.patch("jobdigest.mailer.send") as send:
                self.run_cli(d, "--today", "2026-10-03")
                self.assertIn("새 공고 0", send.call_args.kwargs["subject"])
                self.assertIn("마감임박 1", send.call_args.kwargs["subject"])  # S1002 오늘 마감

            logs = Path(d, "runs.jsonl").read_text(encoding="utf-8").splitlines()
            self.assertEqual([json.loads(l)["sent"] for l in logs], [False, True, True])

    def test_source_failure_is_reported_not_fatal(self):
        env = {"DATA_GO_KR_KEY": "k", "GMAIL_USER": "me@example.com", "GMAIL_APP_PASSWORD": "p"}
        with tempfile.TemporaryDirectory() as d, mock.patch.dict("os.environ", env), \
                mock.patch.object(sources, "fetch_recruit", side_effect=http.FetchError("HTTP 403")), \
                mock.patch.object(sources, "fetch_press", return_value=load_press()), \
                mock.patch("jobdigest.mailer.send") as send:
            self.assertEqual(self.run_cli(d, "--today", "2026-10-02"), 0)
            self.assertIn("HTTP 403", send.call_args.kwargs["html"])


if __name__ == "__main__":
    unittest.main()
