import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

SRC = Path(r"D:/Downloads/Phần 2 Ngay Từ Đầu Kích Hoạt Hệ Thống Cướp Đoạt Công Pháp.srt.bak")
OUT_DIR = Path("D:/Downloads/phan2")
OUT_DIR.mkdir(exist_ok=True)

raw = SRC.read_bytes().decode("utf-8-sig")
raw = raw.replace("\r\n", "\n").strip()

# Split into blocks by blank lines
blocks = re.split(r"\n\s*\n", raw)
time_re = re.compile(r"^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$")

cues = []
idx = 0
for block in blocks:
    lines = [l for l in block.split("\n") if l.strip() != ""]
    if not lines:
        continue
    # first line may be index
    pos = 0
    if re.fullmatch(r"\d+", lines[0].strip()):
        pos = 1
    m = time_re.match(lines[pos].strip())
    if not m:
        print("SKIP malformed block:", block[:80])
        continue
    idx += 1
    text = " ".join(l.strip() for l in lines[pos + 1:])
    cues.append({"id": idx, "time": f"{m.group(1)} --> {m.group(2)}", "zh": text})

out = OUT_DIR / "source.json"
out.write_text(json.dumps(cues, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"Extracted {len(cues)} cues -> {out}")
print(f"First: {cues[0]['time']} | {cues[0]['zh']}")
print(f"Last:  {cues[-1]['time']} | {cues[-1]['zh']}")
ids = [c["id"] for c in cues]
print("ids continuous:", ids == list(range(1, len(ids) + 1)))
