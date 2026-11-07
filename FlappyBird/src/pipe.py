"""Pipe obstacles with scrolling and gap management."""

import random
import pygame
from src.constants import (
    PIPE_WIDTH, PIPE_GAP, PIPE_SPEED,
    PIPE_MIN_Y, PIPE_MAX_Y, SCREEN_HEIGHT, GROUND_HEIGHT,
)


class Pipe:
    def __init__(self, x, pipe_sprite):
        self.x = x
        self.pipe_sprite = pipe_sprite  # Bottom pipe image
        self.top_sprite = pygame.transform.flip(pipe_sprite, False, True)  # Flipped for top

        # Random gap position
        gap_top = random.randint(PIPE_MIN_Y, PIPE_MAX_Y)
        self.gap_top = gap_top
        self.gap_bottom = gap_top + PIPE_GAP

        self.scored = False  # Whether the bird has passed this pipe

    @property
    def top_rect(self):
        """Rect for the top pipe."""
        return pygame.Rect(
            int(self.x), self.gap_top - self.top_sprite.get_height(),
            PIPE_WIDTH, self.top_sprite.get_height()
        )

    @property
    def bottom_rect(self):
        """Rect for the bottom pipe."""
        return pygame.Rect(
            int(self.x), self.gap_bottom,
            PIPE_WIDTH, self.pipe_sprite.get_height()
        )

    @property
    def top_mask(self):
        return pygame.mask.from_surface(self.top_sprite)

    @property
    def bottom_mask(self):
        return pygame.mask.from_surface(self.pipe_sprite)

    def update(self):
        self.x -= PIPE_SPEED

    def is_off_screen(self):
        return self.x + PIPE_WIDTH < 0

    def draw(self, surface):
        # Top pipe
        surface.blit(self.top_sprite, (int(self.x), self.gap_top - self.top_sprite.get_height()))
        # Bottom pipe
        surface.blit(self.pipe_sprite, (int(self.x), self.gap_bottom))


class PipeManager:
    def __init__(self, pipe_sprite):
        self.pipe_sprite = pipe_sprite
        self.pipes = []
        self.spawn_timer = 0
        self.spawn_interval = 90  # Frames between spawns

    def update(self):
        self.spawn_timer += 1
        if self.spawn_timer >= self.spawn_interval:
            self.spawn_timer = 0
            self.pipes.append(Pipe(300, self.pipe_sprite))  # Spawn just off screen right

        for pipe in self.pipes:
            pipe.update()

        # Remove off-screen pipes
        self.pipes = [p for p in self.pipes if not p.is_off_screen()]

    def draw(self, surface):
        for pipe in self.pipes:
            pipe.draw(surface)

    def check_collision(self, bird_rect):
        """Check pixel-approximate collision with bird rect."""
        # Use rect collision with slight inner margin for fairness
        shrunk = bird_rect.inflate(-6, -6)
        for pipe in self.pipes:
            if shrunk.colliderect(pipe.top_rect) or shrunk.colliderect(pipe.bottom_rect):
                return True
        return False

    def check_score(self, bird_x):
        """Check if bird has passed any pipe. Returns number of new points."""
        points = 0
        for pipe in self.pipes:
            if not pipe.scored and pipe.x + PIPE_WIDTH < bird_x:
                pipe.scored = True
                points += 1
        return points

    def reset(self):
        self.pipes.clear()
        self.spawn_timer = 0
