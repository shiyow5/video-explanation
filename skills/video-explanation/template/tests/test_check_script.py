import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from check_script import check  # noqa: E402

READINGS = [("GPU", "ジーピーユー"), ("API", "エーピーアイ")]


def base(**over):
    scene = {
        "id": "s1",
        "stage": 1,
        "asof": "2025-04",
        "kind": "bullets",
        "title": "例",
        "source": "2025年4月の定例資料",
        "items": [{"t": "項目", "l": 0}],
        "lines": [{"text": "2025年4月に始まりました。"}],
    }
    scene.update(over)
    return scene


def script(*scenes, stages=None):
    return {"speaker": 3, "speedScale": 1.1, "stages": stages or ["段階1", "段階2"], "scenes": list(scenes)}


def errors(issues):
    return [i for i in issues if i.level == "error"]


def messages(issues):
    return " / ".join(i.message for i in issues)


def test_valid_script_has_no_errors():
    assert errors(check(script(base()), READINGS)) == []


def test_future_date_in_text_is_error():
    s = base(lines=[{"text": "2025年6月に方針を変えました。"}])
    issues = check(script(s), READINGS)
    assert any("未来" in i.message for i in errors(issues))


def test_future_date_in_item_is_error():
    s = base(items=[{"t": "2026年1月の結果", "l": 0}])
    assert any("未来" in i.message for i in errors(check(script(s), READINGS)))


def test_retrospective_scene_may_mention_any_date():
    s = base(retrospective=True, lines=[{"text": "2026年1月まで続きました。"}])
    assert errors(check(script(s), READINGS)) == []


def test_asof_going_back_is_error():
    a = base(id="a", asof="2025-06", lines=[{"text": "2025年6月です。"}])
    b = base(id="b", asof="2025-04")
    assert any("asof" in i.message for i in errors(check(script(a, b), READINGS)))


def test_bad_asof_format_is_error():
    assert errors(check(script(base(asof="2025/4")), READINGS))


def test_character_speech_is_error():
    s = base(lines=[{"text": "これが結果なのだ。"}])
    assert any("口調" in i.message for i in errors(check(script(s), READINGS)))


def test_item_line_index_out_of_range_is_error():
    s = base(items=[{"t": "項目", "l": 3}])
    assert any("l=3" in i.message for i in errors(check(script(s), READINGS)))


def test_decision_requires_question_reason_by_and_chosen():
    s = base(kind="decision", items=[{"t": "案A", "l": 0}, {"t": "案B", "l": 0}])
    msg = messages(errors(check(script(s), READINGS)))
    for key in ("question", "reason", "by", "chosen"):
        assert key in msg


def test_complete_decision_passes():
    s = base(
        kind="decision",
        question="どれを使うか",
        reason="費用が低い",
        by="合意",
        items=[{"t": "案A", "l": 0, "chosen": True}, {"t": "案B", "l": 0}],
    )
    assert errors(check(script(s), READINGS)) == []


def test_docs_items_need_date_and_who():
    s = base(kind="docs", items=[{"t": "設計書", "l": 0}])
    msg = messages(errors(check(script(s), READINGS)))
    assert "date" in msg and "who" in msg


def test_stage_out_of_range_is_error():
    assert errors(check(script(base(stage=5)), READINGS))


def test_unknown_kind_is_error():
    assert errors(check(script(base(kind="chart")), READINGS))


def test_duplicate_ids_are_error():
    assert errors(check(script(base(), base()), READINGS))


def test_unread_ascii_is_warning():
    s = base(lines=[{"text": "2025年4月に XYZ を使いました。"}])
    issues = check(script(s), READINGS)
    assert any("XYZ" in i.message for i in issues if i.level == "warn")


def test_known_reading_is_not_warned():
    s = base(lines=[{"text": "2025年4月に GPU を使いました。"}])
    assert not any("英字" in i.message for i in check(script(s), READINGS))


def test_slash_date_is_warning():
    s = base(lines=[{"text": "2025年4月、4/24 に決まりました。"}])
    assert any("分数" in i.message for i in check(script(s), READINGS))


def test_banned_word_is_error():
    s = base(lines=[{"text": "2025年4月、架空商事と話しました。"}])
    issues = check(script(s), READINGS, banned=["架空商事"])
    assert any("架空商事" in i.message for i in errors(issues))


def test_too_many_items_is_warning():
    s = base(items=[{"t": f"項目{i}", "l": 0} for i in range(7)])
    assert any("項目が多" in i.message for i in check(script(s), READINGS))


def test_numbers_without_source_is_warning():
    s = base(kind="stats", items=[{"v": 12, "label": "件数", "l": 0}])
    s.pop("source")
    assert any("出典" in i.message for i in check(script(s), READINGS))


# ---------- 図解の場面とアイコン

ICONS = ({"database", "file-text", "users", "bot", "smile"}, {"report"})


def chart(**over):
    s = base(**over)
    s.setdefault("source", "2025年4月の資料")
    return s


