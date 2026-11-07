package com.craft.world;

import java.util.Random;

/**
 * Seeded Perlin noise, plus the fractal helpers terrain generation is built from.
 *
 * <p>Ken Perlin's improved noise: a permutation table shuffled from the world seed, gradients
 * chosen by hashing lattice corners, and a quintic fade so the second derivative is continuous
 * and terrain has no visible grid creases.
 *
 * <p>Raw {@code noise2}/{@code noise3} return roughly -1..1. The fractal variants normalise by
 * total amplitude, so they return -1..1 regardless of octave count.
 */
public class Noise {

    private final int[] permutation = new int[512];

    public Noise(long seed) {
        int[] source = new int[256];
        for (int i = 0; i < 256; i++) {
            source[i] = i;
        }

        // Fisher-Yates from the seed, so a world's terrain is fully reproducible.
        Random random = new Random(seed);
        for (int i = 255; i > 0; i--) {
            int j = random.nextInt(i + 1);
            int tmp = source[i];
            source[i] = source[j];
            source[j] = tmp;
        }

        // Doubled so lattice lookups can index up to 511 without wrapping arithmetic.
        for (int i = 0; i < 512; i++) {
            permutation[i] = source[i & 255];
        }
    }

    private static double fade(double t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private static double lerp(double t, double a, double b) {
        return a + t * (b - a);
    }

    private static double grad2(int hash, double x, double y) {
        switch (hash & 7) {
            case 0: return x + y;
            case 1: return x - y;
            case 2: return -x + y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            default: return -y;
        }
    }

    private static double grad3(int hash, double x, double y, double z) {
        int h = hash & 15;
        double u = h < 8 ? x : y;
        double v = h < 4 ? y : (h == 12 || h == 14 ? x : z);
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

    public double noise2(double x, double y) {
        int xi = (int) Math.floor(x) & 255;
        int yi = (int) Math.floor(y) & 255;
        double xf = x - Math.floor(x);
        double yf = y - Math.floor(y);

        double u = fade(xf);
        double v = fade(yf);

        int a = permutation[xi] + yi;
        int b = permutation[xi + 1] + yi;

        double result = lerp(v,
                lerp(u, grad2(permutation[a], xf, yf), grad2(permutation[b], xf - 1, yf)),
                lerp(u, grad2(permutation[a + 1], xf, yf - 1),
                        grad2(permutation[b + 1], xf - 1, yf - 1)));

        // grad2 peaks at sqrt(2); scale so the practical range is about -1..1.
        return result * 0.7071;
    }

    public double noise3(double x, double y, double z) {
        int xi = (int) Math.floor(x) & 255;
        int yi = (int) Math.floor(y) & 255;
        int zi = (int) Math.floor(z) & 255;
        double xf = x - Math.floor(x);
        double yf = y - Math.floor(y);
        double zf = z - Math.floor(z);

        double u = fade(xf);
        double v = fade(yf);
        double w = fade(zf);

        int a = permutation[xi] + yi;
        int aa = permutation[a] + zi;
        int ab = permutation[a + 1] + zi;
        int b = permutation[xi + 1] + yi;
        int ba = permutation[b] + zi;
        int bb = permutation[b + 1] + zi;

        return lerp(w,
                lerp(v,
                        lerp(u, grad3(permutation[aa], xf, yf, zf),
                                grad3(permutation[ba], xf - 1, yf, zf)),
                        lerp(u, grad3(permutation[ab], xf, yf - 1, zf),
                                grad3(permutation[bb], xf - 1, yf - 1, zf))),
                lerp(v,
                        lerp(u, grad3(permutation[aa + 1], xf, yf, zf - 1),
                                grad3(permutation[ba + 1], xf - 1, yf, zf - 1)),
                        lerp(u, grad3(permutation[ab + 1], xf, yf - 1, zf - 1),
                                grad3(permutation[bb + 1], xf - 1, yf - 1, zf - 1))));
    }

    /**
     * Standard deviation of one octave. Perlin noise is not uniform over -1..1 — it is a sum
     * of interpolated gradients and clusters heavily around zero, with a measured sigma near
     * 0.19. Normalising by the nominal range instead of this would leave every downstream
     * threshold looking at a signal three times narrower than it expects.
     */
    private static final double OCTAVE_SIGMA = 0.19;

    /** How many standard deviations of the fractal sum are mapped onto the -1..1 output. */
    private static final double SIGMA_RANGE = 3.0;

    /**
     * Summed octaves of 2D noise, each finer and quieter than the last, normalised so the
     * result really does span -1..1.
     *
     * <p>The octaves are statistically independent, so their variances add and the sum's sigma
     * grows with the <em>quadrature</em> total of the amplitudes, not the arithmetic total.
     * Dividing by the arithmetic total — the obvious thing, and what most fBm snippets do —
     * yields a signal that in practice never leaves -0.35..0.35.
     */
    public double fbm2(double x, double y, int octaves, double frequency, double persistence) {
        double sum = 0;
        double amplitude = 1;
        double quadrature = 0;

        for (int i = 0; i < octaves; i++) {
            sum += noise2(x * frequency, y * frequency) * amplitude;
            quadrature += amplitude * amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return normalise(sum, quadrature);
    }

    public double fbm3(double x, double y, double z, int octaves, double frequency,
                       double persistence) {
        double sum = 0;
        double amplitude = 1;
        double quadrature = 0;

        for (int i = 0; i < octaves; i++) {
            sum += noise3(x * frequency, y * frequency, z * frequency) * amplitude;
            quadrature += amplitude * amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return normalise(sum, quadrature);
    }

    private static double normalise(double sum, double quadrature) {
        double scaled = sum / (Math.sqrt(quadrature) * OCTAVE_SIGMA * SIGMA_RANGE);
        // Beyond three sigma is well under 1% of samples; clamping there costs a little
        // detail on the very highest peaks and deepest basins and nothing else.
        return scaled < -1 ? -1 : Math.min(scaled, 1);
    }

    /**
     * Ridged noise: folds the signal at zero so troughs become sharp crests. This is what
     * turns rolling hills into mountain ridges. Returns 0..1.
     */
    public double ridged2(double x, double y, int octaves, double frequency, double persistence) {
        double sum = 0;
        double amplitude = 1;
        double total = 0;

        for (int i = 0; i < octaves; i++) {
            double n = 1 - Math.abs(noise2(x * frequency, y * frequency));
            sum += n * n * amplitude;
            total += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        return sum / total;
    }
}
