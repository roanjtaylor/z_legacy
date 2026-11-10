#pragma once
#include "core/GameState.hpp"
#include "core/StateManager.hpp"
#include "core/Constants.hpp"

class PausedState : public GameState {
public:
    void handleEvent(const sf::Event& event) override {
        if (auto* kp = event.getIf<sf::Event::KeyPressed>()) {
            if (kp->code == sf::Keyboard::Key::Escape ||
                kp->code == sf::Keyboard::Key::P) {
                m_stateManager->popState();
            }
            if (kp->code == sf::Keyboard::Key::Q) {
                m_stateManager->clearStates();
            }
        }
    }

    void update(float dt) override {}

    void draw(sf::RenderTarget& target) override {
        // Semi-transparent overlay
        sf::RectangleShape overlay(
            {static_cast<float>(Constants::WINDOW_WIDTH),
             static_cast<float>(Constants::WINDOW_HEIGHT)});
        overlay.setFillColor(sf::Color(0, 0, 0, 150));
        target.draw(overlay);

        // Pause text - drawn as a simple rectangle indicator since we may not have font here
        sf::RectangleShape bar1({15.f, 60.f});
        bar1.setPosition({Constants::WINDOW_WIDTH / 2.f - 25.f,
                         Constants::WINDOW_HEIGHT / 2.f - 30.f});
        bar1.setFillColor(sf::Color(0, 255, 255));
        target.draw(bar1);

        sf::RectangleShape bar2({15.f, 60.f});
        bar2.setPosition({Constants::WINDOW_WIDTH / 2.f + 10.f,
                         Constants::WINDOW_HEIGHT / 2.f - 30.f});
        bar2.setFillColor(sf::Color(0, 255, 255));
        target.draw(bar2);
    }
};
