#pragma once
#include <SFML/Graphics.hpp>

// Utility for drawing shapes with neon glow effect
namespace NeonShape {
    inline void drawGlowCircle(sf::RenderTarget& target, sf::Vector2f pos,
                                float radius, sf::Color color, float glowScale = 1.5f) {
        // Inner
        sf::CircleShape inner(radius);
        inner.setOrigin({radius, radius});
        inner.setPosition(pos);
        inner.setFillColor(sf::Color(color.r / 3, color.g / 3, color.b / 3));
        inner.setOutlineColor(color);
        inner.setOutlineThickness(2.f);
        target.draw(inner);

        // Glow
        float gr = radius * glowScale;
        sf::CircleShape glow(gr);
        glow.setOrigin({gr, gr});
        glow.setPosition(pos);
        glow.setFillColor(sf::Color(color.r, color.g, color.b, 20));
        target.draw(glow);
    }

    inline void drawGlowRect(sf::RenderTarget& target, sf::Vector2f pos,
                              sf::Vector2f size, sf::Color color, float glowScale = 1.3f) {
        sf::RectangleShape inner(size);
        inner.setOrigin(size / 2.f);
        inner.setPosition(pos);
        inner.setFillColor(sf::Color(color.r / 3, color.g / 3, color.b / 3));
        inner.setOutlineColor(color);
        inner.setOutlineThickness(2.f);
        target.draw(inner);

        sf::Vector2f gs = size * glowScale;
        sf::RectangleShape glow(gs);
        glow.setOrigin(gs / 2.f);
        glow.setPosition(pos);
        glow.setFillColor(sf::Color(color.r, color.g, color.b, 15));
        target.draw(glow);
    }
}
