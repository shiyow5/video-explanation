"""台本 JSON を、音声を作る前に点検する。

見ること:
  形の誤り（kind・必須の欄・文の番号 l・stage の範囲・id の重複）
  未来の情報（各場面の asof より後の「YYYY年M月」が出ていないか。asof が戻っていないか）
  口調（ずんだもんらしい語尾「のだ」が無いか）
  読み（読み替え表にない英字、分数に読まれる「10/24」の形）
  伏せる名前（--banned のファイルに書いた語）
  見た目（項目の数、題名と字幕の長さ）と、数字のある場面の出典

使い方: python3 scripts/check_script.py <台本.json> [--banned <伏せる語のファイル>] [--readings <読み替え表>]
エラーが1件でもあれば終了コード 1 を返す。
"""
import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_voice import DEFAULT_READINGS, load_readings, to_say  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
KINDS = {
    "cover", "chapter", "bullets", "stats", "bars", "flow", "decision", "docs",
    "ratio", "compare", "diagram", "timeline", "icons",
}
# 1画面に収まる項目数の目安（kinds.tsx・charts.tsx の配置から）
MAX_ITEMS = {
    "bullets": 5, "stats": 4, "bars": 7, "flow": 4, "decision": 5, "docs": 5,
    "ratio": 3, "compare": 2, "diagram": 12, "timeline": 6, "icons": 6,
}
MOTIONS = {"draw", "pop", "pulse", "spin", "bounce", "none"}
# 顔や生き物に見えるアイコン（キャラクターの絵を出さない、という決まりのため）
CHARACTER_ICON = re.compile(
    r"^(bot|smile|laugh|frown|meh|angry|annoyed|ghost|skull|baby|cat|dog|rabbit|squirrel|"
    r"bird|fish|panda|turtle|snail|rat|origami|user-round|person-standing)"
)
TITLE_MAX = 22
CAPTION_MAX = 80
ASOF = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
YM = re.compile(r"(\d{4})年(\d{1,2})月")
CHARACTER_SPEECH = re.compile(r"なのだ|のだ[。！？!?、」]|のだ$|ボクは|ぼくは")
SLASH_DATE = re.compile(r"(?<![\d.])\d{1,2}/\d{1,2}(?![\d/])")
ASCII_WORD = re.compile(r"[A-Za-z][A-Za-z0-9\-.!²+]*")
TEXT_FIELDS = ("title", "label", "period", "note", "question", "reason", "by")
ITEM_FIELDS = ("t", "s", "label", "date")


@dataclass(frozen=True)
class Issue:
    level: str  # "error" か "warn"
    scene: str
    message: str

    def __str__(self) -> str:
        mark = "エラー" if self.level == "error" else "注意"
        return f"[{mark}] {self.scene}: {self.message}"


def visible_texts(sc: dict) -> list[str]:
    """画面に出る文字と読み上げる文をすべて集める。"""
    out = [sc.get(f) for f in TEXT_FIELDS]
    out += [it.get(f) for it in sc.get("items") or [] for f in ITEM_FIELDS]
    out += [ln.get("text") for ln in sc.get("lines") or []]
    return [t for t in out if isinstance(t, str) and t]


