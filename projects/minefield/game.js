/* 14×14 Minesweeper. Neighbor counts use a zero-padded 3×3 convolution. */
(function () {
  'use strict';

  class Minefield {
    constructor(random = Math.random) {
      this.random = random;
      this.size = 14;
      this.mineCount = 26;
      this.reset();
    }

    reset() {
      this.cells = Array.from({ length: this.size ** 2 }, () => ({
        mine: false, count: 0, revealed: false, flagged: false,
      }));
      this.state = 'ready';
      this.revealed = 0;
      this.flags = 0;
    }

    neighbors(index) {
      const row = Math.floor(index / this.size), col = index % this.size;
      const result = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const y = row + dy, x = col + dx;
          if ((dx || dy) && y >= 0 && y < this.size && x >= 0 && x < this.size) {
            result.push(y * this.size + x);
          }
        }
      }
      return result;
    }

    placeMines(first) {
      // Keep the first cell and its neighbors clear, giving a safe opening.
      const excluded = new Set([first, ...this.neighbors(first)]);
      const candidates = this.cells.map((_, i) => i).filter(i => !excluded.has(i));
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      for (const i of candidates.slice(0, this.mineCount)) this.cells[i].mine = true;
      // Kernel [1,1,1; 1,0,1; 1,1,1], with zero padding at board edges.
      this.cells.forEach((cell, i) => {
        cell.count = this.neighbors(i).reduce((sum, j) => sum + Number(this.cells[j].mine), 0);
      });
      this.state = 'playing';
    }

    reveal(index) {
      const cell = this.cells[index];
      if (!cell || cell.revealed || cell.flagged || ['won', 'lost'].includes(this.state)) return;
      if (this.state === 'ready') this.placeMines(index);
      if (cell.mine) {
        cell.revealed = true;
        this.state = 'lost';
        return;
      }
      const pending = [index];
      while (pending.length) {
        const i = pending.pop(), next = this.cells[i];
        if (next.revealed || next.flagged || next.mine) continue;
        next.revealed = true;
        this.revealed++;
        if (next.count === 0) pending.push(...this.neighbors(i));
      }
      if (this.revealed === this.cells.length - this.mineCount) this.state = 'won';
    }

    toggleFlag(index) {
      const cell = this.cells[index];
      if (!cell || cell.revealed || ['won', 'lost'].includes(this.state)) return;
      if (!cell.flagged && this.flags >= this.mineCount) return;
      cell.flagged = !cell.flagged;
      this.flags += cell.flagged ? 1 : -1;
    }
  }

  // The same model runs in the browser and in deterministic Node tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = Minefield;
  if (typeof document === 'undefined') return;

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('game-status');
  const flagButton = document.getElementById('flag-mode');
  const game = new Minefield();
  const size = 500, cellSize = size / game.size;
  let flagMode = false;

  function draw() {
    ctx.fillStyle = '#241531';
    ctx.fillRect(0, 0, size, size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "600 15px 'JetBrains Mono', monospace";
    game.cells.forEach((cell, i) => {
      const x = (i % game.size + 0.5) * cellSize;
      const y = (Math.floor(i / game.size) + 0.5) * cellSize;
      const showMine = cell.mine && game.state === 'lost';
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.39, 0, Math.PI * 2);
      ctx.fillStyle = showMine ? '#8D2A61' : cell.revealed ? '#30203F' : '#61295A';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = cell.revealed ? '#482E61' : '#BAA2B7';
      ctx.stroke();
      ctx.fillStyle = '#EDE3EC';
      if (showMine) {
        ctx.beginPath();
        ctx.arc(x, y, cellSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (cell.flagged) {
        ctx.fillText('⚑', x, y);
      } else if (cell.revealed && cell.count) {
        ctx.fillText(cell.count, x, y);
      }
    });
    const remaining = game.mineCount - game.flags;
    status.textContent = game.state === 'lost' ? 'Mine hit. Start a new game.'
      : game.state === 'won' ? 'You won — all safe cells cleared.'
      : game.state === 'ready' ? '26 mines · Click a cell to start.'
      : `${remaining} mines unflagged · ${game.revealed}/170 safe cells cleared`;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function indexAt(event) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - rect.left) / rect.width * game.size);
    const row = Math.floor((event.clientY - rect.top) / rect.height * game.size);
    return row >= 0 && row < game.size && col >= 0 && col < game.size
      ? row * game.size + col : -1;
  }

  canvas.addEventListener('click', event => {
    if (flagMode) game.toggleFlag(indexAt(event));
    else game.reveal(indexAt(event));
    draw();
  });
  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    game.toggleFlag(indexAt(event));
    draw();
  });
  flagButton.addEventListener('click', () => {
    flagMode = !flagMode;
    flagButton.setAttribute('aria-pressed', String(flagMode));
    flagButton.textContent = flagMode ? 'Flag mode: on' : 'Flag mode: off';
  });
  window.restartMinefield = function () {
    game.reset();
    flagMode = false;
    flagButton.setAttribute('aria-pressed', 'false');
    flagButton.textContent = 'Flag mode: off';
    draw();
  };
  window.addEventListener('resize', resize);
  resize();
})();
