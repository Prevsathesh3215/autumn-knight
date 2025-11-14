import Phaser from "phaser";
import HealthBar from "./healthbar";

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, config.key, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.scene = scene;
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.setFlipX(config.flipX || false);
    this.setScale(config.scale || 1);

    this.config = config;

    // Stats
    this.maxHP = config.maxHP || 100;
    this.currentHP = this.maxHP;
    this.isDead = false;

    // Hitbox
    const hb = config.hitbox || {
      width: 50,
      height: 50,
      offsetX: 50,
      offsetY: 0,
    };
    this.attackHitbox = scene.add.rectangle(
      x,
      y,
      hb.width,
      hb.height,
      0xff0000,
      0.3
    );
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.visible = false;
    this.hitboxOffsetX = hb.offsetX;
    this.hitboxOffsetY = hb.offsetY;

    // Health bar
    this.healthBar = new HealthBar(scene, x, y);

    // Animations
    // Use unique animation keys per-enemy to avoid global key conflicts (e.g. with Knight/Mage)
    this._animKey = (name) => `${config.key}__${name}`; // e.g. "minotaur_idle__idle"
    this.createAnimations(config.animations);

    // State
    this.isAttacking = false;
    this.isSpawning = false;

    if (this.config.key.startsWith("boss")) {
      const spawnKey = this._animKey("spawn");

      console.log("🧩 Checking for spawn animation:", spawnKey);
      console.log(
        "Existing anim keys:",
        Object.keys(this.scene.anims.anims.entries || {})
      );

      if (this.scene.anims.exists(spawnKey)) {
        this.isSpawning = true;
        console.log("🎬 Boss spawn animation starting...");

        this.scene.cameras.main.shake(500, 0.01); // (duration, intensity)

        // Get animation duration for fallback timer
        const spawnAnim = this.scene.anims.get(spawnKey);
        const animDuration = spawnAnim
          ? (spawnAnim.frames.length / spawnAnim.frameRate) * 1000
          : 3000;

        this.anims.play(spawnKey, false); // Don't loop spawn animation

        // Listen for animation completion
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
          console.log(
            "🎬 Animation complete event fired, key:",
            anim.key,
            "expected:",
            spawnKey
          );
          if (anim.key === spawnKey) {
            console.log("✅ Boss spawn complete → idle");
            this.isSpawning = false;
            this.anims.play(this._animKey("idle"), true);
          }
        });

        // Fallback timer in case animation complete event doesn't fire
        this.scene.time.delayedCall(animDuration + 500, () => {
          if (this.isSpawning && this.anims.currentAnim?.key === spawnKey) {
            console.log(
              "⏰ Spawn animation fallback timer fired → transitioning to idle"
            );
            this.isSpawning = false;
            this.anims.play(this._animKey("idle"), true);
          }
        });
      } else {
        console.warn("⚠️ No spawn animation found for key:", spawnKey);
        this.isSpawning = false;
        this.anims.play(this._animKey("idle"), true);
      }
    }
  }

  createAnimations(animations) {
    if (!animations) return;

    Object.keys(animations).forEach((animName) => {
      const anim = animations[animName];
      const key = this._animKey(animName);

      // Prevent duplicate animations (Phaser errors if key already exists)
      if (this.scene.anims.exists(key)) return;

      // Generate frame array properly
      const frames = this.scene.anims.generateFrameNumbers(anim.key, {
        start: anim.start,
        end: anim.end,
      });

      this.scene.anims.create({
        key,
        frames,
        frameRate: anim.frameRate || 8,
        repeat:
          anim.repeat ?? (animName === "idle" || animName === "walk" ? -1 : 0),
      });

      // 🔁 Boss-only: make a reversed "dead" animation from spawn
      if (this.config.key.startsWith("boss") && animName === "spawn") {
        const reversedFrames = [...frames].reverse();

        const reversedKey = this._animKey("dead");
        if (this.scene.anims.exists(reversedKey)) {
          this.scene.anims.remove(reversedKey);
        }

        this.scene.anims.create({
          key: reversedKey,
          frames: reversedFrames,
          frameRate: anim.frameRate || 8,
          repeat: 0,
        });

        console.log(`✅ Created reversed boss death animation: ${reversedKey}`);
      }
    });
  }

  startAttackLoop(delay = 2000) {
    this.attackTimer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => this.attack(),
    });
  }

  attack() {
    if (this.isAttacking || this.isDead) return;

    this.isAttacking = true;
    this.setVelocity(0);
    this.anims.play(this._animKey("attack"), true);

    this.scene.time.delayedCall(
      300,
      () => (this.attackHitbox.body.enable = true)
    );
    this.scene.time.delayedCall(
      600,
      () => (this.attackHitbox.body.enable = false)
    );

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.anims.play(this._animKey("idle"), true);
      this.isAttacking = false;
    });
  }

  update(target) {
    if (this.isDead) return;

    // Always sync healthbar and hitbox (even during spawn)
    this.healthBar.follow(this);
    const flipMultiplier = this.flipX ? -1 : 1;
    this.attackHitbox.x = this.x + flipMultiplier * this.hitboxOffsetX;
    this.attackHitbox.y = this.y + this.hitboxOffsetY;

    // Don't update behavior during spawn animation
    if (this.isSpawning) {
      // Keep velocity at 0 during spawn
      this.setVelocityX(0);
      return;
    }

    const distanceX = target.x - this.x;
    const absDistance = Math.abs(distanceX);

    if (!this.isAttacking) {
      if (absDistance > 80) {
        const speed = 100;
        this.setVelocityX(Math.sign(distanceX) * speed);
        this.setFlipX(distanceX < 0);

        if (this.anims.currentAnim?.key !== this._animKey("walk"))
          this.anims.play(this._animKey("walk"), true);
      } else {
        this.setVelocityX(0);
        if (this.anims.currentAnim?.key !== this._animKey("idle"))
          this.anims.play(this._animKey("idle"), true);
        if (!this.attackTimer) this.startAttackLoop();
      }
    }
  }

  takeDamage(amount) {
    if (this.isDead || this.isSpawning) return; // Can't take damage during spawn
    this.currentHP -= amount;
    this.currentHP = Math.max(0, this.currentHP);
    this.healthBar.setHealth((this.currentHP / this.maxHP) * 100);

    if (this.currentHP <= 0) this.die();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    this.setVelocity(0, 0);
    if (this.attackTimer) this.attackTimer.remove(false);
    this.attackHitbox.body.enable = false;

    const deadKey = this._animKey("dead");
    if (this.scene.anims.exists(deadKey)) {
      console.log("💀 Playing reversed death animation...");
      this.anims.play(deadKey, true);
    } else {
      this.destroy();
    }

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.events.emit("enemy-died", this);
      this.healthBar.bar.destroy();
      this.destroy();
      console.log("☠️ Enemy defeated");
    });
  }
}
