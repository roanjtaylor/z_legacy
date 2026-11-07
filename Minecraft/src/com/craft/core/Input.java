package com.craft.core;

import static org.lwjgl.glfw.GLFW.*;

/**
 * Keyboard, mouse and scroll state.
 *
 * <p>GLFW delivers input as events; this turns them into per-frame state. "Down" means held
 * right now, "pressed" means it went down since the last {@link #endFrame()} — edge triggers
 * are cleared every frame, so poll them once per loop iteration.
 */
public class Input {

    private static final int MAX_KEYS = GLFW_KEY_LAST + 1;
    private static final int MAX_BUTTONS = GLFW_MOUSE_BUTTON_LAST + 1;

    private final boolean[] keyDown = new boolean[MAX_KEYS];
    private final boolean[] keyPressed = new boolean[MAX_KEYS];
    private final boolean[] keyReleased = new boolean[MAX_KEYS];

    /** Press plus auto-repeat, which is what text editing keys like backspace want. */
    private final boolean[] keyRepeated = new boolean[MAX_KEYS];

    /** Characters typed this frame, already mapped through the keyboard layout. */
    private final StringBuilder typed = new StringBuilder();

    private final boolean[] buttonDown = new boolean[MAX_BUTTONS];
    private final boolean[] buttonPressed = new boolean[MAX_BUTTONS];

    private double mouseX, mouseY;
    private double lastMouseX, lastMouseY;
    private float deltaX, deltaY;
    private boolean firstMouse = true;

    private float scrollDelta;

    public void attach(Window window) {
        long handle = window.handle();

        glfwSetKeyCallback(handle, (win, key, scancode, action, mods) -> {
            if (key < 0 || key >= MAX_KEYS) {
                return;
            }
            if (action == GLFW_PRESS) {
                keyDown[key] = true;
                keyPressed[key] = true;
                keyRepeated[key] = true;
            } else if (action == GLFW_RELEASE) {
                keyDown[key] = false;
                keyReleased[key] = true;
            } else if (action == GLFW_REPEAT) {
                keyRepeated[key] = true;
            }
        });

        // Character input is separate from key input: it accounts for keyboard layout,
        // modifiers and dead keys, which raw key codes do not.
        glfwSetCharCallback(handle, (win, codepoint) -> {
            if (codepoint >= 32 && codepoint < 127) {
                typed.append((char) codepoint);
            }
        });

        glfwSetMouseButtonCallback(handle, (win, button, action, mods) -> {
            if (button < 0 || button >= MAX_BUTTONS) {
                return;
            }
            if (action == GLFW_PRESS) {
                buttonDown[button] = true;
                buttonPressed[button] = true;
            } else if (action == GLFW_RELEASE) {
                buttonDown[button] = false;
            }
        });

        glfwSetCursorPosCallback(handle, (win, x, y) -> {
            mouseX = x;
            mouseY = y;
        });

        glfwSetScrollCallback(handle, (win, xoff, yoff) -> scrollDelta += (float) yoff);
    }

    /** Computes mouse movement for this frame. Call once at the top of the loop. */
    public void beginFrame() {
        if (firstMouse) {
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            firstMouse = false;
        }
        deltaX = (float) (mouseX - lastMouseX);
        deltaY = (float) (mouseY - lastMouseY);
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }

    /** Clears edge-triggered state. Call once at the bottom of the loop. */
    public void endFrame() {
        java.util.Arrays.fill(keyPressed, false);
        java.util.Arrays.fill(keyReleased, false);
        java.util.Arrays.fill(keyRepeated, false);
        java.util.Arrays.fill(buttonPressed, false);
        typed.setLength(0);
        scrollDelta = 0f;
    }

    /** True on the initial press and again on each auto-repeat. */
    public boolean isKeyRepeated(int key) {
        return key >= 0 && key < MAX_KEYS && keyRepeated[key];
    }

    /** Characters typed this frame, in order. Empty most frames. */
    public String getTypedCharacters() {
        return typed.toString();
    }

    /**
     * Discards accumulated mouse movement. Call when grabbing the cursor, otherwise the jump
     * from the menu cursor position to the centre snaps the camera around.
     */
    public void resetMouseDelta() {
        firstMouse = true;
        deltaX = 0f;
        deltaY = 0f;
    }

    public boolean isKeyDown(int key) {
        return key >= 0 && key < MAX_KEYS && keyDown[key];
    }

    public boolean isKeyPressed(int key) {
        return key >= 0 && key < MAX_KEYS && keyPressed[key];
    }

    public boolean isKeyReleased(int key) {
        return key >= 0 && key < MAX_KEYS && keyReleased[key];
    }

    public boolean isButtonDown(int button) {
        return button >= 0 && button < MAX_BUTTONS && buttonDown[button];
    }

    public boolean isButtonPressed(int button) {
        return button >= 0 && button < MAX_BUTTONS && buttonPressed[button];
    }

    public float getDeltaX() {
        return deltaX;
    }

    public float getDeltaY() {
        return deltaY;
    }

    public float getScrollDelta() {
        return scrollDelta;
    }

    public float getMouseX() {
        return (float) mouseX;
    }

    public float getMouseY() {
        return (float) mouseY;
    }
}
