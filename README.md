# 💍 Site de dote — Sidoine & Aurélie

Site statique (HTML/CSS/JS + GSAP) pour la cérémonie traditionnelle (dote) de
**Sidoine & Aurélie — samedi 26 septembre 2026, Cocody Angré (Abidjan)**.
Thème « élégance classique » navy / ivoire / or.

## 📂 Structure

```
├── index.html          # Page principale (intro, hero, compte à rebours, histoire,
│                       #   programme, lieu + carte, RSVP)
├── galerie.html        # Galerie photo (filtres, lightbox, QR de partage)
├── admin.html          # Page discrète de suivi des réponses RSVP (non indexée)
├── css/style.css       # Tous les styles
├── js/main.js          # Intro, musique, compte à rebours, RSVP, animations GSAP
├── js/gallery.js       # Galerie, lightbox, filtres
├── js/admin.js         # Statistiques, tableau, export CSV des réponses
├── assets/images/      # Photos WebP (sidoine-aurelie.webp, faire-part-dote.webp)
├── assets/faire-part-dote.pdf # Faire-part officiel de la dote (téléchargeable)
├── assets/audio/       # Musique d'ambiance
└── tools/generate_ambient.py  # Régénère l'ambiance WAV (optionnel)
```

## ✨ Fonctionnalités

- **RSVP avec sauvegarde** : chaque réponse est enregistrée dans le navigateur de
  l'invité (`localStorage`, clé `lm_rsvps_v1`), avec anti-doublons (une seconde
  réponse du même nom **met à jour** la première) et message de confirmation personnalisé.
- **Page admin** (`admin.html`, non liée depuis le site et `noindex`) : statistiques
  (réponses, invités confirmés, présences, déclinés), tableau des réponses,
  **export CSV** (compatible Excel FR) et effacement.
- **Musique d'ambiance** : bouton flottant ; le site essaie `assets/audio/song.mp3`
  (votre vrai morceau) puis retombe sur `assets/audio/song.wav` (boucle d'ambiance
  générée). Le bouton n'apparaît que si une piste est réellement chargée.
- **Carte interactive** : carte OpenStreetMap intégrée dans la section « Le Lieu »
  (sans clé API) + bouton Google Maps.
- **Faire-part intégré** : la carte officielle de la dote est affichée dans la section
  « Le Faire-part » de la page d'accueil, avec téléchargement PDF (page + pied de page).

## ▶️ Lancer le site en local

Aucun build nécessaire. Ouvrez simplement `index.html`, ou mieux :

```bash
python -m http.server 5500
# puis http://localhost:5500
```

## ⚠️ Limites du RSVP local & alternatives

Le `localStorage` est **propre à chaque appareil** : la page `admin.html` d'un
ordinateur ne voit pas les réponses saisies sur le téléphone d'un invité.
Pour une collecte centralisée sans serveur, remplacez l'enregistrement local par :

- **Formspree** (https://formspree.io) — formulaire hébergé, réponses par e-mail ;
- **Google Forms** — réponses dans Google Sheets ;
- un petit backend (Firebase, Supabase, Netlify Forms, Vercel Functions…).

## 🎵 Remplacer la musique

Déposez votre morceau ici : `assets/audio/song.mp3` (il sera utilisé en priorité).
Pour régénérer l'ambiance WAV : `python tools/generate_ambient.py`.

## 🖼️ Photos & faire-part

- **Photo principale** (fond du hero) et galerie : `assets/images/sidoine-aurelie.webp`
  (1938×1938, WebP qualité 88), convertie en 300 DPI depuis `Carte DOT-1.pdf`
  (conservé en dehors du dépôt).
- **Faire-part de la dote** : `assets/images/faire-part-dote.webp` (1938×1938, 300 DPI)
  affiché dans la section « Le Faire-part », et `assets/faire-part-dote.pdf` téléchargeable.
  Contenu : familles Téhua & Yameogo · dote de Sidoine & Aurélie · 26/09/2026 · repas à Cocody Angré.
- Les anciens placeholders ont été supprimés. Pour ajouter de nouvelles photos, déposez-les dans
  `assets/images/` et complétez `galleryData` dans `js/gallery.js` (catégories « voyage » et
  « mariage » actuellement vides).

## 🚀 Déploiement

Site 100 % statique : GitHub Pages, Netlify, Vercel ou Cloudflare Pages fonctionnent
sans configuration.
