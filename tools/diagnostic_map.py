# -*- coding: utf-8 -*-
"""Diagnostic rendu reel de la carte (sous-agent testeur).
Ouvre la page comme un visiteur (desktop + mobile), clique sur l'intro,
scroll jusqu'a la carte, verifie visibilite + chargement image + erreurs JS,
et capture des screenshots."""
import json
from playwright.sync_api import sync_playwright

BASE = 'http://localhost/'
OUT = r'c:\site-mariage-laurent-melissa\tools'
results = {'console': [], 'errors': [], 'checks': {}}

def audit(ctx, tag):
    page = ctx.new_page()
    page.on('pageerror', lambda e: results['errors'].append(str(e)[:300]))
    page.on('console', lambda m: results['console'].append(m.type + ': ' + m.text[:180]) if m.type in ('error', 'warning') else None)
    page.goto(BASE, wait_until='load', timeout=45000)
    page.wait_for_timeout(2000)
    if page.is_visible('#introEnter'):
        page.click('#introEnter')
        page.wait_for_timeout(1200)
    page.evaluate("document.querySelector('.venue-map').scrollIntoView({block:'center'})")
    page.wait_for_timeout(2500)
    results['checks'].update({
        'map_visible_' + tag: page.locator('.venue-map').is_visible(),
        'img_state_' + tag: page.evaluate(
            "() => { const i = document.querySelector('.venue-map img');"
            " return i ? {complete: i.complete, naturalW: i.naturalWidth,"
            " currentSrc: i.currentSrc.split('/').pop()} : null; }"),
        'card_opacity_' + tag: page.evaluate(
            "() => { const c = document.querySelector('.venue-card');"
            " return c ? getComputedStyle(c).opacity : 'ABSENT'; }"),
        'img_opacity_' + tag: page.evaluate(
            "() => { const i = document.querySelector('.venue-map img');"
            " return i ? getComputedStyle(i).opacity : 'ABSENT'; }"),
        'overflow_x_' + tag: page.evaluate(
            "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"),
    })
    page.locator('.venue-card').screenshot(path=OUT + r'\_diag_' + tag + '_lieu.png')
    page.evaluate("document.querySelector('.rsvp-form').scrollIntoView({block:'center'})")
    page.wait_for_timeout(1500)
    results['checks'].update({
        'rsvp_form_opacity_' + tag: page.evaluate(
            "() => getComputedStyle(document.querySelector('.rsvp-form')).opacity"),
        'rsvp_input_opacity_' + tag: page.evaluate(
            "() => getComputedStyle(document.querySelector('.rsvp-form input')).opacity"),
        'fp_btn_color_' + tag: page.evaluate(
            "() => { const b = document.querySelector('.fairepart-actions .btn-ghost');"
            " return b ? getComputedStyle(b).color : 'ABSENT'; }"),
        'program_card_opacity_' + tag: page.evaluate(
            "() => { const c = document.querySelector('.program-card');"
            " return c ? getComputedStyle(c).opacity : 'ABSENT'; }"),
    })
    page.locator('.rsvp-form').screenshot(path=OUT + r'\_diag_' + tag + '_rsvp.png')

with sync_playwright() as p:
    browser = None
    for channel in ('msedge', 'chrome', None):
        try:
            browser = p.chromium.launch(channel=channel, headless=True)
            results['engine'] = channel or 'chromium-builtin'
            break
        except Exception as e:
            results['errors'].append('launch ' + str(channel) + ': ' + str(e)[:150])
    if not browser:
        print('AUCUN NAVIGATEUR DISPONIBLE'); raise SystemExit(1)
    audit(browser.new_context(viewport={'width': 1280, 'height': 900}), 'desktop')
    audit(browser.new_context(viewport={'width': 390, 'height': 844},
                              device_scale_factor=2), 'mobile')
    browser.close()

print(json.dumps(results, indent=1, ensure_ascii=False))
