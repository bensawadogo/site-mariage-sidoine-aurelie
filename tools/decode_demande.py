# -*- coding: utf-8 -*-
"""Decode les photos de la demande en mariage (base64) -> WebP galerie."""
import base64
import io
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = r'c:\site-mariage-laurent-melissa\assets\images'

with open(os.path.join(HERE, '_demande_b64.txt')) as f:
    lignes = [l.strip() for l in f if l.strip().startswith('/9j/')]

print('photos base64 trouvees :', len(lignes))

for n, b64 in enumerate(lignes, 1):
    try:
        raw = base64.b64decode(b64)
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        w, h = im.size
        # Agrandissement x4 doux (LANCZOS) pour l'affichage dans la grille
        im2 = im.resize((w * 4, h * 4), Image.LANCZOS)
        out = os.path.join(BASE, 'demande-%d.webp' % n)
        im2.save(out, 'WEBP', quality=88, method=6)
        print('demande-%d.webp : %dx%d -> %dx%d, %d Ko' % (
            n, w, h, im2.size[0], im2.size[1], os.path.getsize(out) // 1024))
    except Exception as e:
        print('photo %d ERREUR : %s' % (n, e))
