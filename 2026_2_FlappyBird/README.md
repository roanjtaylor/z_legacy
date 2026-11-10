# Flappy Bird (Local Recreation)

A pixel-art recreation of the classic Flappy Bird game, built with Python and Pygame. Runs entirely offline as a local desktop app.

## Quick Start

```bash
pip install pygame
python main.py
```

On first run, assets are auto-generated if they don't exist. To regenerate manually:

```bash
python generate_assets.py
```

## How to Play

- **Space / Click / Up Arrow** to flap
- Avoid pipes - pass through the gaps to score points
- Don't hit the ground or the ceiling
- **Escape** to quit

## Controls by Screen

| Screen    | Action              | Input                        |
| --------- | ------------------- | ---------------------------- |
| Menu      | Start game          | Click play button / Spacebar |
| Get Ready | Begin playing       | Click / Space / Up           |
| Playing   | Flap                | Click / Space / Up           |
| Game Over | Restart             | Click play button / Spacebar |
| Any       | Quit                | Escape / Close window        |

## Scoring

- +1 point for each pipe pair passed (original Flappy Bird style)
- High score saved locally in `highscore.txt`
- Medals: Bronze (10+), Silver (20+), Gold (30+), Platinum (40+)

## Project Structure

```
FlappyBird/
├── main.py                 # Entry point - run this to play
├── generate_assets.py      # Generates all sprites and sounds programmatically
├── requirements.txt        # Python dependencies (pygame)
├── highscore.txt           # Auto-created, stores best score
├── README.md               # This file
├── src/
│   ├── __init__.py
│   ├── constants.py        # All game configuration (physics, sizes, colors, paths)
│   ├── game.py             # Main game class - state machine, rendering, event loop
│   ├── bird.py             # Bird entity - physics, animation, rotation
│   ├── pipe.py             # Pipe obstacles - spawning, scrolling, collision
│   └── ground.py           # Scrolling ground layer
└── assets/
    ├── sprites/            # All PNG sprite files (auto-generated)
    │   ├── background.png  # Sky, clouds, city silhouette
    │   ├── ground.png      # Scrolling ground tile (wider than screen)
    │   ├── pipe.png        # Green pipe (bottom-facing; top is flipped at runtime)
    │   ├── bird_0/1/2.png  # Bird animation frames (wing up/mid/down)
    │   ├── num_*.png       # Large score digits 0-9
    │   ├── num_small_*.png # Small digits for score panel
    │   ├── title.png       # "Flappy Bird" logo
    │   ├── play_button.png # Play/restart button
    │   ├── game_over.png   # Game over text
    │   ├── get_ready.png   # Get ready text
    │   ├── score_panel.png # Score display panel (game over screen)
    │   ├── tap.png         # Tap instruction graphic
    │   └── medal_*.png     # Bronze, silver, gold, platinum medals
    └── sounds/             # All WAV sound files (auto-generated)
        ├── flap.wav        # Wing flap
        ├── score.wav       # Point scored
        ├── hit.wav         # Collision
        ├── die.wav         # Death
        └── swoosh.wav      # Menu transition
```

## Architecture

### State Machine

The game uses a simple state machine in `game.py`:

```
MENU → GET_READY → PLAYING → GAME_OVER → (back to GET_READY)
```

Each state has its own `_update_*()`, `_draw_*()`, and event handling methods.

### Rendering Pipeline

1. All game logic and drawing happens on a **288x512** internal surface (original Flappy Bird resolution)
2. The surface is scaled **2x** to **576x1024** for the display window
3. This gives crisp pixel art at modern screen sizes

### Physics

- Gravity pulls the bird down each frame (`GRAVITY = 0.5`)
- Flapping sets an upward velocity (`FLAP_VELOCITY = -8`)
- Bird rotation follows velocity (tilts up when flapping, nosedives when falling)
- Pipe collision uses rect-based detection with a small inner margin for fairness

### Asset Generation

All sprites and sounds are generated programmatically by `generate_assets.py` using Pygame drawing functions and wave file synthesis. No external assets are needed. This means:
- No copyright concerns
- Assets can be regenerated or tweaked by editing the generator
- The game is fully self-contained

## Tech Stack

- **Python 3.8+**
- **Pygame 2.5+** - 2D game framework handling rendering, input, and audio

## Work Completed

- Full game loop with 4-state state machine (menu, get ready, playing, game over)
- Bird with gravity physics, flap mechanic, 3-frame wing animation, and velocity-based rotation
- Pipe obstacle system with random gap placement, scrolling, and collision detection
- Scrolling ground with seamless tile looping
- Animated title/landing screen with bobbing bird and play button
- "Get Ready" transition screen with tap instructions
- Game over screen with score panel, best score, and medal awards
- Score display using individual digit sprites (large in-game, small on panel)
- High score persistence to local file
- Sound effects (flap, score, hit, die, swoosh) generated as WAV files
- All pixel art sprites generated programmatically (background with sky gradient/clouds/city, ground tile, green pipes, animated bird, UI elements, medals)
- 2x resolution scaling for crisp display on modern screens
- Keyboard (Space/Up/Escape) and mouse input support
