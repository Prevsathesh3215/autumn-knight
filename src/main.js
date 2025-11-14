import Phaser from "phaser";
import Knight from "./knight";
import Mage from "./mage";
import Minotaur from "./minotaur";
import Enemy from "./enemy";

// Helper function to get correct asset path for both Vite dev and Electron production
function getAssetPath(path) {
  // Remove leading slash and use relative path for Electron compatibility
  // Vite serves public folder at root in dev, but Electron needs relative paths
  return path.startsWith("/") ? `.${path}` : path;
}

// Helper function to ensure Google Font is loaded
async function ensureFontLoaded() {
  // Wait for document to be ready
  if (document.readyState !== "complete") {
    await new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  }

  if (document.fonts && document.fonts.ready) {
    try {
      // Wait for all fonts to be ready
      await document.fonts.ready;

      // Try to load the specific font
      const fontSpec = '16px "Press Start 2P"';
      if (!document.fonts.check(fontSpec)) {
        await document.fonts.load(fontSpec);
      }

      // Verify it's loaded
      let attempts = 0;
      while (!document.fonts.check(fontSpec) && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (document.fonts.check(fontSpec)) {
        console.log("✓ Press Start 2P font loaded successfully");
        return Promise.resolve();
      } else {
        console.warn("⚠ Font may not be loaded, but continuing anyway");
      }
    } catch (e) {
      console.warn("Font loading error:", e);
    }
  } else {
    // Fallback: wait a bit for font to load
    console.warn("Font Loading API not available, waiting 500ms");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Helper function to create text with Google Font
// Usage: createTextWithFont(scene, x, y, text, fontSize, color)
// Example: const scoreText = createTextWithFont(this, 100, 50, "Score: 0", 24, "#ffffff");
function createTextWithFont(
  scene,
  x,
  y,
  text,
  fontSize = 16,
  color = "#ffffff"
) {
  // Use the exact font family name from Google Fonts
  const fontFamily = "Press Start 2P";

  return scene.add.text(x, y, text, {
    fontFamily: `"${fontFamily}", monospace`, // Use the Google Font from index.html
    fontSize: `${fontSize}px`, // Phaser prefers string format for fontSize
    color: color,
  });
}

function setupEnemyCollisions(scene, enemy) {
  scene.physics.add.overlap(enemy.attackHitbox, knight, () => {
    knight.takeDamage(1);
  });
  scene.physics.add.overlap(enemy.attackHitbox, mage, () => {
    mage.takeDamage(1.5);
  });
  scene.physics.add.overlap(knight.attackHitbox, enemy, () => {
    if (
      knight.attackHitbox.active &&
      scene.currentPlayer === knight &&
      !enemy.isDead
    ) {
      enemy.takeDamage(1);
    }
  });
  scene.physics.add.overlap(mage.attackHitbox, enemy, () => {
    if (
      mage.attackHitbox.active &&
      scene.currentPlayer === mage &&
      !enemy.isDead
    ) {
      enemy.takeDamage(3);
    }
  });
}

function handlePlayerSwitch(scene) {
  console.log(
    "handlePlayerSwitch called, currentPlayer:",
    currentPlayer === knight ? "Knight" : "Mage"
  );

  const prev = currentPlayer;
  const next = currentPlayer === knight ? mage : knight;

  console.log(
    "Switching from",
    prev === knight ? "Knight" : "Mage",
    "to",
    next === knight ? "Knight" : "Mage"
  );
  console.log("Mage active:", mage.active, "visible:", mage.visible);
  console.log("Knight active:", knight.active, "visible:", knight.visible);

  // Sync position + facing
  next.x = prev.x;
  next.y = prev.y;
  next.flipX = prev.flipX;

  // Stop movement
  prev.setVelocity(0);
  next.setVelocity(0);

  // Toggle visible/active
  prev.setVisible(false);
  if (prev.setActive) prev.setActive(false);
  next.setVisible(true);
  if (next.setActive) next.setActive(true);

  // Force set the correct texture first, BEFORE playing animation
  const textureKey = next === knight ? "knight_idle" : "mage_idle";
  console.log(
    "Setting texture to:",
    textureKey,
    "for",
    next === knight ? "Knight" : "Mage"
  );
  next.setTexture(textureKey, 0);

  // Stop any current animation first
  if (next.anims) {
    next.anims.stop();
  }

  // Then play the idle animation - use character-specific keys
  const idleKey = next === knight ? "idle" : "mage_idle";
  next.anims.play(idleKey, true);

  // Force refresh the texture again after animation to ensure it's correct
  if (next.texture.key !== textureKey) {
    console.error(
      "Texture mismatch! Expected:",
      textureKey,
      "Got:",
      next.texture.key
    );
    next.setTexture(textureKey, 0);
  }
  next.setDepth(10); // Make sure it's above background
  prev.setDepth(9); // Lower when inactive

  // Bring the active character to front
  if (next.parentContainer) {
    next.parentContainer.bringToTop(next);
  }

  // Force update the display
  next.setVisible(true);
  next.clearTint(); // Remove any tint that might make it invisible

  console.log(
    "Next character texture:",
    next.texture?.key || "MISSING",
    "visible:",
    next.visible,
    "active:",
    next.active
  );

  // Disable the prev physics body and enable next body
  if (prev.body) prev.body.enable = false;
  if (next.body) next.body.enable = true;

  // Ensure hitboxes are disabled by default; they will be enabled by attack logic only
  if (prev.attackHitbox && prev.attackHitbox.body)
    prev.attackHitbox.body.enable = false;
  if (next.attackHitbox && next.attackHitbox.body)
    next.attackHitbox.body.enable = false;

  // Sync healthbar position & ensure only next's healthbar is visible (if you toggle visibility)
  if (prev.healthBar && prev.healthBar.bar)
    prev.healthBar.bar.setVisible(false);
  if (next.healthBar && next.healthBar.bar) next.healthBar.bar.setVisible(true);
  if (next.healthBar) next.healthBar.follow(next);

  currentPlayer = next;
  scene.currentPlayer = currentPlayer; // Update scene reference

  console.log(
    "After switch - Mage visible:",
    mage.visible,
    "Knight visible:",
    knight.visible
  );
  console.log(
    "New currentPlayer:",
    currentPlayer === knight ? "Knight" : "Mage"
  );
}

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: { preload, create, update },
};

let knight;
let mage;
let cursors;
let attackKey;
let blockKey;
let runKey;
let magicKey;
let restartKey;

let currentPlayer;
let switchKey;

const game = new Phaser.Game(config);

function preload() {
  this.enemies = []; // store all enemies in the scene

  // Background layers (using helper for Electron compatibility)
  this.load.image(
    "bg_back",
    getAssetPath("/background/parallax-forest-back-trees.png")
  );
  this.load.image(
    "bg_lights",
    getAssetPath("/background/parallax-forest-lights.png")
  );
  this.load.image(
    "bg_middle",
    getAssetPath("/background/parallax-forest-middle-trees.png")
  );
  this.load.image(
    "bg_front",
    getAssetPath("/background/parallax-forest-front-trees.png")
  );

  // MAGE

  this.load.spritesheet("mage_idle", getAssetPath("/female_player/Idle.png"), {
    frameWidth: 128,
    frameHeight: 71,
  });

  this.load.spritesheet("mage_walk", getAssetPath("/female_player/Walk.png"), {
    frameWidth: 128,
    frameHeight: 71,
  });

  this.load.spritesheet("mage_run", getAssetPath("/female_player/Run.png"), {
    frameWidth: 128,
    frameHeight: 71,
  });

  this.load.spritesheet("mage_dead", getAssetPath("/female_player/Dead.png"), {
    frameWidth: 128,
    frameHeight: 71,
  });

  this.load.spritesheet(
    "mage_attack",
    getAssetPath("/female_player/Attack_1.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "mage_attack_two",
    getAssetPath("/female_player/Attack_2.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "mage_magic",
    getAssetPath("/female_player/Light_charge.png"),
    {
      frameWidth: 128,
      frameHeight: 72,
    }
  );

  // KNIGHT

  this.load.spritesheet(
    "knight_idle",
    getAssetPath("/knight/knight_idle.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_walking",
    getAssetPath("/knight/knight_walking.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_running",
    getAssetPath("/knight/knight_running.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_attack",
    getAssetPath("/knight/knight_attack.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_attack_two",
    getAssetPath("/knight/knight_attack_2.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_attack_three",
    getAssetPath("/knight/knight_attack_3.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_block",
    getAssetPath("/knight/knight_block.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  this.load.spritesheet(
    "knight_dead",
    getAssetPath("/knight/knight_dead.png"),
    {
      frameWidth: 128,
      frameHeight: 71,
    }
  );

  // MINOTAUR

  this.load.spritesheet(
    "minotaur_idle",
    getAssetPath("/enemies/minotaur/minotaur_idle.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "minotaur_attack",
    getAssetPath("/enemies/minotaur/minotaur_attack.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "minotaur_walking",
    getAssetPath("/enemies/minotaur/minotaur_walking.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "minotaur_dead",
    getAssetPath("/enemies/minotaur/minotaur_dead.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  // TENGU
  this.load.spritesheet(
    "tengu_idle",
    getAssetPath("/enemies/yamabushi_tengu/Idle.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "tengu_attack",
    getAssetPath("/enemies/yamabushi_tengu/Attack_1.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "tengu_walking",
    getAssetPath("/enemies/yamabushi_tengu/Walk.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "tengu_dead",
    getAssetPath("/enemies/yamabushi_tengu/Dead.png"),
    {
      frameWidth: 128,
      frameHeight: 128,
    }
  );

  // HOODED KNIGHT

  this.load.spritesheet(
    "boss_idle",
    getAssetPath("/frost_guardian/sprite_0.PNG"),
    {
      frameWidth: 192,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "boss_walking",
    getAssetPath("/frost_guardian/sprite_1.PNG"),
    {
      frameWidth: 192,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "boss_attack",
    getAssetPath("/frost_guardian/sprite_2.PNG"),
    {
      frameWidth: 192,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "boss_dead",
    getAssetPath("/frost_guardian/sprite_4.png"),
    {
      frameWidth: 192,
      frameHeight: 128,
    }
  );

  this.load.spritesheet(
    "boss_spawn",
    getAssetPath("/frost_guardian/sprite_4.png"),
    {
      frameWidth: 192,
      frameHeight: 128,
    }
  );

  this.load.audio("bg_music", getAssetPath("/battle_music.mp3"));
  this.load.audio("boss_music", getAssetPath("/boss_music.mp3"));
  this.load.audio("victory_music", getAssetPath("/victory_fanfare.mp3"));
}

function create() {
  this.cameras.main.setBackgroundColor("#222");

  const { width, height } = this.scale;

  // 🟠 Create seamless looping parallax layers
  const bgLayers = [
    { key: "bg_back", depth: -10, speed: 0.1 },
    { key: "bg_lights", depth: -9, speed: 0.15 },
    { key: "bg_middle", depth: -8, speed: 0.4 },
    { key: "bg_front", depth: -7, speed: 0.8 },
  ];

  // Store layer data for seamless looping
  this.bgLayerData = {};

  bgLayers.forEach((layerConfig) => {
    const tex = this.textures.get(layerConfig.key).getSourceImage();
    const scaleX = width / tex.width;
    const scaleY = height / tex.height;
    const scale = Math.max(scaleX, scaleY);
    const scaledWidth = tex.width * scale;

    // Create 3 copies of each layer for seamless looping
    const images = [];
    for (let i = 0; i < 3; i++) {
      const img = this.add.image(i * scaledWidth, 0, layerConfig.key);
      img.setScale(scale);
      img.setOrigin(0, 0);
      img.setDepth(layerConfig.depth);
      images.push(img);
    }

    // Store layer configuration
    this.bgLayerData[layerConfig.key] = {
      images: images,
      speed: layerConfig.speed,
      scaledWidth: scaledWidth,
      offset: 0, // Track total offset for wrapping
    };
  });

  // 🎵 Background music (create once, outside the loop)
  this.bgMusic = this.sound.add("bg_music", {
    loop: true,
    volume: 0.5,
  });

  this.bossMusic = this.sound.add("boss_music", {
    loop: true,
    volume: 0.8,
  });

  this.victoryMusic = this.sound.add("victory_music", {
    loop: true,
    volume: 0.8,
  });

  // Start playing background music
  this.bgMusic.play();

  // 🎮 Input setup
  cursors = this.input.keyboard.createCursorKeys();
  attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  blockKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  runKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  magicKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

  // ⚔️ Characters - start at same position
  const startX = 250;
  const startY = 600;

  // Verify textures exist before creating sprites
  if (!this.textures.exists("knight_idle")) {
    console.error("ERROR: knight_idle texture not loaded!");
  }
  if (!this.textures.exists("mage_idle")) {
    console.error("ERROR: mage_idle texture not loaded!");
  }

  knight = new Knight(this, startX, startY);
  mage = new Mage(this, startX, startY);

  // Force set textures immediately after creation
  console.log("Knight texture after creation:", knight.texture?.key);
  console.log("Mage texture after creation:", mage.texture?.key);

  // Force correct textures
  knight.setTexture("knight_idle", 0);
  mage.setTexture("mage_idle", 0);

  // Verify textures are correct
  if (knight.texture?.key !== "knight_idle") {
    console.error("Knight texture is wrong:", knight.texture?.key);
  }
  if (mage.texture?.key !== "mage_idle") {
    console.error("Mage texture is wrong:", mage.texture?.key, "- fixing now");
    mage.setTexture("mage_idle", 0);
    // Stop animation and restart to refresh
    if (mage.anims) {
      mage.anims.stop();
      mage.anims.play("idle", true);
    }
  }

  // Set depth to ensure proper rendering
  knight.setDepth(10);
  mage.setDepth(10);

  // initial state
  this.knight = knight;
  this.mage = mage;

  // Choose who starts the game
  currentPlayer = knight; // or knight
  this.currentPlayer = currentPlayer; // Store on scene for access

  // Set initial visibility - explicitly show active, hide inactive
  if (currentPlayer === knight) {
    // Knight starts active
    knight.setVisible(true);
    knight.setActive(true);
    knight.anims.play("idle", true);
    if (knight.body) knight.body.enable = true;
    if (knight.healthBar && knight.healthBar.bar)
      knight.healthBar.bar.setVisible(true);

    // Mage starts inactive
    mage.setVisible(false);
    mage.setActive(false);
    if (mage.body) mage.body.enable = false;
    if (mage.healthBar && mage.healthBar.bar)
      mage.healthBar.bar.setVisible(false);
  } else {
    // Mage starts active
    mage.setVisible(true);
    mage.setActive(true);
    mage.anims.play("mage_idle", true);
    if (mage.body) mage.body.enable = true;
    if (mage.healthBar && mage.healthBar.bar)
      mage.healthBar.bar.setVisible(true);

    // Knight starts inactive
    knight.setVisible(false);
    knight.setActive(false);
    if (knight.body) knight.body.enable = false;
    if (knight.healthBar && knight.healthBar.bar)
      knight.healthBar.bar.setVisible(false);
  }

  switchKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

  // 📝 Example text using Google Font "Press Start 2P"
  // Wait for font to load before creating text
  ensureFontLoaded()
    .then(() => {
      this.titleText = createTextWithFont(
        this,
        width / 2,
        height / 4,
        "VICTORY!",
        32,
        "#ffffff"
      );
      this.titleText.setOrigin(0.5, 0);
      this.titleText.setDepth(100);
      this.titleText.setStroke("#000000", 4);
      this.titleText.setVisible(false);
      // Score/Stats text
      this.scoreText = createTextWithFont(
        this,
        50,
        50,
        "SCORE: 0",
        16,
        "#c8c8c5ff"
      );
      this.scoreText.setOrigin(0, 0);
      this.scoreText.setDepth(100);
      this.scoreText.setStroke("#000000", 2);

      // Instructions text
      this.instructionsText = createTextWithFont(
        this,
        width / 4 + 50,
        height - 30,
        "ARROWS: MOVE | A: ATTACK | E: SWITCH | SPACE: BLOCK | Q: CAST MAGIC AS MAGE",
        12,
        "#c8c8c5ff"
      );
      this.instructionsText.setOrigin(0.5, 0);
      this.instructionsText.setDepth(100);
      this.instructionsText.setStroke("#000000", 2);

      // Wave indicator text
      this.waveText = createTextWithFont(
        this,
        width - 50,
        50,
        "WAVE: 1",
        16,
        "#c8c8c5ff"
      );
      this.waveText.setOrigin(1, 0);
      this.waveText.setDepth(100);
      this.waveText.setStroke("#000000", 2);

      // Debug: Log to verify font is being used
      console.log("Font loaded! Text created with Press Start 2P");
    })
    .catch((err) => {
      console.warn("Font loading failed, creating text with fallback:", err);
      // Create text anyway with fallback
      this.titleText = createTextWithFont(
        this,
        width / 2,
        height / 4,
        "MY RPG",
        32,
        "#ffffff"
      );
      this.titleText.setOrigin(0.5, 0);
      this.titleText.setDepth(100);
      this.titleText.setStroke("#000000", 4);
      this.titleText.setVisible(false);

      this.scoreText = createTextWithFont(
        this,
        50,
        50,
        "SCORE: 0",
        16,
        "#c8c8c5ff"
      );
      this.scoreText.setOrigin(0, 0);
      this.scoreText.setDepth(100);
      this.scoreText.setStroke("#000000", 2);

      this.instructionsText = createTextWithFont(
        this,
        width / 2,
        height - 100,
        "ARROWS: MOVE | A: ATTACK | E: SWITCH | SPACE: BLOCK",
        12,
        "#7a7a73ff"
      );
      this.instructionsText.setOrigin(0.5, 0);
      this.instructionsText.setDepth(100);
      this.instructionsText.setStroke("#000000", 2);

      this.waveText = createTextWithFont(
        this,
        width - 50,
        50,
        "WAVE: 1",
        16,
        "#c8c8c5ff"
      );
      this.waveText.setOrigin(1, 0);
      this.waveText.setDepth(100);
      this.waveText.setStroke("#000000", 2);
    });

  const minotaurConfig = {
    key: "minotaur_idle",
    scale: 1.5,
    flipX: true,
    maxHP: 100,
    hitbox: { width: 60, height: 60, offsetX: 50, offsetY: 0 },
    animations: {
      idle: { key: "minotaur_idle", start: 0, end: 9, frameRate: 4 },
      walk: { key: "minotaur_walking", start: 0, end: 4, frameRate: 8 },
      attack: { key: "minotaur_attack", start: 0, end: 4, frameRate: 8 },
      dead: { key: "minotaur_dead", start: 0, end: 5, frameRate: 8 },
    },
  };

  // const minotaurConfig = {
  //   key: "boss_idle",
  //   scale: 3.5,
  //   flipX: true,
  //   maxHP: 500,
  //   hitbox: { width: 200, height: 200, offsetX: 50, offsetY: 0 },
  //   animations: {
  //     idle: { key: "boss_idle", start: 0, end: 5, frameRate: 4 },
  //     walk: { key: "boss_walking", start: 0, end: 9, frameRate: 8 },
  //     attack: { key: "boss_attack", start: 0, end: 13, frameRate: 8 },
  //     dead: { key: "boss_dead", start: 0, end: 15, frameRate: 8 },
  //   },
  // };

  const minotaur = new Enemy(this, 1300, 560, minotaurConfig);
  this.enemies.push(minotaur);

  this.minotaur = minotaur;
  setupEnemyCollisions(this, minotaur);

  this.enemyWaveIndex = 0;

  const waveConfigs = [
    null,
    {
      key: "tengu_idle",
      scale: 1.5,
      flipX: false,
      maxHP: 250, //250
      hitbox: { width: 50, height: 50, offsetX: 40, offsetY: 0 },
      animations: {
        idle: { key: "tengu_idle", start: 0, end: 5, frameRate: 6 },
        walk: { key: "tengu_walking", start: 0, end: 7, frameRate: 8 },
        attack: { key: "tengu_attack", start: 0, end: 2, frameRate: 8 },
        dead: { key: "tengu_dead", start: 0, end: 5, frameRate: 8 },
      },
    },
    // Wave 3: Boss
    {
      key: "boss_idle",
      scale: 3.5,
      flipX: true,
      maxHP: 500,
      hitbox: { width: 400, height: 200, offsetX: 50, offsetY: 0 },
      animations: {
        spawn: { key: "boss_spawn", start: 0, end: 15, frameRate: 8 },
        idle: { key: "boss_idle", start: 0, end: 5, frameRate: 4 },
        walk: { key: "boss_walking", start: 0, end: 9, frameRate: 8 },
        attack: { key: "boss_attack", start: 0, end: 13, frameRate: 8 },
        dead: { key: "boss_dead", start: 0, end: 15, frameRate: 8 },
      },
    },
  ];

  this.events.on("enemy-died", (deadEnemy) => {
    console.log("Enemy died:", deadEnemy.texture.key);
    console.log("Wave index:", this.enemyWaveIndex);

    // Update wave text
    if (this.waveText) {
      this.waveText.setText(`WAVE: ${this.enemyWaveIndex + 1}`);
    }

    this.time.delayedCall(2000, () => {
      this.enemyWaveIndex++;

      if (this.enemyWaveIndex < waveConfigs.length) {
        const nextWaveConfig = waveConfigs[this.enemyWaveIndex];

        if (nextWaveConfig) {
          const x = 1300;
          const y = 560;
          const newEnemy = new Enemy(this, x, y, nextWaveConfig);
          this.enemies.push(newEnemy);
          setupEnemyCollisions(this, newEnemy);

          if (
            this.enemyWaveIndex === 2 ||
            nextWaveConfig.key.startsWith("boss")
          ) {
            console.log("🎵 Boss wave started — switching to boss music!");

            // Stop background music if still playing
            if (this.bgMusic && this.bgMusic.isPlaying) {
              this.bgMusic.stop();
            }

            // Play boss music once
            if (this.bossMusic && !this.bossMusic.isPlaying) {
              this.bossMusic.play();
            }
          }

          // Update minotaur reference if this is the minotaur wave
          if (nextWaveConfig.key === "minotaur_idle") {
            this.minotaur = newEnemy;
          }

          console.log("🔄 Spawned wave enemy:", nextWaveConfig.key);

          // Update wave text
          if (this.waveText) {
            this.waveText.setText(`WAVE: ${this.enemyWaveIndex + 1}`);
          }
        }
      } else {
        console.log("✅ All waves complete!");
        // Update wave text to show completion
        if (this.waveText) {
          this.waveText.setText("WAVE: COMPLETE!");
        }
        this.bossMusic.stop();
        this.victoryMusic.play();

        if (this.titleText) {
          this.titleText.setVisible(true); // 👈 Add this line to show it
        }

        this.playAgainText = createTextWithFont(
          this,
          width / 2,
          height / 2 + 50,
          "PRESS CTRL + R TO PLAY AGAIN",
          16,
          "#ffffff"
        );
        this.playAgainText.setOrigin(0.5, 0.5);
        this.playAgainText.setDepth(100);
        this.playAgainText.setStroke("#000000", 2);

        this.tweens.add({
          targets: this.playAgainText,
          alpha: 0,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        // Optionally loop back to start or end game
      }
    });
  });
}

function update() {
  if (Phaser.Input.Keyboard.JustDown(switchKey)) {
    console.log("E key pressed!");
    handlePlayerSwitch(this); // Pass scene as 'this'
  }

  if (currentPlayer && currentPlayer.active) {
    currentPlayer.update(cursors, attackKey, blockKey, runKey, magicKey);
    if (currentPlayer.healthBar) currentPlayer.healthBar.follow(currentPlayer);
  }

  const canScroll =
    currentPlayer &&
    currentPlayer.active &&
    !currentPlayer.isAttacking &&
    !currentPlayer.isBlocking;

  const direction =
    canScroll && cursors.left.isDown
      ? 1
      : canScroll && cursors.right.isDown
      ? -1
      : 0;

  if (direction !== 0) {
    Object.keys(this.bgLayerData).forEach((key) => {
      const layer = this.bgLayerData[key];
      // Background scrolls same direction as player: right key = bg scrolls right, left key = bg scrolls left
      const moveAmount = layer.speed * direction;
      const screenWidth = this.scale.width;

      // Move all images in the layer
      layer.images.forEach((img) => {
        img.x += moveAmount;
      });

      // Check each image and wrap if needed
      layer.images.forEach((img) => {
        // If image moves completely off left, wrap to right side
        if (img.x <= -layer.scaledWidth) {
          // Find the rightmost image
          const rightmostX = Math.max(...layer.images.map((i) => i.x));
          img.x = rightmostX + layer.scaledWidth;
        }

        // If image moves completely off right, wrap to left side
        if (img.x >= screenWidth + layer.scaledWidth) {
          // Find the leftmost image
          const leftmostX = Math.min(...layer.images.map((i) => i.x));
          img.x = leftmostX - layer.scaledWidth;
        }
      });
    });
  }

  // Update scene reference to currentPlayer
  this.currentPlayer = currentPlayer;

  // Update all enemies - they target the current player
  if (this.enemies && this.enemies.length > 0) {
    // Filter out dead/destroyed enemies and update active ones
    this.enemies = this.enemies.filter(
      (enemy) => enemy && enemy.active && !enemy.isDead
    );
    this.enemies.forEach((enemy) => {
      if (enemy && enemy.active && !enemy.isDead) {
        enemy.update(currentPlayer);
      }
    });
  }

  // if (Phaser.Input.Keyboard.JustDown(blockKey)) {
  //   this.isBlocking = true;
  //   this.anims.play("block", true); // optional: play block animation
  // }

  // if (Phaser.Input.Keyboard.JustUp(blockKey)) {
  //   this.isBlocking = false;
  //   if (!this.isAttacking) this.anims.play("idle", true);
  // }
}
