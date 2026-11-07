package com.craft.world;

import java.util.HashSet;
import java.util.Set;

/**
 * Flood-fill lighting, in two independent channels.
 *
 * <p><b>Sky light</b> falls from the top of the world. It passes straight down through clear
 * blocks at full strength — that is what makes a shaft or a cave mouth stay bright all the way
 * down — and spreads sideways losing a level per step, which is what puts a soft gradient under
 * an overhang. <b>Block light</b> radiates from emissive blocks and behaves the same way minus
 * the vertical special case.
 *
 * <p>The two are kept apart all the way to the fragment shader, because only sky light should
 * dim at night: a torch has to stay lit at midnight.
 *
 * <p>Everything here runs on the main thread. Propagation crosses chunk borders freely, so it
 * writes to chunks other than the one it was asked about, and letting a worker do that while
 * another thread meshed the neighbour would be a genuine race. Chunks whose light changed get
 * their version bumped, which is what schedules the mesh rebuild.
 */
public class LightEngine {

    private static final int MAX_LEVEL = 15;

    private final World world;

    private final IntQueue skyQueue = new IntQueue();
    private final IntQueue blockQueue = new IntQueue();
    private final Set<Long> touched = new HashSet<>();

    public LightEngine(World world) {
        this.world = world;
    }

    /** A growable FIFO of packed int tuples; avoids boxing millions of coordinates. */
    private static final class IntQueue {
        private int[] data = new int[8192];
        private int head;
        private int tail;

        void push(int value) {
            if (tail == data.length) {
                if (head > data.length / 2) {
                    System.arraycopy(data, head, data, 0, tail - head);
                    tail -= head;
                    head = 0;
                } else {
                    int[] grown = new int[data.length * 2];
                    System.arraycopy(data, 0, grown, 0, tail);
                    data = grown;
                }
            }
            data[tail++] = value;
        }

        void push(int a, int b, int c) {
            push(a);
            push(b);
            push(c);
        }

        void push(int a, int b, int c, int d) {
            push(a);
            push(b);
            push(c);
            push(d);
        }

        int pop() {
            return data[head++];
        }

        boolean isEmpty() {
            return head == tail;
        }

        void clear() {
            head = 0;
            tail = 0;
        }
    }

    // ------------------------------------------------------------------ initial light

    /**
     * Computes a freshly generated chunk's light from scratch.
     *
     * <p>Also re-seeds the four neighbours' border columns. Without that, an existing chunk's
     * light would have no way to spread into the new one — it is already at its final value, so
     * nothing would enqueue it — and every chunk border would show as a dark seam.
     */
    public void lightChunk(Chunk chunk) {
        chunk.clearLight();
        touched.clear();
        touched.add(World.key(chunk.chunkX, chunk.chunkZ));

        seedSkyColumns(chunk);
        seedBlockSources(chunk);
        seedNeighbourBorders(chunk);

        propagateSky();
        propagateBlock();

        chunk.setLit(true);
        flushTouched();
    }

    /**
     * Drops sunlight down each column. A block that does not attenuate at all leaves the beam
     * at full strength; anything else dims it, and an opaque block ends it.
     */
    private void seedSkyColumns(Chunk chunk) {
        int originX = chunk.originX();
        int originZ = chunk.originZ();

        for (int x = 0; x < Chunk.SIZE_X; x++) {
            for (int z = 0; z < Chunk.SIZE_Z; z++) {
                int level = MAX_LEVEL;
                for (int y = Chunk.HEIGHT - 1; y >= 0; y--) {
                    BlockType type = chunk.getBlock(x, y, z);
                    if (type.opaque) {
                        level = 0;
                    } else if (type.lightAttenuation > 0) {
                        level = Math.max(0, level - type.lightAttenuation);
                    }

                    if (level == 0) {
                        // Nothing below this can be lit from directly above, but it may still
                        // be reached sideways, so keep scanning rather than breaking out.
                        continue;
                    }
                    chunk.setSkyLight(x, y, z, level);
                    skyQueue.push(originX + x, y, originZ + z);
                }
            }
        }
    }

    private void seedBlockSources(Chunk chunk) {
        int originX = chunk.originX();
        int originZ = chunk.originZ();

        for (int y = 0; y < Chunk.HEIGHT; y++) {
            for (int z = 0; z < Chunk.SIZE_Z; z++) {
                for (int x = 0; x < Chunk.SIZE_X; x++) {
                    BlockType type = chunk.getBlock(x, y, z);
                    if (type.lightEmission > 0) {
                        chunk.setBlockLight(x, y, z, type.lightEmission);
                        blockQueue.push(originX + x, y, originZ + z);
                    }
                }
            }
        }
    }

