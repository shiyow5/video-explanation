"""専門用語と固有名詞の点検。check_script.py から呼ぶ。

決まり:
  専門用語（glossary）と固有名詞（names）は、ふだんの言葉に置き換えずにそのまま使う。
  どちらも、初めて出る場面の terms に入れて、画面の札と読み上げで解説する。
  固有名詞（手法・モデル・データセット・指標などの名前）は、出てくるすべての文で、
  何の名前かを添える（names の what。例「検索手法のBM25」「QuickRankという手法」）。
  見出し（title・label）は短いので、この決まりの対象にしない。
"""
TERMS_PER_SCENE = 2
DESC_MAX = 40


def _sentences(sc: dict) -> list[str]:
    """固有名詞の決まりを当てる文（読み上げの文と、画面の項目の文）。"""
    out = [ln.get("text", "") for ln in sc.get("lines") or []]
    out += [it.get(k, "") for it in sc.get("items") or [] for k in ("t", "s")]
    return [t for t in out if isinstance(t, str) and t]


def check_terms(script: dict, visible_texts) -> list:
    from check_script import Issue

    glossary: dict = script.get("glossary") or {}
    names: dict = script.get("names") or {}
    issues = []
    for term, desc in glossary.items():
        if len(str(desc)) > DESC_MAX:
            issues.append(Issue("warn", "(用語集)", f"「{term}」の説明が{DESC_MAX}字を超えています。札に収まるよう短くしてください"))
    for name, info in names.items():
        if not isinstance(info, dict) or not info.get("what") or not info.get("desc"):
            issues.append(Issue("error", "(固有名詞)", f"names の「{name}」には what（何の名前か）と desc（説明）が必要です"))
        elif len(info["desc"]) > DESC_MAX:
            issues.append(Issue("warn", "(固有名詞)", f"「{name}」の説明が{DESC_MAX}字を超えています。札に収まるよう短くしてください"))
    known = set(glossary) | set(names)
    explained: set[str] = set()
    for sc in script.get("scenes") or []:
        sid = str(sc.get("id", "(id なし)"))
        terms = sc.get("terms") or []
        for t in terms:
            if t not in known:
                issues.append(Issue("error", sid, f"terms の「{t}」が glossary（用語集）にも names（固有名詞）にもありません"))
        if len(terms) > TERMS_PER_SCENE:
            issues.append(Issue("warn", sid, f"用語の札が{len(terms)}個あります。1場面{TERMS_PER_SCENE}個までにしてください"))
        texts = visible_texts(sc)
        for term in known:
            if term in explained:
                continue
            if term in terms:
                explained.add(term)
            elif any(term in x for x in texts):
                issues.append(Issue(
                    "error", sid,
                    f"「{term}」の初出に説明がありません。置き換えずにそのまま使い、この場面の terms に入れて解説してください",
                ))
                explained.add(term)  # 同じ用語のエラーを繰り返さない
        for name, info in names.items():
            what = info.get("what") if isinstance(info, dict) else None
            if not what:
                continue
            for s in _sentences(sc):
                if name in s and what not in s:
                    issues.append(Issue(
                        "error", sid,
                        f"「{name}」が何の名前か分からない文があります。「{what}の{name}」のように添えてください: {s[:30]}",
                    ))
    return issues
