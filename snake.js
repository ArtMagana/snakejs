// Snake.js game, AI, and drawing utilities

// TODO: move global game functions into a class
var canvas = document.getElementById('board');
var ctx = canvas.getContext('2d');
var CANVAS_DIMENSION = 600; //TODO scale with canvas
var DIMENSION = 20;
var TILE_DIMENSION = CANVAS_DIMENSION / DIMENSION;
var SNAKE_INIT_LEN = 5;
var SNAKE_LEN_STEP = 1;
var snakes = [];
var gameOver = false;
// Board key -- TODO make symbols
// 0 = empty
// 1 = nibble
// i > 1 = snake i-1
var board = new Array (DIMENSION);
var nibblex = 0;
var nibbley = 0;

////////////////////////////////////////////////////////////////////////////////

function gameInit(){
    // Create the board
    for (var i=0; i<DIMENSION; i++){
        board[i] = new Array(DIMENSION);
        j = DIMENSION;
        while(j--) board[i][j] = 0;
    }
    // Reset 
    gameReset();

    // Play
    window.setInterval(gameMain, 1);
}

function gameReset(){
    // Clear the board
    for (var i=0; i<DIMENSION; i++){
        for (var j=0; j<DIMENSION; j++){
            board[i][j] = 0;
        }
    }

    // Create the snake and position it
    var id = 1;
    var headPos = [DIMENSION/2, DIMENSION/2];
    var tailPos = [headPos[0], headPos[1] + SNAKE_INIT_LEN - 1];
    snakes[id-1] = new SnakeAgent (id, headPos, tailPos);
    for (var i=headPos[1]; i<= tailPos[1]; i++){
        board[headPos[0]][i] = id+1;
    }

    // Position the nibble
    newNibble();
}

function newNibble (){
    do {
        nibblex = Math.floor(Math.random() * DIMENSION);
        nibbley = Math.floor(Math.random() * DIMENSION);
    } while (board[nibblex][nibbley] != 0);
    board[nibblex][nibbley] = 1;
    console.log("new nibble: ({0},{1})".format(nibblex, nibbley));
}

function gameMain (){
    if (!gameOver) {
        gameDraw();
        var candidateHead = snakes[0].proposeMove();
        console.log("candidate head: ({0},{1})".format(candidateHead[0], candidateHead[1]));
        result = detectCollision(candidateHead);
        console.log(result);
        if (result.match("died") != null){
            gameOver = true;
        }
        else if (result == "nibble_eaten"){
            newNibble();
            snakes[0].grow();
        }
        else if (result == "ok"){
            snakes[0].grow();
            snakes[0].popTail();
        }
        snakes[0].printSnake();
    }
}

function detectCollision (candidateHead){
    var candx = candidateHead[0];
    var candy = candidateHead[1];

    if ((candx < 0) || (candx >= DIMENSION) || (candy < 0) || (candy >= DIMENSION)){
        return "died_board_edge";
    }
    else if (board[candx][candy] >= 2){
        return "died_hit_self";
    }
    else if (candx == nibblex && candy == nibbley){
        return "nibble_eaten";
    }
    else {
        return "ok";
    }
}

function gameDraw (){
    //console.log("Drawing");
    var outlineTile = false;
    var tileColour = 0;
    for (var i=0; i<DIMENSION; i++){
        for (var j=0; j<DIMENSION; j++){
            switch (board[i][j]){
                case 0:
                    ctx.fillStyle = "white";
                    outlineTile = true;
                    break;
                case 1:
                    ctx.fillStyle = "red";
                    break;
                default:
                    ctx.fillStyle = "green";
            }
            ctx.fillRect(i*TILE_DIMENSION, j*TILE_DIMENSION, TILE_DIMENSION, TILE_DIMENSION);
            if (outlineTile){
                ctx.fillRect(i*TILE_DIMENSION, j*TILE_DIMENSION, TILE_DIMENSION, TILE_DIMENSION);
                outlineTile = false;
            }
        }
    }
}

// Define an abstract SnakeAgent class

var SnakeAgent = function (id, headPos, tailPos) {
    this.id = id;
    this.pos = [];
    this.headPos = headPos;
	this.len = tailPos[1] - headPos[1] + 1;
    this.candidateHead = [-1,-1];
    for (var i=0; i<= this.len; i++){
        this.pos[i] = [this.headPos[0], tailPos[1]-i];
    }

    this.printSnake();
}

SnakeAgent.prototype.dumbMove = function (){
    // Randomly select next move as long as it doesn't interesect self
    var direction = 0;
    var headx, heady;
    var collision = false;
    var directions_tried = [false, false, false, false];
    var dead_end = false;
    for (;;) {
        headx = this.headPos[0];
        heady = this.headPos[1];
        collision = false;
        // 0=L, 1=R, 2=U, 3=D
        direction = Math.floor (Math.random() * 4);
        if (directions_tried[direction] && !dead_end) {
            continue;
        }
        else {
            console.log("direction: {0}".format(direction));
            directions_tried[direction] = true;
            dead_end = true;
            for (var i=0; i<4; i++){
                dead_end &= directions_tried[i];
            }
            if (dead_end) {
                console.log("No other choices for direction");
            }
        }

        //console.log("direction={0}".format(direction));
        switch (direction){
            case 0:
                headx -= 1;
                break;
            case 1:
                headx += 1;
                break;
            case 2:
                heady += 1;
                break;
            case 3:
                heady -= 1;
                break;
        }

        for (var i=0; i<this.pos.length; i++){
            if (((this.pos[i][0] == headx) && (this.pos[i][1] == heady))
                || ((headx < 0) || (headx >= DIMENSION) || (heady < 0) || (heady >= DIMENSION))) {
                console.log("badhead: ({0},{1}) ".format(headx, heady));
                collision = true;
            }
        }

        //Break conditions
        if (dead_end || (!collision && !dead_end)) {
            break;
        }
    }
    //console.debug("new head chosen");
    return [headx, heady];
}

SnakeAgent.prototype.proposeMove = function (newHead){
    this.candidateHead = this.dumbMove();
    return this.candidateHead;
}

SnakeAgent.prototype.grow = function (){
    this.headPos = this.candidateHead;
    console.log("new head: ({0},{1})".format(this.headPos[0], this.headPos[1]));
    this.pos.push(this.candidateHead);
    this.len++;
    board[this.headPos[0]][this.headPos[1]] = this.id + 1;
}

SnakeAgent.prototype.popTail = function (){
    var oldTail = this.pos.splice(0, 1)[0];
    console.log("oldTail: ({0},{1})".format(oldTail[0], oldTail[1]));
    this.len--;
    board[oldTail[0]][oldTail[1]] = 0;
}

SnakeAgent.prototype.printSnake = function() {
    var snakeStr = "Snake: [";
    var x,y;

    for (var i=0; i<this.pos.length; i++){
        x = this.pos[i][0];
        y = this.pos[i][1];
        snakeStr += "(" + x.toString() + "," + y.toString() + "), ";
    }
    snakeStr += "]";
    console.log(snakeStr);
}

// end SnakeAgent

// Define a derived SnakeAi class

// end SnakeAi

String.prototype.format = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
