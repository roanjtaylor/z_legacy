package com.craft.world;

/**
 * What a patch of the world is made of and what grows on it.
 *
 * <p>Chosen per column from temperature, humidity and elevation. Densities are expressed as
 * attempts per chunk; the generator rolls each attempt against the terrain and skips any that
 * land somewhere unsuitable, so these are upper bounds rather than exact counts.
 */
public enum Biome {

    OCEAN("Ocean", Blocks.SAND, Blocks.SAND, 3, TreeKind.NONE, 0, 0),
    BEACH("Beach", Blocks.SAND, Blocks.SAND, 4, TreeKind.NONE, 0, 1),
    DESERT("Desert", Blocks.SAND, Blocks.SANDSTONE, 4, TreeKind.NONE, 0, 6),
    PLAINS("Plains", Blocks.GRASS, Blocks.DIRT, 4, TreeKind.OAK, 1, 14),
    FOREST("Forest", Blocks.GRASS, Blocks.DIRT, 4, TreeKind.OAK, 6, 10),
    BIRCH_FOREST("Birch Forest", Blocks.GRASS, Blocks.DIRT, 4, TreeKind.BEECH, 5, 10),
    SNOWY("Snowy Plains", Blocks.SNOWY_GRASS, Blocks.DIRT, 4, TreeKind.PINE, 5, 2),
    MOUNTAINS("Mountains", Blocks.STONE, Blocks.STONE, 3, TreeKind.PINE, 1, 2),
    SNOWY_PEAKS("Snowy Peaks", Blocks.SNOW, Blocks.STONE, 3, TreeKind.NONE, 0, 0);

    public enum TreeKind {
        NONE, OAK, PINE, BEECH
    }

    public final String displayName;
    public final BlockType surface;
    public final BlockType subsurface;
    public final int subsurfaceDepth;
    public final TreeKind treeKind;
    public final int treeAttempts;
    public final int plantAttempts;

    Biome(String displayName, BlockType surface, BlockType subsurface, int subsurfaceDepth,
          TreeKind treeKind, int treeAttempts, int plantAttempts) {
        this.displayName = displayName;
        this.surface = surface;
        this.subsurface = subsurface;
        this.subsurfaceDepth = subsurfaceDepth;
        this.treeKind = treeKind;
        this.treeAttempts = treeAttempts;
        this.plantAttempts = plantAttempts;
    }

    public boolean isCold() {
        return this == SNOWY || this == SNOWY_PEAKS;
    }
}
