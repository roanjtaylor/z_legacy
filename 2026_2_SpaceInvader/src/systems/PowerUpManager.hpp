#pragma once
#include "entities/PowerUp.hpp"
#include "entities/Player.hpp"
#include "core/Constants.hpp"
#include <vector>
#include <cstdlib>

class PowerUpManager {
public:
    PowerUpManager() {
        m_powerUps.resize(10);
    }

    void trySpawn(sf::Vector2f pos) {
        float roll = static_cast<float>(std::rand()) / RAND_MAX;
        if (roll > Constants::POWERUP_DROP_RATE) return;

        PowerUpType type;
        int r = std::rand() % 100;
        if (r < 30) type = PowerUpType::SpreadShot;
        else if (r < 50) type = PowerUpType::LaserBeam;
        else if (r < 70) type = PowerUpType::Shield;
        else if (r < 90) type = PowerUpType::SlowMo;
        else type = PowerUpType::ExtraLife;

        for (auto& pu : m_powerUps) {
            if (!pu.isAlive()) {
                pu.init(pos, type);
                return;
            }
        }
    }

    void update(float dt, Player& player) {
        for (auto& pu : m_powerUps) {
            if (!pu.isAlive()) continue;
            pu.update(dt);

            // Check collision with player
            if (pu.getBounds().findIntersection(player.getBounds())) {
                applyPowerUp(pu.getType(), player);
                pu.setAlive(false);
            }
        }
    }

    void draw(sf::RenderTarget& target) {
        for (auto& pu : m_powerUps) {
            if (pu.isAlive()) pu.draw(target);
        }
    }

    void clear() {
        for (auto& pu : m_powerUps) pu.setAlive(false);
    }

private:
    void applyPowerUp(PowerUpType type, Player& player) {
        switch (type) {
            case PowerUpType::SpreadShot:
                player.setWeapon(WeaponType::Spread, Constants::SPREAD_DURATION);
                break;
            case PowerUpType::LaserBeam:
                player.setWeapon(WeaponType::Laser, Constants::LASER_DURATION);
                break;
            case PowerUpType::Shield:
                player.setShield(Constants::SHIELD_HITS);
                break;
            case PowerUpType::SlowMo:
                m_slowMoTimer = Constants::SLOWMO_DURATION;
                break;
            case PowerUpType::ExtraLife:
                player.addLife();
                break;
        }
    }

public:
    float getSlowMoFactor() {
        if (m_slowMoTimer > 0.f) return 0.5f;
        return 1.0f;
    }

    void updateSlowMo(float dt) {
        if (m_slowMoTimer > 0.f) m_slowMoTimer -= dt;
    }

private:
    std::vector<PowerUp> m_powerUps;
    float m_slowMoTimer = 0.f;
};
