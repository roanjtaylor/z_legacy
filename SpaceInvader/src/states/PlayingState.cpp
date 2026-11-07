#include "states/PlayingState.hpp"
#include "core/StateManager.hpp"
#include "states/GameOverState.hpp"
#include "states/PausedState.hpp"
#include <cstdlib>

PlayingState::PlayingState() {
    m_playerBullets.resize(50);
    m_enemyBullets.resize(80);
}

void PlayingState::onEnter() {
    m_player.reset();
    m_scoreSystem.reset();
    m_currentWave = 0;
    m_bossWave = false;
    m_powerUpManager.clear();

    m_hud.init("assets/fonts/main.ttf");

    startWave();
}

void PlayingState::handleEvent(const sf::Event& event) {
    if (auto* kp = event.getIf<sf::Event::KeyPressed>()) {
        if (kp->code == sf::Keyboard::Key::Escape) {
            m_stateManager->pushState(std::make_unique<PausedState>());
        }
    }
}

void PlayingState::update(float dt) {
    m_input.update();
    const auto& input = m_input.getState();

    // SlowMo factor
    float slowFactor = m_powerUpManager.getSlowMoFactor();
    float gameDt = dt * slowFactor;
    m_powerUpManager.updateSlowMo(dt);

    // Player movement (not affected by slowmo)
    sf::Vector2f vel(0.f, 0.f);
    if (input.left) vel.x -= Constants::PLAYER_SPEED;
    if (input.right) vel.x += Constants::PLAYER_SPEED;
    m_player.setVelocity(vel);
    m_player.update(dt);

    // Shooting
    if (input.fire) {
        if (m_player.tryFire(m_playerBullets)) {
            m_sound.play(SoundSystem::Shoot);
        }
    }

    // Update bullets
    for (auto& b : m_playerBullets) {
        if (b.isAlive()) b.update(gameDt);
    }
    for (auto& b : m_enemyBullets) {
        if (b.isAlive()) b.update(gameDt);
    }

    // Wave transition
    if (m_waveTransitioning) {
        m_waveTransitionTimer -= dt;
        if (m_waveTransitionTimer <= 0.f) {
            m_waveTransitioning = false;
            startWave();
        }
        m_particles.update(dt);
        m_screenShake.update(dt);
        m_starField.update(dt);
        m_gridFloor.update(dt);
        return;
    }

    // Boss wave logic
    if (m_bossWave) {
        m_boss.update(gameDt);
        m_boss.tryShoot(m_enemyBullets);

        // Player bullets vs boss
        for (auto& b : m_playerBullets) {
            if (!b.isAlive() || !m_boss.isAlive()) continue;
            if (b.getBounds().findIntersection(m_boss.getBounds())) {
                bool destroyed = m_boss.hit();
                if (!b.isPiercing()) b.setAlive(false);

                m_particles.emit(b.getPosition(), sf::Color(255, 200, 100), 5, 150.f);
                m_screenShake.trigger(2.f, 0.05f);
                m_sound.play(SoundSystem::BossHit);

                if (destroyed) {
                    m_scoreSystem.addKill(m_boss.getScore());
                    m_particles.emitBossExplosion(m_boss.getPosition());
                    m_screenShake.trigger(Constants::SHAKE_BOSS_INTENSITY,
                                         Constants::SHAKE_BOSS_DURATION);
                    m_sound.play(SoundSystem::BossDeath);
                    m_bossWave = false;
                    m_waveTransitioning = true;
                    m_waveTransitionTimer = 3.0f;
                }
            }
        }
    } else {
        // Normal wave: enemies
        m_formation.update(gameDt, m_enemyBullets);

        // Collision
        auto events = m_collision.update(m_player, m_formation, m_playerBullets, m_enemyBullets);
        for (const auto& evt : events) {
            switch (evt.type) {
                case CollisionEvent::PlayerBulletHitEnemy:
                    m_scoreSystem.addKill(evt.scoreValue);
                    m_particles.emitExplosion(evt.position, sf::Color(255, 0, 255));
                    m_screenShake.trigger(Constants::SHAKE_KILL_INTENSITY,
                                         Constants::SHAKE_KILL_DURATION);
                    m_powerUpManager.trySpawn(evt.position);
                    m_sound.play(SoundSystem::EnemyDeath);
                    break;
                case CollisionEvent::EnemyBulletHitPlayer:
                    m_scoreSystem.onPlayerHit();
                    m_particles.emitExplosion(evt.position, sf::Color(0, 255, 255));
                    m_screenShake.trigger(8.f, 0.3f);
                    m_sound.play(SoundSystem::PlayerHit);
                    break;
                default:
                    break;
            }
        }

        // Check if enemies reached bottom
        if (m_formation.hasReachedBottom()) {
            m_player.setAlive(false);
        }
    }

    // Power-ups
    m_powerUpManager.update(dt, m_player);

    // Score system
    m_scoreSystem.update(dt);

    // Particles & effects
    m_particles.update(dt);
    m_screenShake.update(dt);
    m_starField.update(dt);
    m_gridFloor.update(dt);

    // Check player death
    if (!m_player.isAlive()) {
        auto gameOver = std::make_unique<GameOverState>(m_scoreSystem.getScore());
        m_stateManager->replaceState(std::move(gameOver));
        return;
    }

    // Check wave complete
    checkWaveComplete();
}

