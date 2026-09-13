const assert = require('node:assert/strict');
const Minefield = require('../projects/minefield/game.js');

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

for (let seed = 1; seed <= 100; seed++) {
  const game = new Minefield(seededRandom(seed));
  const first = seed % 196;
  assert.equal(game.state, 'ready');
  assert.ok(game.cells.every(c => !c.revealed));
  game.reveal(first);
  assert.equal(game.cells.filter(c => c.mine).length, 26);
  assert.equal(game.cells[first].count, 0);
  assert.ok(game.cells[first].revealed);
  assert.ok(game.revealed > 1, 'empty opening expands');
  // Independent count oracle: coordinate distance, including all boundaries.
  game.cells.forEach((cell, i) => {
    const neighbors = game.cells.filter((other, j) => j !== i && other.mine
      && Math.abs(Math.floor(i / 14) - Math.floor(j / 14)) <= 1
      && Math.abs(i % 14 - j % 14) <= 1);
    assert.equal(cell.count, neighbors.length);
  });
  for (let i = 0; i < 196; i++) if (!game.cells[i].mine) game.reveal(i);
  assert.equal(game.state, 'won');
  assert.equal(game.revealed, 170);
  game.reveal(game.cells.findIndex(c => c.mine));
  assert.equal(game.state, 'won', 'win is terminal');
  game.reset();
  assert.equal(game.state, 'ready');
  assert.equal(game.revealed, 0);
  assert.ok(game.cells.every(c => !c.mine && !c.revealed && !c.flagged));
}

const game = new Minefield(seededRandom(42));
game.toggleFlag(0);
game.reveal(0);
assert.equal(game.state, 'ready', 'flagged cell cannot be opened');
game.toggleFlag(0);
game.reveal(0);
const mine = game.cells.findIndex(c => c.mine);
game.toggleFlag(mine);
game.reveal(mine);
assert.equal(game.state, 'playing');
game.toggleFlag(mine);
game.reveal(mine);
assert.equal(game.state, 'lost');
const snapshot = JSON.stringify(game.cells);
game.reveal(195);
game.toggleFlag(195);
assert.equal(JSON.stringify(game.cells), snapshot, 'loss freezes play');
game.reset();
assert.equal(game.flags, 0);
console.log('PASS: 100 seeded boards, counts, safe openings, flood fill, wins, flags, loss, reset.');
