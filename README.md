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

- **`bio.html`** — replace the placeholder paragraphs, portrait, and skill
  tags with your real bio. Search the file for `EDIT ME`.
- **`assets/portrait.jpg`** — add a photo and point the `<img>` in `bio.html`
  at it.
- **`gallery.html`** — add images to `assets/gallery/` and duplicate the
  commented-out `<figure>` block per image.
- **`js/graph-data.js`** — currently fake data shaped like an Obsidian vault.
  Two ways to make it real:
  1. Hand-edit the file — it's just `{ id, group }` nodes and
     `{ source, target }` links.
  2. Upload your actual vault (or just the `.md` files) in a future session
     and ask for a script that walks the files, extracts `[[wikilinks]]`,
     and generates this file automatically.
- **Contact links** — `bio.html` has a placeholder email; swap in your real
  contact info / socials.

## Notes

- `draft.js` from the original repo (a Pokémon API test + an unfinished
  differential-equation solver) was left out of the rebuild since it wasn't
  linked to any page. Still in git history if you want it back.
- Design tokens live in `css/tokens.css` — the palette is derived from the
  original site's "retro palette" comment in the old `css/styles.css`.
