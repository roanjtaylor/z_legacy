package com.craft.dev;

import com.craft.entity.Player;
import com.craft.game.GameMode;
import com.craft.game.Interaction;
import com.craft.game.Inventory;
import com.craft.save.WorldStore;
import com.craft.world.Biome;
import com.craft.world.BlockType;
import com.craft.world.Blocks;
import com.craft.world.Chunk;
import com.craft.world.World;
import com.craft.world.WorldGen;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.Map;

/**
 * Headless checks over world generation and collision. Run with {@code check.bat}.
 *
 * <p>The rendering cannot be verified without eyes on it, but the two systems underneath it can
 * be: terrain is a pure function, and physics is a simulation that either lands the player on
 * the ground or does not. Both have already earned their keep — the fBm normalisation and the
 * collision push-out bugs were both found here rather than in play.
 */
public final class SelfCheck {

    private static int failures;

    private SelfCheck() {
    }

    public static void main(String[] args) {
        long seed = args.length > 0 ? Long.parseLong(args[0]) : 1957473507L;

        checkGeneration(seed);
        checkDeterminism(seed);
        checkPhysics(seed);
        checkLightingAndInteraction(seed);
        checkBuilding(seed);
        checkPersistence(seed);

        System.out.println();
        if (failures == 0) {
            System.out.println("All checks passed.");
        } else {
            System.out.println(failures + " check(s) FAILED.");
        }
        System.exit(failures == 0 ? 0 : 1);
    }

    private static void check(String label, boolean ok, String detail) {
        System.out.printf("  %-46s %s%s%n", label, ok ? "pass" : "FAIL",
                detail.isEmpty() ? "" : "   " + detail);
        if (!ok) {
            failures++;
        }
    }

    // -------------------------------------------------------------------- generation

    private static void checkGeneration(long seed) {
        System.out.println("World generation (seed " + seed + "):");
        WorldGen generator = new WorldGen(seed);

        int span = 1500;
        int step = 5;
        Map<Biome, Integer> biomes = new EnumMap<>(Biome.class);
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        long underwater = 0;
        long samples = 0;

        for (int x = -span; x <= span; x += step) {
            for (int z = -span; z <= span; z += step) {
                int height = generator.heightAt(x, z);
                biomes.merge(generator.biomeAt(x, z, height), 1, Integer::sum);
                min = Math.min(min, height);
                max = Math.max(max, height);
                if (height < WorldGen.SEA_LEVEL) {
                    underwater++;
                }
                samples++;
            }
        }

        double oceanShare = 100.0 * underwater / samples;
        check("terrain spans at least 60 blocks of height", max - min >= 60,
                "min " + min + ", max " + max);
        check("sea covers between 5% and 45% of the world",
                oceanShare > 5 && oceanShare < 45, String.format("%.1f%%", oceanShare));
        check("every biome appears somewhere",
                biomes.size() == Biome.values().length,
                biomes.size() + " of " + Biome.values().length);

        double beachShare = 100.0 * biomes.getOrDefault(Biome.BEACH, 0) / samples;
        check("beaches are a coastline, not a landscape", beachShare < 12,
                String.format("%.1f%%", beachShare));

        Chunk chunk = new Chunk(3, -7);
        generator.generate(chunk);
        long ore = 0;
        long solid = 0;
        for (int i = 0; i < Chunk.BLOCK_COUNT; i++) {
            BlockType type = Blocks.byId(chunk.blockArray()[i] & 0xFF);
            if (type.isAir() || type == Blocks.WATER) {
                continue;
            }
            solid++;
            if (type.name.endsWith("_ore")) {
                ore++;
            }
        }
        double oreShare = 100.0 * ore / solid;
        check("ore is a fraction of a percent of stone, not a seam",
                oreShare > 0.2 && oreShare < 3.0, String.format("%.2f%%", oreShare));
    }

