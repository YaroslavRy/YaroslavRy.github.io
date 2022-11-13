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
    const width = (canvas.width = window.innerWidth / 1.5);
    const height = (canvas.height = window.innerHeight / 1.5);

    canvas.addEventListener('click', function (event) { console.log(getMousePos(canvas, event)); }, false);


    function loop() {
        let alpha = getRandomInt(100) / 100;
        ctx.fillStyle = `rgba(41, 42, 97, ${alpha})`;
        ctx.fillRect(0, 0, width, height);

        let cellSize = 10;
        let step = 10;
        let n = parseInt(width / cellSize);

        ctx.fillStyle = "#BAA2B7";
        let opacity = getRandomInt(100) / 100;
        ctx.fillStyle = `rgba(176, 111, 237, ${opacity})`;
        let text = "Work in progress . . .";
        ctx.font = "3em serif";
        ctx.textAlign = 'center';
        ctx.fillText(`${text}`, width / 2, height / 2);

        for (var j = 0; j < n; j++) {
            for (var i = 0; i < n; i++) {

                rndInt = getRandomInt(999);
                ch = String.fromCharCode(rndInt + 99);

                ctx.font = "10px serif";
                let alpha = getRandomInt(100) / 100;
                ctx.fillStyle = `rgba(141, 42, 97, ${alpha})`;
                ctx.fillText(`${ch}`, i * step, j * step);

                // await sleep(5);
            }
        }
        requestAnimationFrame(loop);
    }


    loop();


});
