import Phaser from "phaser";
import HealthBar from "./healthbar";

export default class Minotaur extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "minotaur_idle", 0);

    // Add to scene & enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Basic properties
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.setFlipX(true);
    this.setScale(1.5);

    // 🟥 Attack hitbox (invisible in final version)
    this.attackHitbox = scene.add.rectangle(x, y, 60, 60, 0xff0000, 0.3);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.enable = false;
    this.attackHitbox.visible = false; // hide later if you don’t want to see it

    // Stats
    this.maxHP = 100;
    this.currentHP = 100;
    this.isDead = false;

    // Add health bar
    this.healthBar = new HealthBar(scene, x, y);

    // Keep scene reference for timers and animations
    this.scene = scene;

    // Create animations
    this.createAnimations(scene);

    // Start idle
    this.anims.play("minotaur_idle", true);

    // State
    this.isAttacking = false;

    // ⚔️ Start automatic attack loop
    // this.startAttackLoop();
  }

  createAnimations(scene) {
    scene.anims.create({
      key: "minotaur_idle",
      frames: scene.anims.generateFrameNumbers("minotaur_idle", {
        start: 0,
        end: 9,
      }),
      frameRate: 4,
      repeat: -1,
    });

    scene.anims.create({
      key: "minotaur_attack",
      frames: scene.anims.generateFrameNumbers("minotaur_attack", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "minotaur_walking",
      frames: scene.anims.generateFrameNumbers("minotaur_walking", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: "minotaur_dead",
      frames: scene.anims.generateFrameNumbers("minotaur_dead", {
        start: 0,
        end: 5,
      }),
      frameRate: 8,
      repeat: 0,
    });
  }

  startAttackLoop() {
    // 🕒 Attack every 2 seconds
    this.attackTimer = this.scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => this.attack(),
    });
  }

  attack() {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.setVelocity(0);
    this.anims.play("minotaur_attack", true);

    // Enable hitbox slightly after animation starts
    this.scene.time.delayedCall(300, () => {
      this.attackHitbox.body.enable = true;
      console.log("🟥 Hitbox active!");
    });

    // Disable hitbox after a short time
    this.scene.time.delayedCall(600, () => {
      this.attackHitbox.body.enable = false;
      console.log("⬜ Hitbox off");
    });

    // Reset animation
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.anims.play("minotaur_idle", true);
      this.isAttacking = false;
    });

    console.log("💢 Minotaur attacks!");
  }

  update(target) {
    if (this.isDead) return;

    const distanceX = target.x - this.x;
    const absDistance = Math.abs(distanceX);

    if (!this.isAttacking) {
      if (absDistance > 80) {
        const speed = 100;
        this.setVelocityX(Math.sign(distanceX) * speed);
        this.setFlipX(distanceX < 0);

        if (this.anims.currentAnim?.key !== "minotaur_walking") {
          this.anims.play("minotaur_walking", true);
        }

        // Stop the attack loop if target runs away
        if (this.attackTimer && absDistance > 100) {
          this.attackTimer.remove();
          this.attackTimer = null;
        }
      } else {
        this.setVelocityX(0);

        if (this.anims.currentAnim?.key !== "minotaur_idle") {
          this.anims.play("minotaur_idle", true);
        }

        // ✅ Start attack loop once
        if (!this.attackTimer) {
          this.startAttackLoop();
        }
      }
    }

    // keep health bar and hitbox synced
    this.healthBar.follow(this);
    const offsetX = this.flipX ? -50 : 50;
    this.attackHitbox.x = this.x + offsetX;
    this.attackHitbox.y = this.y;
  }

  // 🧠 Damage handling
  takeDamage(amount) {
    if (this.isDead) return;
    this.currentHP -= amount;
    if (this.currentHP < 0) this.currentHP = 0;

    const healthPercent = (this.currentHP / this.maxHP) * 100;
    this.healthBar.setHealth(healthPercent);

    if (this.currentHP <= 0) {
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    this.setVelocity(0, 0);
    this.attackHitbox.body.enable = false;
    if (this.attackTimer) this.attackTimer.remove(false);

    this.anims.play("minotaur_dead", true);

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
      if (anim.key !== "minotaur_dead") return;

      const scene = this.scene;

      // Clean up current instance
      this.healthBar.bar.destroy();
      this.destroy();
      console.log("☠️ Minotaur defeated");

      // Respawn after 3 seconds
      scene.time.delayedCall(3000, () => {
        const newMinotaur = new Minotaur(scene, 1000, 560);
        scene.minotaur = newMinotaur;

        // Re-add collision detection for both characters
        
        // Minotaur attacks knight
        scene.physics.add.overlap(newMinotaur.attackHitbox, scene.knight, () => {
          scene.knight.takeDamage(1);
        });

        // Minotaur attacks mage
        scene.physics.add.overlap(newMinotaur.attackHitbox, scene.mage, () => {
          scene.mage.takeDamage(1);
        });

        // Knight attacks minotaur
        scene.physics.add.overlap(scene.knight.attackHitbox, newMinotaur, () => {
          if (
            scene.knight.attackHitbox.active &&
            scene.currentPlayer === scene.knight &&
            !newMinotaur.isDead
          ) {
            console.log("💥 Knight hits Minotaur!");
            newMinotaur.takeDamage(1);
          }
        });

        // Mage attacks minotaur
        scene.physics.add.overlap(scene.mage.attackHitbox, newMinotaur, () => {
          if (
            scene.mage.attackHitbox.active &&
            scene.currentPlayer === scene.mage &&
            !newMinotaur.isDead
          ) {
            console.log("💥 Mage hits Minotaur!");
            newMinotaur.takeDamage(1);
          }
        });
      });
    });
  }
}
