#version 330 core

in vec3 vTexCoord;
in float vLight;
in float vViewDistance;

uniform sampler2DArray uAtlas;

uniform vec3 uFogColour;
uniform float uFogStart;
uniform float uFogEnd;

// Cutouts (leaves, flowers, glass) key out on alpha. Kept below 0.5 because mipmapping
// averages a tile's alpha down, and a stricter cutoff would erase thin plants at range.
uniform float uAlphaCutoff;

// Multiplied into every fragment: drives the day/night cycle and the underwater tint.
uniform vec3 uTint;

out vec4 FragColour;

void main() {
    vec4 texel = texture(uAtlas, vTexCoord);

    if (texel.a < uAlphaCutoff) {
        discard;
    }

    vec3 colour = texel.rgb * vLight * uTint;

    float fog = clamp((vViewDistance - uFogStart) / max(uFogEnd - uFogStart, 0.001), 0.0, 1.0);
    colour = mix(colour, uFogColour, fog);

    FragColour = vec4(colour, texel.a);
}
