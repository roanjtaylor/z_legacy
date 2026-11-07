#version 330 core

in vec3 vTexCoord;
in vec4 vColour;

uniform sampler2DArray uAtlas;

out vec4 FragColour;

void main() {
    vec4 colour = vColour;

    // One buffer carries both plain panels and block icons; the layer index doubles as the
    // flag for which is which, so the whole HUD is a single draw call.
    if (vTexCoord.z >= 0.0) {
        colour *= texture(uAtlas, vTexCoord);
    }

    if (colour.a < 0.004) {
        discard;
    }
    FragColour = colour;
}