def check_shape(sc: dict, sid: str, n_stages: int) -> list[Issue]:
    issues = []
    err = lambda m: issues.append(Issue("error", sid, m))  # noqa: E731
    kind = sc.get("kind")
    if kind not in KINDS and not str(kind).startswith("custom:"):
        err(f"kind={kind!r} は使えません（{', '.join(sorted(KINDS))}、または custom:<名前>）")
    if not sc.get("title"):
        err("title がありません")
    lines = sc.get("lines") or []
    if not lines or not all(isinstance(ln.get("text"), str) and ln["text"] for ln in lines):
        err("lines に text のある文が必要です")
    stage = sc.get("stage")
    if not isinstance(stage, int) or not 0 <= stage <= n_stages:
        err(f"stage={stage!r} は 0〜{n_stages} の整数にしてください")
    items = sc.get("items") or []
    for i, it in enumerate(items):
        if not isinstance(it.get("l"), int) or not 0 <= it["l"] < max(1, len(lines)):
            err(f"items[{i}] の l={it.get('l')} が文の番号の範囲外です（文は {len(lines)} 個）")
    if kind == "decision":
        for key in ("question", "reason", "by"):
            if not sc.get(key):
                err(f"decision には {key} が必要です（資料に無いなら「記録なし」と書く）")
        if not any(it.get("chosen") for it in items):
            err("decision には chosen: true の候補が1つ以上必要です")
        if "rl" in sc and not 0 <= sc["rl"] < len(lines):
            err(f"rl={sc['rl']} が文の番号の範囲外です")
    if kind == "docs":
        for i, it in enumerate(items):
            for key in ("date", "who"):
                if not it.get(key):
                    err(f"docs の items[{i}] に {key} がありません（作成者が不明なら「不明」と書く）")
    if kind == "bars" and not (isinstance(sc.get("max"), (int, float)) and sc["max"] > 0):
        err("bars には正の max が必要です")
    issues += check_charts(sc, sid, kind, items)
    return issues


def check_charts(sc: dict, sid: str, kind: str, items: list[dict]) -> list[Issue]:
    issues = []
    err = lambda m: issues.append(Issue("error", sid, m))  # noqa: E731
    if kind == "ratio":
        for i, it in enumerate(items):
            if not isinstance(it.get("v"), (int, float)) or not 0 <= it["v"] <= 100:
                err(f"ratio の items[{i}] の v は 0〜100 にしてください")
    if kind == "compare":
        if len(items) != 2 or not all(isinstance(it.get("v"), (int, float)) for it in items):
            err("compare は v のある項目をちょうど2つ（前・後）にしてください")
    if kind == "diagram":
        for i, it in enumerate(items):
            g = it.get("g", 0)
            if not isinstance(g, int) or not 0 <= g <= 3:
                err(f"diagram の items[{i}] の g（列）は 0〜3 にしてください")
            for j in it.get("to") or []:
                if not isinstance(j, int) or not 0 <= j < len(items) or j == i:
                    err(f"diagram の items[{i}] の to={j} がつなぎ先の範囲外です")
        per_col: dict[int, int] = {}
        for it in items:
            per_col[it.get("g", 0)] = per_col.get(it.get("g", 0), 0) + 1
        if per_col and max(per_col.values()) > 4:
            issues.append(Issue("warn", sid, "diagram の1列に箱が5個以上あり、小さくなりすぎます"))
    if kind == "timeline":
        lo, hi = sc.get("from"), sc.get("to")
        if not (isinstance(lo, str) and ASOF.match(lo) and isinstance(hi, str) and ASOF.match(hi) and lo <= hi):
            err("timeline には from・to（YYYY-MM、from ≦ to）が必要です")
            lo = hi = None
        for i, it in enumerate(items):
            a, b = it.get("start"), it.get("end")
            if not (isinstance(a, str) and ASOF.match(a) and isinstance(b, str) and ASOF.match(b) and a <= b):
                err(f"timeline の items[{i}] には start・end（YYYY-MM、start ≦ end）が必要です")
            elif lo and hi and not (lo <= a and b <= hi):
                issues.append(Issue("warn", sid, f"timeline の items[{i}] が横軸（{lo}〜{hi}）の外にはみ出しています"))
    if kind == "icons":
        for i, it in enumerate(items):
            if not it.get("icon"):
                err(f"icons の items[{i}] に icon がありません")
    return issues


