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

KINDS = {"cover", "chapter", "bullets", "stats", "bars", "flow", "decision", "docs"}
# 1画面に収まる項目数の目安（kinds.tsx の配置から）
MAX_ITEMS = {"bullets": 5, "stats": 4, "bars": 7, "flow": 4, "decision": 5, "docs": 5}
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
    if kind not in KINDS:
        err(f"kind={kind!r} は使えません（{', '.join(sorted(KINDS))}）")
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
    return issues


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


def check(script: dict, readings: list[tuple[str, str]], banned: list[str] | None = None) -> list[Issue]:
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
    issues = check(script, load_readings(Path(args.readings)), banned)
    for i in issues:
        print(i)
    n_err = sum(i.level == "error" for i in issues)
    print(f"エラー {n_err} 件、注意 {len(issues) - n_err} 件（{len(script.get('scenes', []))} 場面）")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
