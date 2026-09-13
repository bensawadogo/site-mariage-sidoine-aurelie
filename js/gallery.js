(function () {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    /* ===== GALLERY DATA =====
       Photo officielle des fiançailles (convertie depuis la carte DOT-1).
       Les catégories « voyage » et « mariage » seront complétées après le jour J :
       ajoutez simplement vos images dans les tableaux correspondants. */
    const galleryData = {
        'demande': [
            { f: 'assets/images/demande-1.webp', alt: 'La demande en mariage — l\'instant du oui' },
            { f: 'assets/images/demande-2.webp', alt: 'La demande en mariage — souvenir 2' },
            { f: 'assets/images/demande-3.webp', alt: 'La demande en mariage — souvenir 3' },
            { f: 'assets/images/demande-4.webp', alt: 'La demande en mariage — souvenir 4' },
            { f: 'assets/images/demande-5.webp', alt: 'La demande en mariage — souvenir 5' }
        ],
        'fiances': [
            { f: 'assets/images/sidoine-aurelie-thumb.webp', full: 'assets/images/sidoine-aurelie.webp', alt: 'Sidoine & Aurélie — photo officielle des fiançailles' }
        ],
        'voyage': [],
        'mariage': [
            { f: 'assets/images/mariage-1.webp', full: 'assets/images/mariage-1-full.webp', alt: 'Sidoine et Aurélie en tenue traditionnelle' },
            { f: 'assets/images/mariage-2.webp', full: 'assets/images/mariage-2-full.webp', alt: 'Souvenir de la cérémonie de Sidoine et Aurélie' },
            { f: 'assets/images/mariage-3.webp', full: 'assets/images/mariage-3-full.webp', alt: 'Sidoine et Aurélie, souvenir du mariage' },
            { f: 'assets/images/mariage-4.webp', full: 'assets/images/mariage-4-full.webp', alt: 'Portrait de Sidoine et Aurélie en tenue de fête' },
            { f: 'assets/images/mariage-5.webp', full: 'assets/images/mariage-5-full.webp', alt: 'Moment de fête du mariage de Sidoine et Aurélie' },
            { f: 'assets/images/mariage-6.webp', full: 'assets/images/mariage-6-full.webp', alt: 'Souvenir de la célébration de Sidoine et Aurélie' }
        ]
    };

    const UPLOAD_KEY = 'lm_gallery_uploads_v1';
    const MAX_PHOTOS = 8;
    const MAX_FILE_SIZE = 12 * 1024 * 1024;
    const supabaseConfig = window.SUPABASE_CONFIG || {};
    const supabase = supabaseConfig.url && supabaseConfig.anonKey && window.supabase
        ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
        : null;

    function loadUploadedPhotos() {
        try {
            const saved = JSON.parse(localStorage.getItem(UPLOAD_KEY)) || [];
            return Array.isArray(saved) ? saved : [];
        } catch (_) {
            return [];
        }
    }

    function saveUploadedPhotos(photos) {
        try {
            localStorage.setItem(UPLOAD_KEY, JSON.stringify(photos));
            return true;
        } catch (_) {
            return false;
        }
    }

    let uploadedPhotos = loadUploadedPhotos();
    const officialMarriagePhotos = galleryData.mariage;
    galleryData.mariage = officialMarriagePhotos.concat(uploadedPhotos);

    async function loadRemotePhotos() {
        if (!supabase) return;
        const officialPhotos = galleryData.mariage.filter(photo => !photo.remote && !uploadedPhotos.includes(photo));
        const { data, error } = await supabase.storage.from(supabaseConfig.bucket).list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
        });
        if (error) throw error;
        const remotePhotos = (data || []).filter(file => file.name).map(file => ({
            f: supabase.storage.from(supabaseConfig.bucket).getPublicUrl(file.name).data.publicUrl,
            alt: 'Photo ajoutée par un invité',
            remote: true,
            path: file.name
        }));
        galleryData.mariage = officialPhotos.concat(remotePhotos, uploadedPhotos.filter(photo => !photo.remote));
    }

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
            const empty = document.createElement('div');
            empty.className = 'gallery-empty';
            empty.textContent = filter === 'mariage'
                ? 'Les photos ajoutées par les invités apparaîtront ici.'
                : 'Les photos de cette catégorie arriveront bientôt…';
            galleryGrid.appendChild(empty);
            return;
        }
        filtered.forEach(t => {
            const tile = document.createElement('div');
            tile.className = 'gallery-tile';
            tile.dataset.cat = t.cat;
            const image = document.createElement('img');
            image.src = t.f;
            image.dataset.full = t.full || t.f;
            image.alt = t.alt || 'Photo ajoutée par un invité';
            image.loading = 'lazy';
            image.decoding = 'async';
            tile.appendChild(image);
            tile.addEventListener('click', function() { openLightbox(image); });
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
        lbImg.src = img.dataset.full || img.src;
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
        lbImg.src = galleryImages[currentTile].dataset.full || galleryImages[currentTile].src;
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
    const uploadBtn = $('#uploadBtn');
    const photoInput = $('#photoInput');
    const uploadPanel = $('#uploadPanel');
    const uploadPreview = $('#uploadPreview');
    const uploadStatus = $('#uploadStatus');
    const uploadDropzone = $('#uploadDropzone');
    const uploadNote = $('.upload-note');
    const sharePhotosBtn = $('#sharePhotosBtn');

    if (supabase && uploadNote) {
        uploadNote.textContent = 'Elles seront visibles par tous les invités.';
    }

    function showUploadStatus(message, isError) {
        uploadStatus.textContent = message;
        uploadStatus.classList.toggle('error', Boolean(isError));
    }

    function getUploadErrorMessage(error) {
        const message = String(error && error.message ? error.message : error || '');
        if (message.toLowerCase().includes('bucket not found')) {
            return 'Le stockage photo n’est pas encore configuré. Créez le bucket public « wedding-photos » dans Supabase.';
        }
        if (message.toLowerCase().includes('row-level security') || message.toLowerCase().includes('not authorized')) {
            return 'Supabase refuse l’envoi. Vérifiez la politique INSERT du bucket « wedding-photos ».';
        }
        return 'Envoi impossible. Vérifiez la configuration Supabase Storage.';
    }

    function refreshUploadPreview() {
        uploadPreview.innerHTML = '';
        uploadedPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'upload-preview-item';
            const image = document.createElement('img');
            image.src = photo.f;
            image.alt = photo.alt;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'upload-remove';
            remove.textContent = '×';
            remove.setAttribute('aria-label', 'Supprimer cette photo');
            remove.addEventListener('click', function() {
                uploadedPhotos.splice(index, 1);
                galleryData.mariage = uploadedPhotos;
                saveUploadedPhotos(uploadedPhotos);
                refreshUploadPreview();
                renderGallery(currentFilter);
                showUploadStatus('Photo supprimée de cet appareil.', false);
            });
            item.append(image, remove);
            uploadPreview.appendChild(item);
        });
    }

    function readPhoto(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject('Seules les images sont acceptées.');
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                reject('Chaque photo doit faire moins de 12 Mo.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve({
                f: reader.result,
                alt: 'Photo ajoutée par un invité'
            });
            reader.onerror = () => reject('Impossible de lire cette photo.');
            reader.readAsDataURL(file);
        });
    }

    async function uploadToSupabase(file) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-');
        const path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + safeName;
        const { error } = await supabase.storage.from(supabaseConfig.bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        });
        if (error) throw error;
        return {
            f: supabase.storage.from(supabaseConfig.bucket).getPublicUrl(path).data.publicUrl,
            alt: 'Photo ajoutée par un invité',
            remote: true,
            path: path
        };
    }

    uploadBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        showUploadStatus('Sélectionnez une ou plusieurs photos dans votre galerie.', false);
        photoInput.click();
    });

    sharePhotosBtn.addEventListener('click', function(event) {
        event.preventDefault();
        uploadDropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showUploadStatus('Sélectionnez une ou plusieurs photos dans votre galerie.', false);
        photoInput.click();
    });

    async function handleSelectedFiles(files) {
        files = Array.from(files || []);
        if (!files.length) return;
        const remaining = MAX_PHOTOS - uploadedPhotos.length;
        if (remaining <= 0) {
            showUploadStatus('Vous avez atteint la limite de 8 photos sur cet appareil.', true);
            photoInput.value = '';
            return;
        }
        const selected = files.slice(0, remaining);
        const results = await Promise.allSettled(selected.map(file => supabase ? uploadToSupabase(file) : readPhoto(file)));
        const validPhotos = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
        if (supabase) {
            galleryData.mariage = galleryData.mariage.concat(validPhotos);
        } else {
            uploadedPhotos = uploadedPhotos.concat(validPhotos);
            galleryData.mariage = uploadedPhotos;
        }
        if (!supabase && !saveUploadedPhotos(uploadedPhotos)) {
            showUploadStatus('Le navigateur ne peut pas conserver ces photos. Essayez avec moins de fichiers.', true);
        } else {
            const visibility = supabase ? 'pour tous les invités.' : 'sur cet appareil.';
            showUploadStatus(validPhotos.length + ' photo' + (validPhotos.length > 1 ? 's ajoutées' : ' ajoutée') + ' à la galerie ' + visibility, false);
        }
        if (errors.length) showUploadStatus(getUploadErrorMessage(errors[0]), true);
        refreshUploadPreview();
        renderGallery(currentFilter);
        photoInput.value = '';
    }

    photoInput.addEventListener('change', function() {
        handleSelectedFiles(photoInput.files).catch(function(error) {
            console.error('Photo upload error:', error);
            showUploadStatus(getUploadErrorMessage(error), true);
        });
    });

    uploadDropzone.addEventListener('click', function() {
        photoInput.click();
    });
    ['dragenter', 'dragover'].forEach(function(eventName) {
        uploadDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            uploadDropzone.classList.add('is-dragging');
        });
    });
    ['dragleave', 'drop'].forEach(function(eventName) {
        uploadDropzone.addEventListener(eventName, function(event) {
            event.preventDefault();
            uploadDropzone.classList.remove('is-dragging');
        });
    });
    uploadDropzone.addEventListener('drop', function(event) {
        handleSelectedFiles(event.dataTransfer.files);
    });

    if (uploadedPhotos.length || supabase) {
        refreshUploadPreview();
    }

    /* ===== INIT ===== */
    renderGallery('all');

    if (supabase) {
        loadRemotePhotos().then(function() {
            renderGallery(currentFilter);
            refreshUploadPreview();
            showUploadStatus('Galerie partagée activée.', false);
        }).catch(function(error) {
            console.error('Supabase gallery error:', error);
            showUploadStatus('Galerie partagée indisponible. Vérifiez la configuration Supabase.', true);
        });
    }

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
