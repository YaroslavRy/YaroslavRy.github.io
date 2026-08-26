/*
  matrix-bg.js
  A quieter, reusable version of the original cellular.js glyph-rain effect.
  Attaches to any <canvas data-matrix-bg> and fills its parent element.
*/
(function () {
  function initMatrixBg(canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, cellSize, cols;

    function resize() {
      const parent = canvas.parentElement;
      width = canvas.width = parent.clientWidth;
      height = canvas.height = parent.clientHeight;
      cellSize = 16;
      cols = Math.ceil(width / cellSize);
    }
    resize();
    window.addEventListener('resize', resize);

    const glyphs = 'アイウエオカキクケコ01∆∇◇▲λμ∑π'.split('');
    const drops = new Array(cols).fill(0).map(() => Math.random() * -50);

    function rand(max) { return Math.floor(Math.random() * max); }

    function loop() {
      ctx.fillStyle = 'rgba(36, 21, 49, 0.16)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = '13px monospace';
      for (let i = 0; i < cols; i++) {
        const g = glyphs[rand(glyphs.length)];
        const x = i * cellSize;
        const y = drops[i] * cellSize;
        const opacity = Math.random() * 0.5 + 0.15;
        ctx.fillStyle = `rgba(194, 75, 134, ${opacity})`;
        ctx.fillText(g, x, y);

        if (y > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      if (!document.body.dataset.reduceMotion) {
        requestAnimationFrame(loop);
      }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctx.fillStyle = 'rgba(36, 21, 49, 1)';
      ctx.fillRect(0, 0, width, height);
    } else {
      loop();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('canvas[data-matrix-bg]').forEach(initMatrixBg);
  });
})();
