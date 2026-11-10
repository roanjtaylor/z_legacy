package com.craft.world;

import org.joml.Vector3f;

/**
 * The day/night cycle, and every colour derived from it.
 *
 * <p>{@code timeOfDay} runs 0..1 with 0 at dawn, 0.25 at noon, 0.5 at dusk and 0.75 at
 * midnight. Everything else — sun direction, sky and fog colour, how bright skylight makes a
 * block — falls out of the sun's elevation, so there is a single value to save and restore.
 */
public class Sky {

    /** Real seconds for one full cycle. Minecraft's day is 20 minutes; this matches. */
    public static final float DAY_LENGTH_SECONDS = 1200f;

    private static final Vector3f DAY_ZENITH = new Vector3f(0.32f, 0.55f, 0.94f);
    private static final Vector3f DAY_HORIZON = new Vector3f(0.68f, 0.82f, 1.00f);
    private static final Vector3f NIGHT_ZENITH = new Vector3f(0.015f, 0.02f, 0.06f);
    private static final Vector3f NIGHT_HORIZON = new Vector3f(0.05f, 0.06f, 0.13f);
    private static final Vector3f SUNSET_HORIZON = new Vector3f(0.95f, 0.52f, 0.28f);

    private float timeOfDay = 0.20f;
    private boolean frozen;

    private final Vector3f sunDirection = new Vector3f();
    private final Vector3f zenithColour = new Vector3f();
    private final Vector3f horizonColour = new Vector3f();
    private final Vector3f fogColour = new Vector3f();
    private final Vector3f sunColour = new Vector3f(1.0f, 0.96f, 0.86f);

    private float daylight;

    public Sky() {
        recompute();
    }

    public void update(float deltaSeconds) {
        if (!frozen) {
            timeOfDay = (timeOfDay + deltaSeconds / DAY_LENGTH_SECONDS) % 1f;
        }
        recompute();
    }

    private void recompute() {
        // Sun rises in the east, sets in the west, tilted so it is not perfectly overhead.
        double angle = timeOfDay * Math.PI * 2;
        sunDirection.set(
                (float) Math.cos(angle),
                (float) Math.sin(angle),
                (float) (Math.cos(angle) * 0.35)).normalize();

        // Elevation drives brightness, with a soft band around the horizon so dawn and dusk
        // take a while rather than snapping between day and night.
        daylight = clamp01((sunDirection.y + 0.18f) / 0.42f);

        float sunset = sunsetStrength();

        lerp(NIGHT_ZENITH, DAY_ZENITH, daylight, zenithColour);
        lerp(NIGHT_HORIZON, DAY_HORIZON, daylight, horizonColour);
        lerp(horizonColour, SUNSET_HORIZON, sunset * 0.75f, horizonColour);

        // Fog sits between the two so distant terrain melts into the sky at any elevation.
        lerp(horizonColour, zenithColour, 0.25f, fogColour);
    }

    /** Peaks when the sun is close to the horizon, in either direction. */
    private float sunsetStrength() {
        float elevation = sunDirection.y;
        float band = 1f - Math.min(1f, Math.abs(elevation) / 0.30f);
        return band * band;
    }

    /** 0..1 multiplier applied to sky-lit blocks: full by day, a dim blue by night. */
    public float getSkyLightFactor() {
        return 0.12f + 0.88f * daylight;
    }

    public float getTimeOfDay() {
        return timeOfDay;
    }

    public void setTimeOfDay(float timeOfDay) {
        this.timeOfDay = ((timeOfDay % 1f) + 1f) % 1f;
        recompute();
    }

    public boolean isFrozen() {
        return frozen;
    }

    public void setFrozen(boolean frozen) {
        this.frozen = frozen;
    }

    public boolean isNight() {
        return daylight < 0.25f;
    }

    /** Clock reading for the debug overlay, with 0.0 as dawn. */
    public String clock() {
        int minutes = (int) (((timeOfDay + 0.25f) % 1f) * 24 * 60);
        return String.format("%02d:%02d", minutes / 60, minutes % 60);
    }

    public Vector3f getSunDirection() {
        return sunDirection;
    }

    public Vector3f getZenithColour() {
        return zenithColour;
    }

    public Vector3f getHorizonColour() {
        return horizonColour;
    }

    public Vector3f getFogColour() {
        return fogColour;
    }

    public Vector3f getSunColour() {
        return sunColour;
    }

    private static float clamp01(float value) {
        return value < 0f ? 0f : Math.min(value, 1f);
    }

    private static void lerp(Vector3f a, Vector3f b, float t, Vector3f dest) {
        float clamped = clamp01(t);
        dest.set(
                a.x + (b.x - a.x) * clamped,
                a.y + (b.y - a.y) * clamped,
                a.z + (b.z - a.z) * clamped);
    }
}
