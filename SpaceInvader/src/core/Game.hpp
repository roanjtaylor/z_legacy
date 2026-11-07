#pragma once
#include <SFML/Graphics.hpp>
#include "systems/RenderSystem.hpp"
#include <memory>

class GameState;
class StateManager;

class Game {
public:
    Game();
    ~Game();
    void run();

private:
    void processEvents();
    void update(float dt);
    void render();

    sf::RenderWindow m_window;
    std::unique_ptr<StateManager> m_stateManager;
    RenderSystem m_renderSystem;
    sf::Clock m_clock;
    bool m_useBloom = false;
};
