# yaroslavry.github.io

A lab-notebook style portfolio for small computational experiments.

## Structure

```
index.html                     Home — live previews on the left, descriptions on the right
bio.html                       About page (placeholder content — see below)
gallery.html                   Image gallery (empty state until you add photos)
graph.html                     Obsidian-style knowledge graph (placeholder demo data)
projects/
  cellular-automaton/          Glyph Animation — random glyphs with fading trails
  minefield/                   Specimen 02 — minesweeper via 2D convolution
  bouncing-balls/              Elastic collision sandbox (hidden from homepage)
neuronJS/                      Specimen 04 — spiking neuron network (WebGL, scales to 1000s)
  sim.js                       Simulation + WebGL renderer + heatmap + raster
  main.mjs, neoSim.mjs,        Original Plotly-based version — superseded,
  styles.css, test.html        kept for reference but no longer linked from index.html
css/tokens.css                 Color, type, spacing design tokens
css/main.css                   Shared layout, nav, cards, footer
js/matrix-bg.js                Reusable hero background animation
js/previews.js                 Live mini-simulations for the homepage cards
js/graph-data.js               PLACEHOLDER data for graph.html
data/                          Original mp3 assets (unused by any page currently)
```

## Things left for you to fill in

- **`assets/portrait.jpg`** — add a photo; then in `bio.html` swap the
  placeholder box for `<img src="assets/portrait.jpg" alt="Yaroslav Ryndyk">`.
- **`gallery.html`** — add images to `assets/gallery/` and duplicate the
  commented-out `<figure>` block per image.
- **`js/graph-data.js`** — currently fake data shaped like an Obsidian vault.
  Two ways to make it real:
  1. Hand-edit the file — it's just `{ id, group }` nodes and
     `{ source, target }` links.
  2. Upload your actual vault (or just the `.md` files) in a future session
     and ask for a script that walks the files, extracts `[[wikilinks]]`,
     and generates this file automatically. Your real digital garden is
     already live at corvie.ai, which is itself Obsidian-published — this
     would pull its real structure in.

Bio content, blog link (corvie.ai), LinkedIn, and Telegram are already filled
in from your public blog — double check it reads the way you want.

## Recent fixes

- **Minefield** was unclickable — the original `game.js` compared raw
  page-coordinates against canvas-local mine positions, which only lines up
  if the canvas sits at the page's top-left corner with no offset. Fixed to
  convert clicks through `getBoundingClientRect()` properly. Added a
  "New game" button too.
- **Minefield redesigned**: denser 14×14 grid (was 5×5), thin stroked
  circles with subtle fills instead of solid blocks, centered monospace
  labels — matches the site's minimal aesthetic instead of the old bulky
  default styling.
- **Graph now points at real content** — `js/graph-data.js` is built from
  the actual article list on corvie.ai (category hubs + real posts), and
  clicking any article node opens it on the blog in a new tab.
- **Neuron sim connectivity was temporarily faked as pure-random** for
  performance in an earlier pass — that defeated the point and has been
  reverted. Realistic distance-based connectivity is back as the default,
  accelerated with a spatial hash grid so it still scales. Random mode is
  now an explicit, labeled control condition you can switch to for
  comparison, not a silent substitution.
- **Long-range connections added** — pure local/distance-based wiring can
  only ripple through nearest neighbors and never reaches across the
  network. ~18% of each neuron's edges now deliberately skip the local
  radius and link to a random distant neuron instead (wider decay, longer
  delay cap) — the same local-dense + sparse-long-range mix real cortex
  has. You should now see occasional pulses travel slowly across the whole
  canvas, not just hop between immediate neighbors.
- **Signal propagation is now visible** — every in-flight signal renders as
  a bright dot traveling along a faint line from source to target neuron,
  arriving exactly when its distance-based delay says it should.
- **Model description + formulas added** to the neuron sim page (rendered
  with KaTeX) — the leaky integrate-and-fire update rule, the
  distance→probability/weight relationship, and the distance→delay
  relationship, all matching what `sim.js` actually computes.
- **Scale raised** to ~12,000 neurons (up from 5,000), with the spike raster
  optimized to avoid rebuilding a `Set` every frame — actual ceiling depends
  on your device's GPU.

## Notes

- `draft.js` from the original repo (a Pokémon API test + an unfinished
  differential-equation solver) was left out of the rebuild since it wasn't
  linked to any page. Still in git history if you want it back.
- Design tokens live in `css/tokens.css` — the palette is derived from the
  original site's "retro palette" comment in the old `css/styles.css`.

## Layout and controls — 2026-09-12

- Removed the homepage introduction and catalog copy; hid Bouncing Balls.
- Renamed the glyph effect to Glyph Animation, keeping its existing URL.
- Visuals sit left and descriptions right; below 700px they stack.
- Minefield now displays at at most 500×500 CSS pixels, about half its
  previous desktop width and height.
- Neural controls: membrane τ (2–100 steps), spike threshold (0.2–2),
  refractory period (0–30 steps), and synaptic strength multiplier (0–3).
  Existing population, spontaneity, and connectivity controls remain.
  Degree is capped at the implementation's 24-edge limit.
- Canvas resizing uses the canvas bounds, preventing controls from adding
  height on every resize. Time remains one simulation step per rendered frame.

Validation: `python3 tests/check_portfolio.py` uses Python Playwright and its
Chromium browser (`python3 -m playwright install chromium`). Run from the repo
root; it starts a temporary localhost server on port 8765. Checks cover four
pages at desktop 2× pixel density and mobile width, minefield size/click/reset,
neuron slider outputs, pause/reset, repeated resize, and JavaScript errors.
Screenshots are written to `/tmp/*index.html.png`. Inputs are generated by the
simulations; no external dataset is used. Random networks are not seeded, so
exact spike patterns vary between runs.
