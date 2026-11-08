package com.craft.audio;

import com.craft.world.BlockType;
import com.craft.world.Blocks;

import java.util.Random;

/**
 * Every sound in the game, synthesised rather than loaded.
 *
 * <p>There are no audio files to license or ship: footsteps, block breaks and hits are all
 * built from filtered noise and swept tones. Blocks are sorted into a handful of material
 * families whose filtering and pitch differ enough that gravel, wood and glass are clearly
 * distinguishable by ear.
 */
public class Sfx {

    private static final int SAMPLE_RATE = 22050;

    /** How a block sounds, inferred from its name so the block registry stays about blocks. */
    public enum Material {
        SOFT,   // grass, dirt, sand, snow
        STONE,
        WOOD,
        GLASS,
        FOLIAGE
    }

    private final AudioEngine audio;
    private final Random random = new Random(0xC0FFEE);

    private final int[] stepBuffers = new int[Material.values().length];
    private final int[] breakBuffers = new int[Material.values().length];
    private final int[] placeBuffers = new int[Material.values().length];
    private int hurtBuffer;
    private int splashBuffer;

    public Sfx(AudioEngine audio) {
        this.audio = audio;
    }

    public void build() {
        if (!audio.isEnabled()) {
            return;
        }
        for (Material material : Material.values()) {
            stepBuffers[material.ordinal()] = audio.createBuffer(step(material), SAMPLE_RATE);
            breakBuffers[material.ordinal()] = audio.createBuffer(breakUp(material), SAMPLE_RATE);
            placeBuffers[material.ordinal()] = audio.createBuffer(place(material), SAMPLE_RATE);
        }
        hurtBuffer = audio.createBuffer(hurtTone(), SAMPLE_RATE);
        splashBuffer = audio.createBuffer(splash(), SAMPLE_RATE);
    }

    // --------------------------------------------------------------------------- playing

    /** Random pitch on every play, which is what stops repeated steps sounding mechanical. */
    private float wobble(float spread) {
        return 1f + (random.nextFloat() - 0.5f) * 2f * spread;
    }

    public void footstep(BlockType surface) {
        audio.play(stepBuffers[materialOf(surface).ordinal()], wobble(0.12f), 0.32f);
    }

    public void blockBroken(BlockType type) {
        audio.play(breakBuffers[materialOf(type).ordinal()], wobble(0.10f), 0.55f);
    }

    public void blockPlaced(BlockType type) {
        audio.play(placeBuffers[materialOf(type).ordinal()], wobble(0.10f), 0.5f);
    }

    public void hurt() {
        audio.play(hurtBuffer, wobble(0.06f), 0.55f);
    }

    public void splashSound() {
        audio.play(splashBuffer, wobble(0.10f), 0.45f);
    }

    /**
     * Sorts a block into a sound family. Reading the block's name keeps this knowledge in the
     * audio code rather than sprinkling a sound field through sixty registry entries.
     */
    public static Material materialOf(BlockType type) {
        if (type == null || type == Blocks.AIR) {
            return Material.SOFT;
        }
        String name = type.name;
        if (name.contains("glass") || name.contains("ice") || name.contains("amethyst")) {
            return Material.GLASS;
        }
        if (name.contains("log") || name.contains("planks") || name.contains("hay")) {
            return Material.WOOD;
        }
        if (name.contains("leaves") || name.contains("grass") || name.contains("fern")
                || name.contains("flower") || name.contains("mushroom")
                || name.contains("sapling") || name.contains("bush")) {
            return Material.FOLIAGE;
        }
        if (name.contains("sand") || name.contains("dirt") || name.contains("gravel")
                || name.contains("snow") || name.contains("mud") || name.contains("farmland")) {
            return Material.SOFT;
        }
        return Material.STONE;
    }

    // ------------------------------------------------------------------------ synthesis

    private short[] step(Material material) {
        switch (material) {
            case STONE: return noise(0.09f, 0.30f, 0.55f, 1.0f);
            case WOOD: return noise(0.10f, 0.22f, 0.42f, 0.95f);
            case GLASS: return noise(0.07f, 0.65f, 0.30f, 1.0f);
            case FOLIAGE: return noise(0.11f, 0.45f, 0.28f, 0.9f);
            default: return noise(0.10f, 0.16f, 0.40f, 0.85f);
        }
    }

    private short[] breakUp(Material material) {
        switch (material) {
            case STONE: return crumble(0.30f, 0.28f, 0.8f);
            case WOOD: return crumble(0.26f, 0.20f, 0.7f);
            case GLASS: return shatter();
            case FOLIAGE: return crumble(0.22f, 0.55f, 0.5f);
            default: return crumble(0.24f, 0.14f, 0.6f);
        }
    }

