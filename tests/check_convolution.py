"""Browser checks for the independent, editable kernel example. Run from repo root."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in [1440, 390]:
        page = browser.new_page(viewport={'width': width, 'height': 1000}, device_scale_factor=2)
        page.route('https://**/*', lambda route: route.abort())
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((root / 'projects/minefield/index.html').as_uri())
        original_game = page.locator('#game-status').inner_text()
        inputs = page.locator('#conv-input button')
        outputs = page.locator('#conv-output button')
        assert inputs.count() == outputs.count() == 25

        def verify_counts():
            board = [int(v) for v in inputs.all_text_contents()]
            counts = [int(v) for v in outputs.all_text_contents()]
            for i, count in enumerate(counts):
                expected = sum(value for j, value in enumerate(board) if i != j
                               and abs(i // 5 - j // 5) <= 1 and abs(i % 5 - j % 5) <= 1)
                assert count == expected, (i, count, expected)

        verify_counts()
        initial = inputs.all_text_contents()
        inputs.nth(0).click()
        assert 'Cell (1, 1)' in page.locator('#conv-position').inner_text()
        assert page.locator('.term-padding').count() == 5
        page.locator('#conv-edit').check()
        before = outputs.nth(0).inner_text()
        inputs.nth(0).click()
        assert inputs.nth(0).inner_text() == '1'
        assert outputs.nth(0).inner_text() == before, 'center mine must not count itself'
        assert page.locator('.term-center').inner_text() == '1 × 0 = 0'
        verify_counts()
        outputs.nth(6).focus()
        page.keyboard.press('Enter')
        assert 'Cell (2, 2)' in page.locator('#conv-position').inner_text()
        page.locator('#conv-reset').click()
        assert inputs.all_text_contents() == initial
        assert not page.locator('#conv-edit').is_checked()
        page.locator('#conv-step').click()
        assert 'Cell (3, 4)' in page.locator('#conv-position').inner_text()
        page.clock.install()
        page.locator('#conv-play').click()
        assert page.locator('#conv-play').get_attribute('aria-pressed') == 'true'
        page.clock.run_for(850)
        assert 'Cell (1, 2)' in page.locator('#conv-position').inner_text()
        page.clock.run_for(22000)
        assert 'Cell (5, 5)' in page.locator('#conv-position').inner_text()
        assert page.locator('#conv-play').get_attribute('aria-pressed') == 'false'
        page.locator('#conv-play').click()
        page.locator('#conv-play').click()
        paused = page.locator('#conv-position').inner_text()
        page.clock.run_for(2000)
        assert page.locator('#conv-position').inner_text() == paused
        assert page.locator('#game-status').inner_text() == original_game
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#conv-reset').click()
        page.locator('.convolution-layout').scroll_into_view_if_needed()
        page.screenshot(path=f'/tmp/convolution-{width}.png', full_page=True)
        assert not errors, errors
        print(f'PASS {width}px: edit/select, counts, padding, keyboard, scan/end/pause, reset, independent game.')
        page.close()
    browser.close()
