#pragma once
#include <SFML/Graphics.hpp>
#include "core/Constants.hpp"
#include <cmath>

class GridFloor {
public:
    GridFloor() {
        m_vertices.setPrimitiveType(sf::PrimitiveType::Lines);
    }

    void update(float dt) {
        m_scroll += dt * 60.f;
        if (m_scroll >= m_spacing) m_scroll -= m_spacing;
    }

    void draw(sf::RenderTarget& target) {
        m_vertices.clear();
        sf::Color lineColor(80, 0, 120, 80);
        sf::Color fadeColor(80, 0, 120, 0);

        float startY = Constants::WINDOW_HEIGHT * 0.75f;
        float endY = static_cast<float>(Constants::WINDOW_HEIGHT);
        float vanishX = Constants::WINDOW_WIDTH / 2.f;

        // Horizontal lines with perspective
        for (float y = startY; y <= endY; y += m_spacing) {
            float adjustedY = y + m_scroll;
            if (adjustedY > endY) adjustedY -= (endY - startY);
            if (adjustedY < startY) continue;

            float t = (adjustedY - startY) / (endY - startY);
            uint8_t alpha = static_cast<uint8_t>(t * 80.f);
            sf::Color c(80, 0, 120, alpha);

            sf::Vertex left, right;
            left.position = {0.f, adjustedY};
            right.position = {static_cast<float>(Constants::WINDOW_WIDTH), adjustedY};
            left.color = right.color = c;
            m_vertices.append(left);
            m_vertices.append(right);
        }

        // Vertical lines with perspective convergence
        int numLines = 15;
        for (int i = -numLines; i <= numLines; i++) {
            float topX = vanishX + i * 10.f;
            float bottomX = vanishX + i * (Constants::WINDOW_WIDTH / (numLines * 1.5f));

            sf::Vertex top, bottom;
            top.position = {topX, startY};
            bottom.position = {bottomX, endY};
            top.color = fadeColor;
            bottom.color = lineColor;
            m_vertices.append(top);
            m_vertices.append(bottom);
        }

        target.draw(m_vertices);
    }

private:
    sf::VertexArray m_vertices;
    float m_scroll = 0.f;
    float m_spacing = 30.f;
};
