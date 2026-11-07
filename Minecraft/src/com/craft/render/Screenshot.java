package com.craft.render;

import org.lwjgl.stb.STBImageWrite;
import org.lwjgl.system.MemoryUtil;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Writes the current framebuffer to a PNG. */
public final class Screenshot {

    private static final DateTimeFormatter STAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");

    private Screenshot() {
    }

    /**
     * Captures the back buffer. Must be called after drawing but before the buffer swap,
     * which is where the frame we just rendered still lives.
     */
    public static void capture(int width, int height, Path path) {
        ByteBuffer pixels = MemoryUtil.memAlloc(width * height * 4);
        try {
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }

            org.lwjgl.opengl.GL33.glPixelStorei(org.lwjgl.opengl.GL33.GL_PACK_ALIGNMENT, 1);
            org.lwjgl.opengl.GL33.glReadBuffer(org.lwjgl.opengl.GL33.GL_BACK);
            org.lwjgl.opengl.GL33.glReadPixels(0, 0, width, height,
                    org.lwjgl.opengl.GL33.GL_RGBA, org.lwjgl.opengl.GL33.GL_UNSIGNED_BYTE, pixels);

            // OpenGL's origin is bottom-left, PNG's is top-left.
            STBImageWrite.stbi_flip_vertically_on_write(true);
            boolean ok = STBImageWrite.stbi_write_png(
                    path.toString(), width, height, 4, pixels, width * 4);

            if (ok) {
                System.out.println("Saved screenshot to " + path.toAbsolutePath());
            } else {
                System.err.println("Failed to write screenshot to " + path.toAbsolutePath());
            }
        } catch (IOException e) {
            System.err.println("Failed to create screenshot directory: " + e.getMessage());
        } finally {
            MemoryUtil.memFree(pixels);
        }
    }

    /** Timestamped path under {@code screenshots/}, the destination for the F2 key. */
    public static Path defaultPath() {
        return Path.of("screenshots", "craft_" + STAMP.format(LocalDateTime.now()) + ".png");
    }
}
