#pragma once
#include "entities/Entity.hpp"
#include "entities/Bullet.hpp"
#include "core/Constants.hpp"
#include <vector>
#include <cmath>

enum class EnemyType {
    Basic,   // Magenta - standard
    Fast,    // Green - moves quicker
    Tank,    // Orange - takes multiple hits
    Shooter  // Red - shoots more often
};

class Enemy : public Entity {
public:
    Enemy() = default;

    void init(sf::Vector2f pos, EnemyType type, int row, int col) {
        m_position = pos;
        m_type = type;
        m_row = row;
        m_col = col;
        m_alive = true;
        m_hp = (type == EnemyType::Tank) ? 3 : 1;
        m_shootMultiplier = (type == EnemyType::Shooter) ? 3.0f : 1.0f;
    }

    void update(float dt) override {
        // Position is controlled by EnemyFormation, not velocity
        updateBounds(Constants::ENEMY_SIZE * 2.f, Constants::ENEMY_SIZE * 2.f);
    }

    void draw(sf::RenderTarget& target) override {
        if (!m_alive) return;

        sf::Color color = getColor();

        // Draw based on enemy type shape
        switch (m_type) {
            case EnemyType::Basic:
            case EnemyType::Shooter:
                drawDiamond(target, color);
                break;
            case EnemyType::Fast:
                drawArrow(target, color);
                break;
            case EnemyType::Tank:
                drawHexagon(target, color);
                break;
        }
    }

    bool hit() {
        m_hp--;
        if (m_hp <= 0) {
            m_alive = false;
            return true; // destroyed
        }
        m_flashTimer = 0.1f;
        return false;
    }

    int getScore() const {
        switch (m_type) {
            case EnemyType::Basic: return 100;
            case EnemyType::Fast: return 150;
            case EnemyType::Tank: return 250;
            case EnemyType::Shooter: return 200;
        }
        return 100;
    }

    EnemyType getType() const { return m_type; }
    int getRow() const { return m_row; }
    int getCol() const { return m_col; }
    float getShootMultiplier() const { return m_shootMultiplier; }

private:
    sf::Color getColor() const {
        if (m_flashTimer > 0.f) return sf::Color::White;
        switch (m_type) {
            case EnemyType::Basic: return sf::Color(255, 0, 255);
            case EnemyType::Fast: return sf::Color(0, 255, 100);
            case EnemyType::Tank: return sf::Color(255, 150, 0);
            case EnemyType::Shooter: return sf::Color(255, 50, 50);
        }
        return sf::Color::White;
    }

    void drawDiamond(sf::RenderTarget& target, sf::Color color) {
        float s = Constants::ENEMY_SIZE;
        sf::ConvexShape shape(4);
        shape.setPoint(0, {0.f, -s});
        shape.setPoint(1, {s, 0.f});
        shape.setPoint(2, {0.f, s});
        shape.setPoint(3, {-s, 0.f});
        shape.setPosition(m_position);

        sf::Color fill(color.r / 4, color.g / 4, color.b / 4);
        shape.setFillColor(fill);
        shape.setOutlineColor(color);
        shape.setOutlineThickness(2.f);
        target.draw(shape);

        // Glow
        sf::ConvexShape glow(4);
        float gs = s * 1.4f;
        glow.setPoint(0, {0.f, -gs});
        glow.setPoint(1, {gs, 0.f});
        glow.setPoint(2, {0.f, gs});
        glow.setPoint(3, {-gs, 0.f});
        glow.setPosition(m_position);
        glow.setFillColor(sf::Color(color.r, color.g, color.b, 15));
        target.draw(glow);

        // Shooter has inner mark
        if (m_type == EnemyType::Shooter) {
            sf::CircleShape dot(3.f);
            dot.setOrigin({3.f, 3.f});
            dot.setPosition(m_position);
            dot.setFillColor(color);
            target.draw(dot);
        }
    }

    void drawArrow(sf::RenderTarget& target, sf::Color color) {
        float s = Constants::ENEMY_SIZE;
        sf::ConvexShape shape(5);
        shape.setPoint(0, {0.f, s});
        shape.setPoint(1, {-s, -s * 0.5f});
        shape.setPoint(2, {-s * 0.4f, 0.f});
        shape.setPoint(3, {0.f, -s});
        shape.setPoint(4, {s * 0.4f, 0.f});

        // Mirror: right side
        shape = sf::ConvexShape(7);
        shape.setPoint(0, {0.f, s});
        shape.setPoint(1, {-s, -s * 0.3f});
        shape.setPoint(2, {-s * 0.3f, 0.f});
        shape.setPoint(3, {0.f, -s});
        shape.setPoint(4, {s * 0.3f, 0.f});
        shape.setPoint(5, {s, -s * 0.3f});
        shape.setPoint(6, {0.f, s});

        shape.setPosition(m_position);
        sf::Color fill(color.r / 4, color.g / 4, color.b / 4);
        shape.setFillColor(fill);
        shape.setOutlineColor(color);
        shape.setOutlineThickness(2.f);
        target.draw(shape);
    }

    void drawHexagon(sf::RenderTarget& target, sf::Color color) {
        float s = Constants::ENEMY_SIZE;
        sf::CircleShape shape(s, 6);
        shape.setOrigin({s, s});
        shape.setPosition(m_position);
        sf::Color fill(color.r / 4, color.g / 4, color.b / 4);
        shape.setFillColor(fill);
        shape.setOutlineColor(color);
        shape.setOutlineThickness(2.f);
        target.draw(shape);

        // HP indicator for tanks
        if (m_hp > 1) {
            sf::CircleShape inner(s * 0.4f, 6);
            inner.setOrigin({s * 0.4f, s * 0.4f});
            inner.setPosition(m_position);
            inner.setFillColor(sf::Color::Transparent);
            inner.setOutlineColor(sf::Color(color.r, color.g, color.b, 150));
            inner.setOutlineThickness(1.f);
            target.draw(inner);
        }
    }

    EnemyType m_type = EnemyType::Basic;
    int m_row = 0;
    int m_col = 0;
    int m_hp = 1;
    float m_shootMultiplier = 1.0f;
    float m_flashTimer = 0.f;
};
