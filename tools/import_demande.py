# -*- coding: utf-8 -*-
"""Importe les VRAIES photos HD de la demande en mariage.
Déposez les photos (JPG/PNG) dans :  C:\\Users\\sawad\\OneDrive\\Desktop\\photos-demande
Puis lancez :  python tools/import_demande.py
Elles sont converties en WebP et remplacent demande-1.webp, demande-2.webp, ..."""
import os

from PIL import Image, ImageOps

SRC = r'C:\Users\sawad\OneDrive\Desktop\photos-demande'
OUT = r'c:\site-mariage-laurent-melissa\assets\images'
MAX_SIDE = 1600  # qualité Web suffisante, fichiers légers

if not os.path.isdir(SRC):
    raise SystemExit('Dossier source introuvable : ' + SRC)

files = sorted(
    f for f in os.listdir(SRC)
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
)
if not files:
    raise SystemExit('Aucune photo trouvée dans ' + SRC + ' — déposez vos JPG/PNG d\'abord.')

print('%d photo(s) trouvée(s) :' % len(files))
for i, name in enumerate(files, 1):
    src = os.path.join(SRC, name)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im).convert('RGB')
    w, h = im.size
    if max(w, h) > MAX_SIDE:
        r = MAX_SIDE / max(w, h)
        im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
    out = os.path.join(OUT, 'demande-%d.webp' % i)
    im.save(out, 'WEBP', quality=85, method=6)
    print('  %s (%dx%d) -> demande-%d.webp (%dx%d, %d Ko)' % (
        name, w, h, i, im.size[0], im.size[1], os.path.getsize(out) // 1024))

print('\nOK. Si le nombre de photos diffère de 5, mettez à jour la liste')
print('\'demande\' dans js/gallery.js en conséquence.')
