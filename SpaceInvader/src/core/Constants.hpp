#pragma once

namespace Constants {
    // Window
    constexpr unsigned int WINDOW_WIDTH = 1280;
    constexpr unsigned int WINDOW_HEIGHT = 720;
    constexpr float FIXED_TIMESTEP = 1.0f / 60.0f;
    constexpr float MAX_FRAME_TIME = 0.25f;

    // Player
    constexpr float PLAYER_SPEED = 400.0f;
    constexpr float PLAYER_SIZE = 20.0f;
    constexpr float PLAYER_FIRE_RATE = 0.15f;
    constexpr int PLAYER_START_LIVES = 3;
    constexpr float PLAYER_Y = 660.0f;
    constexpr float PLAYER_INVINCIBILITY_TIME = 2.0f;

    // Bullets
    constexpr float BULLET_SPEED = 600.0f;
    constexpr float ENEMY_BULLET_SPEED = 250.0f;
    constexpr float BULLET_WIDTH = 3.0f;
    constexpr float BULLET_HEIGHT = 12.0f;

    // Enemies
    constexpr int ENEMY_COLUMNS = 11;
    constexpr int ENEMY_ROWS = 5;
    constexpr float ENEMY_SIZE = 18.0f;
    constexpr float ENEMY_SPACING_X = 45.0f;
    constexpr float ENEMY_SPACING_Y = 40.0f;
    constexpr float ENEMY_START_X = 180.0f;
    constexpr float ENEMY_START_Y = 80.0f;
    constexpr float ENEMY_BASE_SPEED = 30.0f;
    constexpr float ENEMY_DROP_DISTANCE = 20.0f;
    constexpr float ENEMY_SHOOT_INTERVAL = 1.5f;

    // Boss
    constexpr float BOSS_WIDTH = 80.0f;
    constexpr float BOSS_HEIGHT = 40.0f;

    // Power-ups
    constexpr float POWERUP_DROP_RATE = 0.08f;
    constexpr float POWERUP_SIZE = 15.0f;
    constexpr float POWERUP_FALL_SPEED = 120.0f;
    constexpr float SPREAD_DURATION = 8.0f;
    constexpr float LASER_DURATION = 5.0f;
    constexpr float SLOWMO_DURATION = 6.0f;
    constexpr int SHIELD_HITS = 3;

    // Score
    constexpr float COMBO_WINDOW = 2.0f;
    constexpr int COMBO_TIER1 = 5;
    constexpr int COMBO_TIER2 = 15;
    constexpr int COMBO_TIER3 = 30;

    // Particles
    constexpr int MAX_PARTICLES = 4096;
    constexpr float PARTICLE_LIFETIME = 1.0f;

    // Screen shake
    constexpr float SHAKE_KILL_INTENSITY = 3.0f;
    constexpr float SHAKE_KILL_DURATION = 0.1f;
    constexpr float SHAKE_BOSS_INTENSITY = 15.0f;
    constexpr float SHAKE_BOSS_DURATION = 0.5f;

    // Waves
    constexpr int BOSS_WAVE_INTERVAL = 5;
}
