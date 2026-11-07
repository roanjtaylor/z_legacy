#pragma once
#include <SFML/Graphics.hpp>
#include "core/Constants.hpp"
#include <string>

class HUD {
public:
    bool init(const std::string& fontPath) {
        if (!m_font.openFromFile(fontPath)) {
            // Fallback: try to work without font
            m_fontLoaded = false;
            return false;
        }
        m_fontLoaded = true;
        return true;
    }

    void draw(sf::RenderTarget& target, int score, int lives, int wave,
              int comboCount, int multiplier, float comboTimer) {
        if (!m_fontLoaded) return;

        // Score
        sf::Text scoreText(m_font, "SCORE: " + std::to_string(score), 24);
        scoreText.setFillColor(sf::Color(0, 255, 255));
        scoreText.setPosition({20.f, 10.f});
        target.draw(scoreText);

        // Wave
        sf::Text waveText(m_font, "WAVE " + std::to_string(wave), 24);
        waveText.setFillColor(sf::Color(255, 255, 255));
        float waveWidth = waveText.getLocalBounds().size.x;
        waveText.setPosition({Constants::WINDOW_WIDTH / 2.f - waveWidth / 2.f, 10.f});
        target.draw(waveText);

        // Lives
        sf::Text livesText(m_font, "LIVES: " + std::to_string(lives), 24);
        livesText.setFillColor(sf::Color(0, 255, 100));
        float livesWidth = livesText.getLocalBounds().size.x;
        livesText.setPosition({Constants::WINDOW_WIDTH - livesWidth - 20.f, 10.f});
        target.draw(livesText);

        // Combo indicator
        if (comboCount > 0 && multiplier > 1) {
            std::string comboStr = "COMBO x" + std::to_string(multiplier) +
                " (" + std::to_string(comboCount) + " kills)";
            sf::Text comboText(m_font, comboStr, 20);

            sf::Color comboColor;
            if (multiplier >= 8) comboColor = sf::Color(255, 50, 50);
            else if (multiplier >= 4) comboColor = sf::Color(255, 200, 0);
            else comboColor = sf::Color(255, 150, 0);

            comboText.setFillColor(comboColor);
            float comboWidth = comboText.getLocalBounds().size.x;
            comboText.setPosition({Constants::WINDOW_WIDTH / 2.f - comboWidth / 2.f, 42.f});
            target.draw(comboText);

            // Combo timer bar
            float barMaxWidth = 200.f;
            float barWidth = barMaxWidth * (comboTimer / Constants::COMBO_WINDOW);
            sf::RectangleShape bar({barWidth, 3.f});
            bar.setPosition({Constants::WINDOW_WIDTH / 2.f - barMaxWidth / 2.f, 68.f});
            bar.setFillColor(comboColor);
            target.draw(bar);
        }
    }

    void drawWaveAnnouncement(sf::RenderTarget& target, int wave, float alpha) {
        if (!m_fontLoaded) return;

        std::string text = (wave % Constants::BOSS_WAVE_INTERVAL == 0 && wave > 0) ?
            "BOSS FIGHT!" : "WAVE " + std::to_string(wave);
        uint8_t a = static_cast<uint8_t>(alpha * 255.f);

        sf::Text waveText(m_font, text, 48);
        waveText.setFillColor(sf::Color(255, 255, 255, a));
        float w = waveText.getLocalBounds().size.x;
        waveText.setPosition({Constants::WINDOW_WIDTH / 2.f - w / 2.f,
                             Constants::WINDOW_HEIGHT / 2.f - 30.f});
        target.draw(waveText);
    }

    void drawScorePopup(sf::RenderTarget& target, int points, sf::Vector2f pos, float timer) {
        if (!m_fontLoaded || timer <= 0.f) return;

        uint8_t alpha = static_cast<uint8_t>(timer * 255.f);
        sf::Text popup(m_font, "+" + std::to_string(points), 16);
        popup.setFillColor(sf::Color(255, 255, 100, alpha));
        popup.setPosition({pos.x, pos.y - (1.0f - timer) * 30.f});
        target.draw(popup);
    }

    const sf::Font& getFont() const { return m_font; }
    bool isFontLoaded() const { return m_fontLoaded; }

private:
    sf::Font m_font;
    bool m_fontLoaded = false;
};