    /** Enqueues the neighbours' lit border columns so their light can flow into the new chunk. */
    private void seedNeighbourBorders(Chunk chunk) {
        for (Direction direction : new Direction[]{
                Direction.WEST, Direction.EAST, Direction.NORTH, Direction.SOUTH}) {
            Chunk neighbour = world.getChunk(chunk.chunkX + direction.dx, chunk.chunkZ + direction.dz);
            if (neighbour == null || !neighbour.isLit()) {
                continue;
            }

            // The column of the neighbour that touches this chunk.
            int fixedX = direction.dx == 0 ? -1 : (direction.dx > 0 ? 0 : Chunk.SIZE_X - 1);
            int fixedZ = direction.dz == 0 ? -1 : (direction.dz > 0 ? 0 : Chunk.SIZE_Z - 1);

            for (int y = 0; y < Chunk.HEIGHT; y++) {
                for (int i = 0; i < Chunk.SIZE_X; i++) {
                    int localX = fixedX >= 0 ? fixedX : i;
                    int localZ = fixedZ >= 0 ? fixedZ : i;
                    int worldX = neighbour.originX() + localX;
                    int worldZ = neighbour.originZ() + localZ;

                    if (neighbour.getSkyLight(localX, y, localZ) > 1) {
                        skyQueue.push(worldX, y, worldZ);
                    }
                    if (neighbour.getBlockLight(localX, y, localZ) > 1) {
                        blockQueue.push(worldX, y, worldZ);
                    }
                }
            }
        }
    }

    // ----------------------------------------------------------------- propagation

    private void propagateSky() {
        while (!skyQueue.isEmpty()) {
            int x = skyQueue.pop();
            int y = skyQueue.pop();
            int z = skyQueue.pop();
            int level = getSkyLight(x, y, z);
            if (level <= 1) {
                continue;
            }

            for (Direction direction : Direction.VALUES) {
                int nx = x + direction.dx;
                int ny = y + direction.dy;
                int nz = z + direction.dz;
                if (ny < 0 || ny >= Chunk.HEIGHT) {
                    continue;
                }

                Chunk chunk = world.getChunk(nx >> 4, nz >> 4);
                if (chunk == null) {
                    continue;
                }
                BlockType type = Blocks.byId(chunk.getBlockId(nx & 15, ny, nz & 15));
                if (type.opaque) {
                    continue;
                }

                // Sunlight going straight down through perfectly clear air does not weaken;
                // this is what keeps the bottom of a deep shaft as bright as the surface.
                int next = (direction == Direction.DOWN && level == MAX_LEVEL
                        && type.lightAttenuation == 0)
                        ? MAX_LEVEL
                        : level - 1 - type.lightAttenuation;

                if (next <= 0 || chunk.getSkyLight(nx & 15, ny, nz & 15) >= next) {
                    continue;
                }
                chunk.setSkyLight(nx & 15, ny, nz & 15, next);
                touched.add(World.key(chunk.chunkX, chunk.chunkZ));
                skyQueue.push(nx, ny, nz);
            }
        }
    }

    private void propagateBlock() {
        while (!blockQueue.isEmpty()) {
            int x = blockQueue.pop();
            int y = blockQueue.pop();
            int z = blockQueue.pop();
            int level = getBlockLight(x, y, z);
            if (level <= 1) {
                continue;
            }

            for (Direction direction : Direction.VALUES) {
                int nx = x + direction.dx;
                int ny = y + direction.dy;
                int nz = z + direction.dz;
                if (ny < 0 || ny >= Chunk.HEIGHT) {
                    continue;
                }

                Chunk chunk = world.getChunk(nx >> 4, nz >> 4);
                if (chunk == null) {
                    continue;
                }
                BlockType type = Blocks.byId(chunk.getBlockId(nx & 15, ny, nz & 15));
                if (type.opaque) {
                    continue;
                }

                int next = level - 1 - type.lightAttenuation;
                if (next <= 0 || chunk.getBlockLight(nx & 15, ny, nz & 15) >= next) {
                    continue;
                }
                chunk.setBlockLight(nx & 15, ny, nz & 15, next);
                touched.add(World.key(chunk.chunkX, chunk.chunkZ));
                blockQueue.push(nx, ny, nz);
            }
        }
    }

    // ---------------------------------------------------------------- incremental edit