    private short[] place(Material material) {
        switch (material) {
            case STONE: return noise(0.12f, 0.26f, 0.75f, 1.0f);
            case WOOD: return noise(0.13f, 0.20f, 0.62f, 0.95f);
            case GLASS: return noise(0.10f, 0.70f, 0.45f, 1.1f);
            case FOLIAGE: return noise(0.12f, 0.42f, 0.34f, 0.9f);
            default: return noise(0.12f, 0.15f, 0.55f, 0.85f);
        }
    }

    /**
     * A filtered noise burst with a percussive envelope: the basis of every impact sound here.
     *
     * @param seconds   length
     * @param brightness 0 is a dull thud, 1 is unfiltered hiss
     * @param level     peak amplitude
     * @param decay     shape of the fall-off; higher is snappier
     */
    private short[] noise(float seconds, float brightness, float level, float decay) {
        int count = (int) (seconds * SAMPLE_RATE);
        short[] samples = new short[count];

        // A one-pole low-pass; its coefficient is the brightness control.
        float smoothing = 0.02f + brightness * 0.9f;
        float filtered = 0;

        for (int i = 0; i < count; i++) {
            float white = random.nextFloat() * 2f - 1f;
            filtered += (white - filtered) * smoothing;

            float t = i / (float) count;
            // Fast attack so the transient is sharp, then an exponential tail.
            float attack = Math.min(1f, t * 40f);
            float envelope = attack * (float) Math.exp(-t * (6f + decay * 8f));

            samples[i] = clip(filtered * envelope * level);
        }
        return samples;
    }

    /** A rattling break: several overlapping bursts, so it reads as many small pieces. */
    private short[] crumble(float seconds, float brightness, float level) {
        int count = (int) (seconds * SAMPLE_RATE);
        short[] samples = new short[count];
        float smoothing = 0.02f + brightness * 0.9f;
        float filtered = 0;

        int grains = 4;
        for (int i = 0; i < count; i++) {
            float white = random.nextFloat() * 2f - 1f;
            filtered += (white - filtered) * smoothing;

            float t = i / (float) count;
            float envelope = 0;
            for (int g = 0; g < grains; g++) {
                float start = g / (float) grains * 0.55f;
                if (t >= start) {
                    float local = (t - start) * (grains + 2);
                    envelope += Math.max(0, (float) Math.exp(-local * 6f)) / (1 + g);
                }
            }
            samples[i] = clip(filtered * envelope * level * (1f - t * 0.4f));
        }
        return samples;
    }

    /** Glass: bright noise plus a couple of high ringing partials. */
    private short[] shatter() {
        int count = (int) (0.32f * SAMPLE_RATE);
        short[] samples = new short[count];
        float filtered = 0;

        for (int i = 0; i < count; i++) {
            float t = i / (float) count;
            float white = random.nextFloat() * 2f - 1f;
            filtered += (white - filtered) * 0.8f;

            float ring = (float) (Math.sin(i * 0.62) * 0.35 + Math.sin(i * 0.91) * 0.25);
            float envelope = Math.min(1f, t * 60f) * (float) Math.exp(-t * 9f);
            samples[i] = clip((filtered * 0.7f + ring) * envelope * 0.5f);
        }
        return samples;
    }

    /** A short descending two-tone, the universal "that hurt". */
    private short[] hurtTone() {
        int count = (int) (0.28f * SAMPLE_RATE);
        short[] samples = new short[count];
        double phase = 0;

        for (int i = 0; i < count; i++) {
            float t = i / (float) count;
            double frequency = 320 - 150 * t;
            phase += 2 * Math.PI * frequency / SAMPLE_RATE;

            // A little squared-off, which reads as harsher than a pure sine.
            float wave = (float) (Math.sin(phase) * 0.7 + Math.sin(phase * 2) * 0.3);
            float envelope = Math.min(1f, t * 30f) * (float) Math.exp(-t * 5f);
            samples[i] = clip(wave * envelope * 0.55f);
        }
        return samples;
    }

    private short[] splash() {
        int count = (int) (0.35f * SAMPLE_RATE);
        short[] samples = new short[count];
        float filtered = 0;

        for (int i = 0; i < count; i++) {
            float t = i / (float) count;
            float white = random.nextFloat() * 2f - 1f;
            // The filter opens as the sound develops, which is what makes it read as a
            // splash rising out of a thud rather than a burst of static.
            filtered += (white - filtered) * (0.05f + t * 0.5f);
            float envelope = Math.min(1f, t * 25f) * (float) Math.exp(-t * 4f);
            samples[i] = clip(filtered * envelope * 0.6f);
        }
        return samples;
    }

    private static short clip(float value) {
        float scaled = value * Short.MAX_VALUE;
        if (scaled > Short.MAX_VALUE) {
            return Short.MAX_VALUE;
        }
        if (scaled < Short.MIN_VALUE) {
            return Short.MIN_VALUE;
        }
        return (short) scaled;
    }
}
