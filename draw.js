$(async function () {

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }

    const canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");

    canvas.addEventListener('click', function (event) { console.log(getMousePos(canvas, event)); }, false);

    ctx.font = "6px monospace";
    width = canvas.width = 500;
    canvas.height = 500;

    ctx.fillStyle = "#3f2855";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    let step = 20;
    let n = parseInt(width / step);

    for (var j = 0; j < n; j++) {
        for (var i = 0; i < n; i++) {

            rndInt = getRandomInt(999);
            ch = String.fromCharCode(rndInt + 99);

            ctx.fillStyle = "#ffff00";
            ctx.fillText(`${ch}`, i * step, j * step);

            await sleep(5);
        }
    }

});

