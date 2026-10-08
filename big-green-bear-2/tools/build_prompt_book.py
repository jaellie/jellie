#!/usr/bin/env python3
"""Build a single-page HTML 'prompt book' from the docs/*.md prompt files.
usage: python3 tools/build_prompt_book.py OUT.html"""
import re, sys, html, base64, io, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = [
 ("chars", "Characters", "CHARACTER_ART_PROMPTS.md"),
 ("ui", "UI Kit", "UI_KIT_PROMPTS.md"),
 ("anim", "Animation guide", "ANIMATION_LOOPS.md"),
 ("video", "Grok video", "GROK_VIDEO_LOOPS.md"),
]
esc = html.escape
def inline(t):
    t = esc(t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    return t
def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def render(md, pid):
    lines = md.split("\n"); out = []; i = 0; toc = []; open_sec = False; n = 0
    while i < len(lines):
        L = lines[i]
        if L.startswith("```"):
            j = i + 1; buf = []
            while j < len(lines) and not lines[j].startswith("```"): buf.append(lines[j]); j += 1
            txt = "\n".join(buf)
            out.append(f'<div class="prompt"><button class="copy" type="button">Copy</button><pre>{esc(txt)}</pre></div>')
            i = j + 1; continue
        if L.startswith("|") and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|?$", lines[i+1]):
            hdr = [c.strip() for c in L.strip().strip("|").split("|")]; j = i + 2; rows = []
            while j < len(lines) and lines[j].startswith("|"):
                rows.append([c.strip() for c in lines[j].strip().strip("|").split("|")]); j += 1
            t = "<div class='tbl'><table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in hdr) + "</tr></thead><tbody>"
            for r in rows: t += "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
            out.append(t + "</tbody></table></div>"); i = j; continue
        m = re.match(r"^(#{1,4}) (.*)", L)
        if m:
            lv = len(m.group(1)); title = m.group(2)
            if lv == 1: i += 1; continue
            if lv == 2:
                if open_sec: out.append("</section>")
                sid = f"{pid}-{slug(title)}"; toc.append((sid, title)); n += 1
                out.append(f'<section class="sec" id="{sid}" style="--i:{n}"><h2>{inline(title)}</h2>'); open_sec = True
            else: out.append(f"<h{lv}>{inline(title)}</h{lv}>")
            i += 1; continue
        if L.startswith(">"):
            out.append(f'<p class="note">{inline(L.lstrip("> "))}</p>'); i += 1; continue
        if re.match(r"^\s*([-*]|\d+\.) ", L):
            ordered = bool(re.match(r"^\s*\d+\.", L)); tag = "ol" if ordered else "ul"; items = []
            while i < len(lines) and re.match(r"^\s*([-*]|\d+\.) ", lines[i]):
                items.append(re.sub(r"^\s*([-*]|\d+\.) ", "", lines[i])); i += 1
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>"); continue
        if L.strip() in ("", "---"): i += 1; continue
        out.append(f"<p>{inline(L)}</p>"); i += 1
    if open_sec: out.append("</section>")
    return "\n".join(out), toc
def bear_uri():
    p = os.path.join(ROOT, "Assets/Art/Characters/BigGreenBear/turnaround/bear_turn_three_quarter_left.png")
    im = Image.open(p).convert("RGBA"); im = im.resize((int(im.width*300/im.height), 300), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
panes = []; tabs = []
for pid, label, fn in DOCS:
    body, toc = render(open(os.path.join(ROOT, "docs", fn), encoding="utf-8").read(), pid)
    chips = "".join(f'<a href="#{s}">{esc(re.sub(r"^[A-Z0-9]+\. ", "", t))}</a>' for s, t in toc)
    nprompts = body.count('class="prompt"')
    tabs.append(f'<button type="button" role="tab" data-p="{pid}">{label}<span>{nprompts}</span></button>')
    panes.append(f'<div class="pane" id="pane-{pid}" role="tabpanel"><nav class="chips">{chips}</nav>{body}</div>')
tpl = open(os.path.join(ROOT, "tools", "prompt_book_template.html"), encoding="utf-8").read()
out = tpl.replace("{{TABS}}", "".join(tabs)).replace("{{PANES}}", "\n".join(panes)).replace("{{BEAR}}", bear_uri())
open(sys.argv[1], "w", encoding="utf-8").write(out); print("wrote", sys.argv[1], len(out)//1024, "KB")
