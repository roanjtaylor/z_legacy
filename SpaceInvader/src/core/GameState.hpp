#pragma once
#include <SFML/Graphics.hpp>

class StateManager;

class GameState {
public:
    virtual ~GameState() = default;
    virtual void handleEvent(const sf::Event& event) = 0;
    virtual void update(float dt) = 0;
    virtual void draw(sf::RenderTarget& target) = 0;
    virtual void onEnter() {}
    virtual void onExit() {}

    void setStateManager(StateManager* sm) { m_stateManager = sm; }

protected:
    StateManager* m_stateManager = nullptr;
};
