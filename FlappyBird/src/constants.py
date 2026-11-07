"""Game constants and configuration."""

import os
import sys

# --- Paths ---
# When bundled with PyInstaller, assets live inside the temp _MEIPASS folder.
# The highscore file must be writable, so it goes next to the executable.
if getattr(sys, "frozen", False):
    _BUNDLE_DIR = sys._MEIPASS
    _APP_DIR = os.path.dirname(sys.executable)
else:
    _BUNDLE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _APP_DIR = _BUNDLE_DIR

BASE_DIR = _BUNDLE_DIR
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
SPRITES_DIR = os.path.join(ASSETS_DIR, "sprites")
SOUNDS_DIR = os.path.join(ASSETS_DIR, "sounds")
HIGHSCORE_FILE = os.path.join(_APP_DIR, "highscore.txt")

# --- Display ---
SCREEN_WIDTH = 288
SCREEN_HEIGHT = 512
FPS = 60
SCALE_FACTOR = 2  # Render at 576x1024 for modern screens
WINDOW_WIDTH = SCREEN_WIDTH * SCALE_FACTOR
WINDOW_HEIGHT = SCREEN_HEIGHT * SCALE_FACTOR

# --- Colors (from the original Flappy Bird palette) ---
SKY_BLUE = (78, 192, 202)
SKY_BLUE_NIGHT = (0, 24, 57)
GROUND_TAN = (222, 216, 149)
GROUND_GREEN = (84, 56, 71)
PIPE_GREEN = (78, 124, 26)
PIPE_GREEN_LIGHT = (110, 164, 38)
PIPE_GREEN_DARK = (57, 91, 19)
PIPE_CAP_HIGHLIGHT = (133, 186, 51)
BIRD_YELLOW = (250, 218, 94)
BIRD_ORANGE = (224, 148, 58)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (208, 62, 25)
BRONZE = (205, 133, 63)
SILVER = (192, 192, 192)
GOLD = (255, 215, 0)

# --- Physics ---
GRAVITY = 0.5
FLAP_VELOCITY = -8
MAX_FALL_SPEED = 12
BIRD_X = 60  # Fixed horizontal position of the bird

# --- Bird ---
BIRD_WIDTH = 34
BIRD_HEIGHT = 24
BIRD_ANIMATION_SPEED = 0.15  # Frames per tick
BIRD_MAX_ROTATION = 25  # Degrees upward tilt
BIRD_MIN_ROTATION = -90  # Degrees downward tilt
BIRD_ROTATION_SPEED = 3  # Degrees per frame

# --- Pipes ---
PIPE_WIDTH = 52
PIPE_GAP = 110  # Vertical gap between top and bottom pipes
PIPE_SPEED = 2.5
PIPE_SPAWN_INTERVAL = 90  # Frames between pipe spawns
PIPE_MIN_Y = 80  # Minimum top pipe height
PIPE_MAX_Y = 300  # Maximum top pipe bottom edge

# --- Ground ---
GROUND_HEIGHT = 112
GROUND_SPEED = PIPE_SPEED  # Ground scrolls at same speed as pipes

# --- Game States ---
STATE_MENU = "menu"
STATE_GET_READY = "get_ready"
STATE_PLAYING = "playing"
STATE_GAME_OVER = "game_over"

# --- Score ---
SCORE_FLASH_DURATION = 8  # Frames to flash white when scoring

# --- Title Screen ---
TITLE_BIRD_AMPLITUDE = 8  # Pixels of vertical bob
TITLE_BIRD_SPEED = 0.05  # Bob speed