void PlayingState::draw(sf::RenderTarget& target) {
    target.clear(sf::Color(10, 5, 20));

    sf::Vector2f shakeOffset = m_screenShake.getOffset();
    sf::View view = target.getDefaultView();
    view.setCenter(view.getCenter() + shakeOffset);
    target.setView(view);

    // Background effects
    m_starField.draw(target);
    m_gridFloor.draw(target);

    // Enemies / Boss
    if (m_bossWave) {
        m_boss.draw(target);
    } else {
        m_formation.draw(target);
    }

    // Power-ups
    m_powerUpManager.draw(target);

    // Bullets
    for (auto& b : m_enemyBullets) {
        if (b.isAlive()) b.draw(target);
    }
    for (auto& b : m_playerBullets) {
        if (b.isAlive()) b.draw(target);
    }

    // Player
    m_player.draw(target);

    // Particles
    m_particles.draw(target);

    // Reset view for HUD
    target.setView(target.getDefaultView());

    // HUD
    m_hud.draw(target, m_scoreSystem.getScore(), m_player.getLives(),
               m_currentWave, m_scoreSystem.getComboCount(),
               m_scoreSystem.getMultiplier(), m_scoreSystem.getComboTimer());

    // Wave announcement
    if (m_waveTransitioning && m_waveTransitionTimer < 2.5f) {
        float alpha = std::min(1.0f, (2.5f - m_waveTransitionTimer) * 2.0f);
        if (m_waveTransitionTimer < 0.5f) alpha = m_waveTransitionTimer * 2.0f;
        m_hud.drawWaveAnnouncement(target, m_currentWave + 1, alpha);
    }
}

void PlayingState::startWave() {
    m_currentWave++;

    // Clear bullets
    for (auto& b : m_playerBullets) b.setAlive(false);
    for (auto& b : m_enemyBullets) b.setAlive(false);

    auto config = m_waveManager.getWaveConfig(m_currentWave);

    if (config.isBoss) {
        m_bossWave = true;
        BossType bossType;
        if (m_currentWave <= 5) bossType = BossType::Mothership;
        else if (m_currentWave <= 10) bossType = BossType::Fortress;
        else bossType = BossType::Swarm;

        m_boss.init(bossType, m_currentWave);
    } else {
        m_bossWave = false;
        m_waveManager.setupFormation(m_formation, m_currentWave);
    }
}

void PlayingState::checkWaveComplete() {
    if (m_waveTransitioning) return;

    bool complete = false;
    if (m_bossWave) {
        complete = !m_boss.isAlive();
    } else {
        complete = (m_formation.getAliveCount() == 0);
    }

    if (complete) {
        m_waveTransitioning = true;
        m_waveTransitionTimer = 2.0f;
    }
}
