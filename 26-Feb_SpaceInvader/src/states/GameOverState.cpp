#include "states/GameOverState.hpp"
#include "states/MenuState.hpp"

std::unique_ptr<GameState> GameOverState::createMenuState() {
    return std::make_unique<MenuState>();
}
