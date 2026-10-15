# Nhận dạng giọng nói (offline) file giọng Vbee để lấy mốc thời gian từng từ.
#   python -I -X utf8 vbee_transcribe.py <audio> <out.json> [model]
import json, sys
from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
name = sys.argv[3] if len(sys.argv) > 3 else 'medium'
model = WhisperModel(name, device='cpu', compute_type='int8')
# tự giải mã bằng ffmpeg (bản PyAV hiện tại không tương thích decode_audio của faster-whisper)
import subprocess, numpy as np, imageio_ffmpeg
raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error', '-i', audio, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
segs, info = model.transcribe(pcm, language='vi', word_timestamps=True, vad_filter=False, beam_size=5)
res = []
for s in segs:
    res.append({'a': round(s.start, 3), 'b': round(s.end, 3), 'text': s.text.strip(),
                'words': [{'t': round(w.start, 3), 'e': round(w.end, 3), 'w': w.word.strip()} for w in s.words]})
    print(f"{s.start:7.2f}-{s.end:7.2f}  {s.text.strip()}", flush=True)
json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