    /**
     * The whole persistence design rests on this: unmodified chunks are never saved, they are
     * regenerated. If generation were not reproducible, reloading a world would silently
     * rearrange the parts of it the player had not touched.
     */
    private static void checkDeterminism(long seed) {
        System.out.println("Determinism:");
        WorldGen generator = new WorldGen(seed);

        Chunk first = new Chunk(3, -7);
        generator.generate(first);
        Chunk second = new Chunk(3, -7);
        generator.generate(second);
        check("regenerating a chunk gives identical blocks",
                Arrays.equals(first.blockArray(), second.blockArray()), "");

        // A chunk generated on its own must match one generated after its neighbours, or trees
        // straddling the border would lose their far halves on reload.
        WorldGen other = new WorldGen(seed);
        for (int dx = -1; dx <= 1; dx++) {
            for (int dz = -1; dz <= 1; dz++) {
                if (dx != 0 || dz != 0) {
                    other.generate(new Chunk(3 + dx, -7 + dz));
                }
            }
        }
        Chunk afterNeighbours = new Chunk(3, -7);
        other.generate(afterNeighbours);
        check("generation order does not change a chunk",
                Arrays.equals(first.blockArray(), afterNeighbours.blockArray()), "");

        check("a different seed gives a different world",
                new WorldGen(seed + 1).heightAt(100, 100) != generator.heightAt(100, 100), "");
    }

    // ----------------------------------------------------------------------- physics

    private static void checkPhysics(long seed) {
        System.out.println("Collision and movement:");
        World world = new World(seed);
        try {
            world.loadInitialArea(0, 0, 4);

            checkLanding(world);
            checkResting(world);
            checkWall(world);
            checkStepNeedsJump(world);
            checkFrameRateIndependence(world);
            checkNoTunnelling(world);
        } finally {
            world.shutdown();
        }
    }

    private static void simulate(World world, Player player, int frames, float delta,
                                 float moveX, float moveZ, boolean jump) {
        for (int i = 0; i < frames; i++) {
            player.update(world, delta, moveX, moveZ, jump, false, false, false);
        }
    }

    private static int groundAt(World world, int x, int z) {
        for (int y = Chunk.HEIGHT - 2; y > 1; y--) {
            if (world.getBlock(x, y, z).solid) {
                return y;
            }
        }
        return 0;
    }

    /** Clears a flat stone platform so a test never wanders onto natural terrain. */
    private static int buildPlatform(World world, int x, int z, int length) {
        int ground = groundAt(world, x, z);
        for (int dx = -1; dx <= length; dx++) {
            for (int dz = -2; dz <= 2; dz++) {
                for (int dy = 1; dy <= 6; dy++) {
                    world.setBlock(x + dx, ground + dy, z + dz, Blocks.AIR.id);
                }
                world.setBlock(x + dx, ground, z + dz, Blocks.STONE.id);
            }
        }
        return ground;
    }

    private static void checkLanding(World world) {
        int ground = groundAt(world, 4, 4);
        Player player = new Player(4.5f, 120, 4.5f);
        simulate(world, player, 600, 1 / 60f, 0, 0, false);

        check("a long fall ends on the ground", player.isOnGround(), "");
        check("feet come to rest on the block surface",
                Math.abs(player.position.y - (ground + 1)) < 0.02f,
                String.format("y=%.4f, expected %d", player.position.y, ground + 1));
    }

    private static void checkResting(World world) {
        int ground = buildPlatform(world, 6, 6, 2);
        Player player = new Player(6.5f, ground + 1, 6.5f);
        float startY = player.position.y;
        simulate(world, player, 300, 1 / 60f, 0, 0, false);

        check("standing still does not sink or drift",
                Math.abs(player.position.y - startY) < 0.001f
                        && Math.abs(player.position.x - 6.5f) < 0.001f,
                String.format("drift=%.5f", player.position.y - startY));
    }

    private static void checkWall(World world) {
        int ground = buildPlatform(world, 8, 8, 6);
        for (int dz = -2; dz <= 2; dz++) {
            for (int dy = 1; dy <= 3; dy++) {
                world.setBlock(10, ground + dy, 8 + dz, Blocks.STONE.id);
            }
        }
        Player player = new Player(8.5f, ground + 1, 8.5f);
        simulate(world, player, 180, 1 / 60f, 1, 0, false);

        check("walking into a wall stops flush against it",
                Math.abs(player.position.x - (10 - Player.WIDTH / 2)) < 0.01f,
                String.format("x=%.3f", player.position.x));
    }

