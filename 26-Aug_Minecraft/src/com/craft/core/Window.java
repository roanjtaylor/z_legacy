package com.craft.core;

import org.lwjgl.glfw.GLFWErrorCallback;
import org.lwjgl.glfw.GLFWVidMode;
import org.lwjgl.opengl.GL;
import org.lwjgl.system.MemoryStack;

import java.nio.IntBuffer;

import static org.lwjgl.glfw.Callbacks.glfwFreeCallbacks;
import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.opengl.GL33.*;
import static org.lwjgl.system.MemoryUtil.NULL;

/**
 * The GLFW window and its OpenGL 3.3 core context.
 *
 * <p>LWJGL unpacks its native libraries from the {@code natives-windows} jars on the
 * classpath automatically, so no {@code java.library.path} setup is needed.
 */
public class Window {

    private final String title;
    private long handle;

    private int width;
    private int height;
    private boolean framebufferResized;

    private boolean cursorGrabbed;
    private boolean vsync = true;

    public Window(String title, int width, int height) {
        this.title = title;
        this.width = width;
        this.height = height;
    }

    public void create() {
        GLFWErrorCallback.createPrint(System.err).set();

        if (!glfwInit()) {
            throw new IllegalStateException("Unable to initialise GLFW");
        }

        glfwDefaultWindowHints();
        glfwWindowHint(GLFW_VISIBLE, GLFW_FALSE);
        glfwWindowHint(GLFW_RESIZABLE, GLFW_TRUE);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
        glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
        glfwWindowHint(GLFW_DEPTH_BITS, 24);
        glfwWindowHint(GLFW_SAMPLES, 0);

        handle = glfwCreateWindow(width, height, title, NULL, NULL);
        if (handle == NULL) {
            throw new RuntimeException(
                    "Failed to create a window with an OpenGL 3.3 core context. "
                            + "Check that your graphics drivers are up to date.");
        }

        glfwSetFramebufferSizeCallback(handle, (win, w, h) -> {
            // A minimised window reports 0x0; ignore those so projection maths stays sane.
            if (w > 0 && h > 0) {
                this.width = w;
                this.height = h;
                this.framebufferResized = true;
            }
        });

        centreOnPrimaryMonitor();

        glfwMakeContextCurrent(handle);
        glfwSwapInterval(vsync ? 1 : 0);
        GL.createCapabilities();

        // Pick up the real framebuffer size: on a scaled display it differs from the
        // window size we asked for.
        try (MemoryStack stack = MemoryStack.stackPush()) {
            IntBuffer w = stack.mallocInt(1);
            IntBuffer h = stack.mallocInt(1);
            glfwGetFramebufferSize(handle, w, h);
            this.width = w.get(0);
            this.height = h.get(0);
        }

        glfwShowWindow(handle);

        System.out.println("OpenGL " + glGetString(GL_VERSION));
        System.out.println("Renderer: " + glGetString(GL_RENDERER));
    }

    private void centreOnPrimaryMonitor() {
        long monitor = glfwGetPrimaryMonitor();
        if (monitor == NULL) {
            return;
        }
        GLFWVidMode mode = glfwGetVideoMode(monitor);
        if (mode == null) {
            return;
        }
        try (MemoryStack stack = MemoryStack.stackPush()) {
            IntBuffer w = stack.mallocInt(1);
            IntBuffer h = stack.mallocInt(1);
            glfwGetWindowSize(handle, w, h);
            glfwSetWindowPos(handle, (mode.width() - w.get(0)) / 2, (mode.height() - h.get(0)) / 2);
        }
    }

    /** Swaps buffers and pumps the event queue. Call once at the end of each frame. */
    public void update() {
        glfwSwapBuffers(handle);
        glfwPollEvents();
    }

    /** Pumps the event queue. Call once at the start of each frame, before consuming input. */
    public void pollEvents() {
        glfwPollEvents();
    }

    /** Swaps buffers only. Call once at the end of each frame. */
    public void swapBuffers() {
        glfwSwapBuffers(handle);
    }

    public boolean shouldClose() {
        return glfwWindowShouldClose(handle);
    }

    public void requestClose() {
        glfwSetWindowShouldClose(handle, true);
    }

    /**
     * Returns true once after each framebuffer resize, then clears the flag. Lets callers
     * rebuild the projection matrix only when it actually changed.
     */
    public boolean consumeResized() {
        boolean was = framebufferResized;
        framebufferResized = false;
        return was;
    }

    /** Locks and hides the cursor for mouse-look, or releases it for menus. */
    public void setCursorGrabbed(boolean grabbed) {
        if (cursorGrabbed == grabbed) {
            return;
        }
        cursorGrabbed = grabbed;
        glfwSetInputMode(handle, GLFW_CURSOR, grabbed ? GLFW_CURSOR_DISABLED : GLFW_CURSOR_NORMAL);
    }

    public boolean isCursorGrabbed() {
        return cursorGrabbed;
    }

    public void setVsync(boolean vsync) {
        this.vsync = vsync;
        glfwSwapInterval(vsync ? 1 : 0);
    }

    public boolean isVsync() {
        return vsync;
    }

    public void setTitle(String title) {
        glfwSetWindowTitle(handle, title);
    }

    public long handle() {
        return handle;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public float aspectRatio() {
        return height == 0 ? 1f : (float) width / (float) height;
    }

    public void destroy() {
        glfwFreeCallbacks(handle);
        glfwDestroyWindow(handle);
        glfwTerminate();
        GLFWErrorCallback callback = glfwSetErrorCallback(null);
        if (callback != null) {
            callback.free();
        }
    }
}
