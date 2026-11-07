#pragma once
#include "core/Constants.hpp"
#include <algorithm>

class ScoreSystem {
public:
    void addKill(int baseScore) {
        m_comboCount++;
        m_comboTimer = Constants::COMBO_WINDOW;

        int multiplier = getMultiplier();
        int points = baseScore * multiplier;
        m_score += points;
        m_lastScorePopup = points;
        m_popupTimer = 1.0f;

        if (m_score > m_highScore) {
            m_highScore = m_score;
        }
    }

    void onMiss() {
        resetCombo();
    }

    void onPlayerHit() {
        resetCombo();
    }

    void update(float dt) {
        if (m_comboTimer > 0.f) {
            m_comboTimer -= dt;
            if (m_comboTimer <= 0.f) {
                resetCombo();
            }
        }
        if (m_popupTimer > 0.f) {
            m_popupTimer -= dt;
        }
    }

    int getScore() const { return m_score; }
    int getHighScore() const { return m_highScore; }
    int getComboCount() const { return m_comboCount; }
    float getComboTimer() const { return m_comboTimer; }

    int getMultiplier() const {
        if (m_comboCount >= Constants::COMBO_TIER3) return 8;
        if (m_comboCount >= Constants::COMBO_TIER2) return 4;
        if (m_comboCount >= Constants::COMBO_TIER1) return 2;
        return 1;
    }

    int getLastPopup() const { return m_lastScorePopup; }
    float getPopupTimer() const { return m_popupTimer; }

    void reset() {
        m_score = 0;
        m_comboCount = 0;
        m_comboTimer = 0.f;
    }

    void setHighScore(int hs) { m_highScore = hs; }

private:
    void resetCombo() {
        m_comboCount = 0;
        m_comboTimer = 0.f;
    }

    int m_score = 0;
    int m_highScore = 0;
    int m_comboCount = 0;
    float m_comboTimer = 0.f;
    int m_lastScorePopup = 0;
    float m_popupTimer = 0.f;
};
