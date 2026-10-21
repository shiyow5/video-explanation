"""解説動画用の BGM を合成する（外部素材を使わないので権利の確認が要らない）。

明るいポップ調: 116 BPM、C-G-Am-F の4小節ループ。パッド＋アルペジオ＋ベース＋キック・ハイハット。
使い方: python3 make_bgm.py <出力wav> <秒数>
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 116
BEAT = 60 / BPM
OUT = sys.argv[1]
SECONDS = float(sys.argv[2])

# コード（MIDI番号）。C, G, Am, F
CHORDS = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
BASS = [36, 43, 45, 41]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.01, r=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)


def tone(m, dur, kind="tri", a=0.01, r=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    if kind == "tri":
        w = 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
    elif kind == "sine":
        w = np.sin(2 * np.pi * f * t)
    else:  # 倍音を絞ったのこぎり波（パッド）
        w = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 6))
    return w * env(n, a, r)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 18) + 45
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def noise_hit(seed, dur, decay, gain, highpass):
    n = int(dur * SR)
    w = np.random.default_rng(seed).standard_normal(n)
    if highpass:
        w = np.diff(w, prepend=0)
    return w * np.exp(-np.arange(n) / SR * decay) * gain


total = int(SECONDS * SR) + SR
mix = np.zeros(total)


def add(sig, start_sec, gain):
    s = int(start_sec * SR)
    e = min(total, s + len(sig))
    if s < total:
        mix[s:e] += sig[: e - s] * gain


bar = 4 * BEAT
nbars = int(SECONDS / bar) + 1
arp_pattern = [0, 1, 2, 1, 0, 2, 1, 2]
hat = noise_hit(0, 0.06, 60, 0.25, True)
clap = noise_hit(1, 0.18, 25, 0.18, False)
for b in range(nbars):
    c = CHORDS[b % 4]
    t0 = b * bar
    for m in c:
        add(tone(m, bar, "pad", a=0.3, r=2.5), t0, 0.035)
    for i, k in enumerate(arp_pattern):
        add(tone(c[k] + 12, BEAT / 2, "tri", a=0.005, r=0.18), t0 + i * BEAT / 2, 0.09)
    for i in range(4):
        add(tone(BASS[b % 4], BEAT * 0.9, "sine", a=0.01, r=0.5), t0 + i * BEAT, 0.22)
    if b >= 1:  # 2小節目からビート
        for i in range(4):
            add(kick(), t0 + i * BEAT, 0.5)
            add(hat, t0 + i * BEAT + BEAT / 2, 1.0)
        add(clap, t0 + BEAT, 1.0)
        add(clap, t0 + 3 * BEAT, 1.0)

mix = mix[: int(SECONDS * SR)]
fi, fo = int(1.0 * SR), int(3.0 * SR)
mix[:fi] *= np.linspace(0, 1, fi)
mix[-fo:] *= np.linspace(1, 0, fo)
mix = mix / np.max(np.abs(mix)) * 0.8
pcm = (mix * 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(np.stack([pcm, pcm], axis=1).tobytes())
print("wrote", OUT, SECONDS, "sec")
