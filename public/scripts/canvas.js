function initCanvas(selector) {
    var cv = {
        dotted: dotted,
        drawScreen: drawScreen,
        animScreen: animScreen,
        chessBoard: chessBoard,
        drawdot: drawdot,
        gridit: gridit()
    };
    var canvasOne = $(selector)[0];
    var context = canvasOne.getContext('2d');

    function drawScreen(start, end) {
        context.strokeStyle = "grey"; //need list of available colors
        context.lineWidth = 1;
        context.lineJoin = 'round';
        context.lineCap = 'square';
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
        context.closePath();
    }
    //$('#cv1').mousemove(function(event) {
    //   console.log(event);
    //});
    //
    $(selector).click(function(event) {
        console.log(event);
    });

    function animScreen() {
        //draw black square
        context.fillStyle = "black";
        context.fillRect(20, 20, 25, 25);
        //now draw a red square
        context.setTransform(1, 0, 0, 1, 0, 0);
        var angleInRadians = 45 * Math.PI / 180;
        var x = 100;
        var y = 100;
        var width = 50;
        var height = 50;
        context.translate(x + .5 * width, y + .5 * height);
        context.rotate(angleInRadians);
        context.fillStyle = "red";
        context.fillRect(-.5 * width, -.5 * height, width, height);
    }

    context.globalAlpha = 0.4;

    function chessBoard(i, j) {
        var color = (i + j) % 2 == 0 ? 'white' : 'black'
        context.fillStyle = color;
        context.fillRect(i * 64, j * 64, 64, 64);
    }

    function drawdot(pnt) {
        context.strokeStyle = "grey"; //need list of available colors
        context.lineWidth = 1;
        context.beginPath();
        context.arc(pnt.x, pnt.y, 2, 0, Math.PI * 2);
        context.stroke();
        context.closePath();
    }

    function drawrec() {
        x = pnt.x;
        y = pnt.y;
        context.strokeStyle = "grey"; //need list of available colors
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x - 2, y - 2);
        context.lineTo(x - 2, y + 2);
        context.lineTo(x + 2, y + 2);
        context.lineTo(x + 2, y - 2);
        context.lineTo(x - 2, y - 2);
        context.stroke();
        context.closePath();
    }
    var h = context.canvas.clientHeight;
    var w = context.canvas.clientWidth;

    context.fillStyle = "rgba(0,0,0,0.2)";
    context.fillRect(0, 0, w, h);
    var interval = 80;
    var rowCount = Math.floor(h / interval);
    var colCount = Math.floor(w / interval);
    /*
    for (var i = 0; i < rowCount; i++) {
        var y = i * 64 + 64;
        var dotCount = w / 5;

        for (var doti = 0; doti < dotCount; doti++) {
            var x = doti * 5
            dotted(x, y);
        }
    }

    function dotted(x, y, color) {
        context.strokeStyle = "'rgb(0,0,0)'"; //need list of available colors
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 1, y);
        context.stroke();
        context.closePath();
    }
    for (var i = 0; i < colCount; i++) {
        var x = i * 64 + 64;
        var dotCount = w / 5;

        for (var doti = 0; doti < dotCount; doti++) {
            var y = doti * 5

            dotted(x, y);
        }
    }*/
    function dotted(x, y, color) {
        /*if (x < ext.center.x + 128 && x > ext.center.x - 128 && y < ext.center.x + 128 && y > ext.center.x - 128) {
            var dist = Math.floor(Math.sqrt((x - ext.center.x) ^ 2 + (y - ext.center.y) ^ 2));
            var heat = 255 - Math.abs(dist - radi) * 33
            if (heat > 0) color = 'rgb(' + heat - +',0,0,0.7)';
        }
        context.fillStyle = 'black'; //need list of available colors
        context.fillRect(x, y, 1, 1);*/
        /* */
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x, y - 1);
        context.lineTo(x, y + 1);
        context.stroke();
        context.closePath();
        context.beginPath();
        context.moveTo(x - 1, y);
        context.lineTo(x + 1, y);
        context.stroke();
        context.closePath();
    }

    function gridit() {
        var ext = {};
        ext.center = {
            x: 0,
            y: 0
        };
        var aniRadius = 0;
        ext.next = function() {
            aniRadius += 32;
            radi = aniRadius % 255;
            for (var i = 0; i < colCount; i++) {
                var x = i * interval + interval;
                var dotCount = w / 5;

                for (var doti = 0; doti < dotCount; doti++) {
                    var y = doti * 5

                    var color = 'rgb(' + radi + ',0,0,0.7)';
                    dotted(x, y, color);
                }
            }
            for (var i = 0; i < rowCount; i++) {
                var y = i * interval + interval;
                var dotCount = w / 5;

                for (var doti = 0; doti < dotCount; doti++) {
                    var x = doti * 5
                    var color = 'rgb(' + radi + ',0,0,0.7)';
                    dotted(x, y, color);
                }
            }
        }

        return ext
    };
    cv.gridit.next();
    /*setInterval(anima.next, 200);
    $('#cv1').mouseover(function(event) {});
    $('#cv1').mousemove(function(event) {
        anima.center = {
            x: event.offsetX,
            y: event.offsetY
        }
    });
    for (var i = 0; i < colCount; i++) {
        var start = {
            x: i * 64 + 64,
            y: 0
        };
        var end = {
            x: i * 64 + 64,
            y: h
        }
        drawScreen(start, end);
    }
    */
    for (var i = 0; i < colCount; i++) {

        for (var j = 0; j < rowCount; j++) {
            var pnt = {
                x: i * 64 + 64,
                y: j * 64 + 64
            }
            drawrec(pnt);
            //chessBoard(i, j);
        }
    }
}
