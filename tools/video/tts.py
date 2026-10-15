# Sinh giọng đọc từng câu bằng Edge-TTS (giọng nữ HoaiMy) + mốc thời gian từng từ để làm phụ đề.
# python -I -X utf8 tts.py <lines.json> <outdir>
#   lines.json: [{"id": "c2", "text": "..."}, ...]
#   Ra: <outdir>/<id>.mp3, <outdir>/<id>.wav, <outdir>/timing.json  ({id: {text, dur, words:[{t, d, w}]}})
# Dịch vụ Edge-TTS hay từ chối (NoAudioReceived) các lần gọi sau trong CÙNG một tiến trình, nên mỗi lần chạy
# script chỉ tạo 1 câu còn thiếu rồi thoát (mã 2 = còn câu thiếu); tts.ps1 gọi lặp lại tới khi đủ.
# Câu đã có trong timing.json với đúng nội dung thì bỏ qua.
import asyncio, json, os, subprocess, sys, wave
import edge_tts
import imageio_ffmpeg

VOICE = 'vi-VN-HoaiMyNeural'
RATE = '-5%'
SAY = {'IOC': 'Ai Ô Xi'}
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


async def synth(text, mp3_path):
    # Edge-TTS trả về rỗng khi câu có dấu gạch ngang "–"/"-" đứng riêng -> đọc thành dấu phẩy
    spoken = text.replace(' – ', ', ').replace(' - ', ', ')
    # đọc tên viết tắt kiểu tiếng Anh (phụ đề vẫn giữ chữ gốc)
    for k, v in SAY.items(): spoken = spoken.replace(k, v)
    com = edge_tts.Communicate(spoken, VOICE, rate=RATE, boundary='WordBoundary')
    words = []
    with open(mp3_path, 'wb') as f:
        async for chunk in com.stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                words.append({'t': chunk['offset'] / 1e7, 'd': chunk['duration'] / 1e7, 'w': chunk['text']})
    return words


async def main(lines_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    lines = json.load(open(lines_path, encoding='utf-8-sig'))
    tpath = os.path.join(outdir, 'timing.json')
    timing = json.load(open(tpath, encoding='utf-8-sig')) if os.path.exists(tpath) else {}
    missing = [ln for ln in lines if timing.get(ln['id'], {}).get('text') != ln['text'] or timing.get(ln['id'], {}).get('say') != SAY]
    if not missing:
        print('Đủ giọng cho', len(lines), 'câu')
        return 0
    ln = missing[0]
    mp3 = os.path.join(outdir, ln['id'] + '.mp3')
    wav = os.path.join(outdir, ln['id'] + '.wav')
    try:
        words = await synth(ln['text'], mp3)
    except edge_tts.exceptions.NoAudioReceived:
        print(f"  {ln['id']}: bị từ chối")
        return 2
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', mp3, '-ar', '48000', '-ac', '2', wav], check=True)
    with wave.open(wav) as w:
        dur = w.getnframes() / w.getframerate()
    timing[ln['id']] = {'text': ln['text'], 'say': SAY, 'dur': round(dur, 3), 'words': words}
    json.dump(timing, open(tpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"{ln['id']}: {dur:.2f}s, {len(words)} từ")
    return 2 if len(missing) > 1 else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main(sys.argv[1], sys.argv[2])))


