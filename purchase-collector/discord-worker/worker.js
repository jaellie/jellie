// Moa /moa 명령 접수 창구 (Cloudflare Worker)
//
// 디스코드에서 /moa 를 입력하면 디스코드가 이 Worker로 요청을 보낸다.
// Worker는 요청이 진짜 디스코드에서 왔는지 서명을 확인하고, GitHub Actions의
// "Moa 구매요청 집계" 워크플로를 그 채널 ID로 실행시킨 뒤 바로 "접수됐어요"라고 답한다.
// 엑셀 생성과 업로드는 GitHub Actions에서 Moa 봇이 한다.
//
// 필요한 설정 (Cloudflare → Worker → Settings → Variables and Secrets)
//   DISCORD_PUBLIC_KEY  (Secret) 디스코드 Developer Portal → General Information → Public Key
//   GITHUB_TOKEN        (Secret) GitHub fine-grained token, 이 저장소만 / Actions: Read and write
//   GITHUB_REPO         (Text)   예: jaellie/jellie
//   GITHUB_REF          (Text)   선택. 기본 main
//   ALLOWED_CHANNEL_IDS (Text)   선택. 쉼표로 구분한 채널 ID. 비우면 봇이 있는 모든 채널 허용

const WORKFLOW_FILE = "moa.yml";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 };
const ResponseType = { PONG: 1, CHANNEL_MESSAGE: 4 };
const EPHEMERAL = 64; // 명령을 친 사람에게만 보이는 메시지

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function reply(content, { ephemeral = false } = {}) {
  return json({
    type: ResponseType.CHANNEL_MESSAGE,
    data: { content, flags: ephemeral ? EPHEMERAL : 0, allowed_mentions: { parse: [] } },
  });
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function verifySignature(publicKeyHex, signatureHex, timestamp, body) {
  if (!publicKeyHex || !signatureHex || !timestamp || !/^[0-9a-f]+$/i.test(signatureHex)) return false;
  // 표준 이름 "Ed25519"를 먼저 쓰고, 예전 Workers 런타임용 "NODE-ED25519"로 한 번 더 시도
  const algorithms = [{ name: "Ed25519" }, { name: "NODE-ED25519", namedCurve: "NODE-ED25519" }];
  for (const algorithm of algorithms) {
    try {
      const key = await crypto.subtle.importKey("raw", hexToBytes(publicKeyHex), algorithm, false, ["verify"]);
      return await crypto.subtle.verify(
        algorithm,
        key,
        hexToBytes(signatureHex),
        new TextEncoder().encode(timestamp + body),
      );
    } catch {
      // 다음 알고리즘 이름으로 재시도
    }
  }
  return false;
}

function optionValues(interaction) {
  const out = {};
  for (const opt of interaction.data?.options ?? []) out[opt.name] = opt.value;
  return out;
}

async function dispatchWorkflow(env, inputs) {
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "moa-discord-worker",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: env.GITHUB_REF || "main", inputs }),
    },
  );
  // 성공하면 204 No Content
  if (res.status !== 204) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error(`GitHub ${res.status} ${detail}`);
  }
}

async function handleMoa(interaction, env) {
  const channelId = interaction.channel_id ?? interaction.channel?.id;
  const allowed = (env.ALLOWED_CHANNEL_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length && !allowed.includes(channelId)) {
    return reply("이 채널에서는 Moa를 쓸 수 없어요. 구매요청 채널에서 다시 시도해 주세요.", { ephemeral: true });
  }

  const opts = optionValues(interaction);
  for (const name of ["since", "until"]) {
    if (opts[name] && !DATE_RE.test(opts[name])) {
      return reply(`날짜는 2026-09-28 형식으로 입력해 주세요. (입력한 값: ${opts[name]})`, { ephemeral: true });
    }
  }

  try {
    await dispatchWorkflow(env, {
      channel_id: channelId,
      since: opts.since ?? "",
      until: opts.until ?? "",
      post: "true",
      mask_names: opts.mask ? "true" : "false",
    });
  } catch (err) {
    console.log("dispatch failed", err.message);
    return reply("⚠️ 집계를 시작하지 못했어요. 관리자에게 알려 주세요. (GitHub 실행 요청 실패)", { ephemeral: true });
  }

  const user = interaction.member?.user ?? interaction.user;
  const who = user?.global_name || user?.username || "누군가";
  const range = opts.since || opts.until ? ` (${opts.since || "처음"} ~ ${opts.until || "오늘"})` : "";
  return reply(`🛒 ${who}님의 요청으로 구매 요청 집계를 시작해요${range}. 1~2분 뒤 이 채널에 엑셀이 올라와요.`);
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Moa interaction endpoint", { status: 200 });
    }
    const body = await request.text();
    const ok = await verifySignature(
      env.DISCORD_PUBLIC_KEY,
      request.headers.get("X-Signature-Ed25519"),
      request.headers.get("X-Signature-Timestamp"),
      body,
    );
    if (!ok) return new Response("invalid request signature", { status: 401 });

    const interaction = JSON.parse(body);
    if (interaction.type === InteractionType.PING) return json({ type: ResponseType.PONG });
    if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === "moa") {
      return handleMoa(interaction, env);
    }
    return reply("알 수 없는 명령이에요.", { ephemeral: true });
  },
};
