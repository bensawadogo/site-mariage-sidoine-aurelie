# -*- coding: utf-8 -*-
"""Capture d'ecran de la section programme (desktop + mobile)."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(channel='msedge', headless=True)
    pg = b.new_context(viewport={'width': 1280, 'height': 900}).new_page()
    pg.goto('http://localhost/', wait_until='load', timeout=45000)
    pg.wait_for_timeout(1500)
    if pg.is_visible('#introEnter'):
        pg.click('#introEnter')
        pg.wait_for_timeout(800)
    pg.evaluate("document.querySelector('.program-grid').scrollIntoView({block:'center'})")
    pg.wait_for_timeout(1500)
    pg.locator('.program-grid').screenshot(path=r'C:\Users\sawad\OneDrive\Desktop\apercu-programme.png')
    m = b.new_context(viewport={'width': 390, 'height': 844},
                      device_scale_factor=2).new_page()
    m.goto('http://localhost/', wait_until='load', timeout=45000)
    m.wait_for_timeout(1500)
    if m.is_visible('#introEnter'):
        m.click('#introEnter')
        m.wait_for_timeout(800)
    m.evaluate("document.querySelector('.program-grid').scrollIntoView({block:'center'})")
    m.wait_for_timeout(1500)
    m.locator('.program-grid').screenshot(path=r'C:\Users\sawad\OneDrive\Desktop\apercu-programme-mobile.png')
    b.close()
print('CAPTURES OK : Desktop\\apercu-programme.png + apercu-programme-mobile.png')