def test_ratio_value_must_be_0_to_100():
    s = chart(kind="ratio", items=[{"v": 120, "label": "割合", "l": 0}])
    assert any("0〜100" in i.message for i in errors(check(script(s), READINGS)))


def test_compare_needs_exactly_two_items():
    s = chart(kind="compare", items=[{"v": 1, "label": "前", "l": 0}])
    assert any("2つ" in i.message for i in errors(check(script(s), READINGS)))


def test_diagram_edge_out_of_range_is_error():
    s = chart(kind="diagram", items=[{"t": "A", "g": 0, "to": [5], "l": 0}, {"t": "B", "g": 1, "l": 0}])
    assert any("to" in i.message for i in errors(check(script(s), READINGS)))


def test_diagram_valid_passes():
    s = chart(kind="diagram", items=[{"t": "A", "g": 0, "to": [1], "l": 0}, {"t": "B", "g": 1, "l": 0}])
    assert errors(check(script(s), READINGS)) == []


def test_timeline_band_past_asof_is_future_info():
    s = chart(
        kind="timeline",
        **{"from": "2025-01", "to": "2025-12"},
        items=[{"t": "試作", "start": "2025-03", "end": "2025-08", "l": 0}],
    )
    assert any("未来" in i.message for i in errors(check(script(s), READINGS)))


def test_timeline_plan_band_may_extend_past_asof():
    s = chart(
        kind="timeline",
        **{"from": "2025-01", "to": "2025-12"},
        items=[{"t": "試作", "start": "2025-03", "end": "2025-08", "plan": True, "l": 0}],
    )
    assert errors(check(script(s), READINGS)) == []


def test_timeline_needs_axis():
    s = chart(kind="timeline", items=[{"t": "試作", "start": "2025-03", "end": "2025-04", "l": 0}])
    assert any("from" in i.message for i in errors(check(script(s), READINGS)))


def test_unknown_icon_is_error():
    s = chart(items=[{"t": "項目", "icon": "no-such-icon", "l": 0}])
    assert any("no-such-icon" in i.message for i in errors(check(script(s), READINGS, icons=ICONS)))


def test_known_and_custom_icons_pass():
    s = chart(items=[{"t": "A", "icon": "database", "l": 0}, {"t": "B", "icon": "custom:report", "l": 0}])
    assert errors(check(script(s), READINGS, icons=ICONS)) == []


def test_character_icon_is_error():
    s = chart(items=[{"t": "A", "icon": "bot", "l": 0}])
    assert any("キャラクター" in i.message for i in errors(check(script(s), READINGS, icons=ICONS)))


def test_icons_kind_requires_icon():
    s = chart(kind="icons", items=[{"t": "A", "l": 0}])
    assert any("icon" in i.message for i in errors(check(script(s), READINGS)))


def test_bad_motion_is_error():
    s = chart(items=[{"t": "A", "icon": "database", "motion": "fly", "l": 0}])
    assert any("motion" in i.message for i in errors(check(script(s), READINGS, icons=ICONS)))


def test_custom_kind_must_be_registered():
    s = chart(kind="custom:Nothing")
    issues = check(script(s), READINGS, custom_kinds={"UnitGrid"})
    assert any("custom:Nothing" in i.message for i in errors(issues))
    ok = chart(kind="custom:UnitGrid", items=[{"v": 3, "label": "約3割", "l": 0}])
    assert errors(check(script(ok), READINGS, custom_kinds={"UnitGrid"})) == []


# ---------- 論文の解説（mode: paper）

PAPER = {"title": "架空の論文", "authors": "架空 太郎", "url": "https://arxiv.org/abs/0000.00000"}


def paper_script(*scenes, paper=PAPER):
    s = script(*scenes)
    s["mode"] = "paper"
    if paper is not None:
        s["paper"] = paper
    return s


def pscene(**over):
    s = {
        "id": "p1",
        "stage": 1,
        "kind": "bullets",
        "title": "例",
        "source": "論文 1節",
        "items": [{"t": "項目", "l": 0}],
        "lines": [{"text": "この論文は、文書の検索を速くする方法を提案しています。"}],
    }
    s.update(over)
    return s


def test_paper_mode_does_not_need_asof():
    issues = check(paper_script(pscene()), READINGS)
    assert not any("asof" in i.message for i in issues)
    assert errors(issues) == []


def test_paper_mode_needs_paper_url():
    assert any("url" in i.message for i in errors(check(paper_script(pscene(), paper=None), READINGS)))


def test_paper_mode_needs_source_on_numbers():
    s = pscene(kind="stats", items=[{"v": 92, "suf": "%", "label": "正解率", "l": 0}])
    s.pop("source")
    assert any("出典" in i.message for i in errors(check(paper_script(s), READINGS)))


