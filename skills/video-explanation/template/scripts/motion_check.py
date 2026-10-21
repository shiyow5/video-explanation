"""場面ごとに「始まってすぐ」と「終わる少し前」の静止画を書き出し、動きがあるかを確かめる。

2枚で明るさが大きく変わった画素の割合が小さい場面は、動きが無い（何も出てこない）とみなして知らせる。
背景の方眼と丸もゆっくり動くが、色の差が小さいので数に入らない。
全場面の「終わる少し前」を並べた一覧の画像も作るので、重なりやはみ出しの確認にも使う。

使い方:
  python3 scripts/motion_check.py <composition の id> <音声の一覧.json> <出力フォルダ> [--only s01,s04]
例:
  python3 scripts/motion_check.py ProjectStory src/voice-manifest.json out/check
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# src/theme.ts と同じ値（変えたら両方を直す）
FPS = 30
PAD_START = 0.5
GAP = 0.35
PAD_END = 0.8
# 明るさの差がこれより大きい画素を「変わった」とみなす（背景の動きは 20 前後で、これを超えない）
PIXEL_THRESHOLD = 24
# 変わった画素の割合（％）がこれより小さければ「動きが無い」。
# 見本では、内容のある場面が 3.7〜9.4％、章の扉が 0.9％だった
MIN_CHANGED = 0.5


def scene_frames(manifest: dict) -> list[tuple[str, int, int]]:
    """各場面の (id, 開始フレーム, フレーム数)。theme.ts の buildTimings と同じ計算。"""
    out = []
    cursor = 0
    for sc in manifest["scenes"]:
        t = PAD_START
        for ln in sc["lines"]:
            t += ln["seconds"] + GAP
        dur = math.ceil((t - GAP + PAD_END) * FPS)
        out.append((sc["id"], cursor, dur))
        cursor += dur
    return out


def still(comp: str, frame: int, path: Path) -> None:
    subprocess.run(
        ["npx", "remotion", "still", comp, str(path), f"--frame={frame}", "--log=error"],
        cwd=ROOT,
        check=True,
    )


def changed_percent(a: Path, b: Path) -> float:
    """2枚の画像で、明るさが PIXEL_THRESHOLD より大きく変わった画素の割合（％）。"""
    from PIL import Image, ImageChops

    x = Image.open(a).convert("L").resize((480, 270))
    y = Image.open(b).convert("L").resize((480, 270))
    d = ImageChops.difference(x, y).point(lambda v: 255 if v > PIXEL_THRESHOLD else 0)
    return 100 * d.histogram()[255] / (480 * 270)


def sheet(paths: list[Path], out: Path) -> None:
    from PIL import Image

    cols = 4
    w, h = 480, 270
    rows = -(-len(paths) // cols)
    img = Image.new("RGB", (cols * w, rows * h), "white")
    for i, p in enumerate(paths):
        img.paste(Image.open(p).convert("RGB").resize((w, h)), ((i % cols) * w, (i // cols) * h))
    img.save(out)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("composition")
    ap.add_argument("manifest")
    ap.add_argument("out")
    ap.add_argument("--only", help="確かめる場面の id（カンマ区切り）")
    args = ap.parse_args()
    out = ROOT / args.out
    out.mkdir(parents=True, exist_ok=True)
    frames = scene_frames(json.loads((ROOT / args.manifest).read_text(encoding="utf-8")))
    only = set(args.only.split(",")) if args.only else None
    still_scenes = []
    lates = []
    for sid, start, dur in frames:
        if only and sid not in only:
            continue
        early = out / f"{sid}_a.png"
        late = out / f"{sid}_b.png"
        # 頭の白い抜け（約0.3秒）を避けて 0.4 秒後と、終わる 0.3 秒前
        still(args.composition, start + int(0.4 * FPS), early)
        still(args.composition, start + dur - int(0.3 * FPS), late)
        d = changed_percent(early, late)
        lates.append(late)
        mark = "OK" if d >= MIN_CHANGED else "動きなし？"
        print(f"{sid:12s} 変わった画素 {d:5.2f}%  {mark}")
        if d < MIN_CHANGED:
            still_scenes.append(sid)
    if lates:
        sheet(lates, out / "_sheet.png")
        print(f"一覧の画像: {out / '_sheet.png'}")
    if still_scenes:
        print(f"動きが確かめられない場面: {', '.join(still_scenes)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
