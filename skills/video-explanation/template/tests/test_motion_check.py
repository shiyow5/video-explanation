import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from motion_check import scene_frames  # noqa: E402


def test_scene_frames_match_theme_timing():
    # theme.ts: 0.5 + (2.0 + 0.35) + (1.0 + 0.35) - 0.35 + 0.8 = 4.65 秒 → 139.5 → 140 フレーム
    manifest = {
        "scenes": [
            {"id": "a", "lines": [{"seconds": 2.0}, {"seconds": 1.0}]},
            {"id": "b", "lines": [{"seconds": 1.0}]},
        ]
    }
    frames = scene_frames(manifest)
    assert frames[0] == ("a", 0, 140)
    # b: 0.5 + 1.0 + 0.35 - 0.35 + 0.8 = 2.3 秒 → 69 フレーム
    assert frames[1] == ("b", 140, 69)


def test_changed_percent_ignores_faint_change_and_counts_real_change(tmp_path):
    from PIL import Image, ImageDraw

    from motion_check import MIN_CHANGED, changed_percent

    base = Image.new("L", (480, 270), 250)
    faint = base.copy()
    ImageDraw.Draw(faint).rectangle([0, 0, 479, 269], fill=235)  # 背景の動き程度の差（15）
    shown = base.copy()
    ImageDraw.Draw(shown).rectangle([100, 100, 200, 130], fill=40)  # 項目が出てきた
    for name, img in (("a", base), ("b", faint), ("c", shown)):
        img.save(tmp_path / f"{name}.png")
    assert changed_percent(tmp_path / "a.png", tmp_path / "b.png") == 0
    assert changed_percent(tmp_path / "a.png", tmp_path / "c.png") > MIN_CHANGED
