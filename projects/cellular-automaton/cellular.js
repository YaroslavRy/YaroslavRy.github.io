/*
  cellular.js — interactive version
  Based on the original cellular.js glyph-rain effect. The controls below
  the canvas are now wired up: they used to just echo their own value back
  into a text box without touching the animation.
*/
$(async function () {

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  const canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  const width = (canvas.width = Math.min(900, window.innerWidth * 0.86));
  const height = (canvas.height = 360);

  // Controlled by the sliders — bigger step = fewer, larger glyphs.
  window.cellStep = 11;
  window.showLabel = true;

  function loop() {
    let alpha = 0.3;
    ctx.fillStyle = `rgba(72, 46, 97, ${alpha})`;
    ctx.fillRect(0, 0, width, height);

    let step = window.cellStep;
    let n = parseInt(width / step);
    let m = parseInt(height / step);

    if (window.showLabel) {
      let opacity = getRandomInt(100) / 100;
      ctx.fillStyle = `rgba(237, 227, 236, ${opacity})`;
      let text = 'glyph animation';
      ctx.font = '2.2em "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      let rndShift = getRandomInt(6);
      ctx.fillText(`${text}`, width / 2 + rndShift, height / 2 + rndShift);
    }

    for (var j = 0; j < m; j++) {
      for (var i = 0; i < n; i++) {
        let rndInt = getRandomInt(999);
        let ch = String.fromCharCode(rndInt + 99);

        ctx.font = '10px monospace';
        let alpha = getRandomInt(100) / 100;
        ctx.fillStyle = `rgba(194, 75, 134, ${alpha})`;
        ctx.fillText(`${ch}`, i * step, j * step);
      }
    }
    requestAnimationFrame(loop);
  }

  loop();
});
