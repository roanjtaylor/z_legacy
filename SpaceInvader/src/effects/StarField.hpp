#pragma once
#include <SFML/Graphics.hpp>
#include "core/Constants.hpp"
#include <vector>
#include <cstdlib>

struct Star {
    sf::Vector2f position;
    float speed;
    float brightness;
    float size;
};

class StarField {
public:
    StarField() {
        m_vertices.setPrimitiveType(sf::PrimitiveType::Triangles);

        // Create stars at random positions
        for (int i = 0; i < 150; i++) {
            Star star;
            star.position.x = static_cast<float>(std::rand() % Constants::WINDOW_WIDTH);
            star.position.y = static_cast<float>(std::rand() % Constants::WINDOW_HEIGHT);
            star.speed = 10.f + static_cast<float>(std::rand() % 40);
            star.brightness = 0.3f + static_cast<float>(std::rand() % 70) / 100.f;
            star.size = 1.f + static_cast<float>(std::rand() % 20) / 10.f;
            m_stars.push_back(star);
        }
    }

    void update(float dt) {
        for (auto& star : m_stars) {
            star.position.y += star.speed * dt;
            if (star.position.y > Constants::WINDOW_HEIGHT) {
                star.position.y = 0.f;
                star.position.x = static_cast<float>(std::rand() % Constants::WINDOW_WIDTH);
            }
        }
    }

    void draw(sf::RenderTarget& target) {
        m_vertices.clear();

        for (const auto& star : m_stars) {
            uint8_t alpha = static_cast<uint8_t>(star.brightness * 255.f);
            sf::Color color(200, 180, 255, alpha);
            float s = star.size;

            sf::Vertex v0, v1, v2;
            v0.position = {star.position.x, star.position.y - s};
            v1.position = {star.position.x - s * 0.7f, star.position.y + s * 0.5f};
            v2.position = {star.position.x + s * 0.7f, star.position.y + s * 0.5f};
            v0.color = v1.color = v2.color = color;

            m_vertices.append(v0);
            m_vertices.append(v1);
            m_vertices.append(v2);
        }

        target.draw(m_vertices);
    }

private:
    std::vector<Star> m_stars;
    sf::VertexArray m_vertices;
};
