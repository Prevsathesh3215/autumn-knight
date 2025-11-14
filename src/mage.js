import Phaser from "phaser";
import HealthBar from "./healthbar";

export default class Mage extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "mage_idle", 0);

    // Add to scene & physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Explicitly set the texture to ensure it's correct
    this.setTexture("mage_idle", 0);

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

    // Explicitly set texture again after animations are created
    if (scene.textures.exists("mage_idle")) {
      this.setTexture("mage_idle", 0);
      console.log("Mage texture set to:", this.texture.key);
    } else {
      console.error("ERROR: mage_idle texture does not exist!");
    }

    // Default idle - use mage_idle animation key
    this.anims.play("mage_idle", true);

    // Double-check texture after animation plays
    if (this.texture.key !== "mage_idle") {
      console.error(
        "Mage texture is wrong after animation play:",
        this.texture.key
      );
      this.setTexture("mage_idle", 0);
    }
  }

  createAnimations(scene) {
    // Use unique animation keys to avoid conflicts with other characters
    scene.anims.create({
      key: "mage_walk",
      frames: scene.anims.generateFrameNumbers("mage_walk", {
        start: 0,
        end: 6,
      }),
      frameRate: 7,
      repeat: -1,
    });

    scene.anims.create({
      key: "mage_run",
      frames: scene.anims.generateFrameNumbers("mage_run", {
        start: 0,
        end: 7,
      }),
      frameRate: 7,
      repeat: -1,
    });

    scene.anims.create({
      key: "mage_idle",
      frames: scene.anims.generateFrameNumbers("mage_idle", {
        start: 0,
        end: 6,
      }),
      frameRate: 4,
      repeat: -1,
    });

    scene.anims.create({
      key: "mage_attack",
      frames: scene.anims.generateFrameNumbers("mage_attack", {
        start: 0,
        end: 10,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "mage_attack_two",
      frames: scene.anims.generateFrameNumbers("mage_attack_two", {
        start: 0,
        end: 3,
      }),
      frameRate: 8,
      repeat: 0,
    });

    scene.anims.create({
      key: "mage_magic",
      frames: scene.anims.generateFrameNumbers("mage_magic", {
        start: 0,
        end: 12,
      }),
      frameRate: 8,
      repeat: 0,
    });

    // scene.anims.create({
    //   key: "block",
    //   frames: scene.anims.generateFrameNumbers("knight_block", {
    //     start: 0,
    //     end: 4,
    //   }),
    //   frameRate: 8,
    //   repeat: -1,
    // });

    scene.anims.create({
      key: "mage_dead",
      frames: scene.anims.generateFrameNumbers("mage_dead", {
        start: 0,
        end: 4,
      }),
      frameRate: 8,
      repeat: 0,
    });
  }

  castMagic() {
    if (this.isAttacking || this.isDead) return;

    console.log("✨ Mage casting magic!");

    this.isAttacking = true;
    this.setVelocity(0);
    this.anims.play("mage_magic", false); // Don't loop magic animation

    // Activate hitbox during magic cast
    this.scene.time.delayedCall(300, () => {
      this.attackHitbox.body.enable = true;
      console.log("✨ Mage magic hitbox active!");
    });

    this.scene.time.delayedCall(600, () => {
      this.attackHitbox.body.enable = false;
      console.log("⬜ Mage magic hitbox off");
    });

    // (Optional) Spawn a projectile a bit later during the animation
    // this.scene.time.delayedCall(400, () => {
    //   this.spawnMagicProjectile();
    // });

    // When done, return to idle
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      this.anims.play("mage_idle", true);
    });
  }

  update(cursors, attackKey, blockKey, runKey, magicKey) {
    // Stop all control/animation overrides once dead so the death anim can play
    if (this.isDead) {
      return;
    }

    // Stop movement and return early if attacking
    if (this.isAttacking) {
      this.setVelocity(0);
      // Keep UI / hitbox in sync during attack
      this.healthBar.follow(this);
      const offsetX = this.flipX ? -50 : 50;
      this.attackHitbox.x = this.x + offsetX;
      this.attackHitbox.y = this.y;
      return;
    }

    const isRunning = runKey?.isDown;
    const moveSpeed = isRunning ? 280 : 160;
    const animKey = isRunning ? "mage_run" : "mage_walk";

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
      if (this.anims.currentAnim?.key !== "mage_idle")
        this.anims.play("mage_idle");
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

    // ✨ Magic key (Q)
    if (magicKey && Phaser.Input.Keyboard.JustDown(magicKey)) {
      this.castMagic();
    }

    // Update health bar and hitbox position
    this.healthBar.follow(this);
    const offsetX = this.flipX ? -50 : 50;
    this.attackHitbox.x = this.x + offsetX;
    this.attackHitbox.y = this.y;
  }

  attack() {
    if (this.isAttacking) {
      this.nextComboQueued = true;
      return;
    }

    this.isAttacking = true;
    this.setVelocity(0);

    this.comboIndex = (this.comboIndex || 0) + 1;
    if (this.comboIndex > 2) this.comboIndex = 1;

    console.log(this.comboIndex);

    const attackKeys = ["mage_attack", "mage_attack_two"];
    const attackKey = attackKeys[this.comboIndex - 1];

    if (!this.scene.anims.exists(attackKey)) {
      console.error(`❌ Animation not found: ${attackKey}`);
      return;
    }
    console.log(`🗡️ Playing combo ${this.comboIndex}: ${attackKey}`);
    this.anims.play(attackKey, true);

    // Activate hitbox briefly
    this.scene.time.delayedCall(200, () => {
      this.attackHitbox.body.enable = true;
      console.log("🟩 Mage hitbox active!");
    });

    this.scene.time.delayedCall(500, () => {
      this.attackHitbox.body.enable = false;
      console.log("⬜ Mage hitbox off");
    });

    // Return to idle when done
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

    // if (this.isBlocking) {
    //   amount = Math.floor(amount / 2); // reduce damage by 50%
    //   console.log("🛡️ Blocked! Damage reduced.");
    // }

    this.currentHP -= amount;
    const healthPercent = (this.currentHP / this.maxHP) * 100;
    this.healthBar.setHealth(healthPercent);

    if (this.currentHP <= 0) {
      this.isDead = true;
      this.anims.play("mage_dead", true);

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
        if (anim.key === "mage_dead") {
          this.destroy();
          this.healthBar.bar.destroy();
        }
      });
    }
  }
}
