#pragma once
#include <SFML/Graphics.hpp>
#include <SFML/Audio.hpp>
#include <string>
#include <unordered_map>
#include <memory>

class ResourceManager {
public:
    static ResourceManager& instance() {
        static ResourceManager inst;
        return inst;
    }

    sf::Font& getFont(const std::string& path) {
        auto it = m_fonts.find(path);
        if (it != m_fonts.end()) return *it->second;

        auto font = std::make_unique<sf::Font>();
        font->openFromFile(path);
        auto& ref = *font;
        m_fonts[path] = std::move(font);
        return ref;
    }

private:
    ResourceManager() = default;
    std::unordered_map<std::string, std::unique_ptr<sf::Font>> m_fonts;
};