    /**
     * Full blocks are not auto-stepped, exactly as in Minecraft. This also guards the
     * push-out clamp: before it existed, walking into a block launched the player on top of it.
     */
    private static void checkStepNeedsJump(World world) {
        int ground = buildPlatform(world, 20, 20, 16);
        for (int dz = -2; dz <= 2; dz++) {
            world.setBlock(24, ground + 1, 20 + dz, Blocks.STONE.id);
        }

        Player walker = new Player(20.5f, ground + 1, 20.5f);
        simulate(world, walker, 120, 1 / 60f, 1, 0, false);
        check("walking into a one-block step is blocked",
                walker.position.y < ground + 2 && walker.position.x < 24,
                String.format("x=%.3f y=%.3f", walker.position.x, walker.position.y));

        Player jumper = new Player(20.5f, ground + 1, 20.5f);
        simulate(world, jumper, 240, 1 / 60f, 1, 0, true);
        check("jumping clears a one-block step",
                jumper.position.y >= ground + 2 - 0.01f && jumper.position.x > 24,
                String.format("x=%.3f y=%.3f", jumper.position.x, jumper.position.y));
    }

    private static void checkFrameRateIndependence(World world) {
        int ground = buildPlatform(world, 40, 40, 16);

        Player slow = new Player(40.5f, ground + 1, 40.5f);
        simulate(world, slow, 120, 1 / 60f, 1, 0, false);
        Player fast = new Player(40.5f, ground + 1, 40.5f);
        simulate(world, fast, 240, 1 / 120f, 1, 0, false);

        check("60 fps and 120 fps cover the same ground",
                Math.abs(slow.position.x - fast.position.x) < 0.15f,
                String.format("60fps=%.3f 120fps=%.3f", slow.position.x, fast.position.x));
        check("walking speed is about 4.3 blocks per second",
                Math.abs(slow.horizontalSpeed() - 4.3f) < 0.3f,
                String.format("%.3f", slow.horizontalSpeed()));
    }

    // ------------------------------------------------------- lighting and interaction

    /**
     * Exercises the incremental relight, which is the hardest thing in the project to get
     * right and the easiest to get subtly wrong. Digging a shaft has to let sunlight all the
     * way down at full strength; capping it again has to take that light back out, which needs
     * the two-phase removal rather than a simple re-flood.
     */
    private static void checkLightingAndInteraction(long seed) {
        System.out.println("Lighting and interaction:");
        World world = new World(seed);
        try {
            world.setRenderDistance(3);
            world.loadInitialArea(0, 0, 3);
            settleLighting(world);

            int surface = topSolid(world, 0, 0);
            check("chunks report themselves lit", world.getChunk(0, 0).isLit(), "");
            check("open sky above the surface is fully lit",
                    world.getLightEngine().getSkyLight(0, surface + 2, 0) == 15,
                    "level " + world.getLightEngine().getSkyLight(0, surface + 2, 0));

            // Dig four blocks straight down.
            for (int y = surface; y > surface - 4; y--) {
                world.setBlock(0, y, 0, Blocks.AIR.id);
            }
            int bottom = surface - 3;
            int litLevel = world.getLightEngine().getSkyLight(0, bottom, 0);
            check("sunlight reaches the bottom of a fresh shaft at full strength",
                    litLevel == 15, "level " + litLevel);
            // Sample relative to that column's own surface: neighbouring terrain is not
            // necessarily at the same height, so a fixed y could easily be open sky.
            int buriedY = topSolid(world, 3, 3) - 5;
            int buried = world.getLightEngine().getSkyLight(3, buriedY, 3);
            check("light does not leak sideways into solid rock", buried == 0, "level " + buried);

            // Cap it and the shaft must go dark again.
            world.setBlock(0, surface, 0, Blocks.STONE.id);
            int cappedLevel = world.getLightEngine().getSkyLight(0, bottom, 0);
            check("capping the shaft removes the light again",
                    cappedLevel == 0, "level " + cappedLevel);

            // Reopen it: the light has to come back, which only works if removal left the
            // surrounding sources intact rather than zeroing the whole column.
            world.setBlock(0, surface, 0, Blocks.AIR.id);
            check("reopening the shaft restores the light",
                    world.getLightEngine().getSkyLight(0, bottom, 0) == 15,
                    "level " + world.getLightEngine().getSkyLight(0, bottom, 0));

            checkBlockLight(world, surface);
            checkTargeting(world, surface);
        } finally {
            world.shutdown();
        }
    }

