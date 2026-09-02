(function () {
    'use strict';

    /* ===== HELPERS ===== */
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const format2 = (n) => (n < 10 ? '0' + n : '' + n);

    /* ===== SCREEN INTRO ===== */
    const screenIntro = $('#screenIntro');
    const introEnter = $('#introEnter');
    const musicBtn = $('#musicBtn');
    const audio = new Audio('assets/audio/song.mp3');
    audio.loop = true;
    audio.volume = 0.4;

    if (introEnter && screenIntro) {
        introEnter.addEventListener('click', () => {
            screenIntro.classList.add('hidden');
            document.body.style.overflow = 'auto';
        });
        // Prevent scroll while intro visible
        document.body.style.overflow = 'hidden';
    }

    musicBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => {});
            musicBtn.classList.add('playing');
        } else {
            audio.pause();
            musicBtn.classList.remove('playing');
        }
    });

    /* ===== NAV SCROLL ===== */
    const nav = $('#siteNav');
    const navToggle = $('#navToggle');
    const mobileMenu = $('#mobileMenu');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    navToggle.addEventListener('click', () => {
        const open = mobileMenu.classList.toggle('open');
        navToggle.classList.toggle('active', open);
    });

    $$('#mobileMenu a').forEach(a =>
        a.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            navToggle.classList.remove('active');
        })
    );

    /* ===== REVEAL ON SCROLL ===== */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                revealObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => revealObserver.observe(el));

    /* ===== COUNTDOWN ===== */
    const countdown = document.querySelector('.countdown');
    if (countdown) {
        // Date du mariage — À MODIFIER
        const weddingDate = new Date('2026-06-14T15:00:00');
        const daysEl = $('#cd-days'), hoursEl = $('#cd-hours'),
              minsEl = $('#cd-mins'), secsEl = $('#cd-secs');

        function updateCountdown() {
            const diff = weddingDate.getTime() - Date.now();
            if (diff <= 0) {
                daysEl.textContent = '00'; hoursEl.textContent = '00';
                minsEl.textContent = '00'; secsEl.textContent = '00';
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            daysEl.textContent = format2(days);
            hoursEl.textContent = format2(hours);
            minsEl.textContent = format2(mins);
            secsEl.textContent = format2(secs);
        }
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    /* ===== GALLERY ===== */
    const galleryData = {
        'fiances': [
            { f: 'assets/images/placeholder1.jpg', alt: 'Fiançailles 1' },
            { f: 'assets/images/placeholder2.jpg', alt: 'Fiançailles 2' }
        ],
        'voyage': [
            { f: 'assets/images/placeholder3.jpg', alt: 'Voyage 1' },
            { f: 'assets/images/placeholder4.jpg', alt: 'Voyage 2' }
        ],
        'mariage': [
            { f: 'assets/images/placeholder5.jpg', alt: 'Mariage 1' },
            { f: 'assets/images/placeholder6.jpg', alt: 'Mariage 2' }
        ]
    };

    // ===== GALLERY RENDER + FILTER =====
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
            tile.innerHTML = `<img src="${t.f}" alt="${t.alt}" loading="lazy">`;
            tile.addEventListener('click', () => openLightbox(tile.querySelector('img')));
            galleryGrid.appendChild(tile);
        });
    }

    $$('.gfilter').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.gfilter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.f;
            renderGallery(currentFilter);
        });
    });

    // ===== GALLERY LIGHTBOX =====
    const lightbox = $('#lightbox');
    const lbImg = $('#lbImg');
    let currentTile = null;
    let galleryImages = [];

    function openLightbox(img) {
        lbImg.src = img.src;
        galleryImages = $$('#galleryGrid img');
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
    $('#lbPrev').addEventListener('click', () => navLightbox(-1));
    $('#lbNext').addEventListener('click', () => navLightbox(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navLightbox(-1);
        if (e.key === 'ArrowRight') navLightbox(1);
    });

    /* ===== UPLOAD BTN (placeformulaire) ===== */
    $('#uploadBtn').addEventListener('click', () => {
        alert('Le partage de photos sera bientôt disponible. Merci de scanner le QR code à la réception le jour du mariage !');
    });

    /* ===== RSVP ===== */
    const rsvpForm = $('#rsvpForm');
    const rsvpMsg = $('#rsvpMsg');
    rsvpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        rsvpMsg.textContent = 'Merci ! Votre réponse a bien été enregistrée. À très bientôt !';
        rsvpMsg.classList.add('ok');
        rsvpForm.reset();
    });

    /* ===== INIT GALLERY ===== */
    renderGallery('all');

    /* ═══════════════════════════════════════════════════
       GSAP SCROLL ANIMATIONS — IMMERSION
       ═══════════════════════════════════════════════════ */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        /* --- HERO PARALLAX on scroll --- */
        gsap.to('.hero-bg', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
        });
        gsap.to('.hero-content', {
            y: -120, opacity: 0.15, ease: 'none',
            scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: 1 }
        });

        /* --- COUNTDOWN SCALE IN --- */
        gsap.from('.countdown .cd-item', {
            y: 50, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: '.countdown-section', start: 'top 75%', toggleActions: 'play none none none' }
        });

        /* --- PARALLAX DIVIDERS --- */
        $$('.parallax-divider').forEach(pd => {
            const bg = pd.querySelector('.pd-bg');
            const texts = pd.querySelectorAll('.pd-text, .pd-center');
            gsap.to(bg, {
                yPercent: -20, ease: 'none',
                scrollTrigger: { trigger: pd, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
            });
            texts.forEach(el => {
                const spd = parseFloat(el.dataset.speed) || 0.5;
                gsap.from(el, {
                    y: 80 * spd, opacity: 0, duration: 1, ease: 'power2.out',
                    scrollTrigger: { trigger: pd, start: 'top 80%', toggleActions: 'play none none none' }
                });
            });
        });

        /* --- STORY NODES STAGGER --- */
        gsap.from('.story-node', {
            x: -40, opacity: 0, duration: 0.9, stagger: 0.2, ease: 'power2.out',
            scrollTrigger: { trigger: '.story-timeline', start: 'top 72%' }
        });

        /* --- STORY TIMELINE LINE DRAW --- */
        const timeline = document.querySelector('.story-timeline');
        if (timeline) {
            gsap.from('.story-timeline::before', {
                scaleY: 0, transformOrigin: 'top', ease: 'none',
                scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 30%', scrub: 1 }
            });
        }

        /* --- PROGRAM CARDS SLIDE UP --- */
        gsap.from('.program-card', {
            y: 80, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: '.program-grid', start: 'top 75%' }
        });

        /* --- VENUE SCALE IN --- */
        gsap.from('.venue-card', {
            scale: 0.9, opacity: 0, duration: 1, ease: 'power2.out',
            scrollTrigger: { trigger: '.venue-section', start: 'top 65%' }
        });

        /* --- GALLERY TILES STAGGER --- */
        $$('.gallery-tile').forEach((tile, i) => {
            gsap.from(tile, {
                y: 60, opacity: 0, duration: 0.7,
                delay: (i % 3) * 0.1,
                ease: 'power2.out',
                scrollTrigger: { trigger: tile, start: 'top 88%' }
            });
        });

        /* --- RSVP FORM REVEAL --- */
        gsap.from('.rsvp-form > *', {
            y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
            scrollTrigger: { trigger: '.rsvp-form', start: 'top 78%' }
        });

        /* --- NAV BACKGROUND SHIFT on section color change --- */
        ScrollTrigger.create({
            trigger: '.program-section',
            start: 'top 60%',
            onEnter: () => nav.classList.add('scrolled'),
            onLeaveBack: () => nav.classList.remove('scrolled')
        });

        /* --- SMOOTH SCROLL NAV --- */
        $$('.nav-links a, .mobile-menu a, .hero-cta a').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    gsap.to(window, { scrollTo: { y: href, offsetY: 60 }, duration: 1, ease: 'power3.inOut' });
                    mobileMenu.classList.remove('open');
                    navToggle.classList.remove('active');
                }
            });
        });

        /* --- SECTION COLOR TRANSITIONS (immersive) --- */
        $$('.section-pad').forEach(sec => {
            ScrollTrigger.create({
                trigger: sec,
                start: 'top 60%',
                end: 'bottom 40%',
                onEnter: () => sec.classList.add('sec-active'),
                onLeave: () => sec.classList.remove('sec-active'),
                onEnterBack: () => sec.classList.add('sec-active'),
                onLeaveBack: () => sec.classList.remove('sec-active')
            });
        });

    } // end GSAP

})();
