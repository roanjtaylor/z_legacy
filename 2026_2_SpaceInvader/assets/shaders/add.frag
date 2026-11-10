#version 130

uniform sampler2D texture;
uniform sampler2D bloomTexture;
uniform float bloomIntensity;

void main() {
    vec4 scene = texture2D(texture, gl_TexCoord[0].xy);
    vec4 bloom = texture2D(bloomTexture, gl_TexCoord[0].xy);
    gl_FragColor = scene + bloom * bloomIntensity;
}
