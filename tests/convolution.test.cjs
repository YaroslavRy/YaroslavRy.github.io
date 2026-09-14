const assert = require('node:assert/strict');
const convolveCell = require('../projects/minefield/convolution.js');
const Minefield = require('../projects/minefield/game.js');

for (const size of [5, 14]) {
  for (const fill of [0, 1]) {
    const board = Array(size * size).fill(fill);
    assert.equal(convolveCell(board, size, 0).sum, 3 * fill);
    assert.equal(convolveCell(board, size, 1).sum, 5 * fill);
    assert.equal(convolveCell(board, size, size + 1).sum, 8 * fill);
  }
  for (let mine = 0; mine < size * size; mine++) {
    const board = Array(size * size).fill(0);
    board[mine] = 1;
    for (let cell = 0; cell < size * size; cell++) {
      const nearby = cell !== mine && Math.abs(cell % size - mine % size) <= 1
        && Math.abs(Math.floor(cell / size) - Math.floor(mine / size)) <= 1;
      assert.equal(convolveCell(board, size, cell).sum, Number(nearby));
    }
    assert.equal(convolveCell(board, size, mine).terms[4].product, 0);
  }
}
let seed = 42;
const game = new Minefield(() => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
});
game.reveal(0);
const map = game.cells.map(c => Number(c.mine));
game.cells.forEach((cell, i) => assert.equal(convolveCell(map, 14, i).sum, cell.count));
console.log('PASS: zero padding, center exclusion, every single-mine position, and agreement with game counts.');
