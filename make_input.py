import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SRC = Path("D:/Downloads/phan2/source.json")
with open(SRC, encoding="utf-8") as f:
    cues = json.load(f)


def dur(time_str: str) -> float:
    start, end = time_str.split(" --> ")

    def to_s(t: str) -> float:
        h, m, rest = t.split(":")
        s, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000

    return to_s(end) - to_s(start)


out = []
for c in cues:
    d = dur(c["time"])
    zh = c["zh"]
    if not zh:
        out.append(f"{c['id']}|<EMPTY>||{d:.1f}")
    else:
        out.append(f"{c['id']}|{zh}||{d:.1f}")

OUT = Path("D:/Downloads/phan2/input_all.txt")
OUT.write_text("\n".join(out), encoding="utf-8")
print(f"Wrote {len(out)} lines -> {OUT}")
print("Sample:")
for line in out[:5]:
    print(" ", line)