    /**
     * Updates lighting after a single block changed.
     *
     * <p>Adding light is easy: seed the new value and flood outward. Removing it is not, because
     * a darkened cell's neighbours may have been lit <em>by</em> it or by something else
     * entirely, and there is no record of which. The standard answer, used here, is a two-phase
     * pass: walk outward zeroing every cell that was dimmer than the light it came from (so it
     * must have been descended from the removed source), while collecting any cell that was
     * brighter (so it has an independent source), then re-flood from those survivors.
     */
    public void onBlockChanged(int x, int y, int z) {
        touched.clear();
        skyQueue.clear();
        blockQueue.clear();

        Chunk chunk = world.getChunk(x >> 4, z >> 4);
        if (chunk == null) {
            return;
        }
        touched.add(World.key(chunk.chunkX, chunk.chunkZ));

        BlockType type = Blocks.byId(chunk.getBlockId(x & 15, y, z & 15));

        removeLight(x, y, z, true);
        removeLight(x, y, z, false);

        if (type.opaque) {
            chunk.setSkyLight(x & 15, y, z & 15, 0);
            chunk.setBlockLight(x & 15, y, z & 15, 0);
        } else {
            // The cell is passable again: let every lit neighbour flow back into it.
            for (Direction direction : Direction.VALUES) {
                int nx = x + direction.dx;
                int ny = y + direction.dy;
                int nz = z + direction.dz;
                if (ny < 0 || ny >= Chunk.HEIGHT) {
                    continue;
                }
                if (getSkyLight(nx, ny, nz) > 0) {
                    skyQueue.push(nx, ny, nz);
                }
                if (getBlockLight(nx, ny, nz) > 0) {
                    blockQueue.push(nx, ny, nz);
                }
            }
            // Sky above an unobstructed column reaches this cell directly.
            if (y + 1 >= Chunk.HEIGHT || getSkyLight(x, y + 1, z) == MAX_LEVEL) {
                chunk.setSkyLight(x & 15, y, z & 15,
                        Math.max(0, MAX_LEVEL - type.lightAttenuation));
                skyQueue.push(x, y, z);
            }
        }

        if (type.lightEmission > 0) {
            chunk.setBlockLight(x & 15, y, z & 15, type.lightEmission);
            blockQueue.push(x, y, z);
        }

        propagateSky();
        propagateBlock();
        flushTouched();
    }

    /** Phase one of a blockQueue: darken everything descended from this cell, collect the rest. */
    private void removeLight(int startX, int startY, int startZ, boolean skyChannel) {
        int startLevel = skyChannel
                ? getSkyLight(startX, startY, startZ)
                : getBlockLight(startX, startY, startZ);
        if (startLevel == 0) {
            return;
        }

        IntQueue pending = new IntQueue();
        pending.push(startX, startY, startZ, startLevel);
        setLight(startX, startY, startZ, 0, skyChannel);

        while (!pending.isEmpty()) {
            int x = pending.pop();
            int y = pending.pop();
            int z = pending.pop();
            int level = pending.pop();

            for (Direction direction : Direction.VALUES) {
                int nx = x + direction.dx;
                int ny = y + direction.dy;
                int nz = z + direction.dz;
                if (ny < 0 || ny >= Chunk.HEIGHT) {
                    continue;
                }
                Chunk chunk = world.getChunk(nx >> 4, nz >> 4);
                if (chunk == null) {
                    continue;
                }

                int neighbourLevel = skyChannel
                        ? chunk.getSkyLight(nx & 15, ny, nz & 15)
                        : chunk.getBlockLight(nx & 15, ny, nz & 15);
                if (neighbourLevel == 0) {
                    continue;
                }

                // A vertical column of full-strength sunlight is not "descended from" the cell
                // above in the usual sense — it is equal to it — so it must be torn down too.
                boolean descended = neighbourLevel < level
                        || (skyChannel && direction == Direction.DOWN
                        && neighbourLevel == MAX_LEVEL && level == MAX_LEVEL);

                if (descended) {
                    setLight(nx, ny, nz, 0, skyChannel);
                    touched.add(World.key(chunk.chunkX, chunk.chunkZ));
                    pending.push(nx, ny, nz, neighbourLevel);
                } else {
                    // Brighter than us, so it has its own source: it will re-light the hole.
                    if (skyChannel) {
                        skyQueue.push(nx, ny, nz);
                    } else {
                        blockQueue.push(nx, ny, nz);
                    }
                }
            }
        }
    }

    // ------------------------------------------------------------------------ helpers

    private void flushTouched() {
        for (Long key : touched) {
            Chunk chunk = world.getChunk((int) (key >> 32), key.intValue());
            if (chunk != null) {
                chunk.bumpVersion();
            }
        }
        touched.clear();
    }

    private void setLight(int x, int y, int z, int level, boolean skyChannel) {
        Chunk chunk = world.getChunk(x >> 4, z >> 4);
        if (chunk == null) {
            return;
        }
        if (skyChannel) {
            chunk.setSkyLight(x & 15, y, z & 15, level);
        } else {
            chunk.setBlockLight(x & 15, y, z & 15, level);
        }
        touched.add(World.key(chunk.chunkX, chunk.chunkZ));
    }

    public int getSkyLight(int x, int y, int z) {
        if (y < 0) {
            return 0;
        }
        if (y >= Chunk.HEIGHT) {
            return MAX_LEVEL;
        }
        Chunk chunk = world.getChunk(x >> 4, z >> 4);
        return chunk == null ? 0 : chunk.getSkyLight(x & 15, y, z & 15);
    }

    public int getBlockLight(int x, int y, int z) {
        if (y < 0 || y >= Chunk.HEIGHT) {
            return 0;
        }
        Chunk chunk = world.getChunk(x >> 4, z >> 4);
        return chunk == null ? 0 : chunk.getBlockLight(x & 15, y, z & 15);
    }
}
