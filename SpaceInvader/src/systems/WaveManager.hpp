#pragma once
#include "core/Constants.hpp"
#include "entities/EnemyFormation.hpp"

struct WaveConfig {
    int rows;
    int cols;
    float speedMultiplier;
    bool isBoss;
};

class WaveManager {
public:
    WaveConfig getWaveConfig(int wave) const {
        WaveConfig config;
        config.isBoss = (wave % Constants::BOSS_WAVE_INTERVAL == 0) && wave > 0;

        if (config.isBoss) {
            config.rows = 0;
            config.cols = 0;
            config.speedMultiplier = 1.0f;
        } else {
            config.rows = std::min(Constants::ENEMY_ROWS + wave / 3, 7);
            config.cols = Constants::ENEMY_COLUMNS;
            config.speedMultiplier = 1.0f + wave * 0.12f;
        }
        return config;
    }

    void setupFormation(EnemyFormation& formation, int wave) {
        auto config = getWaveConfig(wave);
        if (!config.isBoss) {
            formation.init(config.rows, config.cols, config.speedMultiplier, wave);
        }
    }
};
