package com.craft.render;

import org.joml.Matrix4f;
import org.lwjgl.system.MemoryUtil;

import java.nio.FloatBuffer;

import static org.lwjgl.opengl.GL33.*;

/**
 * Immediate-mode 2D overlay: crosshair, hotbar, health, break progress, debug text.
 *
 * <p>Quads are accumulated into one streamed buffer each frame and drawn in a single call.
 * Panels and block icons share it — a negative texture layer marks a quad as untextured — so
 * the whole HUD costs one draw regardless of how much is on screen.
 *
 * <p>Coordinates are pixels with the origin at the top left, which is how UI layout is
 * naturally expressed; the projection matrix flips y.
 */
public class HudRenderer {

    /** x, y, u, v, layer, r, g, b, a */
    private static final int FLOATS_PER_VERTEX = 9;
    private static final int MAX_QUADS = 4096;
    private static final float UNTEXTURED = -1f;

    private final Shader shader;
    private final int vao;
    private final int vbo;
    private final FloatBuffer buffer;
    private final Matrix4f projection = new Matrix4f();

    private int quadCount;
    private int screenWidth;
    private int screenHeight;

    public HudRenderer() {
        shader = Shader.load("hud");

        vao = glGenVertexArrays();
        glBindVertexArray(vao);
        vbo = glGenBuffers();
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferData(GL_ARRAY_BUFFER,
                (long) MAX_QUADS * 6 * FLOATS_PER_VERTEX * Float.BYTES, GL_STREAM_DRAW);

        int stride = FLOATS_PER_VERTEX * Float.BYTES;
        glVertexAttribPointer(0, 2, GL_FLOAT, false, stride, 0);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 2, GL_FLOAT, false, stride, 2L * Float.BYTES);
        glEnableVertexAttribArray(1);
        glVertexAttribPointer(2, 1, GL_FLOAT, false, stride, 4L * Float.BYTES);
        glEnableVertexAttribArray(2);
        glVertexAttribPointer(3, 4, GL_FLOAT, false, stride, 5L * Float.BYTES);
        glEnableVertexAttribArray(3);
        glBindVertexArray(0);

        buffer = MemoryUtil.memAllocFloat(MAX_QUADS * 6 * FLOATS_PER_VERTEX);
    }

    public void begin(int width, int height) {
        this.screenWidth = width;
        this.screenHeight = height;
        quadCount = 0;
        buffer.clear();
    }

    /** A flat coloured rectangle. */
    public void rect(float x, float y, float width, float height,
                     float r, float g, float b, float a) {
        push(x, y, width, height, UNTEXTURED, r, g, b, a);
    }

    /** A block texture, tinted. Use for hotbar and inventory icons. */
    public void icon(float x, float y, float size, int layer, float brightness) {
        push(x, y, size, size, layer, brightness, brightness, brightness, 1f);
    }

    /** A single font glyph. The layer comes from {@link BitmapFont#layerOf(char)}. */
    public void glyph(float x, float y, float size, int layer,
                      float r, float g, float b, float a) {
        push(x, y, size, size, layer, r, g, b, a);
    }

    /** A one-pixel-thick outline drawn as four rectangles. */
    public void outline(float x, float y, float width, float height, float thickness,
                        float r, float g, float b, float a) {
        rect(x, y, width, thickness, r, g, b, a);
        rect(x, y + height - thickness, width, thickness, r, g, b, a);
        rect(x, y + thickness, thickness, height - 2 * thickness, r, g, b, a);
        rect(x + width - thickness, y + thickness, thickness, height - 2 * thickness, r, g, b, a);
    }

    private void push(float x, float y, float width, float height, float layer,
                      float r, float g, float b, float a) {
        if (quadCount >= MAX_QUADS) {
            return;
        }
        quadCount++;

        vertex(x, y, 0, 0, layer, r, g, b, a);
        vertex(x, y + height, 0, 1, layer, r, g, b, a);
        vertex(x + width, y + height, 1, 1, layer, r, g, b, a);

        vertex(x, y, 0, 0, layer, r, g, b, a);
        vertex(x + width, y + height, 1, 1, layer, r, g, b, a);
        vertex(x + width, y, 1, 0, layer, r, g, b, a);
    }

    private void vertex(float x, float y, float u, float v, float layer,
                        float r, float g, float b, float a) {
        buffer.put(x).put(y).put(u).put(v).put(layer).put(r).put(g).put(b).put(a);
    }

    public void end(TextureArray textures) {
        if (quadCount == 0) {
            return;
        }
        buffer.flip();

        boolean depthWasEnabled = glIsEnabled(GL_DEPTH_TEST);
        glDisable(GL_DEPTH_TEST);
        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
        glDisable(GL_CULL_FACE);

        shader.bind();
        textures.bind(0);
        shader.setInt("uAtlas", 0);
        // Top-left origin: bottom and top are swapped so y grows downwards.
        shader.setMatrix4("uProjection",
                projection.identity().ortho2D(0, screenWidth, screenHeight, 0));

        glBindVertexArray(vao);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferSubData(GL_ARRAY_BUFFER, 0, buffer);
        glDrawArrays(GL_TRIANGLES, 0, quadCount * 6);
        glBindVertexArray(0);

        Shader.unbind();

        glEnable(GL_CULL_FACE);
        glDisable(GL_BLEND);
        if (depthWasEnabled) {
            glEnable(GL_DEPTH_TEST);
        }
        buffer.clear();
    }

    public void destroy() {
        MemoryUtil.memFree(buffer);
        glDeleteBuffers(vbo);
        glDeleteVertexArrays(vao);
        shader.destroy();
    }
}
