#pragma once
#include <SFML/Window/Keyboard.hpp>

struct InputState {
    bool left = false;
    bool right = false;
    bool fire = false;
    bool pause = false;
    bool confirm = false;
    bool back = false;
    bool up = false;
    bool down = false;
};

class InputHandler {
public:
    void update() {
        m_state.left = sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Left) ||
                       sf::Keyboard::isKeyPressed(sf::Keyboard::Key::A);
        m_state.right = sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Right) ||
                        sf::Keyboard::isKeyPressed(sf::Keyboard::Key::D);
        m_state.fire = sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Space) ||
                       sf::Keyboard::isKeyPressed(sf::Keyboard::Key::Z);
    }

    const InputState& getState() const { return m_state; }

private:
    InputState m_state;
};
