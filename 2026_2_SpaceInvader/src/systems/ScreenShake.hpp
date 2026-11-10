#pragma once
#include <SFML/Graphics.hpp>
#include <cmath>
#include <cstdlib>

class ScreenShake {
public:
    void trigger(float intensity, float duration) {
        if (intensity > m_intensity) {
            m_intensity = intensity;
        }
        m_duration = duration;
        m_timer = duration;
    }

    void update(float dt) {
        if (m_timer <= 0.f) {
            m_offset = {0.f, 0.f};
            return;
        }

        m_timer -= dt;
        float factor = m_timer / m_duration; // exponential-ish decay
        float currentIntensity = m_intensity * factor * factor;

        m_offset.x = (static_cast<float>(std::rand() % 200 - 100) / 100.f) * currentIntensity;
        m_offset.y = (static_cast<float>(std::rand() % 200 - 100) / 100.f) * currentIntensity;

        if (m_timer <= 0.f) {
            m_intensity = 0.f;
            m_offset = {0.f, 0.f};
        }
    }

    sf::Vector2f getOffset() const { return m_offset; }

private:
    float m_intensity = 0.f;
    float m_duration = 0.f;
    float m_timer = 0.f;
    sf::Vector2f m_offset{0.f, 0.f};
};
