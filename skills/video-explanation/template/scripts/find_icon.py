"""アイコンを名前で探す（手元の lucide-react の名前と、src/custom-icons.tsx の自作アイコンから）。

日本語の語は、よく使うものだけ英語の語に置き換えて探す（JA の表）。ネットには問い合わせない。
使い方:
  python3 scripts/find_icon.py データ 検索            # 候補の名前を表示
  python3 scripts/find_icon.py chart --sheet out/icons.png   # 候補を並べた画像も作る（remotion still）
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_script import ROOT, CHARACTER_ICON, known_icons  # noqa: E402

JA = {
    "データ": ["database", "table", "sheet"],
    "表": ["table", "sheet"],
    "文書": ["file-text", "file", "notebook"],
    "資料": ["file-text", "presentation", "book"],
    "報告": ["file-chart", "clipboard", "presentation"],
    "人": ["user", "users"],
    "チーム": ["users"],
    "会議": ["users", "presentation", "calendar"],
    "検索": ["search", "scan"],
    "画像": ["image", "images", "camera"],
    "文字": ["type", "text", "scan-text"],
    "読み取り": ["scan", "scan-text", "scan-line"],
    "グラフ": ["chart", "trending"],
    "増加": ["trending-up", "arrow-up"],
    "減少": ["trending-down", "arrow-down"],
    "時間": ["clock", "timer", "hourglass"],
    "日付": ["calendar"],
    "費用": ["coins", "wallet", "receipt", "banknote", "japanese-yen"],
    "お金": ["coins", "wallet", "banknote", "japanese-yen"],
    "サーバー": ["server", "cloud"],
    "クラウド": ["cloud"],
    "計算": ["cpu", "calculator"],
    "モデル": ["brain", "cpu", "network"],
    "学習": ["graduation-cap", "brain"],
    "設定": ["settings", "sliders"],
    "確認": ["check", "circle-check", "badge-check"],
    "注意": ["triangle-alert", "circle-alert"],
    "失敗": ["circle-x", "x"],
    "判断": ["scale", "split", "signpost"],
    "分岐": ["split", "git-branch", "git-fork"],
    "流れ": ["workflow", "arrow-right", "route"],
    "つなぐ": ["link", "plug", "cable"],
    "目標": ["target", "flag", "goal"],
    "鍵": ["key", "lock"],
    "安全": ["shield", "lock"],
    "店": ["store", "shopping-cart", "shopping-bag"],
    "商品": ["package", "shopping-basket", "tag"],
    "地図": ["map", "map-pin"],
    "メール": ["mail"],
    "コード": ["code", "terminal", "braces"],
}


def search(words: list[str]) -> list[str]:
    lucide, custom = known_icons()
    if lucide is None:
        sys.exit("lucide-react が見つかりません。先に npm i を実行してください")
    keys = []
    for w in words:
        keys += JA.get(w, [w.lower()])
    names = sorted(lucide) + [f"custom:{c}" for c in sorted(custom)]
    hits = [n for n in names if any(k in n for k in keys)]
    # 顔や生き物に見えるアイコンは出さない
    return [n for n in hits if not CHARACTER_ICON.match(n)]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("words", nargs="+")
    ap.add_argument("--sheet", help="候補を並べた PNG の出力先（先頭の40個まで）")
    args = ap.parse_args()
    hits = search(args.words)
    print(f"{len(hits)} 件: " + " ".join(hits[:120]))
    if args.sheet and hits:
        props = json.dumps({"names": hits[:40]})
        subprocess.run(
            ["npx", "remotion", "still", "IconPreview", args.sheet, f"--props={props}", "--log=error"],
            cwd=ROOT,
            check=True,
        )
        print(f"画像: {args.sheet}")


if __name__ == "__main__":
    main()
