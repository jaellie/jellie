// 실행: cd purchase-collector/discord-worker && node --test
import assert from "node:assert/strict";
import { test } from "node:test";

import worker, { verifySignature } from "./worker.js";

const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const PUBLIC_KEY_HEX = Buffer.from(await crypto.subtle.exportKey("raw", publicKey)).toString("hex");

const ENV = {
  DISCORD_PUBLIC_KEY: PUBLIC_KEY_HEX,
  GITHUB_TOKEN: "gh-test",
  GITHUB_REPO: "jaellie/jellie",
};

async function signedRequest(payload, { tamper = false } = {}) {
  const body = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sig = await crypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(timestamp + body));
  return new Request("https://moa.example.workers.dev/", {
    method: "POST",
    headers: {
      "X-Signature-Ed25519": Buffer.from(sig).toString("hex"),
      "X-Signature-Timestamp": timestamp,
    },
    body: tamper ? body.replace("moa", "evil") : body,
  });
}

function command(options = [], channel_id = "222") {
  return {
    type: 2,
    channel_id,
    member: { user: { username: "haneul", global_name: "이하늘" } },
    data: { name: "moa", options },
  };
}

function mockGitHub(status = 204) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
    return new Response(status === 204 ? null : "boom", { status });
  };
  return calls;
}

test("rejects requests without a valid Discord signature", async () => {
  const res = await worker.fetch(await signedRequest({ type: 1 }, { tamper: false }), {
    ...ENV,
    DISCORD_PUBLIC_KEY: "00".repeat(32),
  });
  assert.equal(res.status, 401);
  const tampered = await worker.fetch(await signedRequest(command(), { tamper: true }), ENV);
  assert.equal(tampered.status, 401);
  assert.equal(await verifySignature(PUBLIC_KEY_HEX, "zz", "1", "{}"), false);
});

test("answers Discord PING with PONG", async () => {
  const res = await worker.fetch(await signedRequest({ type: 1 }), ENV);
  assert.deepEqual(await res.json(), { type: 1 });
});

test("/moa dispatches the workflow for the current channel", async () => {
  const calls = mockGitHub(204);
  const res = await worker.fetch(
    await signedRequest(command([{ name: "since", value: "2026-09-28" }, { name: "mask", value: true }])),
    ENV,
  );
  const out = await res.json();
  assert.equal(out.type, 4);
  assert.match(out.data.content, /이하늘님의 요청으로/);
  assert.match(out.data.content, /2026-09-28 ~ 오늘/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.github.com/repos/jaellie/jellie/actions/workflows/moa.yml/dispatches");
  assert.equal(calls[0].auth, "Bearer gh-test");
  assert.deepEqual(calls[0].body, {
    ref: "main",
    inputs: { channel_id: "222", since: "2026-09-28", until: "", post: "true", mask_names: "true" },
  });
});

test("invalid date is rejected before calling GitHub", async () => {
  const calls = mockGitHub(204);
  const res = await worker.fetch(await signedRequest(command([{ name: "until", value: "10월 3일" }])), ENV);
  const out = await res.json();
  assert.equal(out.data.flags, 64);
  assert.match(out.data.content, /형식/);
  assert.equal(calls.length, 0);
});

test("channel allow-list", async () => {
  const calls = mockGitHub(204);
  const res = await worker.fetch(await signedRequest(command([], "999")), { ...ENV, ALLOWED_CHANNEL_IDS: "222, 333" });
  assert.equal((await res.json()).data.flags, 64);
  assert.equal(calls.length, 0);
});

test("GitHub failure is reported to the user, not hidden", async () => {
  mockGitHub(404);
  const res = await worker.fetch(await signedRequest(command()), ENV);
  const out = await res.json();
  assert.equal(out.data.flags, 64);
  assert.match(out.data.content, /시작하지 못했어요/);
});
