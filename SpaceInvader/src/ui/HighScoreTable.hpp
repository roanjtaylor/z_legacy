#pragma once
#include <SFML/Graphics.hpp>
#include <string>
#include <vector>
#include <algorithm>
#include <fstream>

struct HighScoreEntry {
    std::string name;
    int score;
};

class HighScoreTable {
public:
    void load() {
        m_entries.clear();
        std::ifstream file("data/highscores.dat");
        if (!file.is_open()) return;

        std::string name;
        int score;
        while (file >> name >> score) {
            m_entries.push_back({name, score});
        }
        sortEntries();
    }

    void save() {
        std::ofstream file("data/highscores.dat");
        if (!file.is_open()) return;

        for (const auto& entry : m_entries) {
            file << entry.name << " " << entry.score << "\n";
        }
    }

    void addScore(const std::string& name, int score) {
        m_entries.push_back({name, score});
        sortEntries();
        if (m_entries.size() > 10) {
            m_entries.resize(10);
        }
    }

    bool isHighScore(int score) const {
        if (m_entries.size() < 10) return true;
        return score > m_entries.back().score;
    }

    void draw(sf::RenderTarget& target, const sf::Font& font, float centerX, float startY) {
        sf::Text header(font, "HIGH SCORES", 28);
        header.setFillColor(sf::Color(255, 200, 0));
        float hw = header.getLocalBounds().size.x;
        header.setPosition({centerX - hw / 2.f, startY});
        target.draw(header);

        float y = startY + 45.f;
        for (int i = 0; i < static_cast<int>(m_entries.size()) && i < 10; i++) {
            const auto& entry = m_entries[i];
            std::string line = std::to_string(i + 1) + ". " + entry.name +
                " - " + std::to_string(entry.score);

            sf::Color color = (i == 0) ? sf::Color(255, 200, 0) :
                             (i < 3) ? sf::Color(200, 200, 200) :
                             sf::Color(150, 150, 150);

            sf::Text text(font, line, 22);
            text.setFillColor(color);
            float tw = text.getLocalBounds().size.x;
            text.setPosition({centerX - tw / 2.f, y});
            target.draw(text);
            y += 28.f;
        }

        if (m_entries.empty()) {
            sf::Text empty(font, "NO SCORES YET", 22);
            empty.setFillColor(sf::Color(100, 100, 100));
            float ew = empty.getLocalBounds().size.x;
            empty.setPosition({centerX - ew / 2.f, y});
            target.draw(empty);
        }
    }

    const std::vector<HighScoreEntry>& getEntries() const { return m_entries; }

private:
    void sortEntries() {
        std::sort(m_entries.begin(), m_entries.end(),
                  [](const HighScoreEntry& a, const HighScoreEntry& b) {
                      return a.score > b.score;
                  });
    }

    std::vector<HighScoreEntry> m_entries;
};
