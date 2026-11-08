"""Flappy Bird - Entry Point.

Run this file to start the game:
    python main.py

On first run, assets will be auto-generated if they don't exist.
To regenerate assets manually:
    python generate_assets.py
"""

import os
import sys

# Ensure project root is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def ensure_assets():
    """Generate assets if they don't exist yet."""
    sprites_dir = os.path.join(os.path.dirname(__file__), "assets", "sprites")
    if not os.path.exists(os.path.join(sprites_dir, "background.png")):
        print("Assets not found. Generating...")
        from generate_assets import main as generate
        generate()
        print()


if __name__ == "__main__":
    ensure_assets()
    from src.game import Game
    game = Game()
    game.run()
