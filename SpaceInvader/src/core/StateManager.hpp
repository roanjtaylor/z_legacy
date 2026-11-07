#pragma once
#include "core/GameState.hpp"
#include <memory>
#include <vector>
#include <functional>

class StateManager {
public:
    using StateFactory = std::function<std::unique_ptr<GameState>()>;

    void pushState(std::unique_ptr<GameState> state) {
        if (!m_states.empty()) {
            m_states.back()->onExit();
        }
        state->setStateManager(this);
        state->onEnter();
        m_states.push_back(std::move(state));
    }

    void popState() {
        if (!m_states.empty()) {
            m_states.back()->onExit();
            m_states.pop_back();
            if (!m_states.empty()) {
                m_states.back()->onEnter();
            }
        }
    }

    void replaceState(std::unique_ptr<GameState> state) {
        if (!m_states.empty()) {
            m_states.back()->onExit();
            m_states.pop_back();
        }
        state->setStateManager(this);
        state->onEnter();
        m_states.push_back(std::move(state));
    }

    void clearStates() {
        while (!m_states.empty()) {
            m_states.back()->onExit();
            m_states.pop_back();
        }
    }

    GameState* currentState() {
        return m_states.empty() ? nullptr : m_states.back().get();
    }

    bool empty() const { return m_states.empty(); }

    sf::RenderWindow* window = nullptr;

private:
    std::vector<std::unique_ptr<GameState>> m_states;
};
