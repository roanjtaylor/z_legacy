#pragma once
#include "core/GameState.hpp"
#include "core/StateManager.hpp"
#include "core/Constants.hpp"
#include "ui/HighScoreTable.hpp"

class HighScoreState : public GameState {
public:
    void onEnter() override {
        m_font.openFromFile("assets/fonts/main.ttf");
        m_highScores.load();
    }

    void handleEvent(const sf::Event& event) override {
        if (auto* kp = event.getIf<sf::Event::KeyPressed>()) {
            if (kp->code == sf::Keyboard::Key::Escape ||
                kp->code == sf::Keyboard::Key::Enter) {
                m_stateManager->popState();
            }
        }
    }

    void update(float dt) override {}

    void draw(sf::RenderTarget& target) override {
        target.clear(sf::Color(10, 5, 20));

        float centerX = Constants::WINDOW_WIDTH / 2.f;

        sf::Text title(m_font, "HIGH SCORES", 48);
        title.setFillColor(sf::Color(255, 200, 0));
        float tw = title.getLocalBounds().size.x;
        title.setPosition({centerX - tw / 2.f, 60.f});
        target.draw(title);

        m_highScores.draw(target, m_font, centerX, 150.f);

        sf::Text back(m_font, "PRESS ESC TO GO BACK", 20);
        back.setFillColor(sf::Color(100, 100, 120));
        float bw = back.getLocalBounds().size.x;
        back.setPosition({centerX - bw / 2.f, 620.f});
        target.draw(back);
    }

private:
    sf::Font m_font;
    HighScoreTable m_highScores;
};
