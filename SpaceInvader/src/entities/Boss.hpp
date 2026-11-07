#pragma once
#include "entities/Entity.hpp"
#include "entities/Bullet.hpp"
#include "core/Constants.hpp"
#include <vector>
#include <cmath>

enum class BossType {
    Mothership,  // Wave 5: sweeping + spread fire
    Fortress,    // Wave 10: stationary + spawns minions
    Swarm        // Wave 15+: multi-segment
};

class Boss : public Entity {
public:
    Boss() { m_alive = false; }

    void init(BossType type, int wave) {
        m_type = type;
        m_alive = true;
        m_phase = 0;
        m_phaseTimer = 0.f;
        m_shootTimer = 0.f;
        m_moveTimer = 0.f;

        // HP scales with wave
        m_maxHp = 20 + wave * 5;
        m_hp = m_maxHp;

        m_width = Constants::BOSS_WIDTH + (type == BossType::Fortress ? 40.f : 0.f);
        m_height = Constants::BOSS_HEIGHT;

        m_position = {Constants::WINDOW_WIDTH / 2.f, -m_height};
        m_targetY = 80.f;
        m_entering = true;
    }

    void update(float dt) override {
        if (!m_alive) return;

        // Entry animation
        if (m_entering) {
            m_position.y += 100.f * dt;
            if (m_position.y >= m_targetY) {
                m_position.y = m_targetY;
                m_entering = false;
            }
            updateBounds(m_width, m_height);
            return;
        }

        m_moveTimer += dt;
        m_phaseTimer += dt;
        m_shootTimer += dt;

        // Movement pattern
        switch (m_type) {
            case BossType::Mothership:
                m_position.x = Constants::WINDOW_WIDTH / 2.f +
                    std::sin(m_moveTimer * 0.8f) * 300.f;
                break;
            case BossType::Fortress:
                // Mostly stationary, slight wobble
                m_position.x = Constants::WINDOW_WIDTH / 2.f +
                    std::sin(m_moveTimer * 0.3f) * 50.f;
                break;
            case BossType::Swarm:
                m_position.x = Constants::WINDOW_WIDTH / 2.f +
                    std::sin(m_moveTimer * 1.2f) * 250.f;
                m_position.y = m_targetY + std::sin(m_moveTimer * 0.5f) * 30.f;
                break;
        }

        updateBounds(m_width, m_height);
    }

    bool tryShoot(std::vector<Bullet>& bullets) {
        if (!m_alive || m_entering) return false;

        float interval = 0.8f;
        if (m_type == BossType::Mothership) interval = 0.5f;
        if (m_type == BossType::Fortress) interval = 0.3f;

        // Shoot faster when low HP
        float hpRatio = static_cast<float>(m_hp) / m_maxHp;
        interval *= (0.5f + hpRatio * 0.5f);

        if (m_shootTimer < interval) return false;
        m_shootTimer = 0.f;

        switch (m_type) {
            case BossType::Mothership:
                fireSpread(bullets, 5);
                break;
            case BossType::Fortress:
                fireStraight(bullets);
                break;
            case BossType::Swarm:
                fireSpread(bullets, 3);
                break;
        }
        return true;
    }

    bool hit() {
        m_hp--;
        m_flashTimer = 0.08f;
        if (m_hp <= 0) {
            m_alive = false;
            return true;
        }
        return false;
    }

