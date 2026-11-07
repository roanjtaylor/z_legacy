package com.craft.render;

import org.lwjgl.system.MemoryUtil;

import java.nio.FloatBuffer;

import static org.lwjgl.opengl.GL33.*;

/**
 * A non-indexed triangle mesh in the block vertex format.
 *
 * <p>Layout, 8 floats (32 bytes) per vertex: position (3), texture coordinate within the tile
 * (2), the texture array layer to sample (1), a shade term folding together face shading and
 * ambient occlusion (1), and the two light levels packed into one float as
 * {@code sky + block * 16} (1).
 *
 * <p>Sky and block light stay separate all the way to the shader so that nightfall can dim
 * daylight without dimming torches. Chunk meshes are rebuilt often, so skipping an index buffer
 * keeps the rebuild path simple; the cost is a third more vertex data.
 */
public class Mesh {

    public static final int FLOATS_PER_VERTEX = 8;
    private static final int STRIDE = FLOATS_PER_VERTEX * Float.BYTES;

    private final int vao;
    private final int vbo;
    private final int vertexCount;

    public Mesh(float[] vertices, int floatCount) {
        this.vertexCount = floatCount / FLOATS_PER_VERTEX;

        FloatBuffer buffer = MemoryUtil.memAllocFloat(floatCount);
        try {
            buffer.put(vertices, 0, floatCount).flip();

            vao = glGenVertexArrays();
            glBindVertexArray(vao);

            vbo = glGenBuffers();
            glBindBuffer(GL_ARRAY_BUFFER, vbo);
            glBufferData(GL_ARRAY_BUFFER, buffer, GL_STATIC_DRAW);

            glVertexAttribPointer(0, 3, GL_FLOAT, false, STRIDE, 0);
            glEnableVertexAttribArray(0);
            glVertexAttribPointer(1, 2, GL_FLOAT, false, STRIDE, 3L * Float.BYTES);
            glEnableVertexAttribArray(1);
            glVertexAttribPointer(2, 1, GL_FLOAT, false, STRIDE, 5L * Float.BYTES);
            glEnableVertexAttribArray(2);
            glVertexAttribPointer(3, 1, GL_FLOAT, false, STRIDE, 6L * Float.BYTES);
            glEnableVertexAttribArray(3);
            glVertexAttribPointer(4, 1, GL_FLOAT, false, STRIDE, 7L * Float.BYTES);
            glEnableVertexAttribArray(4);

            glBindVertexArray(0);
        } finally {
            MemoryUtil.memFree(buffer);
        }
    }

    public Mesh(float[] vertices) {
        this(vertices, vertices.length);
    }

    public void render() {
        if (vertexCount == 0) {
            return;
        }
        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, vertexCount);
    }

    public int getVertexCount() {
        return vertexCount;
    }

    public boolean isEmpty() {
        return vertexCount == 0;
    }

    public void destroy() {
        glDeleteBuffers(vbo);
        glDeleteVertexArrays(vao);
    }
}
