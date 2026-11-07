#pragma once
#include <cmath>
#include "core/GameState.hpp"
#include "core/StateManager.hpp"
#include "core/Constants.hpp"
#include "ui/HighScoreTable.hpp"

class MenuState;

class GameOverState : public GameState {
public:
    GameOverState(int finalScore) : m_finalScore(finalScore) {}

    void onEnter() override {
        m_font.openFromFile("assets/fonts/main.ttf");
        m_timer = 0.f;

        m_highScores.load();
        m_isNewHighScore = m_highScores.isHighScore(m_finalScore);
        if (m_isNewHighScore) {
            m_enteringName = true;
        }
    }

    void handleEvent(const sf::Event& event) override {
        if (auto* kp = event.getIf<sf::Event::KeyPressed>()) {
            if (m_enteringName) {
                if (kp->code == sf::Keyboard::Key::Enter && !m_playerName.empty()) {
                    m_highScores.addScore(m_playerName, m_finalScore);
                    m_highScores.save();
                    m_enteringName = false;
                } else if (kp->code == sf::Keyboard::Key::Backspace && !m_playerName.empty()) {
                    m_playerName.pop_back();
                }
            } else if (m_timer > 1.0f) {
                if (kp->code == sf::Keyboard::Key::Enter ||
                    kp->code == sf::Keyboard::Key::Space) {
                    // Return to menu
                    auto menu = createMenuState();
                    if (menu) m_stateManager->replaceState(std::move(menu));
                }
            }
        }

        if (m_enteringName) {
            if (auto* te = event.getIf<sf::Event::TextEntered>()) {
                if (te->unicode >= 32 && te->unicode < 127 && m_playerName.size() < 10) {
                    m_playerName += static_cast<char>(te->unicode);
                }
            }
        }
    }

    void update(float dt) override {
        m_timer += dt;
    }

    void draw(sf::RenderTarget& target) override {
        target.clear(sf::Color(10, 5, 20));

        float centerX = Constants::WINDOW_WIDTH / 2.f;

        // GAME OVER text
        sf::Text title(m_font, "GAME OVER", 56);
        title.setFillColor(sf::Color(255, 0, 100));
        float tw = title.getLocalBounds().size.x;
        title.setPosition({centerX - tw / 2.f, 100.f});
        target.draw(title);

        // Glow
        sf::Text titleGlow(m_font, "GAME OVER", 56);
        titleGlow.setFillColor(sf::Color(255, 0, 100, 30));
        titleGlow.setPosition({centerX - tw / 2.f - 2.f, 98.f});
        target.draw(titleGlow);

        // Score
        sf::Text scoreText(m_font, "FINAL SCORE: " + std::to_string(m_finalScore), 32);
        scoreText.setFillColor(sf::Color(0, 255, 255));
        float sw = scoreText.getLocalBounds().size.x;
        scoreText.setPosition({centerX - sw / 2.f, 200.f});
        target.draw(scoreText);

        if (m_enteringName) {
            sf::Text prompt(m_font, "NEW HIGH SCORE! ENTER YOUR NAME:", 24);
            prompt.setFillColor(sf::Color(255, 255, 100));
            float pw = prompt.getLocalBounds().size.x;
            prompt.setPosition({centerX - pw / 2.f, 300.f});
            target.draw(prompt);

            std::string displayName = m_playerName + "_";
            sf::Text nameText(m_font, displayName, 32);
            nameText.setFillColor(sf::Color::White);
            float nw = nameText.getLocalBounds().size.x;
            nameText.setPosition({centerX - nw / 2.f, 340.f});
            target.draw(nameText);
        } else {
            // Show high scores
            m_highScores.draw(target, m_font, centerX, 300.f);

            if (m_timer > 1.0f) {
                float blink = std::fmod(m_timer, 1.0f);
                uint8_t alpha = blink < 0.5f ? 255 : 100;
                sf::Text cont(m_font, "PRESS ENTER TO CONTINUE", 20);
                cont.setFillColor(sf::Color(200, 200, 200, alpha));
                float cw = cont.getLocalBounds().size.x;
                cont.setPosition({centerX - cw / 2.f, 600.f});
                target.draw(cont);
            }
        }
    }

private:
    std::unique_ptr<GameState> createMenuState();

    int m_finalScore;
    sf::Font m_font;
    float m_timer = 0.f;
    HighScoreTable m_highScores;
    bool m_isNewHighScore = false;
    bool m_enteringName = false;
    std::string m_playerName;
};
