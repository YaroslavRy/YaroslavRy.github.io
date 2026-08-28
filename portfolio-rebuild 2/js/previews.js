/*
  previews.js
  Small, self-contained versions of each project's simulation,
  used as live thumbnails on the homepage specimen grid.
  Each function is intentionally tiny — these are previews, not the full sims.

  All previews register themselves with a shared IntersectionObserver so
  they pause when scrolled out of view — four canvases animating at once
  is otherwise wasted CPU.
*/

function fitCanvas(canvas) {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

// Shared registry: canvas -> { running, start() }
const _visibilityObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const handle = entry.target._previewHandle;
    if (!handle) return;
    handle.visible = entry.isIntersecting;
    if (handle.visible && !handle.running) {
      handle.running = true;
      handle.loop();
    }
  });
}, { threshold: 0.05 });

function registerPreview(canvas, loopFn) {
  const handle = { running: false, visible: false, loop: loopFn };
  canvas._previewHandle = handle;
  _visibilityObserver.observe(canvas);
}

/* ---------- Preview: Minefield ---------- */
function previewMinefield(canvas) {
  const ctx = canvas.getContext('2d');
  const { w, h } = fitCanvas(canvas);
  const cellSize = 22;
  const cols = Math.max(4, Math.floor(w / cellSize));
  const rows = Math.max(4, Math.floor(h / cellSize));

  function freshGrid() {
    const bombs = new Set();
    const total = cols * rows;
    const nBombs = Math.floor(total * 0.15);
    while (bombs.size < nBombs) bombs.add(Math.floor(Math.random() * total));
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        bomb: bombs.has(r * cols + c),
        revealed: false,
        pop: 0, // 0→1 reveal-pop animation progress
      }))
    );
  }

  let grid = freshGrid();

  function draw() {
    ctx.fillStyle = '#241531';
    ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        const baseR = cellSize / 2 - 2;
        const radius = cell.revealed ? baseR * (0.6 + 0.4 * cell.pop) : baseR;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (!cell.revealed) {
          ctx.fillStyle = '#61295A';
          ctx.shadowBlur = 0;
        } else if (cell.bomb) {
          ctx.fillStyle = '#C24B86';
          ctx.shadowColor = '#C24B86';
          ctx.shadowBlur = 10 * cell.pop;
        } else {
          ctx.fillStyle = '#3F2855';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (cell.revealed && cell.pop < 1) cell.pop = Math.min(1, cell.pop + 0.12);
      }
    }
  }

  let tick = 0;
  function loop() {
    if (!canvas._previewHandle.visible) { canvas._previewHandle.running = false; return; }
    if (tick % 18 === 0) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      grid[r][c].revealed = true;
    }
    if (tick % 150 === 0 && tick > 0) grid = freshGrid();
    draw();
    tick++;
    requestAnimationFrame(loop);
  }
  registerPreview(canvas, loop);
}

