package com.craft.core;

/** Frame timing and a one-second-window FPS counter. */
public class Timer {

    private long lastTime = System.nanoTime();
    private float delta;

    private int frames;
    private long fpsWindowStart = System.nanoTime();
    private int fps;

    /** Advances the clock and returns the seconds elapsed since the previous call. */
    public float tick() {
        long now = System.nanoTime();
        delta = (now - lastTime) / 1_000_000_000f;
        lastTime = now;

        // A long stall (dragging the window, a GC pause, a breakpoint) would otherwise
        // teleport the player through terrain. Clamp to a sane maximum step.
        if (delta > 0.1f) {
            delta = 0.1f;
        }

        frames++;
        if (now - fpsWindowStart >= 1_000_000_000L) {
            fps = frames;
            frames = 0;
            fpsWindowStart = now;
        }
        return delta;
    }

    public float getDelta() {
        return delta;
    }

    public int getFps() {
        return fps;
    }
}
