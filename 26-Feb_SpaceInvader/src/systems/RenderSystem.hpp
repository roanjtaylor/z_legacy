#pragma once
#include <SFML/Graphics.hpp>
#include "core/Constants.hpp"

class RenderSystem {
public:
    bool init() {
        // Create render textures
        if (!m_sceneTexture.resize({Constants::WINDOW_WIDTH, Constants::WINDOW_HEIGHT}))
            return false;

        unsigned int halfW = Constants::WINDOW_WIDTH / 2;
        unsigned int halfH = Constants::WINDOW_HEIGHT / 2;
        if (!m_brightTexture.resize({halfW, halfH}))
            return false;
        if (!m_blurTexture1.resize({halfW, halfH}))
            return false;
        if (!m_blurTexture2.resize({halfW, halfH}))
            return false;

        // Load shaders
        bool shadersLoaded = true;
        if (!m_brightnessShader.loadFromFile("assets/shaders/brightness.frag", sf::Shader::Type::Fragment))
            shadersLoaded = false;
        if (!m_blurShader.loadFromFile("assets/shaders/blur.frag", sf::Shader::Type::Fragment))
            shadersLoaded = false;
        if (!m_addShader.loadFromFile("assets/shaders/add.frag", sf::Shader::Type::Fragment))
            shadersLoaded = false;

        m_shadersAvailable = shadersLoaded;

        // Setup fullscreen quad sprite
        m_sceneTexture.setSmooth(true);
        m_brightTexture.setSmooth(true);
        m_blurTexture1.setSmooth(true);
        m_blurTexture2.setSmooth(true);

        return true;
    }

    sf::RenderTexture& getSceneTexture() { return m_sceneTexture; }

    void render(sf::RenderWindow& window) {
        if (!m_shadersAvailable) {
            // Fallback: just draw scene directly
            m_sceneTexture.display();
            sf::Sprite sceneSprite(m_sceneTexture.getTexture());
            window.draw(sceneSprite);
            return;
        }

        m_sceneTexture.display();

        // Step 1: Extract bright pixels
        m_brightTexture.clear(sf::Color::Black);
        m_brightnessShader.setUniform("threshold", 0.4f);
        sf::Sprite sceneSprite(m_sceneTexture.getTexture());
        float scaleX = static_cast<float>(m_brightTexture.getSize().x) /
                       m_sceneTexture.getSize().x;
        float scaleY = static_cast<float>(m_brightTexture.getSize().y) /
                       m_sceneTexture.getSize().y;
        sceneSprite.setScale({scaleX, scaleY});
        m_brightTexture.draw(sceneSprite, &m_brightnessShader);
        m_brightTexture.display();

        // Step 2: Horizontal blur
        sf::Vector2f halfRes(static_cast<float>(m_brightTexture.getSize().x),
                             static_cast<float>(m_brightTexture.getSize().y));

        m_blurShader.setUniform("direction", sf::Glsl::Vec2{1.0f, 0.0f});
        m_blurShader.setUniform("resolution", sf::Glsl::Vec2{halfRes.x, halfRes.y});
        m_blurTexture1.clear(sf::Color::Black);
        sf::Sprite brightSprite(m_brightTexture.getTexture());
        m_blurTexture1.draw(brightSprite, &m_blurShader);
        m_blurTexture1.display();

        // Step 3: Vertical blur
        m_blurShader.setUniform("direction", sf::Glsl::Vec2{0.0f, 1.0f});
        m_blurTexture2.clear(sf::Color::Black);
        sf::Sprite blur1Sprite(m_blurTexture1.getTexture());
        m_blurTexture2.draw(blur1Sprite, &m_blurShader);
        m_blurTexture2.display();

        // Second pass for wider bloom
        m_blurShader.setUniform("direction", sf::Glsl::Vec2{2.0f, 0.0f});
        m_blurTexture1.clear(sf::Color::Black);
        sf::Sprite blur2Sprite(m_blurTexture2.getTexture());
        m_blurTexture1.draw(blur2Sprite, &m_blurShader);
        m_blurTexture1.display();

        m_blurShader.setUniform("direction", sf::Glsl::Vec2{0.0f, 2.0f});
        m_blurTexture2.clear(sf::Color::Black);
        sf::Sprite blur1Sprite2(m_blurTexture1.getTexture());
        m_blurTexture2.draw(blur1Sprite2, &m_blurShader);
        m_blurTexture2.display();

        // Step 4: Composite scene + bloom
        m_addShader.setUniform("texture", sf::Shader::CurrentTexture);
        m_addShader.setUniform("bloomTexture", m_blurTexture2.getTexture());
        m_addShader.setUniform("bloomIntensity", 1.5f);

        sf::Sprite finalSprite(m_sceneTexture.getTexture());
        window.draw(finalSprite, &m_addShader);
    }

    bool areShadersAvailable() const { return m_shadersAvailable; }

private:
    sf::RenderTexture m_sceneTexture;
    sf::RenderTexture m_brightTexture;
    sf::RenderTexture m_blurTexture1;
    sf::RenderTexture m_blurTexture2;

    sf::Shader m_brightnessShader;
    sf::Shader m_blurShader;
    sf::Shader m_addShader;

    bool m_shadersAvailable = false;
};