    void draw(sf::RenderTarget& target) override {
        if (!m_alive) return;

        sf::Color color = m_flashTimer > 0.f ? sf::Color::White : getColor();
        if (m_flashTimer > 0.f) m_flashTimer -= 1.f / 60.f;

        // Main body
        sf::RectangleShape body({m_width, m_height});
        body.setOrigin({m_width / 2.f, m_height / 2.f});
        body.setPosition(m_position);
        body.setFillColor(sf::Color(color.r / 4, color.g / 4, color.b / 4));
        body.setOutlineColor(color);
        body.setOutlineThickness(3.f);
        target.draw(body);

        // Detail shapes based on type
        if (m_type == BossType::Mothership) {
            sf::ConvexShape wing(3);
            wing.setPoint(0, {-m_width / 2.f, 0.f});
            wing.setPoint(1, {-m_width / 2.f - 20.f, m_height / 2.f});
            wing.setPoint(2, {-m_width / 2.f, m_height / 2.f});
            wing.setPosition(m_position);
            wing.setFillColor(sf::Color(color.r / 3, color.g / 3, color.b / 3));
            wing.setOutlineColor(color);
            wing.setOutlineThickness(2.f);
            target.draw(wing);

            sf::ConvexShape wing2(3);
            wing2.setPoint(0, {m_width / 2.f, 0.f});
            wing2.setPoint(1, {m_width / 2.f + 20.f, m_height / 2.f});
            wing2.setPoint(2, {m_width / 2.f, m_height / 2.f});
            wing2.setPosition(m_position);
            wing2.setFillColor(sf::Color(color.r / 3, color.g / 3, color.b / 3));
            wing2.setOutlineColor(color);
            wing2.setOutlineThickness(2.f);
            target.draw(wing2);
        }

        // HP bar
        float barWidth = m_width;
        float barHeight = 4.f;
        float hpRatio = static_cast<float>(m_hp) / m_maxHp;

        sf::RectangleShape barBg({barWidth, barHeight});
        barBg.setOrigin({barWidth / 2.f, 0.f});
        barBg.setPosition({m_position.x, m_position.y + m_height / 2.f + 8.f});
        barBg.setFillColor(sf::Color(50, 50, 50));
        target.draw(barBg);

        sf::RectangleShape bar({barWidth * hpRatio, barHeight});
        bar.setOrigin({barWidth / 2.f, 0.f});
        bar.setPosition({m_position.x, m_position.y + m_height / 2.f + 8.f});

        sf::Color barColor = hpRatio > 0.5f ? sf::Color(0, 255, 100) :
                            hpRatio > 0.25f ? sf::Color(255, 200, 0) :
                            sf::Color(255, 50, 50);
        bar.setFillColor(barColor);
        target.draw(bar);

        // Glow
        sf::RectangleShape glow({m_width * 1.5f, m_height * 1.5f});
        glow.setOrigin({m_width * 0.75f, m_height * 0.75f});
        glow.setPosition(m_position);
        glow.setFillColor(sf::Color(color.r, color.g, color.b, 15));
        target.draw(glow);
    }

    int getScore() const {
        return m_maxHp * 50;
    }

    BossType getType() const { return m_type; }
    float getHpRatio() const { return static_cast<float>(m_hp) / m_maxHp; }
    bool isEntering() const { return m_entering; }

private:
    sf::Color getColor() const {
        switch (m_type) {
            case BossType::Mothership: return sf::Color(255, 0, 200);
            case BossType::Fortress: return sf::Color(255, 100, 0);
            case BossType::Swarm: return sf::Color(200, 0, 255);
        }
        return sf::Color::White;
    }

    void fireSpread(std::vector<Bullet>& bullets, int count) {
        float startAngle = -20.f * (count / 2);
        for (int i = 0; i < count; i++) {
            float angle = startAngle + i * (40.f / (count - 1));
            float rad = angle * 3.14159f / 180.f;
            sf::Vector2f vel(std::sin(rad) * Constants::ENEMY_BULLET_SPEED,
                            std::cos(rad) * Constants::ENEMY_BULLET_SPEED);
            for (auto& b : bullets) {
                if (!b.isAlive()) {
                    b.init(m_position + sf::Vector2f(0.f, m_height / 2.f),
                           vel, BulletType::Enemy);
                    break;
                }
            }
        }
    }

    void fireStraight(std::vector<Bullet>& bullets) {
        // Fire from multiple points
        float offsets[] = {-m_width / 3.f, 0.f, m_width / 3.f};
        for (float off : offsets) {
            for (auto& b : bullets) {
                if (!b.isAlive()) {
                    b.init(m_position + sf::Vector2f(off, m_height / 2.f),
                           {0.f, Constants::ENEMY_BULLET_SPEED * 1.3f}, BulletType::Enemy);
                    break;
                }
            }
        }
    }

    BossType m_type = BossType::Mothership;
    int m_hp = 20;
    int m_maxHp = 20;
    float m_width = Constants::BOSS_WIDTH;
    float m_height = Constants::BOSS_HEIGHT;
    int m_phase = 0;
    float m_phaseTimer = 0.f;
    float m_shootTimer = 0.f;
    float m_moveTimer = 0.f;
    float m_targetY = 80.f;
    bool m_entering = true;
    float m_flashTimer = 0.f;
};
