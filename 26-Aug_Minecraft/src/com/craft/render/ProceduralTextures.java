package com.craft.render;

import java.awt.image.BufferedImage;
import java.util.Random;
import java.util.function.Function;

/**
 * Tiles the texture pack does not provide, synthesised at load time.
 *
 * <p>Ores are drawn over the pack's own stone tile so they sit in the same palette as
 * everything else rather than looking pasted on. Everything here is seeded, so the same tile
 * comes out identical on every run.
 */
public final class ProceduralTextures {

    private static final int SIZE = 16;

    private ProceduralTextures() {
    }

    /**
     * @param name        the part after {@code gen:} in a block's texture name
     * @param baseLoader  loads an existing pack tile, used for the ore backdrop
     */
    public static BufferedImage generate(String name, Function<String, BufferedImage> baseLoader) {
        switch (name) {
            case "water":
                return water();
            case "coal_ore":
                return ore(baseLoader.apply("stone_generic"), 0x27272E, 0x43434F, 7L);
            case "iron_ore":
                return ore(baseLoader.apply("stone_generic"), 0xC08B63, 0xE8BE96, 13L);
            case "gold_ore":
                return ore(baseLoader.apply("stone_generic"), 0xE0B13A, 0xFFE484, 23L);
            case "diamond_ore":
                return ore(baseLoader.apply("stone_generic"), 0x3FBFB6, 0x9DEFE8, 31L);
            default:
                throw new IllegalArgumentException("No generator for texture 'gen:" + name + "'");
        }
    }

    /** Deep blue with gentle horizontal banding, translucent enough to see the bed through. */
    private static BufferedImage water() {
        BufferedImage image = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_ARGB);
        Random random = new Random(1234L);

        for (int y = 0; y < SIZE; y++) {
            // Two offset sine bands give a slow swell without needing animation.
            double band = Math.sin(y * 0.8) * 6 + Math.sin(y * 0.31 + 1.7) * 4;
            for (int x = 0; x < SIZE; x++) {
                double ripple = Math.sin((x + y * 0.5) * 0.9) * 5;
                int noise = random.nextInt(9) - 4;

                int r = clamp((int) (38 + band * 0.3 + ripple * 0.3 + noise));
                int g = clamp((int) (94 + band * 0.6 + ripple * 0.5 + noise));
                int b = clamp((int) (168 + band + ripple + noise));

                image.setRGB(x, y, (200 << 24) | (r << 16) | (g << 8) | b);
            }
        }
        return image;
    }

    /** Stamps chunky mineral blobs over a stone tile, wrapping at the edges so it stays tileable. */
    private static BufferedImage ore(BufferedImage stone, int colour, int highlight, long seed) {
        BufferedImage image = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < SIZE; y++) {
            for (int x = 0; x < SIZE; x++) {
                image.setRGB(x, y, stone.getRGB(x % stone.getWidth(), y % stone.getHeight()));
            }
        }

        Random random = new Random(seed);
        int blobs = 5 + random.nextInt(2);

        for (int i = 0; i < blobs; i++) {
            int cx = random.nextInt(SIZE);
            int cy = random.nextInt(SIZE);
            int radius = 1 + random.nextInt(2);

            for (int dy = -radius; dy <= radius; dy++) {
                for (int dx = -radius; dx <= radius; dx++) {
                    // Ragged edge: drop the odd corner pixel so blobs are not perfect discs.
                    if (dx * dx + dy * dy > radius * radius + random.nextInt(2)) {
                        continue;
                    }
                    int px = Math.floorMod(cx + dx, SIZE);
                    int py = Math.floorMod(cy + dy, SIZE);
                    boolean lit = dx <= 0 && dy <= 0 && random.nextInt(3) == 0;
                    image.setRGB(px, py, 0xFF000000 | (lit ? highlight : colour));
                }
            }
        }
        return image;
    }

    private static int clamp(int value) {
        return value < 0 ? 0 : Math.min(value, 255);
    }
}
