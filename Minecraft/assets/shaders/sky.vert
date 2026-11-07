#version 330 core

// A fullscreen triangle generated from gl_VertexID - no vertex buffer needed. Vertices land
// at (-1,-1), (3,-1) and (-1,3), which covers the viewport with one primitive.

uniform mat4 uInverseViewProjection;

out vec3 vRay;

void main() {
    vec2 ndc = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;

    // Depth 1.0 puts the sky on the far plane, behind all terrain.
    gl_Position = vec4(ndc, 1.0, 1.0);

    // Unproject the near and far points of this pixel to recover its view ray in world space.
    vec4 near = uInverseViewProjection * vec4(ndc, -1.0, 1.0);
    vec4 far = uInverseViewProjection * vec4(ndc, 1.0, 1.0);
    vRay = (far.xyz / far.w) - (near.xyz / near.w);
}
