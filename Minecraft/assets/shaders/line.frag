#version 330 core

uniform vec4 uColour;

out vec4 FragColour;

void main() {
    FragColour = uColour;
}
