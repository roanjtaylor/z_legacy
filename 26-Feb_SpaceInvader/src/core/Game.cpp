#include "core/Game.hpp"
#include "core/Constants.hpp"
#include "core/StateManager.hpp"
#include "states/MenuState.hpp"
#include <cstdlib>
#include <ctime>

Game::Game()
    : m_window(sf::VideoMode({Constants::WINDOW_WIDTH, Constants::WINDOW_HEIGHT}), "Space Invader: Neon Synthwave")
    , m_stateManager(std::make_unique<StateManager>())
{
    std::srand(static_cast<unsigned>(std::time(nullptr)));
    m_window.setFramerateLimit(60);
    m_stateManager->window = &m_window;

    m_useBloom = m_renderSystem.init();

    m_stateManager->pushState(std::make_unique<MenuState>());
}

Game::~Game() {
    m_stateManager->clearStates();
}

void Game::run() {
    float accumulator = 0.f;

    while (m_window.isOpen()) {
        float frameTime = m_clock.restart().asSeconds();
        if (frameTime > Constants::MAX_FRAME_TIME)
            frameTime = Constants::MAX_FRAME_TIME;

        processEvents();

        accumulator += frameTime;
        while (accumulator >= Constants::FIXED_TIMESTEP) {
            update(Constants::FIXED_TIMESTEP);
            accumulator -= Constants::FIXED_TIMESTEP;
        }

        render();
    }
}

void Game::processEvents() {
    while (const auto event = m_window.pollEvent()) {
        if (event->is<sf::Event::Closed>()) {
            m_window.close();
            return;
        }

        if (auto* state = m_stateManager->currentState()) {
            state->handleEvent(*event);
        }
    }
}

void Game::update(float dt) {
    if (m_stateManager->empty()) {
        m_window.close();
        return;
    }
    if (auto* state = m_stateManager->currentState()) {
        state->update(dt);
    }
}

void Game::render() {
    if (m_useBloom) {
        auto& scene = m_renderSystem.getSceneTexture();
        scene.clear(sf::Color(10, 5, 20));
        if (auto* state = m_stateManager->currentState()) {
            state->draw(scene);
        }
        m_window.clear();
        m_renderSystem.render(m_window);
    } else {
        m_window.clear();
        if (auto* state = m_stateManager->currentState()) {
            state->draw(m_window);
        }
    }
    m_window.display();
}
