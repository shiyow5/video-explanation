"""論文の解説（mode: paper）と、数式・表・図の場面の点検。check_script.py から呼ぶ。

見ること:
  論文の URL があるか
  主張の出典（論文の節・式・表・図）があるか（論文の解説では、数字のある場面に出典が無ければエラー）
  数式が KaTeX で書ける形か（手元の Node で KaTeX を動かして確かめる）
  表の各行のセルの数が列の数とそろっているか
  図の画像があるか、クレジットとライセンスがあるか、そのライセンスで転載してよいか
"""
import json
import re
import subprocess
from collections.abc import Callable
from pathlib import Path

PAPER_KINDS = {"equation", "table", "figure"}
PAPER_MAX_ITEMS = {"equation": 4, "table": 6, "figure": 4}
# 転載してよいライセンス（クレジットを付ける前提）と、自分たちで作った図
REUSABLE = re.compile(r"CC[ -]?BY|CC0|public domain|パブリックドメイン|自作|見本用", re.I)
# 条件付きのもの（改変禁止・非営利）
RESTRICTED = re.compile(r"-ND|-NC|NoDerivatives|NonCommercial", re.I)


def check_paper_script(script: dict) -> list:
    from check_script import Issue

    if script.get("mode") != "paper":
        return []
    url = (script.get("paper") or {}).get("url", "")
    if not str(url).startswith("http"):
        return [Issue("error", "(全体)", "mode: paper には paper.url（論文の URL。arXiv など）が必要です")]
    return []


def _has_number(sc: dict) -> bool:
    texts = [ln.get("text", "") for ln in sc.get("lines") or []]
    texts += [str(it.get(k, "")) for it in sc.get("items") or [] for k in ("t", "s", "label")]
    return any(re.search(r"\d", t) for t in texts) or any("v" in it for it in sc.get("items") or [])


def check_paper_scene(
    sc: dict,
    sid: str,
    mode: str | None,
    tex_ok: Callable[[str], bool] | None = None,
    public_files: set[str] | None = None,
) -> list:
    from check_script import Issue

    issues = []
    err = lambda m: issues.append(Issue("error", sid, m))  # noqa: E731
    kind = sc.get("kind")
    items = sc.get("items") or []
    content = kind not in ("cover", "chapter")
    if content and not sc.get("source") and (kind in PAPER_KINDS or (mode == "paper" and _has_number(sc))):
        err("出典（source）がありません。論文の節・式・表・図の番号まで書いてください（例「論文 4.2節 表3」）")
    if kind == "equation":
        texts = [sc.get("tex")] + [it.get("tex") for it in items if it.get("tex")]
        if not sc.get("tex"):
            err("equation には tex（式全体の LaTeX）が必要です")
        if tex_ok is not None:
            for t in texts:
                if t and not tex_ok(t):
                    err(f"LaTeX として読めない式があります: {t[:40]}")
    if kind == "table":
        cols = sc.get("columns") or []
        if len(cols) < 2:
            err("table には2つ以上の columns（列の見出し）が必要です")
        for i, it in enumerate(items):
            if len(it.get("cells") or []) != len(cols):
                err(f"table の items[{i}] の cells の数（{len(it.get('cells') or [])}）が列の数（{len(cols)}）と違います")
    if kind == "figure":
        image = sc.get("image")
        if not image:
            err("figure には image（public/ の中の画像）が必要です")
        elif public_files is not None and image not in public_files:
            err(f"画像 public/{image} がありません")
        for key in ("credit", "license"):
            if not sc.get(key):
                err(f"figure には {key} が必要です（図の出典とライセンス）")
        lic = str(sc.get("license") or "")
        if lic and not REUSABLE.search(lic):
            err(f"ライセンス「{lic}」では図を転載できません。図を描き直す（diagram などで自作する）か、転載の許可を得てください")
        elif lic and RESTRICTED.search(lic):
            issues.append(Issue("warn", sid, f"ライセンス「{lic}」には条件（改変禁止・非営利）があります。枠を重ねる・営利で使うなどが条件に合うか確かめてください"))
        for i, it in enumerate(items):
            box = it.get("box")
            if box is not None and not (len(box) == 4 and all(isinstance(v, (int, float)) and 0 <= v <= 100 for v in box)):
                err(f"figure の items[{i}] の box は [左, 上, 幅, 高さ]（0〜100）にしてください")
    return issues


def katex_checker(root: Path, texts: list[str]) -> Callable[[str], bool] | None:
    """手元の KaTeX で式をまとめて確かめ、その結果を引く関数を返す。KaTeX が無ければ None。"""
    if not (root / "node_modules" / "katex").is_dir() or not texts:
        return None
    js = (
        "const k=require('katex');let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{"
        "const r={};for(const t of JSON.parse(s)){try{k.renderToString(t,{throwOnError:true});r[t]=true}"
        "catch(e){r[t]=false}}process.stdout.write(JSON.stringify(r))})"
    )
    out = subprocess.run(
        ["node", "-e", js], input=json.dumps(texts), capture_output=True, text=True, cwd=root, check=True
    )
    result = json.loads(out.stdout)
    return lambda t: result.get(t, True)


def collect_tex(script: dict) -> list[str]:
    texts = []
    for sc in script.get("scenes") or []:
        if sc.get("tex"):
            texts.append(sc["tex"])
        texts += [it["tex"] for it in sc.get("items") or [] if it.get("tex")]
    return texts


def public_file_set(root: Path) -> set[str]:
    pub = root / "public"
    return {str(p.relative_to(pub)) for p in pub.rglob("*") if p.is_file()} if pub.is_dir() else set()
