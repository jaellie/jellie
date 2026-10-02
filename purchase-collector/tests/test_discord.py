import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

from purchase_collector import cli, collect, discord_source

FIXTURES = Path(__file__).resolve().parent / "fixtures"
PAGE = json.loads((FIXTURES / "discord_messages.json").read_text(encoding="utf-8"))


def fake_api(pages):
    """GET 요청마다 pages를 차례로 돌려주는 가짜 _request."""
    calls = []
    it = iter(pages)

    def _request(method, path, token, **kw):
        calls.append((method, path))
        if method == "GET":
            return next(it, [])
        return {"id": "posted-1", "attachments": [{"id": "a1"}]}

    return _request, calls


class DiscordFetchTest(unittest.TestCase):
    def test_converts_and_filters(self):
        req, calls = fake_api([PAGE])
        with mock.patch.object(discord_source, "_request", req):
            msgs = discord_source.fetch_messages("42", "token")
        self.assertEqual(len(calls), 1)  # 100개 미만이면 한 페이지로 끝
        self.assertEqual([m.sender for m in msgs], ["이하늘", "이하늘", "정민호", "정민호", "이하늘"])
        self.assertEqual(msgs[0].time, datetime(2026, 9, 30, 10, 15))  # UTC → KST
        self.assertNotIn("봇 메시지", " ".join(m.text for m in msgs))

    def test_pagination_stops_at_since(self):
        def page(start, ts):
            return [
                {"id": str(start - i), "type": 0, "timestamp": ts,
                 "author": {"username": "a"}, "content": "x"}
                for i in range(100)
            ]
        req, calls = fake_api([
            page(500, "2026-10-02T00:00:00+00:00"),
            page(400, "2026-09-01T00:00:00+00:00"),
            page(300, "2026-08-01T00:00:00+00:00"),
        ])
        with mock.patch.object(discord_source, "_request", req):
            discord_source.fetch_messages("42", "t", since=datetime(2026, 9, 15))
        self.assertEqual(len(calls), 2)
        self.assertIn("before=401", calls[1][1])

    def test_missing_message_content_intent(self):
        empty = [{**m, "content": ""} for m in PAGE]
        req, _ = fake_api([empty])
        with mock.patch.object(discord_source, "_request", req):
            with self.assertRaises(discord_source.DiscordError) as e:
                discord_source.fetch_messages("42", "t")
        self.assertIn("Message Content Intent", str(e.exception))

    def test_same_pipeline_as_kakao(self):
        req, _ = fake_api([PAGE])
        with mock.patch.object(discord_source, "_request", req):
            result = collect.collect(discord_source.fetch_messages("42", "t"))
        shops = {r.shop: r for r in result.requests}
        self.assertEqual(set(shops), {"쿠팡", "11번가"})
        self.assertEqual(shops["쿠팡"].total_qty, 2)  # 재게시는 1번만, 덧붙인 "2박스요" 연결
        self.assertEqual(shops["11번가"].total_qty, 1)  # <링크> 형식(미리보기 끔)도 인식, 답장 메시지 포함


class DiscordCliTest(unittest.TestCase):
    def test_cli_fetch_and_post(self):
        req, calls = fake_api([PAGE])
        with tempfile.TemporaryDirectory() as d, \
                mock.patch.object(discord_source, "_request", req), \
                mock.patch.dict("os.environ", {"DISCORD_BOT_TOKEN": "t"}):
            out = Path(d, "r.xlsx")
            self.assertEqual(cli.main(["--discord", "42", "-o", str(out), "--post"]), 0)
            self.assertTrue(out.exists())
        self.assertEqual(calls[-1], ("POST", "/channels/42/messages"))

    def test_post_failure_is_reported(self):
        req, _ = fake_api([PAGE])

        def broken(method, path, token, **kw):
            return req(method, path, token) if method == "GET" else {"id": "x", "attachments": []}

        with tempfile.TemporaryDirectory() as d, \
                mock.patch.object(discord_source, "_request", broken), \
                mock.patch.dict("os.environ", {"DISCORD_BOT_TOKEN": "t"}):
            self.assertEqual(cli.main(["--discord", "42", "-o", str(Path(d, "r.xlsx")), "--post"]), 1)

    def test_requires_token_and_single_source(self):
        with mock.patch.dict("os.environ", {}, clear=True):
            self.assertEqual(cli.main(["--discord", "42"]), 1)
        with self.assertRaises(SystemExit):
            cli.main(["chat.txt", "--discord", "42"])
        with self.assertRaises(SystemExit):
            cli.main(["chat.txt", "--post"])


if __name__ == "__main__":
    unittest.main()
