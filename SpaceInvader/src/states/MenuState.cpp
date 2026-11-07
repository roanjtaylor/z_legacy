#include "states/MenuState.hpp"
#include "states/PlayingState.hpp"
#include "states/HighScoreState.hpp"

void MenuState::selectItem() {
    switch (m_selectedItem) {
        case 0: // Start Game
            m_stateManager->replaceState(std::make_unique<PlayingState>());
            break;
        case 1: // High Scores
            m_stateManager->pushState(std::make_unique<HighScoreState>());
            break;
        case 2: // Quit
            if (m_stateManager->window) {
                m_stateManager->window->close();
            }
            break;
    }
}