def check_icons(sc: dict, sid: str, icons: tuple[set[str] | None, set[str]] | None) -> list[Issue]:
    issues = []
    for i, it in enumerate(sc.get("items") or []):
        name = it.get("icon")
        motion = it.get("motion")
        if motion is not None and motion not in MOTIONS:
            issues.append(Issue("error", sid, f"items[{i}] の motion={motion!r} は使えません（{', '.join(sorted(MOTIONS))}）"))
        if not name:
            continue
        if CHARACTER_ICON.match(name):
            issues.append(Issue("error", sid, f"キャラクターに見えるアイコン「{name}」は使いません"))
        if icons is None:
            continue
        lucide, custom = icons
        if name.startswith("custom:"):
            if name[7:] not in custom:
                issues.append(Issue("error", sid, f"自作アイコン「{name}」が src/custom-icons.tsx にありません"))
        elif lucide is None:
            issues.append(Issue("warn", sid, f"アイコン「{name}」を確かめられません（npm i をしてから点検する）"))
        elif name not in lucide:
            issues.append(Issue("error", sid, f"アイコン「{name}」は Lucide にありません（https://lucide.dev/icons/ で名前を確かめる）"))
    return issues


def known_icons(root: Path = ROOT) -> tuple[set[str] | None, set[str]]:
    """Lucide のアイコン名（node_modules から）と、自作アイコンの名前（custom-icons.tsx から）。"""
    d = root / "node_modules" / "lucide-react" / "dist" / "esm" / "icons"
    lucide = {p.name[:-4] for p in d.glob("*.mjs")} - {"index"} if d.is_dir() else None
    src = root / "src" / "custom-icons.tsx"
    custom: set[str] = set()
    if src.exists():
        block = src.read_text(encoding="utf-8").split("CUSTOM_ICONS", 2)[-1]
        custom = set(re.findall(r"^\s+\"?([\w-]+)\"?\s*:", block, re.M))
    return lucide, custom


def known_custom_kinds(root: Path = ROOT) -> set[str]:
    src = root / "src" / "custom" / "index.ts"
    if not src.exists():
        return set()
    block = src.read_text(encoding="utf-8").split("CUSTOM_KINDS", 1)[-1]
    return set(re.findall(r"^\s+(\w+)\s*[,:]", block, re.M))


def check_layout(sc: dict, sid: str) -> list[Issue]:
    issues = []
    limit = MAX_ITEMS.get(sc.get("kind", ""))
    n = len(sc.get("items") or [])
    if limit and n > limit:
        issues.append(Issue("warn", sid, f"項目が多すぎます（{n} 個。{sc['kind']} は {limit} 個まで）"))
    if len(sc.get("title") or "") > TITLE_MAX:
        issues.append(Issue("warn", sid, f"title が長く、1行に収まらないおそれがあります（{TITLE_MAX} 字まで）"))
    for ln in sc.get("lines") or []:
        if len(ln.get("text") or "") > CAPTION_MAX:
            issues.append(Issue("warn", sid, f"字幕が {CAPTION_MAX} 字を超えています。文を分けてください: {ln['text'][:20]}…"))
    has_number = any(re.search(r"\d", t) for t in visible_texts(sc)) or any(
        "v" in it for it in sc.get("items") or []
    )
    if sc.get("kind") in ("stats", "bars", "decision", "docs", "bullets") and has_number and not sc.get("source"):
        issues.append(Issue("warn", sid, "数字や日付があるのに出典（source）がありません"))
    return issues


def check_time(sc: dict, sid: str, prev_asof: str | None) -> tuple[list[Issue], str | None]:
    issues = []
    asof = sc.get("asof")
    if asof is None:
        if sc.get("kind") not in ("cover", "chapter") and not sc.get("retrospective"):
            issues.append(Issue("warn", sid, "asof（いつの時点の情報か）がありません"))
        return issues, prev_asof
    if not ASOF.match(str(asof)):
        issues.append(Issue("error", sid, f"asof={asof!r} は YYYY-MM の形にしてください"))
        return issues, prev_asof
    if sc.get("retrospective"):
        return issues, prev_asof
    if prev_asof and asof < prev_asof:
        issues.append(Issue("error", sid, f"asof={asof} が前の場面（{prev_asof}）より前に戻っています"))
    for t in visible_texts(sc):
        for y, m in YM.findall(t):
            ym = f"{int(y):04d}-{int(m):02d}"
            if ym > asof:
                issues.append(Issue("error", sid, f"未来の情報: asof={asof} の場面に「{y}年{m}月」があります: {t[:30]}"))
    if sc.get("kind") == "timeline":
        for i, it in enumerate(sc.get("items") or []):
            end = it.get("end")
            if isinstance(end, str) and end > asof and not it.get("plan"):
                issues.append(Issue(
                    "error", sid,
                    f"未来の情報: timeline の items[{i}] が asof={asof} より後（{end}）まで伸びています（その時点の予定なら plan: true）",
                ))
    return issues, asof


