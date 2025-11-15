yes i write this doc using ai, dont judge me

# 🎮 Autumn Knight - 2D Action RPG

<div align="center">

![Phaser](https://img.shields.io/badge/Phaser-3.90.0-FF6B6B?style=for-the-badge&logo=phaser)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)
![Electron](https://img.shields.io/badge/Electron-33.2.0-47848F?style=for-the-badge&logo=electron)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite)

**A fast-paced 2D action RPG featuring dynamic character switching, combo-based combat, and wave-based enemy encounters.**

[Features](#-features) • [Controls](#-controls) • [Installation](#-installation) • [Screenshots](#-screenshots) • [Tech Stack](#-tech-stack)

</div>

---

## 🎯 Overview

**Autumn Knight** is a side-scrolling action RPG where players control two unique characters—a melee-focused Knight and a magic-wielding Mage—switching between them on the fly to overcome increasingly challenging enemy waves. Fight through hordes of mythical creatures, master combo attacks, and face off against epic boss battles in this pixel-art adventure.

### Key Highlights

- **Dual Character System**: Seamlessly switch between Knight and Mage with unique playstyles
- **Combo Combat**: Chain attacks together for devastating combos
- **Progressive Difficulty**: Three waves of enemies culminating in an epic boss fight
- **Parallax Scrolling**: Immersive multi-layer forest background
- **Dynamic Music**: Adaptive soundtrack that changes based on gameplay events
- **Desktop Ready**: Built with Electron for native desktop deployment

---

## ✨ Features

### 🗡️ Combat System
- **Knight**: Melee fighter with 3-hit combo system and defensive blocking
- **Mage**: Ranged magic caster with powerful spell attacks
- **Combo Mechanics**: Chain attacks within timing windows for maximum damage
- **Blocking**: Reduce incoming damage by 50% (Knight only)
- **Hitbox System**: Precise collision detection for attacks and damage

### 👥 Character Switching
- Press **E** to instantly switch between Knight and Mage
- Shared position and facing direction for seamless transitions
- Independent health pools for strategic character management

### 👾 Enemy Waves
1. **Wave 1**: Minotaur - The first challenge
2. **Wave 2**: Yamabushi Tengu - Agile flying enemy
3. **Wave 3**: Frost Guardian Boss - Epic final encounter with cinematic spawn

### 🎨 Visual Features
- **Parallax Background**: 4-layer scrolling forest environment
- **Pixel Art Sprites**: Hand-crafted character and enemy animations
- **Health Bars**: Real-time health visualization for all entities
- **Retro UI**: Press Start 2P font for authentic arcade feel

### 🎵 Audio
- Dynamic background music that adapts to gameplay
- Boss battle theme for epic encounters
- Victory fanfare upon completion

---

## 🎮 Controls

| Action | Key | Character |
|--------|-----|-----------|
| **Move** | ← → Arrow Keys | Both |
| **Attack** | **A** | Both |
| **Block** | **SPACE** | Knight |
| **Run** | **R** | Both |
| **Cast Magic** | **Q** | Mage |
| **Switch Character** | **E** | - |
| **Restart** | **N** | - |

---

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/my-rpg.git
   cd my-rpg
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   # Web version
   npm run dev

   # Electron desktop app
   npm run dev:electron
   ```

4. **Build for production**
   ```bash
   # Web build
   npm run build

   # Electron desktop build
   npm run build:electron
   ```

---

## 📁 Project Structure

```
my-rpg/
├── src/
│   ├── main.js          # Main game scene and logic
│   ├── knight.js        # Knight character class
│   ├── mage.js          # Mage character class
│   ├── enemy.js         # Enemy base class
│   ├── minotaur.js      # Minotaur enemy (if custom)
│   ├── tengu.js         # Tengu enemy (if custom)
│   └── healthbar.js    # Health bar UI component
├── public/
│   ├── background/      # Parallax background layers
│   ├── enemies/         # Enemy sprite sheets
│   ├── knight/          # Knight sprite sheets
│   ├── female_player/   # Mage sprite sheets
│   └── *.mp3            # Audio files
├── electron/
│   └── main.js          # Electron main process
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
└── package.json         # Project dependencies
```

---

## 🛠️ Tech Stack

- **Phaser 3.90.0** - Game framework
- **JavaScript (ES6+)** - Programming language
- **Vite 7.1.7** - Build tool and dev server
- **Electron 33.2.0** - Desktop app framework
- **Electron Builder** - Application packaging

---

## 🎯 Gameplay Mechanics

### Character Stats

**Knight**
- Health: 100 HP
- Attack Damage: 1 per hit
- Special: Blocking reduces damage by 50%
- Combo: 3-hit chain

**Mage**
- Health: 100 HP
- Attack Damage: 3 per hit (higher damage, lower defense)
- Special: Magic spell casting (Q key)
- Combo: 2-hit chain

### Enemy Stats

- **Minotaur**: 100 HP
- **Tengu**: 250 HP
- **Frost Guardian**: 500 HP

### Scoring System
- Score increases as you defeat enemies
- Track your performance across waves

---

## 🎨 Art & Assets

All sprite assets are custom pixel art animations including:
- Character idle, walk, run, attack, and death animations
- Enemy-specific animations and behaviors
- Parallax background layers for depth
- UI elements and health bars

---

## 🔧 Development

### Running Locally

```bash
# Start Vite dev server (web)
npm run dev

# Start Electron app in dev mode
npm run dev:electron
```

### Building

```bash
# Build web version
npm run build

# Build Electron app (Windows installer)
npm run build:electron
```

The built Electron app will be in the `dist/` directory.

---

## 📝 License

This project is private and not licensed for public use.

---

## 👤 Author

**Sathesh Previn**

---

## 🙏 Acknowledgments

- Built with [Phaser.js](https://phaser.io/)
- Pixel art sprites and animations
- Background music and sound effects

---

## 🎮 Play Now

Run `npm run dev` and open your browser to `http://localhost:5173` to start playing!

**Pro Tip**: Master the character switching mechanic to maximize your combat effectiveness. Use the Knight for tanking and blocking, then switch to the Mage for burst damage!

---

<div align="center">

**Made with ❤️ and ⚔️**

</div>

