#version 130

uniform sampler2D texture;
uniform vec2 direction;
uniform vec2 resolution;

void main() {
    vec2 texCoord = gl_TexCoord[0].xy;
    vec2 step = direction / resolution;

    vec4 color = vec4(0.0);
    float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

    color += texture2D(texture, texCoord) * weights[0];

    for (int i = 1; i < 5; i++) {
        color += texture2D(texture, texCoord + step * float(i)) * weights[i];
        color += texture2D(texture, texCoord - step * float(i)) * weights[i];
    }

    gl_FragColor = color;
}
