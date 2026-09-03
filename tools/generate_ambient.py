"""Génère assets/audio/song.wav — boucle d'ambiance douce (~32 s).

Le site essaie d'abord assets/audio/song.mp3 (vrai morceau), puis retombe
sur ce WAV d'ambiance. Pour utiliser une vraie musique : déposez simplement
votre fichier sous le nom assets/audio/song.mp3 (ou modifiez MUSIC_SOURCES
dans js/main.js).

Usage :  python tools/generate_ambient.py
"""
import math
import random
import struct
import wave
from pathlib import Path

try:
    import numpy as np
except ImportError:
    np = None

SR = 22050          # Hz — suffisant pour de l'ambiance, fichier léger
DUR = 32.0          # secondes
N = int(SR * DUR)

# Accords doux (Cmaj7 · Am7 · Fmaj7 · G6), une nappe par tranche de DUR/4 s
CHORDS = [
    [130.81, 164.81, 196.00, 246.94],
    [110.00, 130.81, 164.81, 196.00],
    [87.31, 110.00, 130.81, 164.81],
    [98.00, 123.47, 146.83, 164.81],
]
BELL_NOTES = [523.25, 587.33, 659.26, 783.99, 880.00, 1046.50]


def _add_pure(samples, freq, start, dur, amp, partials, decay):
    """Ajout d'une note (Python pur — fallback sans numpy)."""
    i0 = int(round(start * SR))
    if i0 >= N:
        return
    skip = 0
    if i0 < 0:
        skip = -i0
        i0 = 0
    n = min(int(dur * SR) - skip, N - i0)
    edge = 1.2
    sin = math.sin
    exp = math.exp
    cos = math.cos
    for i in range(n):
        idx = i0 + i
        t = (skip + i) / SR
        if decay is None:
            a = min(1.0, t / edge)
            b = min(1.0, (dur - t) / edge)
            env = 0.5 - 0.5 * cos(math.pi * min(a, b))
        else:
            env = exp(-t / decay) * min(1.0, t / 0.02)
        s = 0.0
        for m, pa in partials:
            s += pa * sin(2 * math.pi * freq * m * t)
        samples[idx] += amp * env * s


def build():
    if np is not None:
        samples = np.zeros(N)
        t = np.arange(N) / SR

        def add_np(freq, start, dur, amp, partials, decay):
            i0 = int(round(start * SR))
            if i0 >= N:
                return
            skip = 0
            if i0 < 0:
                skip = -i0
                i0 = 0
            n = min(int(dur * SR) - skip, N - i0)
            if n <= 0:
                return
            tt = t[i0:i0 + n] + skip / SR
            if decay is None:
                edge = 1.2
                env = np.minimum(1.0, np.minimum(tt, dur - tt) / edge)
                env = 0.5 - 0.5 * np.cos(math.pi * np.clip(env, 0.0, 1.0))
            else:
                env = np.exp(-tt / decay) * np.minimum(1.0, tt / 0.02)
            s = np.zeros(n)
            for m, pa in partials:
                s += pa * np.sin(2 * math.pi * freq * m * tt)
            samples[i0:i0 + n] += amp * env * s

        # 1) Nappes d'accords (chevauchement léger pour transition continue)
        seg = DUR / len(CHORDS)
        for ci, chord in enumerate(CHORDS):
            for f in chord:
                add_np(f, ci * seg - 0.001, seg + 0.002, 0.10,
                       ((1, 1.0), (2, 0.28), (3, 0.10)), None)

        # 2) Cloches cristallines éparses (déterministe)
        random.seed(20260614)
        bell_t = 1.5
        while bell_t < DUR - 3:
            f = random.choice(BELL_NOTES)
            add_np(f, bell_t, 4.0, random.uniform(0.025, 0.05),
                   ((1, 1.0), (2, 0.15)), 1.6)
            bell_t += random.uniform(2.2, 4.0)

        # 3) Courts fondus anti-clic + normalisation
        fade = int(0.4 * SR)
        ramp = np.linspace(0.0, 1.0, fade)
        samples[:fade] *= ramp
        samples[-fade:] *= ramp[::-1]
        peak = max(1e-9, float(np.max(np.abs(samples))))
        data = samples * (0.55 / peak)
        return data
    # ----- Fallback Python pur -----
    samples = [0.0] * N
    seg = DUR / len(CHORDS)
    for ci, chord in enumerate(CHORDS):
        for f in chord:
            _add_pure(samples, f, ci * seg - 0.001, seg + 0.002, 0.10,
                      ((1, 1.0), (2, 0.28), (3, 0.10)), None)
    random.seed(20260614)
    bell_t = 1.5
    while bell_t < DUR - 3:
        f = random.choice(BELL_NOTES)
        _add_pure(samples, f, bell_t, 4.0, random.uniform(0.025, 0.05),
                  ((1, 1.0), (2, 0.15)), 1.6)
        bell_t += random.uniform(2.2, 4.0)
    fade = int(0.4 * SR)
    for i in range(fade):
        g = i / fade
        samples[i] *= g
        samples[N - 1 - i] *= g
    peak = max(1e-9, max(abs(s) for s in samples))
    return [s * (0.55 / peak) for s in samples]


def main():
    data = build()
    out = Path(__file__).resolve().parent.parent / 'assets' / 'audio' / 'song.wav'
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        if np is not None:
            frames = (np.clip(data, -1.0, 1.0) * 32767).astype('<i2').tobytes()
        else:
            frames = b''.join(
                struct.pack('<h', int(max(-1.0, min(1.0, s)) * 32767))
                for s in data
            )
        w.writeframes(frames)
    print('OK ->', out, f'({out.stat().st_size / 1024:.0f} Ko)')


if __name__ == '__main__':
    main()
