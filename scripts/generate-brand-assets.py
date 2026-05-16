#!/usr/bin/env python3
"""
generate-brand-assets.py — KOLOR Studio (Iter 185)
Regenerates all brand assets in one command.
Usage: python3 scripts/generate-brand-assets.py
"""
import sys, pathlib

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'Pillow',
                    '--break-system-packages', '-q'])
    from PIL import Image, ImageDraw, ImageFont

ROOT  = pathlib.Path(__file__).parent.parent
PUB   = ROOT / 'frontend' / 'public'
MARK  = PUB / 'kolor-mark.png'
BRAND = (108, 46, 219)

def white_mark(size):
    raw = Image.open(MARK).convert('RGBA')
    raw = raw.resize((size, size), Image.LANCZOS)
    r, g, b, a = raw.split()
    w = Image.merge('RGBA', (
        Image.new('L', (size,size), 255),
        Image.new('L', (size,size), 255),
        Image.new('L', (size,size), 255), a))
    bg = Image.new('RGBA', (size,size), (*BRAND,255))
    return Image.alpha_composite(bg, w)

def make_favicon(size, name):
    img = Image.new('RGBA', (size,size), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0,0,size-1,size-1],
        radius=max(2,int(size*0.22)), fill=(*BRAND,255))
    ms = int(size*0.76)
    mark = white_mark(ms)
    off = (size-ms)//2
    img.paste(mark, (off,off), mark)
    out = PUB/name
    img.save(str(out),'PNG',optimize=True)
    sz = out.stat().st_size
    # Sample known white K-stroke positions; OK if any pixel is white.
    # Geometry of the K mark within the violet container isn't a perfect SVG copy,
    # so we probe several candidate positions and accept if any is white.
    candidates = [(0.32, 0.35), (0.45, 0.30), (0.62, 0.30), (0.45, 0.70), (0.32, 0.65)]
    ok = 'CHECK'
    for rx, ry in candidates:
        x = max(0, min(size-1, int(size*rx)))
        y = max(0, min(size-1, int(size*ry)))
        px_val = img.getpixel((x, y))
        if px_val[0] > 200 and px_val[1] > 200 and px_val[2] > 200:
            ok = 'OK'
            break
    print(f'  {name}: {sz}b [{ok}]')

def make_og():
    W,H = 1200,630
    img = Image.new('RGB',(W,H),(8,6,18))
    draw = ImageDraw.Draw(img)
    draw.rectangle([0,0,8,H], fill=BRAND)
    for i in range(150):
        t=i/150
        draw.rectangle([0,H-150+i,W,H-150+i+1],
            fill=(int(8+40*t),int(6+15*t),int(18+60*t)))
    # Container
    CS,CX,CY=120,48,48
    cimg=Image.new('RGBA',(CS,CS),(0,0,0,0))
    cd=ImageDraw.Draw(cimg)
    cd.rounded_rectangle([0,0,CS-1,CS-1],radius=26,fill=(*BRAND,255))
    ms=int(CS*0.76); mark=white_mark(ms); off=(CS-ms)//2
    cimg.paste(mark,(off,off),mark)
    img.paste(cimg.convert('RGB'),(CX,CY))
    try:
        B=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',72)
        Bs=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',30)
        N=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',30)
        Ns=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',18)
        Np=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',22)
        Nu=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',20)
    except Exception:
        B=Bs=N=Ns=Np=Nu=ImageFont.load_default()
    draw.text((CX,CY+CS+18),'KOLOR',font=Bs,fill=(255,255,255))
    draw.text((CX,CY+CS+56),'STUDIO',font=Ns,fill=(170,150,220))
    TX,TY=48,270
    draw.text((TX,TY),'The studio behind',font=B,fill=(200,190,235))
    draw.text((TX,TY+84),'your best work.',font=B,fill=(255,255,255))
    draw.text((TX,TY+180),'CRM for photographers, designers & fine artists.',font=N,fill=(165,150,210))
    feats=['Leads','Quotes','Contracts','Calendar']; px,py=TX,TY+238
    for f in feats:
        bb=draw.textbbox((0,0),f,font=Np); fw=bb[2]-bb[0]; pad=14
        draw.rounded_rectangle([px-pad,py-6,px+fw+pad,py+24],radius=9,
            fill=(50,24,100),outline=BRAND,width=2)
        draw.text((px,py),f,font=Np,fill=(167,139,250)); px+=fw+pad*2+12
    draw.text((TX,TY+298),'kolorstudio.app',font=Nu,fill=BRAND)
    # CTA pill — bottom right
    try:
        F_CTA = ImageFont.truetype(B, 24)
        cta = 'Start free  →'
        bb = draw.textbbox((0,0), cta, font=F_CTA)
        tw = bb[2]-bb[0]
        px2, py2 = 24, 12
        pw = tw+px2*2
        ph = bb[3]-bb[1]+py2*2
        cx = W-pw-48
        cy = H-ph-48
        draw.rounded_rectangle([cx,cy,cx+pw,cy+ph], radius=ph//2, fill=BRAND)
        draw.text((cx+px2, cy+py2-2), cta, font=F_CTA, fill=(255,255,255))
    except Exception as e:
        print('CTA pill warning:', e)
    out=PUB/'og-card.png'
    img.save(str(out),'PNG',optimize=True)
    sz=out.stat().st_size
    print(f'  og-card.png: {sz/1024:.1f}KB')
    assert sz>10000,f'Too small: {sz}'

print('Generating KOLOR brand assets...')
print('Favicons:')
make_favicon(16,'favicon-16.png')
make_favicon(32,'favicon-32.png')
make_favicon(180,'apple-touch-icon.png')
make_favicon(192,'favicon-192.png')
make_favicon(512,'favicon-512.png')
make_favicon(180,'favicon-mark.png')
print('OG card:')
make_og()
print('Done.')
