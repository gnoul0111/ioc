import json, sys, wave, numpy as np
M = json.load(open(sys.argv[1], encoding='utf-8')); SR = 48000
out = np.zeros((int(M['duration'] * SR) + SR, 2))
for vid, v in M['voices'].items():
    with wave.open(f"{sys.argv[2]}/{vid}.wav") as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2) / 32768
    i = int(v['start'] * SR); out[i:i + len(a)] += a[:len(out) - i]
out = out[:int(M['duration'] * SR)]
with wave.open(sys.argv[3], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok')
