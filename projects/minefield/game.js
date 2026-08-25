$(function () {
    var gameStatus = 1;

    Array.prototype.reshape = function (rows, cols) {
        var copy = this.slice(0); // Copy all elements.
        this.length = 0; // Clear out existing array.

        for (var r = 0; r < rows; r++) {
            var row = [];
            for (var c = 0; c < cols; c++) {
                var i = r * cols + c;
                if (i < copy.length) {
                    row.push(copy[i]);
                }
            }
            this.push(row);
        };
    };

    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array
    };

    const kernel = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
    ];

    function uniform_array(len, value) {
        let arr = new Array(len); for (let i = 0; i < len; ++i) arr[i] = Array.isArray(value) ? [...value] : value;
        return arr;
    }

    function conv_2d(kernel, array) {
        var result = uniform_array(array.length, uniform_array(array[0].length, 0));
        var kRows = kernel.length;
        var kCols = kernel[0].length;
        var rows = array.length;
        var cols = array[0].length;
        // find center position of kernel (half of kernel size)
        var kCenterX = Math.floor(kCols / 2);
        var kCenterY = Math.floor(kRows / 2);
        var i, j, m, n, ii, jj;

        for (i = 0; i < rows; ++i) {          // for all rows
            for (j = 0; j < cols; ++j) {          // for all columns
                for (m = 0; m < kRows; ++m) {         // for all kernel rows
                    for (n = 0; n < kCols; ++n) {        // for all kernel columns
                        // index of input signal, used for checking boundary
                        ii = i + (m - kCenterY);
                        jj = j + (n - kCenterX);
                        // ignore input samples which are out of bound
                        if (ii >= 0 && ii < rows && jj >= 0 && jj < cols) {
                            result[i][j] += array[ii][jj] * kernel[m][n];
                        };
                    };
                };
            };
        };
        return result;
    };

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    class landMines {
        constructor() {
            this.nCells = 0;
            this.mines = {};
            this.matrix = math.matrix();
            this.neigbs = [];
            this.totalVisbileCells = 0;
            this.currentSaveCells = 0;
            this.totalBombs = 0;
        }

        addMine(mine) {
            this.mines[mine.id] = mine;
            this.nCells++;
            this.totalBombs = this.totalBombs + mine.bomb;
        }

        get nSaveCells() {
            return this.totalSaveCells
        }

        get nCurrentSaveCells() {
            return this.currentSaveCells;
        }

        calcDist(x1, y1, x2, y2) {
            return Math.hypot(x2 - x1, y2 - y1)
        }

        fillNeighbours(neigbs) {
            this.neigbs = neigbs;
            for (var i = 0; i < neigbs.length; i++) {
                for (var j = 0; j < neigbs.length; j++) {
                    let curMine = this.mines[`${i};${j}`];
                    // // console.log('curMine', curMine, this.mines);
                    let nNeighb = this.neigbs[i][j];
                    if (nNeighb === 0) {
                        curMine.makeVisible();
                    } else {
                        ctx.font = "2em serif";
                        ctx.fillStyle = '#945DC7';
                        ctx.fillText(nNeighb, curMine.x, curMine.y);
                    }
                }
            }
        }

        fillFieldMatrix(m) {
            this.matrix = m;
        }

        checkClicked(e) {
            if (gameStatus === 0) {
                return;
            }
            // console.log(321, this.nSaveCells, this.nCells);
            var cursorX = e.pageX;
            var cursorY = e.pageY;

            // // console.log({ 'x': cursorX, 'y': cursorY });
            for (const [key, value] of Object.entries(this.mines)) {
                // // // console.log(key, value.x, value.y, value.width);
                let curMine = this.mines[key];
                let distance = this.calcDist(value.x, value.y, cursorX, cursorY);
                // // // console.log('distance', distance, '2r', 2*value.radius);
                if (distance < (value.radius)) {

                    let promise = new Promise(function (resolve, reject) {
                        setTimeout(() => resolve(1), 150);

                    });
                    promise.then(function (result) {
                        curMine.detonate();
                        if (curMine.status === 'dead') {
                            gameStatus = 0;
                            ctx.font = "2.5em serif";
                            ctx.fillStyle = 'white';
                            ctx.fillText(curMine.status, canvasWidth / 2 - (curMine.width / 4), canvasHeight / 2);
                        }
                    });

                }
            }
        }

    }

    class Mine {
        constructor(id, height, width, x, y, bomb, c) {
            this.id = id;
            this.height = height;
            this.width = width;
            this.bomb = bomb
            this.x = x;
            this.y = y;
            this.radius = height / 2;
            this.draw();
            this.c = c;
            this.status = 'alive';
        }

        get isBomb() {
            return this.bomb
        }

        makeVisible() {
            let color = '#261833';
            if (this.isBomb) {
                color = 'red';
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#0033333';
            ctx.stroke();
        }

        detonate() {
            let color = '#261833';
            if (this.isBomb) {
                color = 'red';
                this.status = 'dead';
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#0033333';
            ctx.stroke();
        }

        draw() {
            var color = '#654087'
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#black';
            ctx.stroke();

        }
    }


    const canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");
    var mineField = new landMines();

    canvas.addEventListener('click', function handleClick(event) {
        mineField.checkClicked(event);
    });

    canvasWidth = canvas.width = 500;
    canvasHeight = canvas.height = 500;

    ctx.fillStyle = "#2C1C3B";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function rndMinesCoor(rows, nMines) {
        let size = rows * rows;
        let maxProportion = 0.85;
        let curProportion = nMines / size;
        if ((size < nMines) || (maxProportion < curProportion)) {
            throw new Error(`size >> nMines. Max proportions nMines/nCells must be greater than ${maxProportion}`);
        }
        let arr = new Array(size).fill(0);
        arr.reshape(rows, rows);
        // // console.log(arr);
        var totalMines = 0;

        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < rows; j++) {
                let r = Math.floor(Math.random() * 2);
                if ((r === 1) && (totalMines < nMines)) {
                    arr[i][j] = r;
                    totalMines++;
                    // console.log('totalMines', totalMines, nMines, totalMines < nMines);
                }
            }
        }

        shuffleArray(arr.flat()).reshape(rows, rows)
        return arr

    }

    function populateMineField(nRows, nMines) {
        let bubbleSize = parseInt(canvasWidth / nRows);
        let bubleRadius = bubbleSize / 2;
        let rows = [];
        let minesCoordArr = rndMinesCoor(nRows, nMines);
        for (var i = 0; i < nRows; i++) {
            let curCol = [];
            for (var j = 0; j < nRows; j++) {
                let rndInt = minesCoordArr[i][j];
                let x = bubleRadius + (j * bubleRadius * 2);
                let y = bubleRadius + (i * bubleRadius * 2);
                let mine = new Mine(id = `${i};${j}`, height = bubbleSize, widht = bubbleSize, x = x, y = y, bomb = rndInt, c = ctx);
                mineField.addMine(mine);
                curCol.push(mine.bomb);
            }
            rows.push(curCol);
        }

        mineField.fillFieldMatrix(rows);

        // cals neighbours with convolution
        let convRes = conv_2d(kernel, mineField.matrix);

        mineField.fillNeighbours(convRes);

    }

    populateMineField(nRows = 5, nMines = 15);
}
);