    private static void checkBlockLight(World world, int surface) {
        // Amethyst emits light; drop one at the bottom of a dark hole and check it glows.
        int x = 6;
        int z = 6;
        int top = topSolid(world, x, z);
        for (int y = top; y > top - 5; y--) {
            world.setBlock(x, y, z, Blocks.AIR.id);
        }
        world.setBlock(x, top + 1, z, Blocks.STONE.id);

        int floor = top - 4;
        world.setBlock(x, floor, z, Blocks.AMETHYST.id);

        // Sample the air directly above it. Opaque blocks never store light, so a cell inside
        // the surrounding rock would read zero however well the source was working.
        int above = world.getLightEngine().getBlockLight(x, floor + 1, z);
        check("an emissive block lights the air around it",
                above == Blocks.AMETHYST.lightEmission - 1,
                "level " + above + ", expected " + (Blocks.AMETHYST.lightEmission - 1));

        world.setBlock(x, floor, z, Blocks.AIR.id);
        check("removing the source removes its light",
                world.getLightEngine().getBlockLight(x, floor + 1, z) == 0,
                "level " + world.getLightEngine().getBlockLight(x, floor + 1, z));
    }

    private static void checkTargeting(World world, int surface) {
        int x = 10;
        int z = 10;
        int top = topSolid(world, x, z);
        for (int y = top + 1; y <= top + 6; y++) {
            world.setBlock(x, y, z, Blocks.AIR.id);
        }

        // Look straight down from above the block.
        org.joml.Vector3f eye = new org.joml.Vector3f(x + 0.5f, top + 4.5f, z + 0.5f);
        org.joml.Vector3f down = new org.joml.Vector3f(0, -1, 0);
        com.craft.entity.Raycast.Hit hit =
                com.craft.entity.Raycast.cast(world, eye, down, 8f, false);

        check("the crosshair finds the block below", hit != null
                        && hit.x == x && hit.y == top && hit.z == z,
                hit == null ? "no hit" : hit.x + "," + hit.y + "," + hit.z);
        check("and reports the face it entered through",
                hit != null && hit.face == com.craft.world.Direction.UP,
                hit == null ? "no hit" : String.valueOf(hit.face));
        check("so a placed block would land on top",
                hit != null && hit.placeY() == top + 1,
                hit == null ? "no hit" : String.valueOf(hit.placeY()));

        // Out of range must miss rather than reach through the world.
        check("a ray shorter than the gap hits nothing",
                com.craft.entity.Raycast.cast(world, eye, down, 2f, false) == null, "");
    }

    // ------------------------------------------------------- mining and building

