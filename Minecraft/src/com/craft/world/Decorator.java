package com.craft.world;

import java.util.Random;

/**
 * Places trees and plants on generated terrain.
 *
 * <p>Trees straddle chunk borders, so a chunk cannot simply decorate itself: half of a tree
 * whose trunk sits in the chunk next door would be missing. Instead every chunk replays the
 * decoration pass of all nine chunks in its 3x3 neighbourhood and keeps only the blocks that
 * land inside itself.
 *
 * <p>That only works if replaying a neighbour's pass produces exactly the same trees it
 * produced for itself. Two rules keep that true, and breaking either shows up as trees that
 * lose their far half after a reload:
 *
 * <ul>
 *   <li>Every random value for an attempt is drawn <em>before</em> deciding anything, so a
 *       tree that lands outside the target chunk still consumes the same numbers.</li>
 *   <li>Terrain queries go through {@link WorldGen}'s pure height and biome functions, never
 *       through chunk data, which for a neighbour's positions would not be loaded.</li>
 * </ul>
 */
public final class Decorator {

    private Decorator() {
    }

    public static void decorate(WorldGen gen, Chunk target) {
        for (int dx = -1; dx <= 1; dx++) {
            for (int dz = -1; dz <= 1; dz++) {
                decorateFrom(gen, target, target.chunkX + dx, target.chunkZ + dz);
            }
        }
    }

    private static void decorateFrom(WorldGen gen, Chunk target, int sourceX, int sourceZ) {
        int baseX = sourceX * Chunk.SIZE_X;
        int baseZ = sourceZ * Chunk.SIZE_Z;

        // One biome per source chunk, sampled at its centre: cheaper than per-position, and it
        // keeps the number of random draws fixed for the whole pass.
        Biome biome = gen.biomeAt(baseX + 8, baseZ + 8);
        if (biome.treeAttempts == 0 && biome.plantAttempts == 0) {
            return;
        }

        Random random = gen.decorationRandom(sourceX, sourceZ);

        for (int i = 0; i < biome.treeAttempts; i++) {
            int worldX = baseX + random.nextInt(Chunk.SIZE_X);
            int worldZ = baseZ + random.nextInt(Chunk.SIZE_Z);
            int trunkHeight = random.nextInt(4);
            int shape = random.nextInt(16);
            tryTree(gen, target, worldX, worldZ, biome, trunkHeight, shape);
        }

        for (int i = 0; i < biome.plantAttempts; i++) {
            int worldX = baseX + random.nextInt(Chunk.SIZE_X);
            int worldZ = baseZ + random.nextInt(Chunk.SIZE_Z);
            int pick = random.nextInt(100);
            tryPlant(gen, target, worldX, worldZ, pick);
        }
    }

    // --------------------------------------------------------------------------- trees

    private static void tryTree(WorldGen gen, Chunk target, int worldX, int worldZ,
                                Biome sourceBiome, int heightRoll, int shape) {
        int ground = gen.heightAt(worldX, worldZ);
        if (ground <= WorldGen.SEA_LEVEL) {
            return;
        }

        // The biome directly under the trunk, not the source chunk's: this stops forests
        // spilling trees onto the beach or bare rock at their edges.
        Biome here = gen.biomeAt(worldX, worldZ, ground);
        if (here.treeKind == Biome.TreeKind.NONE || here.surface != sourceBiome.surface) {
            return;
        }

        int base = ground + 1;
        switch (here.treeKind) {
            case OAK:
                buildRoundTree(target, worldX, base, worldZ, 4 + heightRoll,
                        Blocks.OAK_LOG.id, Blocks.OAK_LEAVES.id, shape);
                break;
            case BEECH:
                buildRoundTree(target, worldX, base, worldZ, 5 + heightRoll,
                        Blocks.BEECH_LOG.id, Blocks.BEECH_LEAVES.id, shape);
                break;
            case PINE:
                buildConeTree(target, worldX, base, worldZ, 6 + heightRoll,
                        Blocks.PINE_LOG.id, Blocks.PINE_LEAVES.id);
                break;
            default:
                break;
        }
    }

