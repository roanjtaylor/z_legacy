#version 330 core

layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in float aLayer;    // negative means "untextured, use the colour alone"
layout (location = 3) in vec4 aColour;

uniform mat4 uProjection;

out vec3 vTexCoord;
out vec4 vColour;

void main() {
    gl_Position = uProjection * vec4(aPosition, 0.0, 1.0);
    vTexCoord = vec3(aTexCoord, aLayer);
    vColour = aColour;
}
