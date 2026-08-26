# yaroslavry.github.io

A lab-notebook style portfolio for small computational experiments.

## Structure

```
index.html                     Home — hero + specimen grid (live mini previews)
bio.html                       About page (placeholder content — see below)
gallery.html                   Image gallery (empty state until you add photos)
graph.html                     Obsidian-style knowledge graph (placeholder demo data)
projects/
  cellular-automaton/          Specimen 01 — glyph-rain canvas, now interactive
  minefield/                   Specimen 02 — minesweeper via 2D convolution
  bouncing-balls/              Specimen 03 — elastic collision sandbox
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
- **Neuron sim** connectivity was temporarily faked as pure-random for
  performance in an earlier pass — that defeated the point and has been
  reverted. Realistic distance-based connectivity is back as the default,
  accelerated with a spatial hash grid so it still scales. Random mode is
  now an explicit, labeled control condition you can switch to for
  comparison, not a silent substitution.
- **Signal propagation is now visible** — every in-flight signal renders as
  a bright dot traveling along a faint line from source to target neuron,
  arriving exactly when its distance-based delay says it should.
- **Scale raised** to ~12,000 neurons (up from 5,000), with the spike raster
  optimized to avoid rebuilding a `Set` every frame — actual ceiling depends
  on your device's GPU.

## Notes

- `draft.js` from the original repo (a Pokémon API test + an unfinished
  differential-equation solver) was left out of the rebuild since it wasn't
  linked to any page. Still in git history if you want it back.
- Design tokens live in `css/tokens.css` — the palette is derived from the
  original site's "retro palette" comment in the old `css/styles.css`.
