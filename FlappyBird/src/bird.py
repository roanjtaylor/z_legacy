"""Bird entity with physics, animation, and rotation."""

import pygame
from src.constants import (
    GRAVITY, FLAP_VELOCITY, MAX_FALL_SPEED,
    BIRD_X, BIRD_WIDTH, BIRD_HEIGHT,
    BIRD_ANIMATION_SPEED, BIRD_MAX_ROTATION, BIRD_MIN_ROTATION,
    BIRD_ROTATION_SPEED, SCREEN_HEIGHT, GROUND_HEIGHT,
)


class Bird:
    def __init__(self, sprites):
        self.sprites = sprites  # List of 3 surfaces [up, mid, down]
        self.animation_index = 0.0
        self.velocity = 0
        self.x = BIRD_X
        self.y = SCREEN_HEIGHT // 2 - BIRD_HEIGHT // 2
        self.rotation = 0  # Degrees
        self.alive = True
        self.visible = True

    @property
    def rect(self):
        return pygame.Rect(self.x, int(self.y), BIRD_WIDTH, BIRD_HEIGHT)

    @property
    def mask(self):
        """Return collision mask for current frame."""
        frame = self.sprites[int(self.animation_index) % 3]
        rotated = pygame.transform.rotate(frame, self.rotation)
        return pygame.mask.from_surface(rotated)

    def get_rotated_image(self):
        frame = self.sprites[int(self.animation_index) % 3]
        rotated = pygame.transform.rotate(frame, self.rotation)
        return rotated

    def flap(self):
        if self.alive:
            self.velocity = FLAP_VELOCITY
            self.rotation = BIRD_MAX_ROTATION

    def update(self):
        if not self.alive:
            # Fall to ground
            self.velocity += GRAVITY
            self.velocity = min(self.velocity, MAX_FALL_SPEED)
            self.y += self.velocity
            self.rotation = max(self.rotation - BIRD_ROTATION_SPEED * 2, BIRD_MIN_ROTATION)

            ground_y = SCREEN_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT
            if self.y >= ground_y:
                self.y = ground_y
                self.velocity = 0
            return

        # Gravity
        self.velocity += GRAVITY
        self.velocity = min(self.velocity, MAX_FALL_SPEED)
        self.y += self.velocity

        # Animation
        self.animation_index += BIRD_ANIMATION_SPEED
        if self.animation_index >= 3:
            self.animation_index = 0

        # Rotation based on velocity
        if self.velocity < 0:
            self.rotation = min(self.rotation + BIRD_ROTATION_SPEED, BIRD_MAX_ROTATION)
        else:
            self.rotation = max(self.rotation - BIRD_ROTATION_SPEED, BIRD_MIN_ROTATION)

    def draw(self, surface):
        if not self.visible:
            return
        image = self.get_rotated_image()
        # Rotate around center
        rect = image.get_rect(center=(self.x + BIRD_WIDTH // 2, int(self.y) + BIRD_HEIGHT // 2))
        surface.blit(image, rect)

    def reset(self):
        self.y = SCREEN_HEIGHT // 2 - BIRD_HEIGHT // 2
        self.velocity = 0
        self.rotation = 0
        self.animation_index = 0
        self.alive = True
        self.visible = True
