#pragma once
#include "core/GameState.hpp"
#include "core/StateManager.hpp"
#include "core/Constants.hpp"
#include "effects/StarField.hpp"
#include "effects/GridFloor.hpp"
#include <cmath>

class PlayingState;

class MenuState : public GameState {
public:
    void onEnter() override {
        m_font.openFromFile("assets/fonts/main.ttf");
        m_timer = 0.f;
        m_selectedItem = 0;
    }

    void handleEvent(const sf::Event& event) override {
        if (auto* kp = event.getIf<sf::Event::KeyPressed>()) {
            if (kp->code == sf::Keyboard::Key::Up) {
                m_selectedItem = (m_selectedItem + 2) % 3;
            } else if (kp->code == sf::Keyboard::Key::Down) {
                m_selectedItem = (m_selectedItem + 1) % 3;
            } else if (kp->code == sf::Keyboard::Key::Enter ||
                       kp->code == sf::Keyboard::Key::Space) {
                selectItem();
            }
        }
    }

    void update(float dt) override {
        m_timer += dt;
        m_starField.update(dt);
        m_gridFloor.update(dt);
    }

    void draw(sf::RenderTarget& target) override {
        target.clear(sf::Color(10, 5, 20));

        m_starField.draw(target);
        m_gridFloor.draw(target);

        float centerX = Constants::WINDOW_WIDTH / 2.f;

        // Title
        float titleBob = std::sin(m_timer * 2.f) * 5.f;
        sf::Text title(m_font, "SPACE INVADER", 64);
        title.setFillColor(sf::Color(0, 255, 255));
        float tw = title.getLocalBounds().size.x;
        title.setPosition({centerX - tw / 2.f, 120.f + titleBob});
        target.draw(title);

        // Title glow
        sf::Text titleGlow(m_font, "SPACE INVADER", 64);
        titleGlow.setFillColor(sf::Color(0, 255, 255, 25));
        titleGlow.setPosition({centerX - tw / 2.f - 3.f, 118.f + titleBob});
        target.draw(titleGlow);

        // Subtitle
        sf::Text subtitle(m_font, "NEON SYNTHWAVE EDITION", 24);
        subtitle.setFillColor(sf::Color(255, 0, 255));
        float stw = subtitle.getLocalBounds().size.x;
        subtitle.setPosition({centerX - stw / 2.f, 195.f + titleBob});
        target.draw(subtitle);

        // Decorative line
        sf::RectangleShape line({400.f, 2.f});
        line.setPosition({centerX - 200.f, 240.f});
        line.setFillColor(sf::Color(0, 255, 255, 100));
        target.draw(line);

        // Menu items
        const char* items[] = {"START GAME", "HIGH SCORES", "QUIT"};
        float y = 320.f;
        for (int i = 0; i < 3; i++) {
            sf::Color color = (i == m_selectedItem) ?
                sf::Color(255, 255, 255) : sf::Color(100, 100, 120);

            sf::Text item(m_font, items[i], 32);
            item.setFillColor(color);
            float iw = item.getLocalBounds().size.x;
            item.setPosition({centerX - iw / 2.f, y});
            target.draw(item);

            // Selection indicator
            if (i == m_selectedItem) {
                float pulse = std::sin(m_timer * 6.f) * 0.3f + 0.7f;
                uint8_t alpha = static_cast<uint8_t>(pulse * 255.f);

                sf::RectangleShape indicator({8.f, 8.f});
                indicator.setFillColor(sf::Color(0, 255, 255, alpha));
                indicator.setPosition({centerX - iw / 2.f - 25.f, y + 12.f});
                target.draw(indicator);
            }

            y += 50.f;
        }

        // Instructions
        sf::Text controls(m_font, "ARROWS: Move   SPACE: Fire   ESC: Pause", 16);
        controls.setFillColor(sf::Color(80, 80, 100));
        float cw = controls.getLocalBounds().size.x;
        controls.setPosition({centerX - cw / 2.f, 600.f});
        target.draw(controls);
    }

private:
    void selectItem();

    sf::Font m_font;
    float m_timer = 0.f;
    int m_selectedItem = 0;
    StarField m_starField;
    GridFloor m_gridFloor;
};
