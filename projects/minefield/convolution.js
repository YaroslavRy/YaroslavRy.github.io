/* Fixed, editable teaching board; independent of the hidden game board. */
(function () {
  'use strict';
  function convolveCell(board, size, index) {
    const row = Math.floor(index / size), col = index % size;
    const terms = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const y = row + dy, x = col + dx;
        const padding = y < 0 || y >= size || x < 0 || x >= size;
        const value = padding ? 0 : board[y * size + x];
        const weight = dx === 0 && dy === 0 ? 0 : 1;
        terms.push({ value, weight, padding, product: value * weight });
      }
    }
    return { terms, sum: terms.reduce((total, term) => total + term.product, 0) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = convolveCell;
  if (typeof document === 'undefined') return;

  const initial = [
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    1, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
    0, 1, 0, 0, 0,
  ];
  let board = initial.slice(), selected = 12, timer = null;
  const input = document.getElementById('conv-input');
  const output = document.getElementById('conv-output');
  const play = document.getElementById('conv-play');
  const edit = document.getElementById('conv-edit');
  const products = document.getElementById('conv-products');
  const sum = document.getElementById('conv-sum');
  const windowElement = document.getElementById('conv-window');
  const inputCells = [], outputCells = [];

  function stop() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'Scan board';
    play.setAttribute('aria-pressed', 'false');
    sum.setAttribute('aria-live', 'polite');
  }

  // One padding ring makes edge behavior visible without clipping the kernel.
  for (let row = -1; row <= 5; row++) {
    for (let col = -1; col <= 5; col++) {
      const padding = row < 0 || row >= 5 || col < 0 || col >= 5;
      for (const [grid, cells, isInput] of [[input, inputCells, true], [output, outputCells, false]]) {
        const cell = document.createElement(padding ? 'span' : 'button');
        if (padding) {
          cell.className = isInput ? 'conv-padding' : 'conv-spacer';
          cell.textContent = isInput ? '0' : '';
          cell.setAttribute('aria-hidden', 'true');
        } else {
          const index = row * 5 + col;
          cell.type = 'button';
          cell.dataset.index = index;
          cell.addEventListener('click', () => {
            stop();
            selected = index;
            if (isInput && edit.checked) board[index] = 1 - board[index];
            render();
          });
          cells[index] = cell;
        }
        grid.append(cell);
      }
    }
  }
  const termCells = Array.from({ length: 9 }, () => {
    const cell = document.createElement('span');
    products.append(cell);
    return cell;
  });

  function render() {
    const row = Math.floor(selected / 5), col = selected % 5;
    board.forEach((value, i) => {
      const r = Math.floor(i / 5), c = i % 5;
      inputCells[i].textContent = value;
      inputCells[i].classList.toggle('is-mine', value === 1);
      inputCells[i].classList.toggle('in-kernel', Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1);
      inputCells[i].classList.toggle('kernel-center', i === selected);
      inputCells[i].setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${value ? 'mine' : 'empty'}`);
      inputCells[i].setAttribute('aria-pressed', String(i === selected));
      const count = convolveCell(board, 5, i).sum;
      outputCells[i].textContent = count;
      outputCells[i].classList.toggle('is-selected', i === selected);
      outputCells[i].setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}: ${count} neighboring mines`);
      outputCells[i].setAttribute('aria-pressed', String(i === selected));
    });
    windowElement.style.left = `${col * 100 / 7}%`;
    windowElement.style.top = `${row * 100 / 7}%`;
    const result = convolveCell(board, 5, selected);
    result.terms.forEach((term, i) => {
      termCells[i].textContent = `${term.value} × ${term.weight} = ${term.product}`;
      termCells[i].className = i === 4 ? 'term-center' : term.padding ? 'term-padding' : term.product ? 'term-mine' : '';
      termCells[i].title = i === 4 ? 'Center: ignored' : term.padding ? 'Outside board: zero padding' : 'Neighbor';
    });
    document.getElementById('conv-position').textContent = `Cell (${row + 1}, ${col + 1}): input × kernel`;
    sum.textContent = `${result.terms.map(term => term.product).join(' + ')} = ${result.sum}`;
  }
  play.addEventListener('click', () => {
    if (timer !== null) { stop(); return; }
    edit.checked = false;
    selected = 0;
    render();
    play.textContent = 'Pause scan';
    play.setAttribute('aria-pressed', 'true');
    // Avoid announcing every automatic step to screen readers.
    sum.setAttribute('aria-live', 'off');
    timer = setInterval(() => {
      selected++;
      render();
      if (selected === 24) stop();
    }, 850);
  });
  document.getElementById('conv-step').addEventListener('click', () => {
    stop(); selected = (selected + 1) % 25; render();
  });
  document.getElementById('conv-reset').addEventListener('click', () => {
    stop(); board = initial.slice(); selected = 12; edit.checked = false; render();
  });
  edit.addEventListener('change', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  render();
})();
