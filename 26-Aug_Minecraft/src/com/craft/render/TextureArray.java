package com.craft.render;

import org.lwjgl.system.MemoryUtil;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import static org.lwjgl.opengl.GL33.*;

/**
 * Every block texture in one {@code GL_TEXTURE_2D_ARRAY}, one tile per layer.
 *
 * <p>A texture array rather than a packed atlas: tiles cannot bleed into each other at any mip
 * level, and vertices carry a layer index instead of needing atlas UV arithmetic. All layers
 * must share one size, which the 16x16 pack gives us for free.
 */
public class TextureArray {

    public static final int TILE_SIZE = 16;

    /** 16, 8 and 4 pixel mips only. Averaging further would erase thin leaves and flowers. */
    private static final int MAX_MIP_LEVEL = 2;

    private static final String TEXTURE_DIR = "assets/textures/blocks";

    private final int textureId;
    private final Map<String, Integer> layerByName = new HashMap<>();
    private final Map<String, BufferedImage> loadCache = new HashMap<>();

    private final int extraBaseLayer;

    /**
     * @param names block texture names, in a stable order
     * @param extra additional 16x16 images appended after them — the font glyphs, which share
     *              this array so the HUD can draw text and block icons in one call
     */
    public TextureArray(LinkedHashSet<String> names, List<BufferedImage> extra) {
        List<BufferedImage> tiles = new ArrayList<>(names.size() + extra.size());

        for (String name : names) {
            BufferedImage image = name.startsWith("gen:")
                    ? ProceduralTextures.generate(name.substring(4), this::loadPackTile)
                    : loadPackTile(name);

            layerByName.put(name, tiles.size());
            tiles.add(normalise(name, image));
        }

        extraBaseLayer = tiles.size();
        for (BufferedImage image : extra) {
            tiles.add(normalise("extra", image));
        }

        textureId = upload(tiles);
        System.out.println("Loaded " + names.size() + " block textures and "
                + extra.size() + " glyphs into a texture array");
    }

    /** Where the {@code extra} images start. */
    public int getExtraBaseLayer() {
        return extraBaseLayer;
    }

    private BufferedImage loadPackTile(String name) {
        return loadCache.computeIfAbsent(name, n -> {
            File file = new File(TEXTURE_DIR, n + ".png");
            if (!file.isFile()) {
                throw new RuntimeException("Missing block texture: " + file.getAbsolutePath());
            }
            try {
                BufferedImage image = ImageIO.read(file);
                if (image == null) {
                    throw new IOException("not a readable image");
                }
                return image;
            } catch (IOException e) {
                throw new RuntimeException("Could not read " + file.getAbsolutePath(), e);
            }
        });
    }

    /**
     * Forces a tile to 16x16. The pack's tall plants are 16x32; cropping to the bottom half
     * keeps them at their intended pixel scale rather than squashing them.
     */
    private static BufferedImage normalise(String name, BufferedImage source) {
        if (source.getWidth() == TILE_SIZE && source.getHeight() == TILE_SIZE) {
            return source;
        }

        BufferedImage result = new BufferedImage(TILE_SIZE, TILE_SIZE, BufferedImage.TYPE_INT_ARGB);
        if (source.getWidth() == TILE_SIZE && source.getHeight() > TILE_SIZE) {
            int top = source.getHeight() - TILE_SIZE;
            for (int y = 0; y < TILE_SIZE; y++) {
                for (int x = 0; x < TILE_SIZE; x++) {
                    result.setRGB(x, y, source.getRGB(x, top + y));
                }
            }
            return result;
        }

        System.out.println("  note: scaling " + name + " from "
                + source.getWidth() + "x" + source.getHeight() + " to 16x16");
        for (int y = 0; y < TILE_SIZE; y++) {
            for (int x = 0; x < TILE_SIZE; x++) {
                int sx = x * source.getWidth() / TILE_SIZE;
                int sy = y * source.getHeight() / TILE_SIZE;
                result.setRGB(x, y, source.getRGB(sx, sy));
            }
        }
        return result;
    }

    private static int upload(List<BufferedImage> tiles) {
        int id = glGenTextures();
        glBindTexture(GL_TEXTURE_2D_ARRAY, id);

        glTexImage3D(GL_TEXTURE_2D_ARRAY, 0, GL_RGBA8,
                TILE_SIZE, TILE_SIZE, tiles.size(), 0, GL_RGBA, GL_UNSIGNED_BYTE, (ByteBuffer) null);

        ByteBuffer pixels = MemoryUtil.memAlloc(TILE_SIZE * TILE_SIZE * 4);
        try {
            for (int layer = 0; layer < tiles.size(); layer++) {
                BufferedImage tile = tiles.get(layer);
                pixels.clear();
                for (int y = 0; y < TILE_SIZE; y++) {
                    for (int x = 0; x < TILE_SIZE; x++) {
                        int argb = tile.getRGB(x, y);
                        pixels.put((byte) (argb >> 16));
                        pixels.put((byte) (argb >> 8));
                        pixels.put((byte) argb);
                        pixels.put((byte) (argb >> 24));
                    }
                }
                pixels.flip();
                glTexSubImage3D(GL_TEXTURE_2D_ARRAY, 0, 0, 0, layer,
                        TILE_SIZE, TILE_SIZE, 1, GL_RGBA, GL_UNSIGNED_BYTE, pixels);
            }
        } finally {
            MemoryUtil.memFree(pixels);
        }

        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAX_LEVEL, MAX_MIP_LEVEL);
        glGenerateMipmap(GL_TEXTURE_2D_ARRAY);

        // Nearest magnification keeps the pixel art crisp; mipmapped minification stops
        // distant terrain from shimmering.
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_NEAREST_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        glBindTexture(GL_TEXTURE_2D_ARRAY, 0);
        return id;
    }

    public int layerOf(String name) {
        Integer layer = layerByName.get(name);
        if (layer == null) {
            throw new IllegalArgumentException("Texture '" + name + "' was never registered");
        }
        return layer;
    }

    public void bind(int unit) {
        glActiveTexture(GL_TEXTURE0 + unit);
        glBindTexture(GL_TEXTURE_2D_ARRAY, textureId);
    }

    public void destroy() {
        glDeleteTextures(textureId);
    }
}
