#pragma once
#include "core/GameState.hpp"
#include "core/Constants.hpp"
#include "entities/Player.hpp"
#include "entities/Bullet.hpp"
#include "entities/EnemyFormation.hpp"
#include "entities/Boss.hpp"
#include "systems/InputHandler.hpp"
#include "systems/CollisionSystem.hpp"
#include "systems/ParticleSystem.hpp"
#include "systems/ScreenShake.hpp"
#include "systems/ScoreSystem.hpp"
#include "systems/WaveManager.hpp"
#include "systems/PowerUpManager.hpp"
#include "effects/GridFloor.hpp"
#include "effects/StarField.hpp"
#include "systems/SoundSystem.hpp"
#include "ui/HUD.hpp"
#include <vector>

class PlayingState : public GameState {
public:
    PlayingState();

    void handleEvent(const sf::Event& event) override;
    void update(float dt) override;
    void draw(sf::RenderTarget& target) override;
    void onEnter() override;

private:
    void startWave();
    void checkWaveComplete();

    Player m_player;
    std::vector<Bullet> m_playerBullets;
    std::vector<Bullet> m_enemyBullets;
    EnemyFormation m_formation;
    CollisionSystem m_collision;
    InputHandler m_input;
    ParticleSystem m_particles;
    ScreenShake m_screenShake;
    ScoreSystem m_scoreSystem;
    WaveManager m_waveManager;
    PowerUpManager m_powerUpManager;
    GridFloor m_gridFloor;
    StarField m_starField;
    HUD m_hud;
    SoundSystem m_sound;

    Boss m_boss;
    bool m_bossWave = false;

    int m_currentWave = 0;
    float m_waveTransitionTimer = 0.f;
    bool m_waveTransitioning = false;
};
