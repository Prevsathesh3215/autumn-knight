export default class HealthBar {
  constructor(scene, x, y, width = 50, height = 6) {
    this.bar = scene.add.graphics();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.value = 100;
    this.draw();
  }

  draw() {
    this.bar.clear();

    // Background (red)
    this.bar.fillStyle(0xff0000);
    this.bar.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    // Foreground (green)
    this.bar.fillStyle(0x00ff00);
    this.bar.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width * (this.value / 100), this.height);
  }

  setHealth(percent) {
    this.value = Phaser.Math.Clamp(percent, 0, 100);
    this.draw();
  }

  follow(target) {
    // Position just above knight
    this.x = target.x;
    this.y = target.y - target.height / 2 - 25; // 10px above head
    this.draw();
  }
}
