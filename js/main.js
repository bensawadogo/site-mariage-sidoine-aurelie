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

    /* Musique du mariage : le bouton reste disponible sur mobile, même avant le chargement. */
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.4;
    audio.preload = 'auto';
    const MUSIC_SOURCES = ['assets/audio/emma-c-est-toi-d-abord.mp3'];
    let musicIndex = 0;
    let musicReady = false;

    function tryLoadMusic() {
        if (musicIndex >= MUSIC_SOURCES.length) return; // aucune piste disponible
        audio.src = MUSIC_SOURCES[musicIndex];
        audio.load();
        if (musicBtn) musicBtn.classList.add('show');
    }
    audio.addEventListener('canplaythrough', () => {
        if (!musicReady && musicBtn) musicBtn.classList.add('show');
        musicReady = true;
    });
    audio.addEventListener('error', () => {
        musicIndex += 1;
        tryLoadMusic();
    });
    tryLoadMusic();

    function dismissIntro() {
        if (!screenIntro) return;
            screenIntro.classList.add('hidden');
            document.body.style.overflow = 'auto';
            // Recalcule les positions des animations au scroll (intro = scroll verrouillé)
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    if (introEnter && screenIntro) {
        introEnter.addEventListener('click', dismissIntro);
        // Prevent scroll while intro visible
        document.body.style.overflow = 'hidden';
    }

    // Les liens restent utilisables même si l'invité passe directement à une section.
    if (screenIntro) {
        $$('a').forEach(link => link.addEventListener('click', dismissIntro));
    }

    if (musicBtn) {
        musicBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().then(() => musicBtn.classList.add('playing')).catch(() => {
                    musicBtn.classList.remove('playing');
                });
            } else {
                audio.pause();
                musicBtn.classList.remove('playing');
            }
        });
    }

    /* ===== NAV SCROLL ===== */
    /* La navbar complète a été retirée : #navToggle / #mobileMenu n'existent plus.
       On ne garde que le fond de la mini-nav au scroll (avec garde-fou si absente). */
    const nav = $('#siteNav');

    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 60);
        }, { passive: true });
    }

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

    /* ===== FILET DE SÉCURITÉ RÉVÉLATION =====
       Garantit qu'aucune section ne reste bloquée en opacity:0 si l'observer
       ou une animation échoue : tout élément .reveal atteint par le scroll
       (ou après 2,5 s) est forcé à l'état visible. */
    const forceReveal = () => {
        const limit = window.innerHeight + 200;
        $$('.reveal:not(.in)').forEach(el => {
            if (el.getBoundingClientRect().top < limit) el.classList.add('in');
        });
    };
    window.addEventListener('scroll', forceReveal, { passive: true });
    window.addEventListener('resize', forceReveal, { passive: true });
    setTimeout(forceReveal, 2500);

    /* ===== COUNTDOWN ===== */
    const countdown = document.querySelector('.countdown');
    if (countdown) {
        // Date de la cérémonie de la dote — 26 septembre 2026 (voir faire-part)
        const weddingDate = new Date('2026-09-26T15:00:00');
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

    /* ===== RSVP (avec sauvegarde locale) =====
       Les réponses sont enregistrées dans le navigateur du visiteur (localStorage),
       puis consultables depuis la page discrète admin.html (statistiques + export CSV).
       NB : le stockage est local à chaque appareil — voir README.md pour les limites
       et les options de collecte centralisée. */
    const RSVP_KEY = 'lm_rsvps_v1';
    const rsvpForm = $('#rsvpForm');
    const rsvpMsg = $('#rsvpMsg');

    function loadRsvps() {
        try { return JSON.parse(localStorage.getItem(RSVP_KEY)) || []; }
        catch (_) { return []; }
    }
    function saveRsvps(list) {
        try { localStorage.setItem(RSVP_KEY, JSON.stringify(list)); return true; }
        catch (_) { return false; }
    }

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = new FormData(rsvpForm);
            const nom = String(data.get('nom') || '').trim();
            const invites = parseInt(data.get('invites'), 10) || 1;
            const reponse = String(data.get('reponse') || '');
            const message = String(data.get('message') || '').trim();

            if (!nom || !reponse) {
                rsvpMsg.textContent = 'Merci de renseigner votre nom et votre réponse.';
                rsvpMsg.classList.add('err');
                rsvpMsg.classList.remove('ok');
                return;
            }

            const list = loadRsvps();
            const key = nom.toLowerCase();
            const existing = list.find(r => r.nom.toLowerCase() === key);

            if (existing) {
                // Mise à jour silencieuse — pas de doublon
                existing.invites = invites;
                existing.reponse = reponse;
                existing.message = message;
                existing.updatedAt = new Date().toISOString();
                const saved = saveRsvps(list);
                rsvpMsg.textContent = saved
                    ? 'Merci ' + nom + ' ! Nous avons mis à jour votre réponse. À très bientôt !'
                    : 'Impossible d\u2019enregistrer la réponse (stockage du navigateur indisponible).';
            } else {
                list.push({
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
                    nom: nom,
                    invites: invites,
                    reponse: reponse,
                    message: message,
                    createdAt: new Date().toISOString()
                });
                const saved = saveRsvps(list);
                rsvpMsg.textContent = saved
                    ? (reponse === 'oui'
                        ? 'Merci ' + nom + ' ! Votre présence pour ' + invites + ' invité' + (invites > 1 ? 's' : '') + ' est bien enregistrée. À très bientôt !'
                        : 'Merci ' + nom + ' ! Votre réponse a bien été enregistrée. Vous serez dans nos pensées !')
                    : 'Impossible d\u2019enregistrer la réponse (stockage du navigateur indisponible).';
            }
            rsvpMsg.classList.add('ok');
            rsvpMsg.classList.remove('err');
            rsvpForm.reset();
        });
    }

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

        /* --- COMPTEUR / PROGRAMME / RSVP : animés par le système .reveal
              (IntersectionObserver + filet forceReveal). Les gsap.from ici
              posaient un style inline opacity:0 qui écrasait .reveal.in. */

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

        /* --- PROGRAMME / RSVP : voir note plus haut (système .reveal uniquement). */

        /* --- VENUE : animé par le système .reveal (IntersectionObserver) —
              pas de gsap.from ici : le style inline opacity:0 de GSAP écrasait
              .reveal.in et laissait la carte invisible définitivement. */

        /* --- GALLERY TILES STAGGER --- */
        $$('.gallery-tile').forEach((tile, i) => {
            gsap.from(tile, {
                y: 60, opacity: 0, duration: 0.7,
                delay: (i % 3) * 0.1,
                ease: 'power2.out',
                scrollTrigger: { trigger: tile, start: 'top 88%' }
            });
        });

        /* --- NAV BACKGROUND SHIFT on section color change --- */
        if (nav) {
            ScrollTrigger.create({
                trigger: '.program-section',
                start: 'top 60%',
                onEnter: () => nav.classList.add('scrolled'),
                onLeaveBack: () => nav.classList.remove('scrolled')
            });
        }

    } // end GSAP

})();
