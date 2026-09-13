"""Run from the repository root with Python Playwright and Chromium installed."""
import json
import subprocess
import threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SEED_JS = """let seed = 42; Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};"""
fixture = json.loads(subprocess.check_output([
    'node', '-e', SEED_JS + """
    const Minefield = require('./projects/minefield/game.js');
    const game = new Minefield(); game.reveal(0);
    console.log(JSON.stringify(game.cells));
    """], cwd=ROOT))
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for width, dpr in [(1440, 2), (390, 3)]:
            page = browser.new_page(viewport={'width': width, 'height': 900}, device_scale_factor=dpr)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            # Prove gameplay still works when every external resource is blocked.
            page.route('**/*', lambda route: route.continue_()
                       if route.request.url.startswith('http://127.0.0.1:') else route.abort())
            page.add_init_script(SEED_JS)
            url = f'http://127.0.0.1:{server.server_port}/projects/minefield/index.html'
            page.goto(url)
            canvas = page.locator('#canvas')
            status = page.locator('#game-status')

            def click_cell(index, button='left'):
                box = canvas.bounding_box()
                canvas.click(position={'x': (index % 14 + 0.5) * box['width'] / 14,
                                       'y': (index // 14 + 0.5) * box['height'] / 14}, button=button)

            assert 'Click a cell to start' in status.inner_text()
            assert canvas.bounding_box()['width'] <= 500
            before = canvas.screenshot()
            click_cell(0)
            assert 'safe cells cleared' in status.inner_text()
            assert before != canvas.screenshot(), 'reveal must change the canvas'
            mine = next(i for i, c in enumerate(fixture) if c['mine'])
            click_cell(mine, 'right')
            assert '25 mines unflagged' in status.inner_text()
            click_cell(mine)
            assert 'safe cells cleared' in status.inner_text()
            page.locator('#flag-mode').click()
            click_cell(mine)
            assert '26 mines unflagged' in status.inner_text()
            page.locator('#flag-mode').click()
            click_cell(mine)
            assert 'Mine hit' in status.inner_text()
            page.get_by_text('New game', exact=True).click()
            assert 'Click a cell to start' in status.inner_text()
            assert page.locator('#flag-mode').get_attribute('aria-pressed') == 'false'
            # Reload resets the seeded generator, then play a full known safe round
            # through canvas DOM events, without exposing board state to the page.
            page.reload()
            click_cell(0)
            safe = [i for i, c in enumerate(fixture) if not c['mine']]
            page.evaluate('''indices => {
              const canvas = document.getElementById('canvas');
              const rect = canvas.getBoundingClientRect();
              for (const i of indices) canvas.dispatchEvent(new MouseEvent('click', {
                clientX: rect.left + (i % 14 + 0.5) * rect.width / 14,
                clientY: rect.top + (Math.floor(i / 14) + 0.5) * rect.height / 14,
              }));
            }''', safe)
            assert 'You won' in status.inner_text()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            page.evaluate('scrollTo({top:0,behavior:"instant"})')
            page.screenshot(path=f'/tmp/minefield-{width}.png', full_page=True)
            print(f'PASS: {width}px / DPR {dpr}: reveal, flags, loss, restart, win; external resources blocked.')
            page.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
