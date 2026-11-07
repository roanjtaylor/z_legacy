"""Main game class - state machine, rendering, collision detection."""

import os
import math
import pygame

from src.constants import (
    SCREEN_WIDTH, SCREEN_HEIGHT, WINDOW_WIDTH, WINDOW_HEIGHT,
    SCALE_FACTOR, FPS, GROUND_HEIGHT,
    BIRD_X, BIRD_WIDTH,
    STATE_MENU, STATE_GET_READY, STATE_PLAYING, STATE_GAME_OVER,
    TITLE_BIRD_AMPLITUDE, TITLE_BIRD_SPEED,
    SPRITES_DIR, SOUNDS_DIR, HIGHSCORE_FILE,
    SCORE_FLASH_DURATION, WHITE, BLACK,
)
from src.bird import Bird
from src.pipe import PipeManager
from src.ground import Ground


class Game:
    def __init__(self):
        pygame.init()
        pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=512)

        self.window = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Flappy Bird")

        # Internal render surface at native resolution
        self.screen = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))

        self.clock = pygame.time.Clock()
        self.running = True
        self.state = STATE_MENU

        self._load_assets()
        self._init_entities()

        self.score = 0
        self.best_score = self._load_best_score()
        self.score_flash = 0
        self.tick = 0  # Global frame counter
        self.get_ready_timer = 0

    # ─── Asset Loading ───────────────────────────────────────────────────

    def _load_assets(self):
        def load_sprite(name):
            path = os.path.join(SPRITES_DIR, name)
            return pygame.image.load(path).convert_alpha()

        def load_sound(name):
            path = os.path.join(SOUNDS_DIR, name)
            return pygame.mixer.Sound(path)

        # Sprites
        self.bg_sprite = load_sprite("background.png")
        self.ground_sprite = load_sprite("ground.png")
        self.pipe_sprite = load_sprite("pipe.png")
        self.bird_sprites = [load_sprite(f"bird_{i}.png") for i in range(3)]
        self.num_sprites = [load_sprite(f"num_{i}.png") for i in range(10)]
        self.num_small_sprites = [load_sprite(f"num_small_{i}.png") for i in range(10)]
        self.title_sprite = load_sprite("title.png")
        self.play_button_sprite = load_sprite("play_button.png")
        self.game_over_sprite = load_sprite("game_over.png")
        self.get_ready_sprite = load_sprite("get_ready.png")
        self.score_panel_sprite = load_sprite("score_panel.png")
        self.tap_sprite = load_sprite("tap.png")

        # Medals
        self.medal_sprites = {}
        for name in ["bronze", "silver", "gold", "platinum"]:
            self.medal_sprites[name] = load_sprite(f"medal_{name}.png")

        # Sounds
        self.sound_flap = load_sound("flap.wav")
        self.sound_score = load_sound("score.wav")
        self.sound_hit = load_sound("hit.wav")
        self.sound_die = load_sound("die.wav")
        self.sound_swoosh = load_sound("swoosh.wav")

    def _init_entities(self):
        self.bird = Bird(self.bird_sprites)
        self.pipes = PipeManager(self.pipe_sprite)
        self.ground = Ground(self.ground_sprite)

    # ─── Score Persistence ───────────────────────────────────────────────

    def _load_best_score(self):
        try:
            with open(HIGHSCORE_FILE, "r") as f:
                return int(f.read().strip())
        except (FileNotFoundError, ValueError):
            return 0

    def _save_best_score(self):
        with open(HIGHSCORE_FILE, "w") as f:
            f.write(str(self.best_score))

    # ─── Score Rendering ─────────────────────────────────────────────────

    def _draw_score_large(self):
        """Draw the in-game score centered at the top."""
        digits = str(self.score)
        total_w = sum(self.num_sprites[int(d)].get_width() + 2 for d in digits) - 2
        x = (SCREEN_WIDTH - total_w) // 2
        y = 40

        for d in digits:
            sprite = self.num_sprites[int(d)]
            # Shadow
            self.screen.blit(sprite, (x + 1, y + 1))
            self.screen.blit(sprite, (x, y))
            x += sprite.get_width() + 2

    def _draw_score_on_panel(self, value, y_pos):
        """Draw a score right-aligned on the score panel."""
        digits = str(value)
        panel_x = (SCREEN_WIDTH - self.score_panel_sprite.get_width()) // 2
        right_edge = panel_x + self.score_panel_sprite.get_width() - 16
        total_w = sum(self.num_small_sprites[int(d)].get_width() + 1 for d in digits) - 1
        x = right_edge - total_w

        for d in digits:
            sprite = self.num_small_sprites[int(d)]
            self.screen.blit(sprite, (x, y_pos))
            x += sprite.get_width() + 1

    def _get_medal(self):
        if self.score >= 40:
            return self.medal_sprites["platinum"]
        elif self.score >= 30:
            return self.medal_sprites["gold"]
        elif self.score >= 20:
            return self.medal_sprites["silver"]
        elif self.score >= 10:
            return self.medal_sprites["bronze"]
        return None

    # ─── State: Menu ─────────────────────────────────────────────────────

    def _update_menu(self):
        self.ground.update()
        # Bird bobs on title screen
        self.tick += 1

    def _draw_menu(self):
        self.screen.blit(self.bg_sprite, (0, 0))
        self.pipes.draw(self.screen)  # No pipes, but keeps layering clean
        self.ground.draw(self.screen)

        # Title
        title_x = (SCREEN_WIDTH - self.title_sprite.get_width()) // 2
        title_y = 80
        self.screen.blit(self.title_sprite, (title_x, title_y))

        # Bobbing bird
        bob = math.sin(self.tick * TITLE_BIRD_SPEED) * TITLE_BIRD_AMPLITUDE
        bird_x = SCREEN_WIDTH // 2 + 10
        bird_y = 180 + bob
        frame = self.bird_sprites[int(self.tick * 0.1) % 3]
        self.screen.blit(frame, (bird_x, int(bird_y)))

        # Play button
        btn_x = (SCREEN_WIDTH - self.play_button_sprite.get_width()) // 2
        btn_y = 340
        self.screen.blit(self.play_button_sprite, (btn_x, btn_y))
        self._play_btn_rect = pygame.Rect(btn_x, btn_y,
                                           self.play_button_sprite.get_width(),
                                           self.play_button_sprite.get_height())

    def _handle_menu_click(self, pos):
        # Scale click position from window to internal resolution
        scaled_pos = (pos[0] // SCALE_FACTOR, pos[1] // SCALE_FACTOR)
        if self._play_btn_rect.collidepoint(scaled_pos):
            self.state = STATE_GET_READY
            self.get_ready_timer = 0
            self.bird.reset()
            self.pipes.reset()
            self.score = 0
            self.ground.scrolling = True
            self.sound_swoosh.play()

    # ─── State: Get Ready ────────────────────────────────────────────────

    def _update_get_ready(self):
        self.ground.update()
        self.tick += 1
        self.get_ready_timer += 1

    def _draw_get_ready(self):
        self.screen.blit(self.bg_sprite, (0, 0))
        self.ground.draw(self.screen)

        # Get ready text
        gr_x = (SCREEN_WIDTH - self.get_ready_sprite.get_width()) // 2
        self.screen.blit(self.get_ready_sprite, (gr_x, 130))

        # Tap instruction
        tap_x = (SCREEN_WIDTH - self.tap_sprite.get_width()) // 2
        self.screen.blit(self.tap_sprite, (tap_x, 200))

        # Bird at start position
        bob = math.sin(self.tick * TITLE_BIRD_SPEED) * TITLE_BIRD_AMPLITUDE
        frame = self.bird_sprites[int(self.tick * 0.1) % 3]
        self.screen.blit(frame, (BIRD_X, int(SCREEN_HEIGHT // 2 - 12 + bob)))

    def _handle_get_ready_input(self):
        self.state = STATE_PLAYING
        self.bird.reset()
        self.bird.flap()
        self.sound_flap.play()

    # ─── State: Playing ──────────────────────────────────────────────────

    def _update_playing(self):
        self.bird.update()
        self.pipes.update()
        self.ground.update()
        self.tick += 1

        if self.score_flash > 0:
            self.score_flash -= 1

        # Score check
        new_points = self.pipes.check_score(self.bird.x)
        if new_points > 0:
            self.score += new_points
            self.score_flash = SCORE_FLASH_DURATION
            self.sound_score.play()

        # Collision with pipes
        if self.pipes.check_collision(self.bird.rect):
            self._trigger_death()
            return

        # Collision with ground
        ground_y = SCREEN_HEIGHT - GROUND_HEIGHT
        if self.bird.y + self.bird.rect.height >= ground_y:
            self.bird.y = ground_y - self.bird.rect.height
            self._trigger_death()
            return

        # Collision with ceiling
        if self.bird.y <= 0:
            self.bird.y = 0
            self.bird.velocity = 0

    def _trigger_death(self):
        self.bird.alive = False
        self.ground.scrolling = False
        self.sound_hit.play()
        self.state = STATE_GAME_OVER

        if self.score > self.best_score:
            self.best_score = self.score
            self._save_best_score()

        # Play die sound slightly delayed effect via timer
        pygame.time.set_timer(pygame.USEREVENT + 1, 300, loops=1)

    def _draw_playing(self):
        self.screen.blit(self.bg_sprite, (0, 0))
        self.pipes.draw(self.screen)
        self.ground.draw(self.screen)
        self.bird.draw(self.screen)
        self._draw_score_large()

        # Flash effect on score
        if self.score_flash > 0:
            flash = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            alpha = int(80 * (self.score_flash / SCORE_FLASH_DURATION))
            flash.fill((255, 255, 255, alpha))
            self.screen.blit(flash, (0, 0))

    # ─── State: Game Over ────────────────────────────────────────────────

    def _update_game_over(self):
        self.bird.update()  # Let bird fall to ground
        self.tick += 1

    def _draw_game_over(self):
        self.screen.blit(self.bg_sprite, (0, 0))
        self.pipes.draw(self.screen)
        self.ground.draw(self.screen)
        self.bird.draw(self.screen)

        # Game over text
        go_x = (SCREEN_WIDTH - self.game_over_sprite.get_width()) // 2
        self.screen.blit(self.game_over_sprite, (go_x, 100))

        # Score panel
        panel_x = (SCREEN_WIDTH - self.score_panel_sprite.get_width()) // 2
        panel_y = 160
        self.screen.blit(self.score_panel_sprite, (panel_x, panel_y))

        # Medal
        medal = self._get_medal()
        if medal:
            self.screen.blit(medal, (panel_x + 14, panel_y + 32))

        # Scores on panel
        self._draw_score_on_panel(self.score, panel_y + 20)
        self._draw_score_on_panel(self.best_score, panel_y + 66)

        # Play button (restart)
        btn_x = (SCREEN_WIDTH - self.play_button_sprite.get_width()) // 2
        btn_y = 340
        self.screen.blit(self.play_button_sprite, (btn_x, btn_y))
        self._play_btn_rect = pygame.Rect(btn_x, btn_y,
                                           self.play_button_sprite.get_width(),
                                           self.play_button_sprite.get_height())

    def _handle_game_over_click(self, pos):
        scaled_pos = (pos[0] // SCALE_FACTOR, pos[1] // SCALE_FACTOR)
        if self._play_btn_rect.collidepoint(scaled_pos):
            self.state = STATE_GET_READY
            self.get_ready_timer = 0
            self.bird.reset()
            self.pipes.reset()
            self.ground.reset()
            self.score = 0
            self.sound_swoosh.play()

    # ─── Main Loop ───────────────────────────────────────────────────────

    def run(self):
        while self.running:
            self._handle_events()
            self._update()
            self._draw()
            self.clock.tick(FPS)

        pygame.quit()

    def _handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                return

            if event.type == pygame.USEREVENT + 1:
                self.sound_die.play()

            if event.type == pygame.MOUSEBUTTONDOWN:
                if self.state == STATE_MENU:
                    self._handle_menu_click(event.pos)
                elif self.state == STATE_GET_READY:
                    self._handle_get_ready_input()
                elif self.state == STATE_PLAYING:
                    self.bird.flap()
                    self.sound_flap.play()
                elif self.state == STATE_GAME_OVER:
                    self._handle_game_over_click(event.pos)

            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_SPACE, pygame.K_UP):
                    if self.state == STATE_GET_READY:
                        self._handle_get_ready_input()
                    elif self.state == STATE_PLAYING:
                        self.bird.flap()
                        self.sound_flap.play()
                    elif self.state == STATE_MENU:
                        # Spacebar starts game from menu too
                        self.state = STATE_GET_READY
                        self.get_ready_timer = 0
                        self.bird.reset()
                        self.pipes.reset()
                        self.score = 0
                        self.ground.scrolling = True
                        self.sound_swoosh.play()
                    elif self.state == STATE_GAME_OVER:
                        # Spacebar restarts from game over
                        self.state = STATE_GET_READY
                        self.get_ready_timer = 0
                        self.bird.reset()
                        self.pipes.reset()
                        self.ground.reset()
                        self.score = 0
                        self.sound_swoosh.play()

                if event.key == pygame.K_ESCAPE:
                    self.running = False

    def _update(self):
        if self.state == STATE_MENU:
            self._update_menu()
        elif self.state == STATE_GET_READY:
            self._update_get_ready()
        elif self.state == STATE_PLAYING:
            self._update_playing()
        elif self.state == STATE_GAME_OVER:
            self._update_game_over()

    def _draw(self):
        if self.state == STATE_MENU:
            self._draw_menu()
        elif self.state == STATE_GET_READY:
            self._draw_get_ready()
        elif self.state == STATE_PLAYING:
            self._draw_playing()
        elif self.state == STATE_GAME_OVER:
            self._draw_game_over()

        # Scale up to window size
        scaled = pygame.transform.scale(self.screen, (WINDOW_WIDTH, WINDOW_HEIGHT))
        self.window.blit(scaled, (0, 0))
        pygame.display.flip()