    /** Drives the real breaking and placing code, the way a click would. */
    private static void checkBuilding(long seed) {
        System.out.println("Mining and building:");
        World world = new World(seed);
        try {
            world.setRenderDistance(3);
            world.loadInitialArea(0, 0, 3);
            settleLighting(world);

            int x = 12;
            int z = 12;
            int ground = topSolid(world, x, z);
            // Two separate columns, cleared and levelled: mining the same column twice would
            // drop the floor out of reach and the placement test would silently find no target.
            for (int column = 0; column <= 2; column += 2) {
                for (int y = ground + 1; y <= ground + 8; y++) {
                    world.setBlock(x + column, y, z, Blocks.AIR.id);
                }
                world.setBlock(x + column, ground, z, Blocks.SAND.id);
            }

            Interaction interaction = new Interaction();
            Inventory inventory = new Inventory();
            org.joml.Vector3f down = new org.joml.Vector3f(0, -1, 0);

            // Stand just above the target column and look straight down at it.
            Player player = new Player(x + 0.5f, ground + 1, z + 0.5f);
            BlockType original = world.getBlock(x, ground, z);

            // Survival: one frame of holding the button must not break it instantly...
            interaction.update(world, player, down, inventory, GameMode.SURVIVAL,
                    true, false, false, 1 / 60f);
            check("mining takes time in survival",
                    world.getBlockId(x, ground, z) == original.id
                            && interaction.getBreakProgress() > 0,
                    String.format("progress %.3f", interaction.getBreakProgress()));

            // ...but holding it long enough does, and the block goes into the inventory.
            for (int i = 0; i < 240 && world.getBlockId(x, ground, z) == original.id; i++) {
                interaction.update(world, player, down, inventory, GameMode.SURVIVAL,
                        true, false, false, 1 / 60f);
            }
            check("holding the button eventually breaks the block",
                    world.getBlock(x, ground, z).isAir(), "");
            check("the broken block goes into the inventory",
                    inventory.slot(0).type == original && inventory.slot(0).count == 1,
                    inventory.slot(0).isEmpty() ? "empty" : inventory.slot(0).type.name);

            // Creative breaks in a single frame, in the other column.
            Player creativePlayer = new Player(x + 2.5f, ground + 1, z + 0.5f);
            interaction.update(world, creativePlayer, down, inventory, GameMode.CREATIVE,
                    true, false, false, 1 / 60f);
            check("creative breaks in one click",
                    world.getBlock(x + 2, ground, z).isAir(), "");

            // Place a block back into the hole just mined; the stack should shrink by one.
            inventory.setSlot(0, Blocks.COBBLESTONE, 5);
            inventory.setSelected(0);
            interaction.update(world, player, down, inventory, GameMode.SURVIVAL,
                    false, true, false, 1 / 60f);
            check("placing puts the block in the world and spends one",
                    world.getBlock(x, ground, z) == Blocks.COBBLESTONE
                            && inventory.slot(0).count == 4,
                    world.getBlock(x, ground, z).name + ", count " + inventory.slot(0).count);

            // Looking up at a low ceiling, the block would land in the player's own space.
            // The ceiling has to sit at head height for that: a player standing at ground+1 is
            // 1.8 tall, so a block two above them is legitimately clear of their head.
            world.setBlock(x, ground + 3, z, Blocks.STONE.id);
            Player standing = new Player(x + 0.5f, ground + 1, z + 0.5f);
            org.joml.Vector3f up = new org.joml.Vector3f(0, 1, 0);
            int before = inventory.slot(0).count;
            interaction.update(world, standing, up, inventory, GameMode.SURVIVAL,
                    false, true, false, 1 / 60f);
            check("nothing is placed inside the player",
                    world.getBlock(x, ground + 2, z).isAir()
                            && inventory.slot(0).count == before,
                    world.getBlock(x, ground + 2, z).name + ", count "
                            + inventory.slot(0).count);
        } finally {
            world.shutdown();
        }
    }

    // ------------------------------------------------------------------------ saving

