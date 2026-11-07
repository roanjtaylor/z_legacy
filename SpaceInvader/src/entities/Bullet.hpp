#pragma once
#include "entities/Entity.hpp"
#include "core/Constants.hpp"

enum class BulletType {
    Player,
    Enemy,
    Laser
};

class Bullet : public Entity {
public:
    Bullet() { m_alive = false; }

    void init(sf::Vector2f pos, sf::Vector2f vel, BulletType type) {
        m_position = pos;
        m_velocity = vel;
        m_type = type;
        m_alive = true;

        if (type == BulletType::Laser) {
            m_width = 6.f;
            m_height = Constants::WINDOW_HEIGHT;
        } else {
            m_width = Constants::BULLET_WIDTH;
            m_height = Constants::BULLET_HEIGHT;
        }
    }

    void update(float dt) override {
        Entity::update(dt);
        updateBounds(m_width, m_height);

        if (m_position.y < -20.f || m_position.y > Constants::WINDOW_HEIGHT + 20.f) {
            m_alive = false;
        }
    }

    void draw(sf::RenderTarget& target) override {
        if (!m_alive) return;

        sf::RectangleShape shape({m_width, m_height});
        shape.setOrigin({m_width / 2.f, m_height / 2.f});
        shape.setPosition(m_position);

        if (m_type == BulletType::Player) {
            shape.setFillColor(sf::Color(0, 200, 255));
        } else if (m_type == BulletType::Enemy) {
            shape.setFillColor(sf::Color(255, 200, 50));
        } else {
            shape.setFillColor(sf::Color(0, 255, 255, 150));
        }

        target.draw(shape);

        // Glow overdraw
        sf::RectangleShape glow({m_width * 3.f, m_height * 1.5f});
        glow.setOrigin({m_width * 1.5f, m_height * 0.75f});
        glow.setPosition(m_position);

        sf::Color glowColor = (m_type == BulletType::Player) ?
            sf::Color(0, 200, 255, 30) : sf::Color(255, 200, 50, 30);
        glow.setFillColor(glowColor);
        target.draw(glow);
    }

    BulletType getType() const { return m_type; }
    bool isPiercing() const { return m_type == BulletType::Laser; }

private:
    BulletType m_type = BulletType::Player;
    float m_width = Constants::BULLET_WIDTH;
    float m_height = Constants::BULLET_HEIGHT;
};
