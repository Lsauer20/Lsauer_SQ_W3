// ============================================================
// NEON BRAWL - Themed Fighting Game (FIXED)
// ============================================================

const STATE_START = "start";
const STATE_FIGHT = "fight";
const STATE_WIN   = "win";

let gameState = STATE_START;
let winner = null;

// ---------------- SOUNDS ----------------
let winSound;
let bgMusic;
let powerSound;
let jumpSound;

// Screen hit flash
let hitFlashScreen = 0;

// ---------------- FIGHTER CLASS ----------------
class Fighter {
  constructor(x, y, colour, controls, label) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.speed = 0.5;
    this.maxSpeed = 4;
    this.friction = 0.78;
    this.r = 28;

    this.colour = colour;
    this.label = label;
    this.blobT = random(100);

    this.controls = controls;

    this.maxHealth = 3;
    this.health = 3;

    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 18;
    this.attackCooldown = 0;
    this.punchReach = 55;
    this.punchDir = 1;

    this.isBlocking = false;
    this.hitFlash = 0;
    this.hitLanded = false;
  }

  update() {
    if (gameState !== STATE_FIGHT) return;

    this.handleInput();
    this.applyPhysics();

    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.hitLanded = false;
        this.attackCooldown = 20;
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hitFlash > 0) this.hitFlash--;
  }

  handleInput() {
    if (keyIsDown(this.controls.left))  this.vx -= this.speed;
    if (keyIsDown(this.controls.right)) this.vx += this.speed;

    this.vx = constrain(this.vx, -this.maxSpeed, this.maxSpeed);

    if (!keyIsDown(this.controls.left) && !keyIsDown(this.controls.right)) {
      this.vx *= this.friction;
    }

    this.isBlocking = keyIsDown(this.controls.block);
  }

  applyPhysics() {
    this.x += this.vx;
    this.x = constrain(this.x, this.r, width - this.r);
  }

  startAttack(targetX) {
    if (this.isAttacking || this.attackCooldown > 0) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.hitLanded = false;

    this.punchDir = targetX > this.x ? 1 : -1;

    powerSound.play();
  }

  getPunchX() {
    return this.x + this.punchDir * this.punchReach;
  }

  takeHit() {
    if (this.isBlocking) return;

    this.health--;
    this.hitFlash = 12;
    hitFlashScreen = 6;

    if (this.health <= 0) {
      this.health = 0;
      endGame(this.label === "P1" ? "P2" : "P1");
    }
  }

  draw() {
    push();

    if (this.isBlocking) {
      noFill();
      stroke(255, 255, 255, 150);
      strokeWeight(3);
      ellipse(this.x, this.y, (this.r + 16) * 2);
    }

    if (this.isAttacking) {
      fill(this.hitFlash > 0 ? color(255) : this.colour);
      ellipse(this.getPunchX(), this.y, 20);
    }

    fill(this.hitFlash > 0 ? color(255) : this.colour);

    beginShape();
    for (let i = 0; i < 48; i++) {
      let angle = (TWO_PI / 48) * i;
      let noiseVal = noise(
        cos(angle) * 0.8 + this.blobT,
        sin(angle) * 0.8 + this.blobT
      );
      let r = this.r + map(noiseVal, 0, 1, -7, 7);
      vertex(this.x + cos(angle) * r, this.y + sin(angle) * r);
    }
    endShape(CLOSE);

    fill(10);
    ellipse(this.x - 9, this.y - 7, 8);
    ellipse(this.x + 9, this.y - 7, 8);

    pop();

    this.blobT += 0.015;
  }
}

// ---------------- GLOBALS ----------------
let fighter1, fighter2;
let groundY;

// ---------------- PRELOAD ----------------
function preload() {
  bgMusic   = loadSound("assets/sounds/BMusic.mp3");
  powerSound = loadSound("assets/sounds/power.wav");
  jumpSound  = loadSound("assets/sounds/Jump.wav");
  winSound   = loadSound("assets/sounds/win.wav");
}

// ---------------- SETUP ----------------
function setup() {
  createCanvas(800, 450);
  groundY = height - 80;
  setupFighters();
}

function setupFighters() {
  fighter1 = new Fighter(
    200,
    groundY - 28,
    color(0, 255, 200),
    { left: 65, right: 68, attack: 70, block: 71 },
    "P1"
  );

  fighter2 = new Fighter(
    600,
    groundY - 28,
    color(255, 120, 0),
    { left: LEFT_ARROW, right: RIGHT_ARROW, attack: 75, block: 76 },
    "P2"
  );
}

