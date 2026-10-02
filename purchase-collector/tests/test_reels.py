import json
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock

from purchase_collector import cli, discord_source, reels
from purchase_collector.parser import Message

FIXTURES = Path(__file__).resolve().parent / "fixtures"
PAGE = json.loads((FIXTURES / "discord_reels.json").read_text(encoding="utf-8"))


def fake_api(pages):
    posts = []
    it = iter(pages)

    def _request(method, path, token, **kw):
        if method == "GET":
            return next(it, [])
        posts.append(json.loads(kw["body"]))
        return {"id": f"m{len(posts)}"}

    return _request, posts


def fetch():
    req, _ = fake_api([PAGE])
    with mock.patch.object(discord_source, "_request", req):
        return discord_source.fetch_since_last_post("7", "t", cli.REELS_MARKER, datetime(2026, 9, 1))


class IdentifyTest(unittest.TestCase):
    def test_same_video_same_key(self):
        keys = {reels.identify(u)[1] for u in [
            "https://youtu.be/AbC123xyz?si=x",
            "https://www.youtube.com/shorts/AbC123xyz",
            "https://m.youtube.com/watch?v=AbC123xyz&feature=share",
        ]}
        self.assertEqual(keys, {"youtube:AbC123xyz"})
        self.assertEqual(reels.identify("https://www.instagram.com/reels/XYZ/?igsh=1")[1], "instagram:XYZ")
        self.assertEqual(reels.identify("https://www.tiktok.com/@a/video/123?lang=ko")[1], "tiktok:123")
        self.assertIsNone(reels.identify("https://www.youtube.com/@channel"))
        self.assertIsNone(reels.identify("https://www.coupang.com/vp/products/1"))

    def test_hashtags(self):
        self.assertEqual(reels.hashtags("#요리 #자취, 맛있겠다 #요리"), ["요리", "자취"])
        self.assertEqual(reels.hashtags("<#123456> https://a.com/x#frag #1"), [])


class FetchSinceLastPostTest(unittest.TestCase):
    def test_uses_last_bot_digest_as_cutoff(self):
        messages, since = fetch()
        self.assertEqual(since, datetime(2026, 10, 1, 21, 0))  # 봇 정리 메시지 시각 (KST)
        self.assertNotIn("어제 이미 정리된", " ".join(m.text for m in messages))
        self.assertTrue(all(m.sender != "Blueberry" for m in messages))

    def test_first_run_uses_fallback(self):
        page = [m for m in PAGE if not m["author"].get("bot")]
        req, _ = fake_api([page])
        with mock.patch.object(discord_source, "_request", req):
            messages, since = discord_source.fetch_since_last_post(
                "7", "t", cli.REELS_MARKER, datetime(2026, 10, 2, 18, 0))
        self.assertEqual(since, datetime(2026, 10, 2, 18, 0))
        self.assertTrue(all(m.time > since for m in messages))


class CollectTest(unittest.TestCase):
    def test_collect_and_group(self):
        messages, since = fetch()
        clips = {c.platform: c for c in reels.collect(messages, since)}
        self.assertEqual(set(clips), {"유튜브", "인스타", "틱톡"})

        yt = clips["유튜브"]  # youtu.be 링크와 shorts 링크가 하나로 합쳐짐
        self.assertEqual(yt.sharers, ["이하늘", "최유진"])
        self.assertEqual(yt.tags, ["요리", "자취"])
        self.assertEqual(yt.title, "자취생 5분 계란찜 (샘플)")  # 미리보기 카드 제목

        ig = clips["인스타"]  # 링크 다음에 따로 보낸 "하체 루틴 #운동"이 연결됨
        self.assertEqual((ig.tags, ig.memo), (["운동"], "하체 루틴"))

        self.assertEqual(clips["틱톡"].tags, [])
        groups = reels.group_by_tag(list(clips.values()))
        self.assertEqual(list(groups), ["요리", "운동", reels.UNTAGGED])

    def test_digest_text(self):
        messages, since = fetch()
        out = reels.format_digest(reels.collect(messages, since), "HEADER")
        self.assertEqual(len(out), 1)
        text = out[0]
        self.assertIn("**#요리** (1)", text)
        self.assertIn("#자취", text)  # 두 번째 태그는 줄 끝에 표시
        self.assertIn("<https://www.tiktok.com/@sample/video/7300000000000000001>", text)  # 미리보기 끔
        self.assertIn("태그를 달면", text)

    def test_long_digest_is_split_under_limit(self):
        msgs = [
            Message(datetime(2026, 10, 2, 10, i % 60), "a", f"https://youtu.be/vid{i:04d} #태그{i % 3} " + "메모" * 30)
            for i in range(120)
        ]
        out = reels.format_digest(reels.collect(msgs), "HEADER")
        self.assertGreater(len(out), 1)
        self.assertTrue(all(len(m) <= reels.DISCORD_LIMIT for m in out))
        self.assertEqual(sum(m.count("youtu.be/vid") for m in out), 120)


class CliTest(unittest.TestCase):
    def run_cli(self, page, *extra):
        req, posts = fake_api([page])
        with mock.patch.object(discord_source, "_request", req), \
                mock.patch.object(cli, "_now", return_value=datetime(2026, 10, 2, 21, 0)), \
                mock.patch.dict("os.environ", {"DISCORD_BOT_TOKEN": "t"}):
            code = cli.main(["--mode", "reels", "--discord", "7", *extra])
        return code, posts

    def test_posts_digest_with_marker(self):
        code, posts = self.run_cli(PAGE, "--post")
        self.assertEqual((code, len(posts)), (0, 1))
        self.assertTrue(posts[0]["content"].startswith(cli.REELS_MARKER))
        self.assertIn("새 영상 3개 (태그 2 · 미분류 1)", posts[0]["content"])
        self.assertEqual(posts[0]["allowed_mentions"], {"parse": []})

    def test_nothing_new_sends_nothing(self):
        only_old = [m for m in PAGE if m["id"] in ("2003", "2002")]
        code, posts = self.run_cli(only_old, "--post")
        self.assertEqual((code, posts), (0, []))

    def test_without_post_only_prints(self):
        code, posts = self.run_cli(PAGE)
        self.assertEqual((code, posts), (0, []))


if __name__ == "__main__":
    unittest.main()
