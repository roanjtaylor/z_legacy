#version 330 core

in vec3 vRay;

uniform vec3 uZenithColour;
uniform vec3 uHorizonColour;
uniform vec3 uSunDirection;
uniform vec3 uSunColour;
uniform float uDaylight;

out vec4 FragColour;

void main() {
    vec3 direction = normalize(vRay);

    // Bias the gradient below the horizon so the blend sits slightly above eye level, which
    // is what makes the horizon read as distant rather than as a hard line.
    float height = clamp(direction.y * 1.35 + 0.18, 0.0, 1.0);
    vec3 colour = mix(uHorizonColour, uZenithColour, height);

    float alignment = max(dot(direction, uSunDirection), 0.0);
    colour += uSunColour * pow(alignment, 300.0) * 2.0;   // the disc itself
    colour += uSunColour * pow(alignment, 8.0) * 0.15;    // the haze around it

    // A handful of stars once the sun is down, hashed from the ray so they hold still.
    if (uDaylight < 0.35) {
        vec3 cell = floor(direction * 190.0);
        float hash = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        if (hash > 0.9985) {
            colour += vec3(1.0) * (1.0 - uDaylight / 0.35) * 0.9;
        }
    }

    FragColour = vec4(colour, 1.0);
}
