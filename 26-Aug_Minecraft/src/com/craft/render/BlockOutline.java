package com.craft.render;

import org.joml.Matrix4f;
import org.lwjgl.system.MemoryUtil;

import java.nio.FloatBuffer;

import static org.lwjgl.opengl.GL33.*;

/** The wireframe box around the block under the crosshair. */
public class BlockOutline {

    /** Grown very slightly so the lines sit outside the block instead of z-fighting its faces. */
    private static final float INFLATE = 0.002f;

    private final Shader shader;
    private final int vao;
    private final int vbo;
    private final Matrix4f model = new Matrix4f();

    public BlockOutline() {
        shader = Shader.load("line");

        float lo = -INFLATE;
        float hi = 1f + INFLATE;
        float[] corners = {
                lo, lo, lo, hi, lo, lo, hi, lo, lo, hi, lo, hi,
                hi, lo, hi, lo, lo, hi, lo, lo, hi, lo, lo, lo,

                lo, hi, lo, hi, hi, lo, hi, hi, lo, hi, hi, hi,
                hi, hi, hi, lo, hi, hi, lo, hi, hi, lo, hi, lo,

                lo, lo, lo, lo, hi, lo, hi, lo, lo, hi, hi, lo,
                hi, lo, hi, hi, hi, hi, lo, lo, hi, lo, hi, hi,
        };

        vao = glGenVertexArrays();
        glBindVertexArray(vao);
        vbo = glGenBuffers();
        glBindBuffer(GL_ARRAY_BUFFER, vbo);

        FloatBuffer data = MemoryUtil.memAllocFloat(corners.length);
        try {
            data.put(corners).flip();
            glBufferData(GL_ARRAY_BUFFER, data, GL_STATIC_DRAW);
        } finally {
            MemoryUtil.memFree(data);
        }

        glVertexAttribPointer(0, 3, GL_FLOAT, false, 3 * Float.BYTES, 0);
        glEnableVertexAttribArray(0);
        glBindVertexArray(0);
    }

    public void render(Matrix4f projection, Matrix4f view, int x, int y, int z, float alpha) {
        shader.bind();
        shader.setMatrix4("uProjection", projection);
        shader.setMatrix4("uView", view);
        shader.setMatrix4("uModel", model.identity().translate(x, y, z));
        shader.setVector4("uColour", 0f, 0f, 0f, alpha);

        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
        glLineWidth(2f);

        glBindVertexArray(vao);
        glDrawArrays(GL_LINES, 0, 24);
        glBindVertexArray(0);

        glDisable(GL_BLEND);
        Shader.unbind();
    }

    public void destroy() {
        glDeleteBuffers(vbo);
        glDeleteVertexArrays(vao);
        shader.destroy();
    }
}
