package com.craft.world;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * A 16 x 128 x 16 column of blocks.
 *
 * <p>One byte per block, indexed y-major so a vertical column is contiguous — the access
 * pattern skylight propagation and heightmap updates both use.
 *
 * <p>Only chunks the player has actually edited are written to disk; everything else is a pure
 * function of the world seed and can be regenerated, which is why {@link #isModified()} exists.
 */
public class Chunk {

    public static final int SIZE_X = 16;
    public static final int SIZE_Z = 16;
    public static final int HEIGHT = 128;
    public static final int BLOCK_COUNT = SIZE_X * HEIGHT * SIZE_Z;

    public final int chunkX;
    public final int chunkZ;

    private final byte[] blocks = new byte[BLOCK_COUNT];

    /** Packed light: high nibble sky, low nibble block-emitted. Recomputed, never saved. */
    private final byte[] light = new byte[BLOCK_COUNT];

    /** Highest non-air block in each column, plus one. Indexed {@code z * SIZE_X + x}. */
    private final int[] heightmap = new int[SIZE_X * SIZE_Z];

    private boolean modified;
    private boolean lit;

    /**
     * Bumped on every block write. A mesher running on a worker thread records the version it
     * read and its result is discarded if the chunk changed underneath it, so a player edit
     * during a rebuild can never be silently lost.
     */
    private final AtomicInteger version = new AtomicInteger();

    public Chunk(int chunkX, int chunkZ) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
    }

    public static int index(int x, int y, int z) {
        return (y << 8) | (z << 4) | x;
    }

    public static boolean inBounds(int x, int y, int z) {
        return x >= 0 && x < SIZE_X && y >= 0 && y < HEIGHT && z >= 0 && z < SIZE_Z;
    }

    /** Local coordinates. Out-of-range y reads as air so callers need not clamp. */
    public int getBlockId(int x, int y, int z) {
        if (!inBounds(x, y, z)) {
            return 0;
        }
        return blocks[index(x, y, z)] & 0xFF;
    }

    public BlockType getBlock(int x, int y, int z) {
        return Blocks.byId(getBlockId(x, y, z));
    }

    /** Used by world generation: writes without marking the chunk as player-modified. */
    public void setBlockRaw(int x, int y, int z, int id) {
        if (!inBounds(x, y, z)) {
            return;
        }
        blocks[index(x, y, z)] = (byte) id;
    }

    /** A player edit: marks the chunk for saving and invalidates any in-flight mesh. */
    public void setBlock(int x, int y, int z, int id) {
        if (!inBounds(x, y, z)) {
            return;
        }
        blocks[index(x, y, z)] = (byte) id;
        modified = true;
        version.incrementAndGet();
    }

    public int getLight(int x, int y, int z) {
        if (!inBounds(x, y, z)) {
            return 0;
        }
        return light[index(x, y, z)] & 0xFF;
    }

    public int getSkyLight(int x, int y, int z) {
        return (getLight(x, y, z) >> 4) & 0xF;
    }

    public int getBlockLight(int x, int y, int z) {
        return getLight(x, y, z) & 0xF;
    }

    public void setSkyLight(int x, int y, int z, int level) {
        if (!inBounds(x, y, z)) {
            return;
        }
        int i = index(x, y, z);
        light[i] = (byte) ((light[i] & 0x0F) | ((level & 0xF) << 4));
    }

    public void setBlockLight(int x, int y, int z, int level) {
        if (!inBounds(x, y, z)) {
            return;
        }
        int i = index(x, y, z);
        light[i] = (byte) ((light[i] & 0xF0) | (level & 0xF));
    }

    public void clearLight() {
        java.util.Arrays.fill(light, (byte) 0);
    }

    /** Recomputes the whole heightmap. Cheap enough to run once after generation. */
    public void rebuildHeightmap() {
        for (int z = 0; z < SIZE_Z; z++) {
            for (int x = 0; x < SIZE_X; x++) {
                int y = HEIGHT - 1;
                while (y >= 0 && getBlock(x, y, z).isAir()) {
                    y--;
                }
                heightmap[z * SIZE_X + x] = y + 1;
            }
        }
    }

    /** One past the highest non-air block in a column; 0 for an empty column. */
    public int getHeight(int x, int z) {
        return heightmap[z * SIZE_X + x];
    }

    public void updateHeight(int x, int z, int height) {
        heightmap[z * SIZE_X + x] = height;
    }

    public byte[] blockArray() {
        return blocks;
    }

    public boolean isModified() {
        return modified;
    }

    public void setModified(boolean modified) {
        this.modified = modified;
    }

    public boolean isLit() {
        return lit;
    }

    public void setLit(boolean lit) {
        this.lit = lit;
    }

    public int getVersion() {
        return version.get();
    }

    /** Marks the chunk changed without a block write — used after a relight. */
    public void bumpVersion() {
        version.incrementAndGet();
    }

    public int originX() {
        return chunkX * SIZE_X;
    }

    public int originZ() {
        return chunkZ * SIZE_Z;
    }
}