/* ---------- Preview: Bouncing Balls ---------- */
function previewBouncingBalls(canvas) {
  const ctx = canvas.getContext('2d');
  const { w, h } = fitCanvas(canvas);
  const colors = ['#C24B86', '#8D2A61', '#EDE3EC', '#BAA2B7'];
  function rand(min, max) { return Math.random() * (max - min) + min; }

  const balls = Array.from({ length: 9 }, () => ({
    x: rand(10, w - 10),
    y: rand(10, h - 10),
    vx: rand(-1.4, 1.4),
    vy: rand(-1.4, 1.4),
    r: rand(4, 8),
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  function draw() {
    ctx.fillStyle = 'rgba(36, 21, 49, 0.3)';
    ctx.fillRect(0, 0, w, h);
    balls.forEach((b) => {
      b.x += b.vx; b.y += b.vy;
      if (b.x - b.r < 0 || b.x + b.r > w) b.vx *= -1;
      if (b.y - b.r < 0 || b.y + b.r > h) b.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function loop() {
    if (!canvas._previewHandle.visible) { canvas._previewHandle.running = false; return; }
    draw();
    requestAnimationFrame(loop);
  }
  registerPreview(canvas, loop);
}

/* ---------- Preview: Cellular Automaton (glyph rain) ---------- */
function previewCellular(canvas) {
  const ctx = canvas.getContext('2d');
  const { w, h } = fitCanvas(canvas);
  const cellSize = 12;
  const cols = Math.ceil(w / cellSize);
  const rows = Math.ceil(h / cellSize);

  function rand(max) { return Math.floor(Math.random() * max); }

  function draw() {
    ctx.fillStyle = 'rgba(36, 21, 49, 0.25)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '10px monospace';
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const ch = String.fromCharCode(rand(999) + 99);
        const opacity = rand(100) / 100;
        ctx.fillStyle = `rgba(194, 75, 134, ${opacity})`;
        ctx.fillText(ch, i * cellSize, j * cellSize);
      }
    }
  }

  function loop() {
    if (!canvas._previewHandle.visible) { canvas._previewHandle.running = false; return; }
    draw();
    requestAnimationFrame(loop);
  }
  registerPreview(canvas, loop);
}

/* ---------- Preview: Neuron Sim (dedicated) ---------- */
function previewNeuronSim(canvas) {
  const ctx = canvas.getContext('2d');
  const { w, h } = fitCanvas(canvas);
  function rand(min, max) { return Math.random() * (max - min) + min; }

  const N = 16;
  const nodes = Array.from({ length: N }, () => ({
    x: rand(w * 0.12, w * 0.88),
    y: rand(h * 0.15, h * 0.85),
    charge: 0,       // 0..1, decays; drives glow + triggers spikes
    threshold: rand(0.55, 0.85),
  }));

  // Sparse random connections
  const edges = [];
  nodes.forEach((_, i) => {
    const connections = 1 + Math.floor(Math.random() * 2);
    for (let k = 0; k < connections; k++) {
      const j = Math.floor(Math.random() * N);
      if (j !== i) edges.push({ a: i, b: j, pulse: -1 }); // pulse: -1 idle, else 0..1 progress
    }
  });

  function fire(i) {
    nodes[i].charge = 1;
    edges.forEach((e) => {
      if (e.a === i && e.pulse < 0) e.pulse = 0;
    });
  }

  // Seed an initial spike
  fire(Math.floor(Math.random() * N));
  let sinceLastSpontaneous = 0;

  function draw() {
    ctx.fillStyle = 'rgba(36, 21, 49, 0.28)';
    ctx.fillRect(0, 0, w, h);

    // Edges + traveling pulses
    edges.forEach((e) => {
      const a = nodes[e.a], b = nodes[e.b];
      ctx.strokeStyle = 'rgba(94, 45, 107, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (e.pulse >= 0) {
        const px = a.x + (b.x - a.x) * e.pulse;
        const py = a.y + (b.y - a.y) * e.pulse;
        ctx.beginPath();
        ctx.fillStyle = '#C24B86';
        ctx.shadowColor = '#C24B86';
        ctx.shadowBlur = 8;
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        e.pulse += 0.05;
        if (e.pulse >= 1) {
          e.pulse = -1;
          nodes[e.b].charge = Math.min(1, nodes[e.b].charge + 0.6);
        }
      }
    });

    // Nodes
    nodes.forEach((n) => {
      const r = 3 + n.charge * 3.5;
      ctx.beginPath();
      const glow = n.charge > 0.05;
      ctx.fillStyle = glow ? '#EDE3EC' : '#8D2A61';
      if (glow) { ctx.shadowColor = '#C24B86'; ctx.shadowBlur = 10 * n.charge; }
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (n.charge >= n.threshold) {
        n.charge = 0;
      }
      n.charge *= 0.93; // decay
    });
  }

  let tick = 0;
  function loop() {
    if (!canvas._previewHandle.visible) { canvas._previewHandle.running = false; return; }
    sinceLastSpontaneous++;
    if (sinceLastSpontaneous > 45 && Math.random() < 0.04) {
      fire(Math.floor(Math.random() * N));
      sinceLastSpontaneous = 0;
    }
    draw();
    tick++;
    requestAnimationFrame(loop);
  }
  registerPreview(canvas, loop);
}

document.addEventListener('DOMContentLoaded', function () {
  const mf = document.querySelector('[data-preview="minefield"]');
  const bb = document.querySelector('[data-preview="bouncing-balls"]');
  const ca = document.querySelector('[data-preview="cellular-automaton"]');
  const ns = document.querySelector('[data-preview="neuron-sim"]');

  if (mf) previewMinefield(mf);
  if (bb) previewBouncingBalls(bb);
  if (ca) previewCellular(ca);
  if (ns) previewNeuronSim(ns);
});