def check_speech(sc: dict, sid: str, readings: list[tuple[str, str]], banned: list[str]) -> list[Issue]:
    issues = []
    for ln in sc.get("lines") or []:
        text = ln.get("text") or ""
        if CHARACTER_SPEECH.search(text):
            issues.append(Issue("error", sid, f"キャラクターの口調があります。まじめな説明の文にしてください: {text[:30]}"))
        spoken = ln.get("say") or to_say(text, readings)
        left = sorted(set(ASCII_WORD.findall(spoken)))
        if left:
            issues.append(Issue("warn", sid, f"読み替え表にない英字があります（readings.json か say に読みを足す）: {', '.join(left)}"))
        if not ln.get("say") and SLASH_DATE.search(text):
            issues.append(Issue("warn", sid, f"「4/24」の形は分数に読まれます。「4月24日」と書いてください: {text[:30]}"))
    for t in visible_texts(sc):
        for w in banned:
            if w and w in t:
                issues.append(Issue("error", sid, f"伏せる語「{w}」が出ています: {t[:30]}"))
    return issues


def check(
    script: dict,
    readings: list[tuple[str, str]],
    banned: list[str] | None = None,
    icons: tuple[set[str] | None, set[str]] | None = None,
    custom_kinds: set[str] | None = None,
) -> list[Issue]:
    """icons と custom_kinds を渡すと、アイコン名と専用の場面が実在するかも確かめる。"""
    banned = banned or []
    issues: list[Issue] = []
    for key in ("speaker", "speedScale", "stages", "scenes"):
        if key not in script:
            issues.append(Issue("error", "(全体)", f"{key} がありません"))
    stages = script.get("stages") or []
    seen: set[str] = set()
    prev_asof = None
    prev_stage = 0
    for sc in script.get("scenes") or []:
        sid = str(sc.get("id", "(id なし)"))
        if sid in seen:
            issues.append(Issue("error", sid, "id が重複しています"))
        seen.add(sid)
        issues += check_shape(sc, sid, len(stages))
        issues += check_layout(sc, sid)
        time_issues, prev_asof = check_time(sc, sid, prev_asof)
        issues += time_issues
        issues += check_speech(sc, sid, readings, banned)
        issues += check_icons(sc, sid, icons)
        kind = str(sc.get("kind"))
        if custom_kinds is not None and kind.startswith("custom:") and kind[7:] not in custom_kinds:
            issues.append(Issue("error", sid, f"{kind} が src/custom/index.ts に登録されていません"))
        stage = sc.get("stage")
        if isinstance(stage, int) and stage > 0:
            if stage < prev_stage and not sc.get("retrospective"):
                issues.append(Issue("warn", sid, f"stage が {prev_stage} から {stage} に戻っています"))
            prev_stage = max(prev_stage, stage)
    return issues


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script")
    ap.add_argument("--readings", default=str(DEFAULT_READINGS))
    ap.add_argument("--banned", help="伏せる語を1行に1つ書いたファイル（社名・店名など）")
    args = ap.parse_args()
    script = json.loads(Path(args.script).read_text(encoding="utf-8"))
    banned = []
    if args.banned:
        banned = [w.strip() for w in Path(args.banned).read_text(encoding="utf-8").splitlines() if w.strip()]
    issues = check(
        script, load_readings(Path(args.readings)), banned, icons=known_icons(), custom_kinds=known_custom_kinds()
    )
    for i in issues:
        print(i)
    n_err = sum(i.level == "error" for i in issues)
    print(f"エラー {n_err} 件、注意 {len(issues) - n_err} 件（{len(script.get('scenes', []))} 場面）")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
