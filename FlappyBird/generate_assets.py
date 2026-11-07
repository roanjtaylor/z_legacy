"""
Generate all pixel art sprites and sound effects for Flappy Bird.

Run this once to create all assets in the assets/ directory.
Requires: pygame, numpy (optional, for sound generation)
"""

import os
import sys
import math
import struct
import wave

import pygame

# Initialize pygame for surface creation (no display needed)
os.environ["SDL_VIDEODRIVER"] = "dummy"
pygame.init()
pygame.display.set_mode((1, 1))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPRITES_DIR = os.path.join(BASE_DIR, "assets", "sprites")
SOUNDS_DIR = os.path.join(BASE_DIR, "assets", "sounds")

os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(SOUNDS_DIR, exist_ok=True)


# ─── Color Palette ───────────────────────────────────────────────────────────

SKY_BLUE = (78, 192, 202)
SKY_BLUE_TOP = (99, 207, 215)
CLOUD_WHITE = (233, 246, 224)
CITY_GREEN_DARK = (98, 153, 68)
CITY_GREEN_LIGHT = (118, 181, 78)
BUSH_GREEN_DARK = (87, 138, 52)
BUSH_GREEN_LIGHT = (117, 181, 74)
GROUND_TAN = (222, 216, 149)
GROUND_TAN_DARK = (210, 200, 130)
GROUND_STRIPE = (192, 178, 108)

PIPE_BODY = (78, 124, 26)
PIPE_BODY_LIGHT = (110, 164, 38)
PIPE_BODY_DARK = (57, 91, 19)
PIPE_CAP_TOP = (133, 186, 51)
PIPE_CAP_MID = (78, 124, 26)
PIPE_CAP_DARK = (57, 91, 19)

BIRD_YELLOW = (250, 218, 94)
BIRD_YELLOW_DARK = (228, 180, 50)
BIRD_ORANGE = (224, 148, 58)
BIRD_RED = (214, 100, 44)
BIRD_WHITE = (255, 255, 255)
BIRD_EYE_BLACK = (48, 44, 46)
BIRD_EYE_WHITE = (255, 255, 255)
BIRD_BEAK_ORANGE = (232, 106, 72)
BIRD_BEAK_RED = (214, 72, 44)
BIRD_WING_TIP = (168, 132, 58)

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)


# ─── Utility ─────────────────────────────────────────────────────────────────

def save(surface, name):
    path = os.path.join(SPRITES_DIR, name)
    pygame.image.save(surface, path)
    print(f"  Created: {path}")


# ─── Background (288 x 512) ─────────────────────────────────────────────────

