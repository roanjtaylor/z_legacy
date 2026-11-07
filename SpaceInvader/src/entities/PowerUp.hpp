#pragma once
#include "entities/Entity.hpp"
#include "core/Constants.hpp"

enum class PowerUpType {
    SpreadShot,
    LaserBeam,
    Shield,
    SlowMo,
    ExtraLife
};

class PowerUp : public Entity {
public:
    PowerUp() { m_alive = false; }

    void init(sf::Vector2f pos, PowerUpType type) {
        m_position = pos;
        m_type = type;
        m_alive = true;
        m_velocity = {0.f, Constants::POWERUP_FALL_SPEED};
        m_bobTimer = 0.f;
    }

    void update(float dt) override {
        Entity::update(dt);
        m_bobTimer += dt * 4.f;
        updateBounds(Constants::POWERUP_SIZE * 2.f, Constants::POWERUP_SIZE * 2.f);

        if (m_position.y > Constants::WINDOW_HEIGHT + 20.f) {
            m_alive = false;
        }
    }

    void draw(sf::RenderTarget& target) override {
        if (!m_alive) return;

        float bob = std::sin(m_bobTimer) * 3.f;
        sf::Vector2f drawPos = m_position + sf::Vector2f(0.f, bob);

        sf::Color color = getColor();

        // Outer circle
        sf::CircleShape circle(Constants::POWERUP_SIZE);
        circle.setOrigin({Constants::POWERUP_SIZE, Constants::POWERUP_SIZE});
        circle.setPosition(drawPos);
        circle.setFillColor(sf::Color(color.r / 3, color.g / 3, color.b / 3));
        circle.setOutlineColor(color);
        circle.setOutlineThickness(2.f);
        target.draw(circle);

        // Glow
        sf::CircleShape glow(Constants::POWERUP_SIZE * 2.f);
        glow.setOrigin({Constants::POWERUP_SIZE * 2.f, Constants::POWERUP_SIZE * 2.f});
        glow.setPosition(drawPos);
        glow.setFillColor(sf::Color(color.r, color.g, color.b, 20));
        target.draw(glow);

        // Icon indicator
        drawIcon(target, drawPos, color);
    }

    PowerUpType getType() const { return m_type; }

private:
    sf::Color getColor() const {
        switch (m_type) {
            case PowerUpType::SpreadShot: return sf::Color(255, 100, 0);
            case PowerUpType::LaserBeam: return sf::Color(255, 0, 0);
            case PowerUpType::Shield: return sf::Color(0, 255, 200);
            case PowerUpType::SlowMo: return sf::Color(100, 100, 255);
            case PowerUpType::ExtraLife: return sf::Color(0, 255, 0);
        }
        return sf::Color::White;
    }

    void drawIcon(sf::RenderTarget& target, sf::Vector2f pos, sf::Color color) {
        float s = 5.f;
        switch (m_type) {
            case PowerUpType::SpreadShot: {
                // Three lines
                for (int i = -1; i <= 1; i++) {
                    sf::RectangleShape line({1.f, s});
                    line.setOrigin({0.5f, s / 2.f});
                    line.setPosition(pos + sf::Vector2f(i * 3.f, 0.f));
                    line.setFillColor(color);
                    target.draw(line);
                }
                break;
            }
            case PowerUpType::LaserBeam: {
                sf::RectangleShape line({2.f, s * 2.f});
                line.setOrigin({1.f, s});
                line.setPosition(pos);
                line.setFillColor(color);
                target.draw(line);
                break;
            }
            case PowerUpType::Shield: {
                sf::CircleShape ring(s);
                ring.setOrigin({s, s});
                ring.setPosition(pos);
                ring.setFillColor(sf::Color::Transparent);
                ring.setOutlineColor(color);
                ring.setOutlineThickness(1.5f);
                target.draw(ring);
                break;
            }
            case PowerUpType::SlowMo: {
                // Clock-like
                sf::CircleShape dot(2.f);
                dot.setOrigin({2.f, 2.f});
                dot.setPosition(pos);
                dot.setFillColor(color);
                target.draw(dot);
                break;
            }
            case PowerUpType::ExtraLife: {
                // Plus sign
                sf::RectangleShape h({s * 2.f, 2.f});
                h.setOrigin({s, 1.f});
                h.setPosition(pos);
                h.setFillColor(color);
                target.draw(h);
                sf::RectangleShape v({2.f, s * 2.f});
                v.setOrigin({1.f, s});
                v.setPosition(pos);
                v.setFillColor(color);
                target.draw(v);
                break;
            }
        }
    }

    PowerUpType m_type = PowerUpType::SpreadShot;
    float m_bobTimer = 0.f;
};
