"""Scrolling ground layer."""

import pygame
from src.constants import SCREEN_WIDTH, SCREEN_HEIGHT, GROUND_HEIGHT, GROUND_SPEED


class Ground:
    def __init__(self, sprite):
        self.sprite = sprite
        self.x = 0
        self.y = SCREEN_HEIGHT - GROUND_HEIGHT
        self.scroll_speed = GROUND_SPEED
        self.scrolling = True

    def update(self):
        if not self.scrolling:
            return
        self.x -= self.scroll_speed
        # Reset position for seamless loop (ground sprite is wider than screen)
        if self.x <= -(self.sprite.get_width() - SCREEN_WIDTH):
            self.x = 0

    def draw(self, surface):
        surface.blit(self.sprite, (int(self.x), self.y))
        # Second copy for seamless scrolling
        surface.blit(self.sprite, (int(self.x) + self.sprite.get_width(), self.y))

    def reset(self):
        self.x = 0
        self.scrolling = True
