(function () {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    /* ===== GALLERY DATA =====
       Photo officielle des fiançailles (convertie depuis la carte DOT-1).
       Les catégories « voyage » et « mariage » seront complétées après le jour J :
       ajoutez simplement vos images dans les tableaux correspondants. */
    const galleryData = {
        'fiances': [
            { f: 'assets/images/carte-principale.jpg', alt: 'Laurent & Mélissa — photo officielle des fiançailles' }
        ],
        'voyage': [],
        'mariage': []
    };

    /* ===== GALLERY RENDER + FILTER ===== */
    const galleryGrid = $('#galleryGrid');
    const galleryEmpty = $('#galleryEmpty');
    let currentFilter = 'all';

    function renderGallery(filter) {
        galleryGrid.innerHTML = '';
        const tiles = [];
        Object.keys(galleryData).forEach(cat => {
            galleryData[cat].forEach(img => {
                tiles.push({ cat, ...img });
            });
        });
        const filtered = filter === 'all' ? tiles : tiles.filter(t => t.cat === filter);

        if (!filtered.length) {
            galleryEmpty.style.display = 'block';
            return;
        }
        galleryEmpty.style.display = 'none';
        filtered.forEach(t => {
            const tile = document.createElement('div');
            tile.className = 'gallery-tile';
            tile.dataset.cat = t.cat;
            tile.innerHTML = '<img src="' + t.f + '" alt="' + t.alt + '" loading="lazy">';
            tile.addEventListener('click', function() { openLightbox(tile.querySelector('img')); });
            galleryGrid.appendChild(tile);
        });
    }

    $$('.gfilter').forEach(function(btn) {
        btn.addEventListener('click', function() {
            $$('.gfilter').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.dataset.f;
            renderGallery(currentFilter);
        });
    });

    /* ===== LIGHTBOX ===== */
    const lightbox = $('#lightbox');
    const lbImg = $('#lbImg');
    let currentTile = 0;
    let galleryImages = [];

    function openLightbox(img) {
        lbImg.src = img.src;
        galleryImages = $$('#galleryGrid .gallery-tile img');
        currentTile = galleryImages.indexOf(img);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }
    function navLightbox(dir) {
        if (!galleryImages.length) return;
        currentTile = (currentTile + dir + galleryImages.length) % galleryImages.length;
        lbImg.src = galleryImages[currentTile].src;
    }

    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', function() { navLightbox(-1); });
    $('#lbNext').addEventListener('click', function() { navLightbox(1); });
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navLightbox(-1);
        if (e.key === 'ArrowRight') navLightbox(1);
    });

    /* ===== UPLOAD ===== */
    $('#uploadBtn').addEventListener('click', function() {
        alert('Le partage de photos sera bientôt disponible. Merci de scanner le QR code à la réception le jour du mariage !');
    });

    /* ===== INIT ===== */
    renderGallery('all');

    /* ===== GSAP REVEAL on gallery page ===== */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        $$('.reveal').forEach(function(el) {
            gsap.from(el, {
                y: 40, opacity: 0, duration: 0.8, ease: 'power2.out',
                scrollTrigger: { trigger: el, start: 'top 90%' }
            });
        });
        $$('.gallery-tile').forEach(function(tile, i) {
            gsap.from(tile, {
                y: 60, opacity: 0, duration: 0.7,
                delay: (i % 4) * 0.08,
                ease: 'power2.out',
                scrollTrigger: { trigger: tile, start: 'top 92%' }
            });
        });
    }

})();
