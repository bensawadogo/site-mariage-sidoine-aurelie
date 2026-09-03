"""Vérifie que chaque ID référencé dans le JS existe bien dans la page HTML associée.

Usage :  python tools/check_ids.py
"""
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
PAGES = {
    'js/main.js': ['index.html'],
    'js/gallery.js': ['galerie.html'],
    'js/admin.js': ['admin.html'],
}

ok = True
for js_file, html_files in PAGES.items():
    js_text = (BASE / js_file).read_text(encoding='utf-8')
    ids = set(re.findall(r"\$\('#([A-Za-z0-9_-]+)'", js_text))
    ids |= set(re.findall(r"getElementById\('([A-Za-z0-9_-]+)'\)", js_text))
    html_text = ''.join((BASE / h).read_text(encoding='utf-8') for h in html_files)
    missing = sorted(i for i in ids if f'id="{i}"' not in html_text)
    status = 'OK' if not missing else f'MANQUANTS: {missing}'
    print(f'{js_file} ({len(ids)} IDs) -> {status}')
    ok = ok and not missing

print('ALL IDS OK' if ok else 'ERREUR: IDs manquants')
raise SystemExit(0 if ok else 1)
