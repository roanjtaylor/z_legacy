#pragma once
#include <SFML/Graphics.hpp>

class Entity {
public:
    Entity() = default;
    virtual ~Entity() = default;

    virtual void update(float dt) {
        m_position += m_velocity * dt;
    }

    virtual void draw(sf::RenderTarget& target) = 0;

    sf::Vector2f getPosition() const { return m_position; }
    void setPosition(sf::Vector2f pos) { m_position = pos; }

    sf::Vector2f getVelocity() const { return m_velocity; }
    void setVelocity(sf::Vector2f vel) { m_velocity = vel; }

    sf::FloatRect getBounds() const { return m_bounds; }

    bool isAlive() const { return m_alive; }
    void setAlive(bool alive) { m_alive = alive; }

protected:
    void updateBounds(float width, float height) {
        m_bounds = sf::FloatRect(
            {m_position.x - width / 2.f, m_position.y - height / 2.f},
            {width, height}
        );
    }

    sf::Vector2f m_position{0.f, 0.f};
    sf::Vector2f m_velocity{0.f, 0.f};
    sf::FloatRect m_bounds;
    bool m_alive = true;
};
