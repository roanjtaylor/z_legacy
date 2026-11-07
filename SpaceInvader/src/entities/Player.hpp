#pragma once
#include "entities/Entity.hpp"
#include "entities/Bullet.hpp"
#include "core/Constants.hpp"
#include <vector>
#include <cmath>

enum class WeaponType {
    Normal,
    Spread,
    Laser
};

class Player : public Entity {
public:
    Player() {
        m_position = {Constants::WINDOW_WIDTH / 2.f, Constants::PLAYER_Y};
        m_lives = Constants::PLAYER_START_LIVES;
    }

    void update(float dt) override {
        Entity::update(dt);

        // Clamp to screen
        float halfSize = Constants::PLAYER_SIZE;
        if (m_position.x < halfSize) m_position.x = halfSize;
        if (m_position.x > Constants::WINDOW_WIDTH - halfSize)
            m_position.x = Constants::WINDOW_WIDTH - halfSize;

        updateBounds(Constants::PLAYER_SIZE * 2.f, Constants::PLAYER_SIZE * 2.f);

        // Fire cooldown
        if (m_fireCooldown > 0.f) m_fireCooldown -= dt;

        // Weapon timer
        if (m_weaponType != WeaponType::Normal) {
            m_weaponTimer -= dt;
            if (m_weaponTimer <= 0.f) {
                m_weaponType = WeaponType::Normal;
            }
        }

        // Shield timer (shield doesn't expire by time, only by hits)

        // Invincibility
        if (m_invincible) {
            m_invincibilityTimer -= dt;
            if (m_invincibilityTimer <= 0.f) {
                m_invincible = false;
            }
        }
    }

    void draw(sf::RenderTarget& target) override {
        if (!m_alive) return;

        // Blink when invincible
        if (m_invincible) {
            float t = m_invincibilityTimer * 10.f;
            if (static_cast<int>(t) % 2 == 0) return;
        }

        // Ship body - triangle
        sf::ConvexShape ship(3);
        ship.setPoint(0, {0.f, -Constants::PLAYER_SIZE});
        ship.setPoint(1, {-Constants::PLAYER_SIZE, Constants::PLAYER_SIZE});
        ship.setPoint(2, {Constants::PLAYER_SIZE, Constants::PLAYER_SIZE});
        ship.setPosition(m_position);

        sf::Color shipColor(0, 255, 255);
        ship.setFillColor(sf::Color(0, 80, 80));
        ship.setOutlineColor(shipColor);
        ship.setOutlineThickness(2.f);
        target.draw(ship);

        // Glow
        sf::ConvexShape glow(3);
        glow.setPoint(0, {0.f, -Constants::PLAYER_SIZE * 1.3f});
        glow.setPoint(1, {-Constants::PLAYER_SIZE * 1.3f, Constants::PLAYER_SIZE * 1.3f});
        glow.setPoint(2, {Constants::PLAYER_SIZE * 1.3f, Constants::PLAYER_SIZE * 1.3f});
        glow.setPosition(m_position);
        glow.setFillColor(sf::Color(0, 255, 255, 20));
        target.draw(glow);

        // Shield indicator
        if (m_shieldHits > 0) {
            sf::CircleShape shield(Constants::PLAYER_SIZE * 1.5f);
            shield.setOrigin({Constants::PLAYER_SIZE * 1.5f, Constants::PLAYER_SIZE * 1.5f});
            shield.setPosition(m_position);
            shield.setFillColor(sf::Color::Transparent);
            shield.setOutlineColor(sf::Color(0, 255, 200, 100));
            shield.setOutlineThickness(2.f);
            target.draw(shield);
        }
    }

    bool tryFire(std::vector<Bullet>& bullets) {
        if (m_fireCooldown > 0.f || !m_alive) return false;
        m_fireCooldown = Constants::PLAYER_FIRE_RATE;

        if (m_weaponType == WeaponType::Spread) {
            // 3-way spread
            float angles[] = {-15.f, 0.f, 15.f};
            for (float angle : angles) {
                float rad = angle * 3.14159f / 180.f;
                sf::Vector2f vel(std::sin(rad) * Constants::BULLET_SPEED,
                                 -std::cos(rad) * Constants::BULLET_SPEED);
                for (auto& b : bullets) {
                    if (!b.isAlive()) {
                        b.init(m_position + sf::Vector2f(0.f, -Constants::PLAYER_SIZE),
                               vel, BulletType::Player);
                        break;
                    }
                }
            }
        } else if (m_weaponType == WeaponType::Laser) {
            for (auto& b : bullets) {
                if (!b.isAlive()) {
                    b.init({m_position.x, Constants::WINDOW_HEIGHT / 2.f},
                           {0.f, 0.f}, BulletType::Laser);
                    break;
                }
            }
        } else {
            for (auto& b : bullets) {
                if (!b.isAlive()) {
                    b.init(m_position + sf::Vector2f(0.f, -Constants::PLAYER_SIZE),
                           {0.f, -Constants::BULLET_SPEED}, BulletType::Player);
                    break;
                }
            }
        }
        return true;
    }

    void hit() {
        if (m_invincible) return;
        if (m_shieldHits > 0) {
            m_shieldHits--;
            return;
        }
        m_lives--;
        if (m_lives <= 0) {
            m_alive = false;
        } else {
            m_invincible = true;
            m_invincibilityTimer = Constants::PLAYER_INVINCIBILITY_TIME;
        }
    }

    int getLives() const { return m_lives; }
    void addLife() { m_lives++; }
    bool isInvincible() const { return m_invincible; }

    void setWeapon(WeaponType type, float duration) {
        m_weaponType = type;
        m_weaponTimer = duration;
    }
    WeaponType getWeapon() const { return m_weaponType; }

    void setShield(int hits) { m_shieldHits = hits; }
    int getShieldHits() const { return m_shieldHits; }

    void reset() {
        m_position = {Constants::WINDOW_WIDTH / 2.f, Constants::PLAYER_Y};
        m_velocity = {0.f, 0.f};
        m_lives = Constants::PLAYER_START_LIVES;
        m_alive = true;
        m_invincible = false;
        m_weaponType = WeaponType::Normal;
        m_shieldHits = 0;
        m_fireCooldown = 0.f;
    }

private:
    int m_lives = Constants::PLAYER_START_LIVES;
    float m_fireCooldown = 0.f;
    bool m_invincible = false;
    float m_invincibilityTimer = 0.f;
    WeaponType m_weaponType = WeaponType::Normal;
    float m_weaponTimer = 0.f;
    int m_shieldHits = 0;
};
