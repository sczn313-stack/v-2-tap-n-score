#!/usr/bin/env python3
"""LAN Founder-pending board for the verified Episode 64 Shooter Experience batch."""
from __future__ import annotations

import json
import os
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import episode64_mona_lisa_20_review_server as shared


ROOT = Path(__file__).resolve().parents[2]
PROOF = Path(os.environ.get(
    "EP64_CONNECT_PROOF",
    ROOT / "docs/authority-evidence/platform/episode64-shooter-experience-connections-2026-10-12/CONNECT_33_MACHINE_PROOF.json",
))
HOST = os.environ.get("EP64_CONNECT_33_HOST", "0.0.0.0")
PORT = int(os.environ.get("EP64_CONNECT_33_PORT", "8222"))
PUBLIC_PORT = int(os.environ.get("EP64_CONNECT_33_PUBLIC_PORT", str(PORT)))
BOARD_PATH = os.environ.get("EP64_CONNECT_BOARD_PATH", "/founder-connect-33.html")

proof = json.loads(PROOF.read_text(encoding="utf-8"))
passing = [row for row in proof["rows"] if row["status"] == "PASS"]
COUNT = len(passing)
shared.HOST = HOST
shared.PORT = PORT
shared.SIGNING_KEY = f"episode64-connect-shooter-experience-{COUNT}-v1"


def board_html() -> str:
    targets = []
    for index, row in enumerate(passing, start=1):
        contract = shared.RESOLVER.resolve(row["runtimeId"], row["missionFamily"])
        product = contract["targetProfile"]["product"]
        targets.append({
            "number": index,
            "masterNumber": row["masterNumber"],
            "name": row["targetName"],
            "publisher": row["publisher"],
            "runtimeId": row["runtimeId"],
            "capability": row["functionalResult"]["capability"],
            "description": product["shooterExperience"]["description"],
            "href": (
                f"target-experience.html?missionFamily={row['missionFamily']}"
                f"&target={row['runtimeId']}&source=registered&authorityPort={PUBLIC_PORT}"
                f"&v=episode64-connect-{COUNT}"
            ),
        })
    payload = json.dumps(targets).replace("</", "<\\/")
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>SCZN3 · Shooter Experience {COUNT}</title>
<style>*{{box-sizing:border-box}}html,body{{margin:0;min-height:100%;background:#071018;color:#eef4fb;font-family:system-ui,-apple-system,sans-serif}}body{{display:grid;grid-template-rows:auto minmax(70vh,1fr)}}header{{padding:12px;background:#0b1722;border-bottom:1px solid #314457}}h1{{font-size:18px;margin:0;color:#f5c958}}.status{{color:#f5a65b;font-size:12px;font-weight:800}}.picker{{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;margin-top:10px}}button,select,a{{min-height:44px;border:1px solid #8d742b;border-radius:8px;padding:8px;font-weight:800}}button,a{{background:#e6bd42;color:#111827;text-decoration:none}}select{{background:#142331;color:#fff}}.identity{{margin-top:8px;color:#afbfce;font-size:13px}}iframe{{width:100%;height:100%;border:0;background:#071018}}@media(max-width:700px){{.picker{{grid-template-columns:1fr 1fr}}select{{grid-column:1/-1;grid-row:1}}}}</style></head>
<body><header><h1>EPISODE 64 · SHOOTER EXPERIENCE {COUNT}</h1><span class="status">MACHINE {COUNT}/{COUNT} PASS · FOUNDER APPROVAL NOT CLAIMED</span><div class="picker"><button id="previous">← PREVIOUS</button><select id="selector"></select><a id="open" target="_blank" rel="noopener">OPEN TARGET ↗</a></div><div class="identity" id="identity"></div></header><iframe id="experience" title="Selected connected shooter experience"></iframe>
<script>const targets={payload};const selector=document.getElementById("selector"),previous=document.getElementById("previous"),open=document.getElementById("open"),identity=document.getElementById("identity"),experience=document.getElementById("experience");let index=Math.max(0,Math.min(targets.length-1,Number((location.hash.match(/target-(\\d+)/)||[])[1]||1)-1));targets.forEach((target,i)=>{{const option=document.createElement("option");option.value=String(i);option.textContent=`${{i+1}}/{COUNT} · #${{target.masterNumber}} · ${{target.name}}`;selector.append(option)}});function render(){{const target=targets[index];selector.value=String(index);previous.disabled=index===0;open.href=target.href;experience.src=target.href;identity.textContent=`${{index+1}}/{COUNT} · Master #${{target.masterNumber}} · ${{target.publisher}} · ${{target.capability}} · FOUNDER PENDING`;history.replaceState(null,"",`#target-${{index+1}}`)}}previous.onclick=()=>{{if(index>0){{index-=1;render()}}}};selector.onchange=()=>{{index=Number(selector.value);render()}};render();</script></body></html>'''


class Handler(shared.Handler):
    def do_GET(self):
        if urlparse(self.path).path == BOARD_PATH:
            body = board_html().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path == "/__connect-test-reset" and os.environ.get("EP64_CONNECT_ENABLE_TEST_RESET") == "1":
            shared.STORE = shared.MemoryStore()
            return self.send_json(200, {"ok": True, "testStoreReset": True})
        super().do_POST()


if __name__ == "__main__":
    print(f"Episode 64 Shooter Experience {COUNT}: http://{HOST}:{PORT}{BOARD_PATH}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