def test_equation_needs_valid_tex():
    s = pscene(kind="equation", tex="y = \\frac{1}{", items=[{"tex": "y", "t": "出力", "l": 0}])
    assert any("LaTeX" in i.message for i in errors(check(paper_script(s), READINGS, tex_ok=lambda t: "{" not in t[-2:])))


def test_equation_valid_passes():
    s = pscene(kind="equation", tex="y = Wx + b", items=[{"tex": "W", "t": "重み", "l": 0}])
    assert errors(check(paper_script(s), READINGS, tex_ok=lambda t: True)) == []


def test_table_cells_must_match_columns():
    s = pscene(kind="table", columns=["手法", "正解率"], items=[{"cells": ["提案手法"], "l": 0}])
    assert any("cells" in i.message for i in errors(check(paper_script(s), READINGS)))


def test_figure_needs_credit_and_reusable_license():
    s = pscene(kind="figure", image="sample/fig1.png", items=[])
    msg = " / ".join(i.message for i in errors(check(paper_script(s), READINGS, public_files={"sample/fig1.png"})))
    assert "credit" in msg and "license" in msg


def test_figure_with_non_reusable_license_is_error():
    s = pscene(kind="figure", image="sample/fig1.png", credit="論文 図1", license="arXiv.org perpetual non-exclusive license", items=[])
    issues = check(paper_script(s), READINGS, public_files={"sample/fig1.png"})
    assert any("描き直" in i.message for i in errors(issues))


def test_figure_with_cc_by_passes():
    s = pscene(kind="figure", image="sample/fig1.png", credit="架空 太郎ほか 図1", license="CC BY 4.0", items=[])
    assert errors(check(paper_script(s), READINGS, public_files={"sample/fig1.png"})) == []


def test_figure_image_must_exist():
    s = pscene(kind="figure", image="sample/none.png", credit="自作", license="自作", items=[])
    assert any("none.png" in i.message for i in errors(check(paper_script(s), READINGS, public_files=set())))


# ---------- 専門用語（glossary と terms）

GLOSSARY = {"コサイン類似度": "2つのベクトルの向きの近さ。1に近いほど似ている"}


def term_script(*scenes, glossary=GLOSSARY):
    s = paper_script(*scenes)
    s["glossary"] = glossary
    return s


def test_term_first_use_needs_explanation():
    s = pscene(lines=[{"text": "点数にはコサイン類似度を使います。"}])
    issues = check(term_script(s), READINGS)
    assert any("コサイン類似度" in i.message and "初" in i.message for i in errors(issues))


def test_term_with_terms_passes_and_later_use_is_fine():
    a = pscene(id="a", terms=["コサイン類似度"], lines=[{"text": "点数にはコサイン類似度を使います。"}])
    b = pscene(id="b", lines=[{"text": "コサイン類似度が高い文書を選びます。"}])
    assert errors(check(term_script(a, b), READINGS)) == []


def test_terms_must_be_in_glossary():
    s = pscene(terms=["未登録の用語"])
    assert any("未登録の用語" in i.message for i in errors(check(term_script(s), READINGS)))


def test_too_long_explanation_is_warning():
    s = pscene(terms=["長い用語"], lines=[{"text": "長い用語を使います。"}])
    issues = check(term_script(s, glossary={"長い用語": "あ" * 60}), READINGS)
    assert any("40字" in i.message for i in issues if i.level == "warn")


NAMES = {"QuickRank": {"what": "検索手法", "desc": "この論文が提案する、2段階で探す検索手法"}}


def name_script(*scenes):
    s = term_script(*scenes, glossary={})
    s["names"] = NAMES
    return s


def test_proper_noun_needs_what_in_every_sentence():
    a = pscene(id="a", terms=["QuickRank"], lines=[{"text": "提案された検索手法のQuickRankを紹介します。"}])
    b = pscene(id="b", lines=[{"text": "QuickRankは速く動きます。"}])
    issues = errors(check(name_script(a, b), READINGS))
    assert len(issues) == 1 and issues[0].scene == "b" and "検索手法" in issues[0].message


def test_proper_noun_with_what_passes():
    a = pscene(id="a", terms=["QuickRank"], lines=[{"text": "検索手法のQuickRankを紹介します。"}])
    b = pscene(id="b", items=[{"t": "QuickRankという検索手法", "l": 0}], lines=[{"text": "この検索手法のQuickRankは速く動きます。"}])
    assert errors(check(name_script(a, b), READINGS)) == []


def test_proper_noun_needs_what_and_desc():
    s = name_script(pscene())
    s["names"] = {"QuickRank": {"what": "検索手法"}}
    assert any("desc" in i.message for i in errors(check(s, READINGS)))


def test_script_readings_are_used_for_unread_ascii():
    s = paper_script(pscene(lines=[{"text": "検索手法のQuickRankを紹介します。"}]))
    assert any("QuickRank" in i.message for i in check(s, READINGS) if i.level == "warn")
    s["readings"] = [["QuickRank", "クイックランク"]]
    assert not any("QuickRank" in i.message for i in check(s, READINGS) if i.level == "warn")
