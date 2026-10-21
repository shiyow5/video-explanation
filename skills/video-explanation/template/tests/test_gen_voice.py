import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from gen_voice import load_readings, to_say  # noqa: E402


def test_longer_terms_are_replaced_first(tmp_path):
    p = tmp_path / "r.json"
    p.write_text(json.dumps([["ID", "アイディー"], ["IDE", "アイディーイー"]]), encoding="utf-8")
    readings = load_readings(p)
    assert to_say("IDE と ID", readings) == "アイディーイー と アイディー"


def test_decimal_is_read_digit_by_digit():
    assert to_say("0.81", []) == "れいてんはちいち"


def test_fraction_and_symbols():
    assert to_say("1/21", []) == "21分の1"
    assert to_say("3〜5%", []) == "3から5パーセント"


def test_japanese_date_is_kept():
    assert to_say("10月24日", []) == "10月24日"


def test_template_readings_file_loads():
    path = Path(__file__).resolve().parent.parent / "scripts" / "readings.json"
    readings = load_readings(path)
    assert ("GPU", "ジーピーユー") in readings
