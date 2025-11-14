import Phaser from "phaser";
import HealthBar from "./healthbar";

export default class Knight extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "knight_idle", 0);

    // Add to scene & physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Explicitly set the texture to ensure it's correct
    this.setTexture("knight_idle", 0);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.4);
    this.setScale(1.5);

    // 🟩 Attack hitbox
    this.attackHitbox = scene.add.rectangle(x, y, 50, 50, 0x00ff00, 0.3);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.visible = false; // hide when done testing

    // Stats
    this.maxHP = 100;
    this.currentHP = 100;
    this.isDead = false;

    // Health bar
    this.healthBar = new HealthBar(scene, x, y);

    this.scene = scene;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isRunning = false;
    this.moveSpeed = 160;

    this.comboIndex = 0; // 👈 initialize combo index here
    this.nextComboQueued = false; // 👈 for chained attacks

    // 🔥 Create animations
    this.createAnimations(scene);

    // Default idle
    this.anims.play("idle", true);
  }

  createAnimations(scene) {
    scene.anims.create({
      key: "walk",
      frames: scene.anims.generateFrameNumbers("knight_walking", {
        start: 0,
        end: 7,
      }),
      frameRate: 7,
      repeat: -1,
    });

    scene.anims.create({
      key: "run",
      frames: scene.anims.generateFrameNumbers("knight_running", {
        start: 0,
        end: 7,
      }),
      frameRate: 7,
      repeat: -1,
    });

    scene.anims.create({
      key: "idle",
      frames: scene.anims.generateFrameNumbers("knight_idle", {
        start: 0,
        end: 3,
      }),
      frameRate: 4,
      repeat: -1,
    });

    scene.anims.create({
      key: "attack",
      frames: scene.anims.generateFrameNumbers("knight_attack", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "attack_two",
      frames: scene.anims.generateFrameNumbers("knight_attack_two", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "attack_three",
      frames: scene.anims.generateFrameNumbers("knight_attack_three", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "block",
      frames: scene.anims.generateFrameNumbers("knight_block", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "dead",
      frames: scene.anims.generateFrameNumbers("knight_dead", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: 0,
    });
  }

  update(cursors, attackKey, blockKey, runKey, magicKey) {
    // Stop all control/animation overrides once dead so the death anim can play
    if (this.isDead) {
      return;
    }

    const wasBlocking = this.isBlocking;
    this.isBlocking = !!blockKey?.isDown;

    if (!this.isAttacking) {
      if (this.isBlocking && !wasBlocking) {
        this.anims.play("block", true);
      } else if (!this.isBlocking && wasBlocking) {
        this.anims.play("idle", true);
      }
    }

    if (this.isAttacking) {
      this.setVelocity(0);
      return;
    }

    if (this.isBlocking) {
      this.setVelocity(0);
      if (this.anims.currentAnim?.key !== "block")
        this.anims.play("block", true);
      // Keep UI / hitbox in sync
      this.healthBar.follow(this);
      const offsetX = this.flipX ? -50 : 50;
      this.attackHitbox.x = this.x + offsetX;
      this.attackHitbox.y = this.y;
      return;
    }

    const isRunning = runKey?.isDown;
    const moveSpeed = isRunning ? 280 : 160;
    const animKey = isRunning ? "run" : "walk";

    // Movement
    this.setVelocity(0);
    if (cursors.left.isDown) {
      if (!this.flipX) this.x -= 10; // fix jump when flipping
      this.flipX = true;
      this.setVelocityX(-moveSpeed);
      this.anims.play(animKey, true);
    } else if (cursors.right.isDown) {
      if (this.flipX) this.x += 10;
      this.flipX = false;
      this.setVelocityX(moveSpeed);
      this.anims.play(animKey, true);
    } else {
      if (this.anims.currentAnim?.key !== "idle") this.anims.play("idle");
    }

    // if (Phaser.Input.Keyboard.JustDown(blockKey)) {
    //   this.isBlocking = true;
    //   this.anims.play("block", true); // optional: play block animation
    // }

    // if (Phaser.Input.Keyboard.JustUp(blockKey)) {
    //   this.isBlocking = false;
    //   if (!this.isAttacking) this.anims.play("idle", true);
    // }

    // 🗡️ Attack key
    if (Phaser.Input.Keyboard.JustDown(attackKey)) {
      this.attack();
    }

    // Update health bar and hitbox position
    this.healthBar.follow(this);
    const offsetX = this.flipX ? -50 : 50;
    this.attackHitbox.x = this.x + offsetX;
    this.attackHitbox.y = this.y;
  }

  attack() {
    // If already attacking, queue next combo if within combo window
    if (this.isAttacking) {
      this.nextComboQueued = true;
      return;
    }

    this.isAttacking = true;
    this.setVelocity(0);

    // 🧩 Determine which combo attack to play
    this.comboIndex = (this.comboIndex || 0) + 1;
    if (this.comboIndex > 3) this.comboIndex = 1;

    const attackKeys = ["attack", "attack_two", "attack_three"];
    const attackKey = attackKeys[this.comboIndex - 1];
    console.log(`🗡️ Playing combo ${this.comboIndex}: ${attackKey}`);
    this.anims.play(attackKey, true);

    // 🟩 Enable hitbox briefly (customize per attack)
    this.scene.time.delayedCall(150, () => {
      this.attackHitbox.body.enable = true;
    });

    this.scene.time.delayedCall(400, () => {
      this.attackHitbox.body.enable = false;
    });

    // 👀 Listen for animation progress
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;

      if (this.nextComboQueued) {
        this.nextComboQueued = false;
        this.attack(); // chain to next attack immediately
      } else {
        // Reset combo if no next attack within window
        this.scene.time.delayedCall(400, () => {
          if (!this.isAttacking && !this.nextComboQueued) {
            this.comboIndex = 0;
          }
        });
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;

    if (this.isBlocking) {
      amount = Math.floor(amount / 2); // reduce damage by 50%
      console.log("🛡️ Blocked! Damage reduced.");
    }

    this.currentHP -= amount;
    const healthPercent = (this.currentHP / this.maxHP) * 100;
    this.healthBar.setHealth(healthPercent);

    if (this.currentHP <= 0) {
      this.isDead = true;
      this.anims.play("dead", true);

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
        if (anim.key === "dead") {
          this.destroy();
          this.healthBar.bar.destroy();
        }
      });
    }
  }
}
