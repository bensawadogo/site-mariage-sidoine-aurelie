/* ═══════════════════════════════════════════════════
   ADMIN — Page de suivi des réponses RSVP
   Lit la même clé localStorage que js/main.js
   ═══════════════════════════════════════════════════ */
(function () {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const RSVP_KEY = 'lm_rsvps_v1';

    function loadRsvps() {
        try { return JSON.parse(localStorage.getItem(RSVP_KEY)) || []; }
        catch (_) { return []; }
    }

    function fmtDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch (_) { return iso || '—'; }
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
        });
    }

    function render() {
        const list = loadRsvps();
        const body = $('#adminBody');
        const empty = $('#adminEmpty');
        const stats = $('#adminStats');

        const oui = list.filter(function (r) { return r.reponse === 'oui'; });
        const non = list.filter(function (r) { return r.reponse !== 'oui'; });
        const invitesOui = oui.reduce(function (sum, r) { return sum + (parseInt(r.invites, 10) || 1); }, 0);

        stats.innerHTML =
            '<div class="stat-card"><span class="stat-num">' + list.length + '</span><span class="stat-label">Réponses</span></div>' +
            '<div class="stat-card"><span class="stat-num gold">' + invitesOui + '</span><span class="stat-label">Invités confirmés</span></div>' +
            '<div class="stat-card"><span class="stat-num">' + oui.length + '</span><span class="stat-label">Présences</span></div>' +
            '<div class="stat-card"><span class="stat-num">' + non.length + '</span><span class="stat-label">Déclinés</span></div>';

        if (!list.length) {
            body.innerHTML = '';
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';
        list.slice().sort(function (a, b) {
            return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
        }).forEach(function (r) {
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td class="admin-msg">' + esc(fmtDate(r.updatedAt || r.createdAt)) + '</td>' +
                '<td><strong>' + esc(r.nom) + '</strong></td>' +
                '<td>' + esc(r.invites) + '</td>' +
                '<td><span class="badge ' + (r.reponse === 'oui' ? 'badge-oui' : 'badge-non') + '">' +
                    (r.reponse === 'oui' ? 'Présent' : 'Absent') + '</span></td>' +
                '<td class="admin-msg">' + esc(r.message || '—') + '</td>';
            body.appendChild(tr);
        });
    }

    /* ===== EXPORT CSV (séparateur ; + BOM pour Excel FR) ===== */
    function exportCsv() {
        const list = loadRsvps();
        if (!list.length) { window.alert('Aucune réponse à exporter.'); return; }
        const rows = [['Date', 'Nom', 'Invités', 'Réponse', 'Message']];
        list.forEach(function (r) {
            rows.push([
                r.updatedAt || r.createdAt || '',
                r.nom,
                r.invites,
                r.reponse === 'oui' ? 'Présent' : 'Absent',
                r.message || ''
            ]);
        });
        const csv = '\uFEFF' + rows.map(function (row) {
            return row.map(function (cell) {
                const v = String(cell).replace(/"/g, '""');
                return /[";\n\r]/.test(v) ? '"' + v + '"' : v;
            }).join(';');
        }).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'rsvp-sidoine-aurelie.csv';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
    }

    /* ===== ACTIONS ===== */
    $('#exportCsv').addEventListener('click', exportCsv);
    $('#clearAll').addEventListener('click', function () {
        if (!loadRsvps().length) { window.alert('Aucune réponse à effacer.'); return; }
        if (window.confirm('Effacer définitivement toutes les réponses enregistrées sur cet appareil ?')) {
            localStorage.removeItem(RSVP_KEY);
            render();
        }
    });

    render();
})();