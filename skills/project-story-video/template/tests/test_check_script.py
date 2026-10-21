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
