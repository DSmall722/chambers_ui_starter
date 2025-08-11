{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 from pathlib import Path\
import re\
\
ROOT = Path("/Users/andrewbowers/Downloads/chambers_ui_starter")\
BACK = ROOT / "backend" / "main.py"\
\
BLOCK = r'''\
# ---- Multi-persona Compare (API) ----\
class MultiRunReq(BaseModel):\
    tool: str  # "initial" | "drafter" | "editor"\
    personas: List[str] = []\
    payload: Dict[str, Any] = \{\}\
    rounds: int = 1\
    matter_id: Optional[str] = None\
    debate: Optional[bool] = False\
\
class MultiRunOut(BaseModel):\
    runs: Dict[str, Dict[str, Any]]\
    synthesis: Dict[str, Any]\
    trace_id: str\
\
def _mp_synthesize(runs: Dict[str, Dict[str, Any]], tool: str, personas: List[str], debate: bool) -> Dict[str, Any]:\
    parts = [\
        f"**Synthesis \'97 \{tool\}**",\
        f"Personas: \{', '.join(personas)\}",\
        f"Debate mode: \{'ON' if debate else 'OFF'\}",\
        ""\
    ]\
    seen = set()\
    for name, r in runs.items():\
        text = (r.get("text") or "").splitlines()\
        for line in text:\
            s = line.strip()\
            if not s:\
                continue\
            key = s.lower()\
            if key in seen:\
                continue\
            seen.add(key)\
            parts.append(f"- \{s\}")\
    return \{"text": "\\\\n".join(parts), "sources": []\}\
\
def _mp_markdown(matter_id: str, tool: str, personas: List[str], synthesis: Dict[str, Any], runs: Dict[str, Dict[str, Any]], rounds: int, debate: bool) -> str:\
    from datetime import datetime\
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")\
    lines = [\
        f"# Multi-Persona Synthesis \'97 \{matter_id\}",\
        f"*Tool:* \{tool\}  ",\
        f"*Personas:* \{', '.join(personas)\}  ",\
        f"*Rounds:* \{rounds\}  *Debate:* \{'ON' if debate else 'OFF'\}  ",\
        f"*Generated:* \{ts\}",\
        "",\
        "## Synthesis (Concordia)",\
        synthesis.get("text",""),\
        ""\
    ]\
    for p, r in runs.items():\
        lines += [f"## \{p\}", r.get("text",""), ""]\
        srcs = r.get("sources") or []\
        if srcs:\
            lines += ["**Sources**"] + [f"- \{s\}" for s in srcs] + [""]\
    return "\\\\n".join(lines)\
\
@app.post("/tool/multi_run")\
def tool_multi_run(req: MultiRunReq):\
    runs: Dict[str, Dict[str, Any]] = \{\}\
    for persona in req.personas:\
        summary = [f"\{persona\} \'97 \{req.tool\} run:"]\
        keys = list(req.payload.keys())[:8]\
        if keys:\
            summary.append("Inputs: " + ", ".join(f"\{k\}=\{str(req.payload[k])[:40]\}" for k in keys))\
        if req.debate and req.rounds and req.rounds >= 2:\
            summary.append("Round 2: critique phase (placeholder)")\
        runs[persona] = \{"text": "\\\\n".join(summary), "sources": []\}\
\
    synthesis = _mp_synthesize(runs, req.tool, req.personas, bool(req.debate))\
    trace_id = __import__("datetime").datetime.utcnow().strftime("mp-%Y%m%d-%H%M%S")\
\
    # Auto-save memo\
    try:\
        md = _mp_markdown(req.matter_id or "UNKNOWN", req.tool, req.personas, synthesis, runs, req.rounds or 1, bool(req.debate))\
        import os\
        memdir = os.path.join(DATA_DIR, "memos")\
        os.makedirs(memdir, exist_ok=True)\
        safe = (req.matter_id or "UNKNOWN").replace("/", "_")\
        fname = f"multi-\{safe\}-\{trace_id\}.md"\
        with open(os.path.join(memdir, fname), "w", encoding="utf-8") as f:\
            f.write(md)\
    except Exception:\
        pass\
\
    return \{"runs": runs, "synthesis": synthesis, "trace_id": trace_id\}\
\
class MultiSaveMemo(BaseModel):\
    matter_id: str\
    title: str\
    markdown: str\
\
@app.post("/multi/save_memo")\
def multi_save_memo(req: MultiSaveMemo):\
    import os\
    memdir = os.path.join(DATA_DIR, "memos")\
    os.makedirs(memdir, exist_ok=True)\
    safe = req.matter_id.replace("/", "_")\
    ts = __import__("datetime").datetime.utcnow().strftime("%Y%m%d-%H%M%S")\
    fname = f"\{req.title.replace(' ', '_')\}-\{safe\}-\{ts\}.md"\
    path = os.path.join(memdir, fname)\
    with open(path, "w", encoding="utf-8") as f:\
        f.write(req.markdown)\
    return \{"ok": True, "download_url": f"/memos/\{fname\}"\}\
'''\
\
def main():\
    txt = BACK.read_text()\
    start = txt.find("\\n# ---- Multi-persona Compare (API) ----")\
    if start == -1:\
        # Not found: append clean block\
        BACK.write_text(txt.rstrip() + "\\n" + BLOCK)\
        print("Appended clean multi-persona block.")\
        return\
    # Replace from marker to end of file with clean block\
    fixed = txt[:start] + "\\n" + BLOCK\
    BACK.write_text(fixed)\
    print("Replaced existing multi-persona block with a clean version.")\
\
if __name__ == "__main__":\
    main()\
}