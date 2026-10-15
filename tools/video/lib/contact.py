import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = sys.argv[2]
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
W, H, cols = 640, 360, 4
rows = (len(files)+cols-1)//cols
sheet = Image.new('RGB', (W*cols, (H+22)*rows), 'white')
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(d, f)).convert('RGB').resize((W, H))
    x, y = (i%cols)*W, (i//cols)*(H+22)
    sheet.paste(im, (x, y+22)); dr.text((x+6, y+5), f, fill='black')
sheet.save(out)
