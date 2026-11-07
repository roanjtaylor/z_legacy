#version 330 core

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in float aLayer;
layout (location = 3) in float aShade;      // face shading * ambient occlusion
layout (location = 4) in float aLight;      // skyLevel + blockLevel * 16, both 0..15

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

// 0 at midnight, 1 at noon. Scales sky light only, so torches keep burning after dark.
uniform float uDaylight;

// Floor at which a fully unlit block still renders. Pitch black is unreadable.
const float MINIMUM_LIGHT = 0.06;

out vec3 vTexCoord;
out float vLight;
out float vViewDistance;

void main() {
    vec4 worldPosition = uModel * vec4(aPosition, 1.0);
    vec4 viewPosition = uView * worldPosition;

    gl_Position = uProjection * viewPosition;
    vTexCoord = vec3(aTexCoord, aLayer);

    float blockLevel = floor(aLight / 16.0);
    float skyLevel = aLight - blockLevel * 16.0;

    // The brighter of the two wins rather than summing, so standing in sunlight next to a
    // torch does not blow out to white.
    float level = max((skyLevel / 15.0) * uDaylight, blockLevel / 15.0);

    // Minecraft's light curve is distinctly non-linear: the top few levels are close together
    // and the bottom ones fall away fast, which is what makes a cave mouth read as a gradient
    // rather than a ramp.
    level = level * level * (3.0 - 2.0 * level);

    vLight = aShade * mix(MINIMUM_LIGHT, 1.0, level);

    // Radial rather than depth-based, so fog does not shift when you turn on the spot.
    vViewDistance = length(viewPosition.xyz);
}