    /** Oak and beech: a straight trunk under a rounded canopy with clipped corners. */
    private static void buildRoundTree(Chunk target, int worldX, int base, int worldZ,
                                       int trunkHeight, int log, int leaves, int shape) {
        int top = base + trunkHeight - 1;

        for (int y = top - 2; y <= top + 1; y++) {
            int radius = (y >= top) ? 1 : 2;
            for (int dx = -radius; dx <= radius; dx++) {
                for (int dz = -radius; dz <= radius; dz++) {
                    if (Math.abs(dx) == radius && Math.abs(dz) == radius) {
                        // The narrow top layers always lose their corners; on the wide layers
                        // one bit of `shape` per corner decides, so canopies vary tree to tree
                        // rather than every oak being the same octagon.
                        if (radius == 1) {
                            continue;
                        }
                        int corner = ((dx > 0 ? 1 : 0) << 1) | (dz > 0 ? 1 : 0);
                        if ((shape & (1 << corner)) == 0) {
                            continue;
                        }
                    }
                    placeIfAir(target, worldX + dx, y, worldZ + dz, leaves);
                }
            }
        }

        for (int y = base; y <= top; y++) {
            place(target, worldX, y, worldZ, log);
        }
    }

    /** Pine: a tall trunk with tiered skirts that narrow towards a single-block tip. */
    private static void buildConeTree(Chunk target, int worldX, int base, int worldZ,
                                      int trunkHeight, int log, int leaves) {
        int top = base + trunkHeight - 1;

        int radius = 2;
        for (int y = base + 2; y <= top; y++) {
            int layer = top - y;
            // Skirts widen every other layer going down, then taper to a point at the tip.
            int r = layer == 0 ? 0 : Math.min(radius, (layer + 1) / 2);
            for (int dx = -r; dx <= r; dx++) {
                for (int dz = -r; dz <= r; dz++) {
                    if (Math.abs(dx) == r && Math.abs(dz) == r && r > 1) {
                        continue;
                    }
                    placeIfAir(target, worldX + dx, y, worldZ + dz, leaves);
                }
            }
        }
        placeIfAir(target, worldX, top + 1, worldZ, leaves);

        for (int y = base; y <= top; y++) {
            place(target, worldX, y, worldZ, log);
        }
    }

    // -------------------------------------------------------------------------- plants

    private static void tryPlant(WorldGen gen, Chunk target, int worldX, int worldZ, int pick) {
        int ground = gen.heightAt(worldX, worldZ);
        if (ground <= WorldGen.SEA_LEVEL) {
            return;
        }

        Biome here = gen.biomeAt(worldX, worldZ, ground);
        int plant = plantFor(here, pick);
        if (plant == 0) {
            return;
        }
        placeIfAir(target, worldX, ground + 1, worldZ, plant);
    }

    private static int plantFor(Biome biome, int pick) {
        switch (biome) {
            case PLAINS:
                if (pick < 55) return Blocks.TALL_GRASS.id;
                if (pick < 68) return Blocks.DANDELION.id;
                if (pick < 80) return Blocks.DAISY.id;
                if (pick < 90) return Blocks.ASTER.id;
                return Blocks.LUPINE.id;
            case FOREST:
                if (pick < 50) return Blocks.TALL_GRASS.id;
                if (pick < 74) return Blocks.FERN.id;
                if (pick < 84) return Blocks.DANDELION.id;
                if (pick < 92) return Blocks.RED_MUSHROOM.id;
                return Blocks.BROWN_MUSHROOM.id;
            case BIRCH_FOREST:
                if (pick < 55) return Blocks.TALL_GRASS.id;
                if (pick < 72) return Blocks.FERN.id;
                if (pick < 86) return Blocks.DAISY.id;
                return Blocks.LUPINE.id;
            case DESERT:
                if (pick < 45) return Blocks.SAGEBRUSH.id;
                if (pick < 70) return Blocks.PRICKLY_PEAR.id;
                return 0;
            case BEACH:
                return pick < 30 ? Blocks.SEA_THRIFT.id : 0;
            case MOUNTAINS:
                return pick < 60 ? Blocks.TALL_GRASS.id : Blocks.FERN.id;
            case SNOWY:
                return pick < 40 ? Blocks.FERN.id : 0;
            default:
                return 0;
        }
    }

    // ------------------------------------------------------------------------ placement

    private static void place(Chunk target, int worldX, int y, int worldZ, int id) {
        int x = worldX - target.originX();
        int z = worldZ - target.originZ();
        if (!Chunk.inBounds(x, y, z)) {
            return;
        }
        target.setBlockRaw(x, y, z, id);
    }

    private static void placeIfAir(Chunk target, int worldX, int y, int worldZ, int id) {
        int x = worldX - target.originX();
        int z = worldZ - target.originZ();
        if (!Chunk.inBounds(x, y, z)) {
            return;
        }
        if (!Blocks.byId(target.getBlockId(x, y, z)).isAir()) {
            return;
        }
        target.setBlockRaw(x, y, z, id);
    }
}