def generate_background():
    w, h = 288, 512
    bg = pygame.Surface((w, h))

    # Sky gradient
    for y in range(h - 112):
        t = y / (h - 112)
        r = int(SKY_BLUE_TOP[0] + (SKY_BLUE[0] - SKY_BLUE_TOP[0]) * t)
        g = int(SKY_BLUE_TOP[1] + (SKY_BLUE[1] - SKY_BLUE_TOP[1]) * t)
        b = int(SKY_BLUE_TOP[2] + (SKY_BLUE[2] - SKY_BLUE_TOP[2]) * t)
        pygame.draw.line(bg, (r, g, b), (0, y), (w, y))

    # Clouds
    cloud_y = 60
    for cx in [30, 100, 200, 260]:
        for dx in range(-20, 21, 2):
            dy = int(8 * math.cos(dx * 0.08))
            alpha_surf = pygame.Surface((4, max(1, 14 - abs(dx) // 2)), pygame.SRCALPHA)
            alpha_surf.fill((*CLOUD_WHITE, 160 - abs(dx) * 3))
            bg.blit(alpha_surf, (cx + dx, cloud_y - dy + (cx % 30)))

    # City silhouette
    city_y = h - 112 - 60
    buildings = [
        (0, 20, 45), (22, 15, 55), (40, 25, 40), (68, 12, 58),
        (82, 22, 35), (108, 18, 50), (128, 28, 30), (158, 14, 52),
        (175, 20, 42), (198, 16, 48), (218, 24, 38), (244, 12, 55),
        (258, 20, 44), (278, 15, 50),
    ]
    for bx, bw, bh in buildings:
        rect = pygame.Rect(bx, city_y + 60 - bh, bw, bh)
        pygame.draw.rect(bg, CITY_GREEN_DARK, rect)
        # Window lights
        for wy in range(rect.top + 4, rect.bottom - 4, 8):
            for wx in range(rect.left + 3, rect.right - 3, 6):
                if (wx + wy) % 3 != 0:
                    pygame.draw.rect(bg, CITY_GREEN_LIGHT, (wx, wy, 3, 4))

    # Bushes / tree line
    bush_y = h - 112 - 16
    for x in range(0, w, 2):
        bh = 10 + int(6 * math.sin(x * 0.05)) + int(4 * math.sin(x * 0.13))
        pygame.draw.rect(bg, BUSH_GREEN_DARK, (x, bush_y + 16 - bh, 2, bh))
        if bh > 12:
            pygame.draw.rect(bg, BUSH_GREEN_LIGHT, (x, bush_y + 16 - bh, 2, bh // 2))

    save(bg, "background.png")
    return bg


# ─── Ground (336 x 112, wider than screen for scroll tiling) ────────────────

def generate_ground():
    w, h = 336, 112
    gnd = pygame.Surface((w, h))

    # Main tan fill
    gnd.fill(GROUND_TAN)

    # Top green/dark stripe
    pygame.draw.rect(gnd, (100, 176, 66), (0, 0, w, 2))
    pygame.draw.rect(gnd, GROUND_STRIPE, (0, 2, w, 2))

    # Polka-dot pattern like original
    for y in range(8, h, 12):
        for x in range(0, w, 12):
            offset = 6 if (y // 12) % 2 else 0
            pygame.draw.rect(gnd, GROUND_TAN_DARK, (x + offset, y, 4, 4))

    save(gnd, "ground.png")
    return gnd


# ─── Pipes ───────────────────────────────────────────────────────────────────

def generate_pipe():
    """Generate a bottom-facing pipe (320px tall). Top pipe is flipped at runtime."""
    w, h = 52, 320
    pipe = pygame.Surface((w, h), pygame.SRCALPHA)

    cap_h = 26
    cap_overhang = 2  # Extends beyond body on each side
    body_x = cap_overhang
    body_w = w - cap_overhang * 2

    # Pipe body
    pygame.draw.rect(pipe, PIPE_BODY_DARK, (body_x, 0, body_w, h))
    pygame.draw.rect(pipe, PIPE_BODY, (body_x + 2, 0, body_w - 6, h))
    pygame.draw.rect(pipe, PIPE_BODY_LIGHT, (body_x + 4, 0, 8, h))
    # Right highlight
    pygame.draw.rect(pipe, PIPE_BODY_LIGHT, (body_x + body_w - 8, 0, 4, h))

    # Pipe cap (at top of the surface, which is the opening end)
    cap_rect = pygame.Rect(0, 0, w, cap_h)
    pygame.draw.rect(pipe, PIPE_CAP_DARK, cap_rect)
    pygame.draw.rect(pipe, PIPE_CAP_MID, (2, 2, w - 4, cap_h - 4))
    pygame.draw.rect(pipe, PIPE_CAP_TOP, (4, 2, 10, cap_h - 4))
    pygame.draw.rect(pipe, PIPE_CAP_TOP, (w - 10, 2, 6, cap_h - 4))

    save(pipe, "pipe.png")
    return pipe


# ─── Bird (3 animation frames) ──────────────────────────────────────────────

def draw_bird_frame(wing_state):
    """Draw a single bird frame. wing_state: 'up', 'mid', 'down'."""
    w, h = 34, 24
    bird = pygame.Surface((w, h), pygame.SRCALPHA)

    # Body (main yellow circle area)
    # Simplified pixel art bird
    body_color = BIRD_YELLOW
    dark_color = BIRD_YELLOW_DARK

    # Body outline and fill
    pygame.draw.ellipse(bird, BLACK, (1, 3, 28, 19))
    pygame.draw.ellipse(bird, body_color, (2, 4, 26, 17))
    # Darker belly
    pygame.draw.ellipse(bird, dark_color, (3, 12, 22, 8))

    # Eye white
    pygame.draw.circle(bird, BIRD_EYE_WHITE, (22, 9), 5)
    pygame.draw.circle(bird, BLACK, (22, 9), 5, 1)
    # Pupil
    pygame.draw.circle(bird, BIRD_EYE_BLACK, (24, 9), 2)

    # Beak
    beak_points = [(27, 12), (34, 14), (27, 17)]
    pygame.draw.polygon(bird, BIRD_BEAK_ORANGE, beak_points)
    beak_bottom = [(27, 15), (32, 15), (27, 17)]
    pygame.draw.polygon(bird, BIRD_BEAK_RED, beak_bottom)

    # Wing
    wing_color = BIRD_WING_TIP
    if wing_state == "up":
        wing_points = [(4, 10), (18, 10), (18, 6), (10, 2)]
        pygame.draw.polygon(bird, wing_color, wing_points)
        pygame.draw.polygon(bird, BLACK, wing_points, 1)
    elif wing_state == "mid":
        pygame.draw.ellipse(bird, wing_color, (4, 10, 16, 6))
        pygame.draw.ellipse(bird, BLACK, (4, 10, 16, 6), 1)
    else:  # down
        wing_points = [(4, 14), (18, 14), (18, 20), (10, 22)]
        pygame.draw.polygon(bird, wing_color, wing_points)
        pygame.draw.polygon(bird, BLACK, wing_points, 1)

    # Tail feathers
    pygame.draw.rect(bird, dark_color, (0, 8, 4, 3))
    pygame.draw.rect(bird, dark_color, (0, 12, 4, 3))

    return bird


def generate_bird():
    for i, state in enumerate(["up", "mid", "down"]):
        bird = draw_bird_frame(state)
        save(bird, f"bird_{i}.png")


# ─── Score Numbers (0-9) ────────────────────────────────────────────────────

def generate_numbers():
    """Generate 0-9 digit sprites for score display."""
    font_size = 28
    # Use a simple bitmap approach
    for digit in range(10):
        surf = pygame.Surface((20, 28), pygame.SRCALPHA)
        # Draw outlined number
        font = pygame.font.SysFont("Arial", font_size, bold=True)
        text = font.render(str(digit), True, WHITE)
        # Shadow
        shadow = font.render(str(digit), True, BLACK)
        # Center on surface
        tx = (20 - text.get_width()) // 2
        ty = (28 - text.get_height()) // 2
        surf.blit(shadow, (tx + 1, ty + 1))
        surf.blit(text, (tx, ty))
        save(surf, f"num_{digit}.png")


# ─── Small Numbers for score panel ──────────────────────────────────────────

def generate_small_numbers():
    for digit in range(10):
        surf = pygame.Surface((12, 16), pygame.SRCALPHA)
        font = pygame.font.SysFont("Arial", 16, bold=True)
        text = font.render(str(digit), True, WHITE)
        shadow = font.render(str(digit), True, BLACK)
        tx = (12 - text.get_width()) // 2
        ty = (16 - text.get_height()) // 2
        surf.blit(shadow, (tx + 1, ty + 1))
        surf.blit(text, (tx, ty))
        save(surf, f"num_small_{digit}.png")


# ─── Title Logo ──────────────────────────────────────────────────────────────

def generate_title():
    """Flappy Bird title text."""
    w, h = 178, 48
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    font = pygame.font.SysFont("Arial", 38, bold=True)
    # "Flappy Bird" with shadow
    text = font.render("Flappy Bird", True, WHITE)
    shadow = font.render("Flappy Bird", True, BLACK)
    tx = (w - text.get_width()) // 2
    ty = (h - text.get_height()) // 2
    surf.blit(shadow, (tx + 2, ty + 2))
    surf.blit(text, (tx, ty))
    # Orange outline effect - render slightly offset in multiple directions
    outline = font.render("Flappy Bird", True, BIRD_ORANGE)
    surf.blit(outline, (tx + 1, ty))
    surf.blit(text, (tx, ty))

    save(surf, "title.png")


# ─── Play Button ─────────────────────────────────────────────────────────────

def generate_play_button():
    w, h = 104, 58
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    # Button background
    pygame.draw.rect(surf, (222, 216, 149), (0, 4, w, h - 4), border_radius=6)
    pygame.draw.rect(surf, (87, 138, 52), (0, 4, w, h - 4), 3, border_radius=6)

    # Play triangle
    cx, cy = w // 2, h // 2 + 2
    tri_points = [(cx - 10, cy - 14), (cx - 10, cy + 14), (cx + 14, cy)]
    pygame.draw.polygon(surf, (87, 138, 52), tri_points)
    pygame.draw.polygon(surf, BLACK, tri_points, 2)

    save(surf, "play_button.png")


# ─── Game Over Text ──────────────────────────────────────────────────────────

def generate_game_over():
    w, h = 192, 42
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    font = pygame.font.SysFont("Arial", 36, bold=True)
    text = font.render("Game Over", True, WHITE)
    shadow = font.render("Game Over", True, BLACK)
    tx = (w - text.get_width()) // 2
    ty = (h - text.get_height()) // 2
    surf.blit(shadow, (tx + 2, ty + 2))
    # Red tint
    red_text = font.render("Game Over", True, (208, 62, 25))
    surf.blit(red_text, (tx + 1, ty + 1))
    surf.blit(text, (tx, ty))

    save(surf, "game_over.png")


# ─── Get Ready Text ──────────────────────────────────────────────────────────

def generate_get_ready():
    w, h = 174, 42
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    font = pygame.font.SysFont("Arial", 36, bold=True)
    text = font.render("Get Ready!", True, WHITE)
    shadow = font.render("Get Ready!", True, BLACK)
    tx = (w - text.get_width()) // 2
    ty = (h - text.get_height()) // 2
    surf.blit(shadow, (tx + 2, ty + 2))
    surf.blit(text, (tx, ty))

    save(surf, "get_ready.png")


# ─── Score Panel (background for game over score display) ────────────────────

def generate_score_panel():
    w, h = 226, 114
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    # Outer border
    pygame.draw.rect(surf, (83, 56, 70), (0, 0, w, h), border_radius=8)
    # Inner fill
    pygame.draw.rect(surf, (222, 216, 149), (3, 3, w - 6, h - 6), border_radius=6)

    # "Score" and "Best" labels
    font = pygame.font.SysFont("Arial", 16, bold=True)
    score_label = font.render("Score", True, (83, 56, 70))
    best_label = font.render("Best", True, (83, 56, 70))
    surf.blit(score_label, (20, 14))
    surf.blit(best_label, (20, 60))

    # Divider line
    pygame.draw.line(surf, (83, 56, 70), (10, 52), (w - 10, 52), 1)

    save(surf, "score_panel.png")


# ─── Tap Instruction ─────────────────────────────────────────────────────────

def generate_tap_instruction():
    w, h = 120, 100
    surf = pygame.Surface((w, h), pygame.SRCALPHA)

    # Hand / tap icon (simplified)
    cx, cy = w // 2, h // 2 + 10
    # Finger
    pygame.draw.ellipse(surf, WHITE, (cx - 8, cy - 30, 16, 36))
    pygame.draw.ellipse(surf, BLACK, (cx - 8, cy - 30, 16, 36), 2)
    # Palm
    pygame.draw.ellipse(surf, WHITE, (cx - 16, cy - 4, 32, 24))
    pygame.draw.ellipse(surf, BLACK, (cx - 16, cy - 4, 32, 24), 2)
    # Tap lines
    for angle in [-40, 0, 40]:
        rad = math.radians(angle - 90)
        x1 = cx + int(24 * math.cos(rad))
        y1 = cy - 16 + int(24 * math.sin(rad))
        x2 = cx + int(32 * math.cos(rad))
        y2 = cy - 16 + int(32 * math.sin(rad))
        pygame.draw.line(surf, WHITE, (x1, y1), (x2, y2), 2)

    # "TAP" text
    font = pygame.font.SysFont("Arial", 18, bold=True)
    text = font.render("TAP", True, WHITE)
    shadow = font.render("TAP", True, BLACK)
    tx = (w - text.get_width()) // 2
    surf.blit(shadow, (tx + 1, h - 23))
    surf.blit(text, (tx, h - 24))

    save(surf, "tap.png")


# ─── Medal sprites ───────────────────────────────────────────────────────────

def generate_medals():
    for name, color, highlight in [
        ("bronze", (205, 133, 63), (230, 170, 100)),
        ("silver", (192, 192, 192), (230, 230, 230)),
        ("gold", (255, 215, 0), (255, 240, 100)),
        ("platinum", (180, 210, 230), (220, 240, 255)),
    ]:
        surf = pygame.Surface((44, 44), pygame.SRCALPHA)
        pygame.draw.circle(surf, BLACK, (22, 22), 21)
        pygame.draw.circle(surf, color, (22, 22), 19)
        pygame.draw.circle(surf, highlight, (18, 16), 8)
        # Star
        star_points = []
        for i in range(5):
            angle = math.radians(i * 72 - 90)
            star_points.append((22 + int(10 * math.cos(angle)), 24 + int(10 * math.sin(angle))))
            angle2 = math.radians(i * 72 - 90 + 36)
            star_points.append((22 + int(5 * math.cos(angle2)), 24 + int(5 * math.sin(angle2))))
        pygame.draw.polygon(surf, highlight, star_points)
        pygame.draw.polygon(surf, BLACK, star_points, 1)
        save(surf, f"medal_{name}.png")


# ─── Sound Effects ───────────────────────────────────────────────────────────

def generate_sound(filename, frequency, duration_ms, wave_type="sine", volume=0.5,
                   fade_out=True, frequency_end=None):
    """Generate a simple sound effect as a .wav file."""
    sample_rate = 22050
    n_samples = int(sample_rate * duration_ms / 1000)
    samples = []

    for i in range(n_samples):
        t = i / sample_rate

        # Frequency sweep
        if frequency_end:
            f = frequency + (frequency_end - frequency) * (i / n_samples)
        else:
            f = frequency

        if wave_type == "sine":
            val = math.sin(2 * math.pi * f * t)
        elif wave_type == "square":
            val = 1.0 if math.sin(2 * math.pi * f * t) > 0 else -1.0
        elif wave_type == "noise":
            import random
            val = random.uniform(-1, 1)
        else:
            val = math.sin(2 * math.pi * f * t)

        # Fade out
        if fade_out:
            envelope = 1.0 - (i / n_samples)
        else:
            envelope = 1.0

        # Quick attack
        if i < sample_rate * 0.01:
            envelope *= i / (sample_rate * 0.01)

        val *= volume * envelope
        samples.append(int(val * 32767))

    path = os.path.join(SOUNDS_DIR, filename)
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(sample_rate)
        for s in samples:
            f.writeframes(struct.pack("<h", max(-32768, min(32767, s))))
    print(f"  Created: {path}")


def generate_sounds():
    # Flap - short, soft whoosh
    generate_sound("flap.wav", 400, 80, "sine", 0.3, frequency_end=200)

    # Score point - cheerful ding
    generate_sound("score.wav", 880, 150, "square", 0.25, frequency_end=1200)

    # Hit - thud
    generate_sound("hit.wav", 200, 200, "square", 0.5, frequency_end=80)

    # Die - falling tone
    generate_sound("die.wav", 400, 400, "sine", 0.4, frequency_end=100)

    # Swoosh - menu transition
    generate_sound("swoosh.wav", 300, 200, "sine", 0.3, frequency_end=600)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Generating Flappy Bird assets...\n")

    print("[Sprites]")
    generate_background()
    generate_ground()
    generate_pipe()
    generate_bird()
    generate_numbers()
    generate_small_numbers()
    generate_title()
    generate_play_button()
    generate_game_over()
    generate_get_ready()
    generate_score_panel()
    generate_tap_instruction()
    generate_medals()

    print("\n[Sounds]")
    generate_sounds()

    print("\nAll assets generated successfully!")
    pygame.quit()


if __name__ == "__main__":
    main()
