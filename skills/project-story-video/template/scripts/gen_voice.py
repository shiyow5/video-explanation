"""台本 JSON の各文を、手元で起動した VOICEVOX エンジンで読み上げ音声にする。

出力: public/<voice_dir>/<scene>_<i>.wav と、シーンごとの文・字幕・秒数を書いた音声の一覧（manifest JSON）。
読み（say）が無い文は、字幕（text）を読み替え表（scripts/readings.json）と数字の規則で読みやすくして読ませる。
エンジンの接続先は 127.0.0.1 / localhost だけを受け付ける（台本を外部のサーバーに送らないため）。

使い方:
  python3 scripts/gen_voice.py <台本.json> <音声の一覧.json> <public 内の出力フォルダ名>
  python3 scripts/gen_voice.py scripts/narration.json src/voice-manifest.json voice
  python3 scripts/gen_voice.py --dry scripts/narration.json      # 読みだけ確かめる
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_READINGS = ROOT / "scripts" / "readings.json"
ENGINE = os.environ.get("VOICEVOX_URL", "http://127.0.0.1:50021")
KANA = ["れい", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"]

TARGET_RMS_DB = -18.0
PEAK_DB = -1.0


def load_readings(path: Path) -> list[tuple[str, str]]:
    """読み替え表を読み、長い語から順に並べる（IDE を ID より先に置き換えるため）。"""
    pairs = json.loads(Path(path).read_text(encoding="utf-8"))
    return sorted(((a, b) for a, b in pairs), key=lambda p: -len(p[0]))


def to_say(text: str, readings: list[tuple[str, str]]) -> str:
    s = text
    for a, b in readings:
        s = s.replace(a, b)
    s = re.sub(r"(\d+)/(\d+)(?!日)", lambda m: f"{m.group(2)}分の{m.group(1)}", s)  # 1/21 → 21分の1
    s = re.sub(
        r"(\d+)\.(\d+)",
        lambda m: ("れい" if m.group(1) == "0" else m.group(1)) + "てん" + "".join(KANA[int(c)] for c in m.group(2)),
        s,
    )
    return s.replace("〜", "から").replace("→", "から").replace("pt", "ポイント").replace("%", "パーセント")


def check_local(url: str) -> None:
    host = urllib.parse.urlparse(url).hostname
    if host not in ("127.0.0.1", "localhost", "::1"):
        sys.exit(f"VOICEVOX_URL={url} は手元のエンジンではありません。台本を外部に送らないため止めます")


def post(path: str, data: bytes | None = None) -> bytes:
    req = urllib.request.Request(
        ENGINE + path, data=data or b"", method="POST", headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def normalize(src: Path, dst: Path) -> None:
    """VOICEVOX の出力は小さい（平均 -28dB 前後）ので、一律の増幅で平均を -18dB にそろえる。

    loudnorm は2秒前後の短い文を正しく測れず、逆に音が下がったため使わない。ピークは -1dB で止める。
    """
    import numpy as np

    with wave.open(str(src)) as w:
        params = w.getparams()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
    voiced = x[np.abs(x) > 10 ** (-40 / 20)]  # 無音部分を除いて平均を測る
    rms = np.sqrt(np.mean(voiced**2)) if voiced.size else 1e-9
    gain = 10 ** ((TARGET_RMS_DB - 20 * np.log10(rms)) / 20)
    peak = np.max(np.abs(x)) or 1e-9
    gain = min(gain, 10 ** (PEAK_DB / 20) / peak)
    y = np.clip(x * gain, -1, 1)
    with wave.open(str(dst), "wb") as w:
        w.setparams(params)
        w.writeframes((y * 32767).astype(np.int16).tobytes())


def synth(text: str, speaker: int, speed: float, out: Path) -> float:
    query = json.loads(post(f"/audio_query?speaker={speaker}&text={urllib.parse.quote(text)}"))
    query.update(
        speedScale=speed, intonationScale=1.0, prePhonemeLength=0.05, postPhonemeLength=0.12, outputSamplingRate=44100
    )
    raw = out.with_suffix(".raw.wav")
    raw.write_bytes(post(f"/synthesis?speaker={speaker}", json.dumps(query).encode()))
    normalize(raw, out)
    raw.unlink()
    return seconds_of(out)


def seconds_of(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def generate(script: Path, manifest: Path, voice_dir: str, readings: list[tuple[str, str]]) -> None:
    check_local(ENGINE)
    cfg = json.loads(script.read_text(encoding="utf-8"))
    vdir = ROOT / "public" / voice_dir
    vdir.mkdir(parents=True, exist_ok=True)
    # 読みが前回と同じ文は合成し直さない（台本を直したときの時間を短くする）
    cache_path = vdir / "_cache.json"
    cache = json.loads(cache_path.read_text(encoding="utf-8")) if cache_path.exists() else {}
    scenes = []
    for sc in cfg["scenes"]:
        lines = []
        for i, ln in enumerate(sc["lines"]):
            name = f"{sc['id']}_{i}.wav"
            say = ln.get("say") or to_say(ln["text"], readings)
            key = f"{cfg['speaker']}|{cfg['speedScale']}|{say}"
            if cache.get(name) == key and (vdir / name).exists():
                sec = seconds_of(vdir / name)
            else:
                sec = synth(say, cfg["speaker"], cfg["speedScale"], vdir / name)
                cache[name] = key
                cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
            lines.append({"file": f"{voice_dir}/{name}", "text": ln["text"], "seconds": round(sec, 3)})
            print(f"{name}  {sec:.2f}s  {say}")
        scenes.append({"id": sc["id"], "lines": lines})
    manifest.write_text(json.dumps({"scenes": scenes}, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(ln["seconds"] for s in scenes for ln in s["lines"])
    print(f"音声の合計 {total:.1f} 秒")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script")
    ap.add_argument("manifest", nargs="?")
    ap.add_argument("voice_dir", nargs="?")
    ap.add_argument("--readings", default=str(DEFAULT_READINGS))
    ap.add_argument("--dry", action="store_true", help="合成せず、読みだけを表示する")
    args = ap.parse_args()
    readings = load_readings(Path(args.readings))
    script = ROOT / args.script
    if args.dry:
        cfg = json.loads(script.read_text(encoding="utf-8"))
        for sc in cfg["scenes"]:
            for ln in sc["lines"]:
                print(sc["id"], "|", ln.get("say") or to_say(ln["text"], readings))
        return
    if not (args.manifest and args.voice_dir):
        ap.error("manifest と voice_dir を指定してください")
    generate(script, ROOT / args.manifest, args.voice_dir, readings)


if __name__ == "__main__":
    main()
