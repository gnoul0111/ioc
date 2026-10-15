import json, sys
m = json.load(open(sys.argv[1], encoding='utf-8'))
def ts(x):
    h, r = divmod(x, 3600); mi, s = divmod(r, 60)
    return f"{int(h):02d}:{int(mi):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    for i, c in enumerate(m['cues'], 1):
        f.write(f"{i}\n{ts(c['a'])} --> {ts(c['b'])}\n{c['text']}\n\n")
print(len(m['cues']), 'cues')