    /**
     * A full save and reload. The design claim under test is that only edited chunks are
     * written: everything else must come back byte-identical from the seed, so the saved
     * folder stays small and a world is still correct after being regenerated around the
     * player's changes.
     */
    private static void checkPersistence(long seed) {
        System.out.println("Saving and loading:");
        String folder = "selfcheck-temp";
        WorldStore.delete(folder);
        WorldStore store = new WorldStore(folder);

        int[][] edits;
        byte[] untouchedBefore;

        World first = new World(seed);
        try {
            first.setRenderDistance(3);
            first.setChunkLoader(store::loadChunk);
            first.loadInitialArea(0, 0, 2);

            int surface = topSolid(first, 5, 5);
            edits = new int[][]{
                    {5, surface, 5, Blocks.AIR.id},
                    {5, surface + 1, 5, Blocks.GLASS.id},
                    {5, surface + 2, 5, Blocks.AMETHYST.id},
                    {6, surface + 1, 5, Blocks.OAK_PLANKS.id},
                    // A chunk away, to prove more than one chunk file is handled.
                    {20, topSolid(first, 20, 20) + 1, 20, Blocks.STONE_BRICKS.id},
            };
            for (int[] edit : edits) {
                first.setBlock(edit[0], edit[1], edit[2], edit[3]);
            }

            Chunk untouched = first.getChunk(-2, -2);
            untouchedBefore = untouched.blockArray().clone();
            check("an untouched chunk is not marked as modified", !untouched.isModified(), "");

            WorldStore.LevelState state = new WorldStore.LevelState();
            state.name = folder;
            state.seed = seed;
            state.mode = GameMode.CREATIVE;
            state.timeOfDay = 0.42f;
            state.playerX = 5.5f;
            state.playerY = surface + 3;
            state.playerZ = 5.5f;
            state.yaw = 123.5f;
            state.pitch = -12.25f;
            state.health = 13;
            state.inventory.setSlot(0, Blocks.DIAMOND_ORE, 7);
            state.inventory.setSlot(4, Blocks.GLASS, 64);
            state.inventory.setSelected(4);
            store.saveLevel(state);

            int savedChunks = store.saveAllChunks(first);
            check("only edited chunks are written", savedChunks == 2,
                    savedChunks + " chunk files for " + first.loadedChunkCount()
                            + " loaded chunks");
        } finally {
            first.shutdown();
        }

        // Reload from scratch, exactly as a restart would.
        World second = new World(seed);
        try {
            second.setRenderDistance(3);
            second.setChunkLoader(store::loadChunk);
            second.loadInitialArea(0, 0, 2);

            boolean editsRestored = true;
            for (int[] edit : edits) {
                if (second.getBlockId(edit[0], edit[1], edit[2]) != edit[3]) {
                    editsRestored = false;
                }
            }
            check("every edited block comes back", editsRestored, "");

            check("untouched terrain regenerates identically",
                    Arrays.equals(untouchedBefore, second.getChunk(-2, -2).blockArray()), "");

            WorldStore.LevelState loaded = store.loadLevel();
            boolean playerOk = Math.abs(loaded.playerX - 5.5f) < 0.001f
                    && Math.abs(loaded.yaw - 123.5f) < 0.01f
                    && Math.abs(loaded.pitch + 12.25f) < 0.01f;
            check("player position and view are restored", playerOk,
                    String.format("x=%.2f yaw=%.2f pitch=%.2f",
                            loaded.playerX, loaded.yaw, loaded.pitch));
            check("mode, health and clock are restored",
                    loaded.mode == GameMode.CREATIVE && loaded.health == 13
                            && Math.abs(loaded.timeOfDay - 0.42f) < 0.001f,
                    loaded.mode + ", health " + loaded.health + ", t=" + loaded.timeOfDay);
            check("inventory is restored",
                    loaded.inventory.slot(0).type == Blocks.DIAMOND_ORE
                            && loaded.inventory.slot(0).count == 7
                            && loaded.inventory.slot(4).count == 64
                            && loaded.inventory.getSelected() == 4, "");

            check("level.json is human readable",
                    Files.readString(store.getDirectory().resolve("level.json"))
                            .contains("\"seed\""), "");
        } catch (IOException e) {
            check("level.json is readable", false, e.getMessage());
        } finally {
            second.shutdown();
        }

        WorldStore.delete(folder);
        check("a deleted world leaves nothing behind",
                !Files.exists(Path.of("saves", folder)), "");
    }

    private static void settleLighting(World world) {
        for (int i = 0; i < 400; i++) {
            world.update(0, 0);
            if (world.chunksAwaitingLight() == 0 && world.pendingChunkCount() == 0 && i > 8) {
                return;
            }
        }
    }

    private static int topSolid(World world, int x, int z) {
        for (int y = Chunk.HEIGHT - 2; y > 1; y--) {
            if (world.getBlock(x, y, z).opaque) {
                return y;
            }
        }
        return 0;
    }

    private static void checkNoTunnelling(World world) {
        int ground = groundAt(world, 60, 60);
        Player player = new Player(60.5f, 125, 60.5f);
        // 20 fps: each step is far enough to skip a block if collision were a point test.
        simulate(world, player, 400, 1 / 20f, 0, 0, false);

        check("a fall at 20 fps does not tunnel through the ground",
                player.isOnGround() && player.position.y > ground,
                String.format("y=%.3f, ground %d", player.position.y, ground));
    }
}
