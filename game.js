/*jslint bitwise:true, es5:true */
(function(window, undefined) {
    'use strict';
    var KEY_ENTER = 13,
        KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40,

        canvas = null,
        ctx = null,
        lastPress = null,
        pause = false,
        gameover = false,
        currentScene = 0,
        scenes = [],
        mainScene = null,
        gameScene = null,
        highscoresScene = null,
        body = [],
        food = null,
        bonus = null,
        count = 0,
        //var wall = [],
        highscores = [],
        posHighscore = 10,
        dir = 0,
        score = 0,
        capture = false,
        iBody = new Image(),
        iFood = new Image(),
        iBonus = new Image(),
        aEat = new Audio(),
        aDie = new Audio(),
        music = new Audio();

    window.requestAnimationFrame = (function() {
        return window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 17);
            };
    }());

    document.addEventListener('keydown', function(evt) {
        if (evt.which >= 37 && evt.which <= 40) {
            evt.preventDefault();
        }

        lastPress = evt.which;
    }, false);

    function Rectangle(x, y, width, height) {
        this.x = (x === undefined) ? 0 : x;
        this.y = (y === undefined) ? 0 : y;
        this.width = (width === undefined) ? 0 : width;
        this.height = (height === undefined) ? this.width : height;
    }

    Rectangle.prototype = {
        constructor: Rectangle,

        intersects: function(rect) {
            if (rect === undefined) {
                window.console.warn('Missing parameters on function intersects');
            } else {
                return (this.x < rect.x + rect.width &&
                    this.x + this.width > rect.x &&
                    this.y < rect.y + rect.height &&
                    this.y + this.height > rect.y);
            }
        },

        fill: function(ctx) {
            if (ctx === undefined) {
                window.console.warn('Missing parameters on function fill');
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },

        drawImage: function(ctx, img) {
            if (img === undefined) {
                window.console.warn('Missing parameters on function drawImage');
            } else {
                if (img.width) {
                    ctx.drawImage(img, this.x, this.y);
                } else {
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                }
            }
        }
    };

    function Scene() {
        this.id = scenes.length;
        scenes.push(this);
    }

    Scene.prototype = {
        constructor: Scene,
        load: function() {},
        paint: function(ctx) {},
        act: function() {}
    };

    function loadScene(scene) {
        currentScene = scene.id;
        scenes[currentScene].load();
        music.play();
    }

    function random(max) {
        return ~~(Math.random() * max);
    }

    function canPlayOgg() {
        var aud = new Audio();
        if (aud.canPlayType('audio/ogg').replace(/no/, '')) {
            return true;
        } else {
            return false;
        }
    }

    function addHighscore(score) {
        posHighscore = 0;
        while (highscores[posHighscore] > score && posHighscore < highscores.length) {
            posHighscore += 1;
        }
        highscores.splice(posHighscore, 0, score);
        if (highscores.length > 10) {
            highscores.length = 10;
        }
        localStorage.highscores = highscores.join(',');
    }

    function repaint() {
        window.requestAnimationFrame(repaint);
        if (scenes.length) {
            scenes[currentScene].paint(ctx);
        }
    }

    function run() {
        setTimeout(run, 50);
        if (scenes.length) {
            scenes[currentScene].act();
        }
    }

    function init() {
        // Get canvas and context
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        // Load assets
        iBody.src = 'assets/body.png';
        iFood.src = 'assets/fruit.png';
        iBonus.src = 'assets/bonus.png';
        if (canPlayOgg()) {
            aEat.src = 'assets/chomp.oga';
            aDie.src = 'assets/dies.oga';
        } else {
            aEat.src = 'assets/chomp.m4a';
            aDie.src = 'assets/dies.m4a';
        }
        music.src = 'assets/dub.mp3';

        // Create food
        food = new Rectangle(80, 80, 10, 10);

        // Create bonus
        bonus = new Rectangle(80, 80, 10, 10);

        // Create walls
        //wall.push(new Rectangle(100, 50, 10, 10));
        //wall.push(new Rectangle(100, 100, 10, 10));
        //wall.push(new Rectangle(200, 50, 10, 10));
        //wall.push(new Rectangle(200, 100, 10, 10));

        // Load saved highscores
        if (localStorage.highscores) {
            highscores = localStorage.highscores.split(',');
        }

        // Start game
        run();
        repaint();
    }

    function request() {
        fetch(`https://jsonplaceholder.typicode.com/?score=${score}`)
            .then(() => {
                console.log(`Score sent successfully: ${score}`);
                capture = false;
            })
            .catch(() => {
                console.log('Error trying to send the score');
            });
    }

    // Main Scene
    mainScene = new Scene();

    mainScene.paint = function(ctx) {
        // Clean canvas
        ctx.fillStyle = '#001';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#009900';
        ctx.textAlign = 'center';
        ctx.font = '50px Verdana';
        ctx.shadowColor = "green";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText('SNAKE', 400, 180);
        ctx.fillStyle = '#fff';
        ctx.font = '25px sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText('Press Enter', 400, 270);
    };

    mainScene.act = function() {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(highscoresScene);
            lastPress = null;
        }
    };

    // Game Scene
    gameScene = new Scene();

    gameScene.load = function() {
        score = 0;
        dir = 1;
        body.length = 0;
        body.push(new Rectangle(40, 40, 10, 10));
        body.push(new Rectangle(0, 0, 10, 10));
        body.push(new Rectangle(0, 0, 10, 10));
        food.x = random(canvas.width / 10 - 1) * 10;
        food.y = random(canvas.height / 10 - 1) * 10;
        bonus.x = random(canvas.width / 10 - 1) * 10;
        bonus.y = random(canvas.height / 10 - 1) * 10;
        gameover = false;
    };

    gameScene.paint = function(ctx) {
        var i = 0,
            l = 0;

        // Clean canvas
        ctx.fillStyle = '#001';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw player
        ctx.strokeStyle = '#0f0';
        ctx.shadowOffsetX = '0';
        ctx.shadowOffsetY = '0';
        for (i = 0, l = body.length; i < l; i += 1) {
            body[i].drawImage(ctx, iBody);
        }

        // Draw walls
        //ctx.fillStyle = '#999';
        //for (i = 0, l = wall.length; i < l; i += 1) {
        // wall[i].fill(ctx);
        //}

        // Draw food
        ctx.strokeStyle = '#f00';
        ctx.shadowOffsetX = '0';
        ctx.shadowOffsetY = '0';
        food.drawImage(ctx, iFood);

        // Draw bonus
        if (count === 5) {
            ctx.strokeStyle = '#00f';
            ctx.shadowOffsetX = '0';
            ctx.shadowOffsetY = '0';
            bonus.drawImage(ctx, iBonus);
        }

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '18px sans-serif';
        ctx.shadowOffsetX = '2';
        ctx.shadowOffsetY = '2';
        ctx.fillText('Score: ' + score, 10, 25);

        // Debug last key pressed
        //ctx.fillText('Last Press: '+lastPress,0,20);

        // Draw pause
        if (pause) {
            ctx.textAlign = 'center';
            if (gameover) {
                ctx.fillText('GAME OVER', 400, 230);
            } else {
                ctx.font = '25px sans-serif';
                ctx.fillText('PAUSE', 400, 230);
            }
        }
    };

    gameScene.act = function() {
        var i = 0,
            l = 0;

        if (!pause) {
            // GameOver Reset
            if (gameover) {
                loadScene(highscoresScene);
            }

            // Move Body
            for (i = body.length - 1; i > 0; i -= 1) {
                body[i].x = body[i - 1].x;
                body[i].y = body[i - 1].y;
            }

            // Change Direction
            if (lastPress === KEY_UP && dir !== 2) {
                dir = 0;
            }
            if (lastPress === KEY_RIGHT && dir !== 3) {
                dir = 1;
            }
            if (lastPress === KEY_DOWN && dir !== 0) {
                dir = 2;
            }
            if (lastPress === KEY_LEFT && dir !== 1) {
                dir = 3;
            }

            // Move Head
            if (dir === 0) {
                body[0].y -= 13;
            }
            if (dir === 1) {
                body[0].x += 13;
            }
            if (dir === 2) {
                body[0].y += 13;
            }
            if (dir === 3) {
                body[0].x -= 13;
            }

            // Out Screen
            if (body[0].x > canvas.width - body[0].width) {
                body[0].x = 0;
            }
            if (body[0].y > canvas.height - body[0].height) {
                body[0].y = 0;
            }
            if (body[0].x < 0) {
                body[0].x = canvas.width - body[0].width;
            }
            if (body[0].y < 0) {
                body[0].y = canvas.height - body[0].height;
            }

            // Food Intersects
            if (body[0].intersects(food)) {
                body.push(new Rectangle(0, 0, 10, 10));
                score += 1;
                food.x = random(canvas.width / 10 - 1) * 10;
                food.y = random(canvas.height / 10 - 1) * 10;
                aEat.play();
                count < 5 ? count++ : count = 0;
            }

            // Bonus Intersects
            if (body[0].intersects(bonus) && count === 5) {
                capture = true;
                request();
                score += 5;
                count = 0;
                bonus.x = random(canvas.width / 10 - 1) * 10;
                bonus.y = random(canvas.height / 10 - 1) * 10;
                aEat.play();
            }

            // Wall Intersects
            //for (i = 0, l = wall.length; i < l; i += 1) {
            // if (food.intersects(wall[i])) {
            // food.x = random(canvas.width / 10 - 1) * 10;
            // food.y = random(canvas.height / 10 - 1) * 10;
            // }
            //
            // if (body[0].intersects(wall[i])) {
            // gameover = true;
            // pause = true;
            // }
            //}

            // Body Intersects
            for (i = 2, l = body.length; i < l; i++) {
                if (body[0].intersects(body[i])) {
                    gameover = true;
                    pause = true;
                    aDie.play();
                }
            }
        }

        // Pause/Unpause
        if (lastPress === KEY_ENTER) {
            pause = !pause;
            lastPress = null;
        }
    };

    // Highscore Scene
    highscoresScene = new Scene();

    highscoresScene.paint = function(ctx) {
        var i = 0,
            l = 0;

        // Clean canvas
        ctx.fillStyle = '#001';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', 400, 180);

        // Draw high scores
        ctx.textAlign = 'right';
        for (i = 0, l = highscores.length; i < l; i += 1) {
            if (i === posHighscore) {
                ctx.fillText('*' + highscores[i], 180, 40 + i * 10);
            } else {
                ctx.fillText(highscores[i], 180, 40 + i * 10);
            }
        }
    };

    highscoresScene.act = function() {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(gameScene);
            lastPress = null;
        }
    };

    window.addEventListener('load', init, false);
}(window));