// ---------------- DRAW LOOP ----------------
function draw() {
  let pulse = map(sin(frameCount * 0.05), -1, 1, 10, 40);
  background(10, 10, pulse);

  if (gameState === STATE_START) {
    drawStartScreen();
  } else if (gameState === STATE_FIGHT) {
    drawArena();
    updateAndDrawFighters();
    checkHits();
    drawHealthBars();
    drawFightHUD();

    if (hitFlashScreen > 0) {
      fill(255, 255, 255, 100);
      rect(0, 0, width, height);
      hitFlashScreen--;
    }

  } else if (gameState === STATE_WIN) {
    drawArena();
    fighter1.draw();
    fighter2.draw();
    drawWinScreen();
  }
}

// ---------------- GAME FLOW ----------------
function startGame() {
  gameState = STATE_FIGHT;
  winner = null;
  setupFighters();

  if (!bgMusic.isPlaying()) bgMusic.loop();
  jumpSound.play();
}

function endGame(winnerLabel) {
  gameState = STATE_WIN;
  winner = winnerLabel;
  bgMusic.stop();
  winSound.play();
}

// ---------------- SCREENS ----------------
function drawStartScreen() {
  background(5, 0, 20);

  textAlign(CENTER);

  fill(0, 255, 200);
  textSize(60);
  text("NEON BRAWL", width / 2, height / 2 - 80);

  fill(180);
  textSize(18);
  text("Step into the arena...", width / 2, height / 2 - 30);

  textSize(14);
  fill(0, 200, 255);
  text("P1: A/D move   F attack   G block", width / 2, height / 2 + 20);
  fill(255, 120, 0);
  text("P2: Arrows move   K attack   L block", width / 2, height / 2 + 45);

  fill(255);
  textSize(20 + sin(frameCount * 0.1) * 3);
  text("Press ENTER to FIGHT", width / 2, height / 2 + 110);
}

function drawWinScreen() {
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);

  let winColor = winner === "P1"
    ? color(0, 255, 200)
    : color(255, 120, 0);

  fill(winColor);
  textAlign(CENTER);

  textSize(64);
  text(winner + " DOMINATES!", width / 2, height / 2 - 40);

  fill(255);
  textSize(20);
  text("Press ENTER to run it back", width / 2, height / 2 + 50);
}

function drawArena() {
  fill(20, 20, 40);
  rect(0, groundY, width, height - groundY);

  stroke(0, 255, 200);
  strokeWeight(2);
  line(0, groundY, width, groundY);

  stroke(100, 100, 255, 120);
  line(width / 2, groundY, width / 2, groundY - 200);
}

// ---------------- GAME LOGIC ----------------
function updateAndDrawFighters() {
  fighter1.update();
  fighter2.update();
  fighter1.draw();
  fighter2.draw();
}

function checkHits() {
  if (fighter1.isAttacking && !fighter1.hitLanded) {
    if (abs(fighter1.getPunchX() - fighter2.x) < fighter2.r + 10) {
      fighter2.takeHit();
      fighter1.hitLanded = true;
    }
  }

  if (fighter2.isAttacking && !fighter2.hitLanded) {
    if (abs(fighter2.getPunchX() - fighter1.x) < fighter1.r + 10) {
      fighter1.takeHit();
      fighter2.hitLanded = true;
    }
  }
}

// ---------------- FIXED HEALTH BARS ----------------
function drawHealthBars() {
  let barW = 200;
  let barH = 18;
  let y = 45;
  let p = 30;

  // P1
  fill(40);
  rect(p, y, barW, barH);
  fill(0, 255, 200);
  rect(p, y, map(fighter1.health, 0, 3, 0, barW), barH);

  // P2 ✅ FIXED
  fill(40);
  rect(width - p - barW, y, barW, barH);

  let p2W = map(fighter2.health, 0, 3, 0, barW);

  fill(255, 120, 0);
  rect(width - p - p2W, y, p2W, barH);

  fill(255);
  textSize(13);
  textAlign(LEFT);
  text("P1", p, y - 5);

  textAlign(RIGHT);
  text("P2", width - p, y - 5);
}

// ---------------- UI ----------------
function drawFightHUD() {
  fill(120);
  textSize(12);
  textAlign(LEFT);
  text("A/D move   F attack   G block", 16, height - 12);
  textAlign(RIGHT);
  text("Arrows move   K attack   L block", width - 16, height - 12);
}

// ---------------- INPUT ----------------
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === STATE_START || gameState === STATE_WIN) {
      startGame();
    }
  }

  if (keyCode === 70 && gameState === STATE_FIGHT) {
    fighter1.startAttack(fighter2.x);
  }

  if (keyCode === 75 && gameState === STATE_FIGHT) {
    fighter2.startAttack(fighter1.x);
  }
}

