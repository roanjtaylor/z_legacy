package com.craft.world;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * The loaded world: a map of chunks around the player, generated on worker threads and handed
 * to the main thread as they finish.
 *
 * <p>Generation is a pure function of the seed, so workers never touch shared state. Player
 * edits happen on the main thread only. A mesher on a worker may therefore read a chunk while
 * it is being edited; that is resolved by chunk version numbers rather than locking, so a stale
 * mesh is detected and rebuilt instead of being displayed.
 */
public class World {

    private static final int MAX_GENERATION_REQUESTS_PER_TICK = 6;
    /** How far past the render distance a chunk survives before being unloaded. */
    private static final int UNLOAD_MARGIN = 2;
    /** Chunks lit per frame. Lighting is main-thread work, so this bounds the frame cost. */
    private static final int MAX_LIGHTING_PER_TICK = 3;

    private final WorldGen generator;
    private final Map<Long, Chunk> chunks = new ConcurrentHashMap<>();
    private final Set<Long> pending = ConcurrentHashMap.newKeySet();
    private final ConcurrentLinkedQueue<Chunk> finished = new ConcurrentLinkedQueue<>();
    private final java.util.ArrayDeque<Chunk> awaitingLight = new java.util.ArrayDeque<>();
    private final LightEngine lightEngine;
    private final ExecutorService workers;

    private int renderDistance = 8;
    private volatile boolean shuttingDown;

    /** Called when a chunk is unloaded, so persistence can save it if it was edited. */
    private java.util.function.Consumer<Chunk> unloadListener = chunk -> { };

    /** Supplies chunks restored from disk; returns null if the chunk was never saved. */
    private java.util.function.BiFunction<Integer, Integer, Chunk> chunkLoader = (x, z) -> null;

    public World(long seed) {
        this.generator = new WorldGen(seed);
        this.lightEngine = new LightEngine(this);

        int threads = Math.max(2, Math.min(6, Runtime.getRuntime().availableProcessors() - 1));
        this.workers = Executors.newFixedThreadPool(threads, runnable -> {
            Thread thread = new Thread(runnable, "chunk-worker");
            thread.setDaemon(true);
            return thread;
        });
    }

    public WorldGen getGenerator() {
        return generator;
    }

    public long getSeed() {
        return generator.getSeed();
    }

    public static long key(int chunkX, int chunkZ) {
        return ((long) chunkX << 32) | (chunkZ & 0xFFFFFFFFL);
    }

    public static int chunkOf(int worldCoordinate) {
        return worldCoordinate >> 4;
    }

    public static int localOf(int worldCoordinate) {
        return worldCoordinate & 15;
    }

    public void setUnloadListener(java.util.function.Consumer<Chunk> listener) {
        this.unloadListener = listener;
    }

    public void setChunkLoader(java.util.function.BiFunction<Integer, Integer, Chunk> loader) {
        this.chunkLoader = loader;
    }

    // ------------------------------------------------------------------- block access

    public Chunk getChunk(int chunkX, int chunkZ) {
        return chunks.get(key(chunkX, chunkZ));
    }

    public boolean isLoaded(int chunkX, int chunkZ) {
        return chunks.containsKey(key(chunkX, chunkZ));
    }

    /** All four horizontal neighbours present, which meshing needs for its border faces. */
    public boolean hasMeshNeighbours(int chunkX, int chunkZ) {
        return isLoaded(chunkX - 1, chunkZ) && isLoaded(chunkX + 1, chunkZ)
                && isLoaded(chunkX, chunkZ - 1) && isLoaded(chunkX, chunkZ + 1);
    }

    /** Reads across chunk borders. Unloaded or out-of-range positions read as air. */
    public int getBlockId(int x, int y, int z) {
        if (y < 0 || y >= Chunk.HEIGHT) {
            return Blocks.AIR.id;
        }
        Chunk chunk = getChunk(chunkOf(x), chunkOf(z));
        return chunk == null ? Blocks.AIR.id : chunk.getBlockId(localOf(x), y, localOf(z));
    }

    public BlockType getBlock(int x, int y, int z) {
        return Blocks.byId(getBlockId(x, y, z));
    }

    /**
     * Writes a block and invalidates every mesh that could have drawn it. Edits on a chunk
     * border also touch the neighbour, whose own version would not otherwise change.
     */
    public boolean setBlock(int x, int y, int z, int id) {
        if (y < 0 || y >= Chunk.HEIGHT) {
            return false;
        }
        Chunk chunk = getChunk(chunkOf(x), chunkOf(z));
        if (chunk == null) {
            return false;
        }

        int localX = localOf(x);
        int localZ = localOf(z);
        chunk.setBlock(localX, y, localZ, id);

        int height = chunk.getHeight(localX, localZ);
        if (!Blocks.byId(id).isAir()) {
            if (y + 1 > height) {
                chunk.updateHeight(localX, localZ, y + 1);
            }
        } else if (y + 1 == height) {
            int scan = y;
            while (scan >= 0 && chunk.getBlock(localX, scan, localZ).isAir()) {
                scan--;
            }
            chunk.updateHeight(localX, localZ, scan + 1);
        }

        if (localX == 0) {
            bump(chunk.chunkX - 1, chunk.chunkZ);
        } else if (localX == Chunk.SIZE_X - 1) {
            bump(chunk.chunkX + 1, chunk.chunkZ);
        }
        if (localZ == 0) {
            bump(chunk.chunkX, chunk.chunkZ - 1);
        } else if (localZ == Chunk.SIZE_Z - 1) {
            bump(chunk.chunkX, chunk.chunkZ + 1);
        }

        // Relight after the write, not before: the engine reads the new block to decide
        // whether light should now flow through the cell or be blocked by it.
        if (chunk.isLit()) {
            lightEngine.onBlockChanged(x, y, z);
        }
        return true;
    }

    private void bump(int chunkX, int chunkZ) {
        Chunk neighbour = getChunk(chunkX, chunkZ);
        if (neighbour != null) {
            neighbour.bumpVersion();
        }
    }

    // ---------------------------------------------------------------------- streaming

    /**
     * Keeps the loaded set centred on the player: publishes finished chunks, requests missing
     * ones nearest-first, and drops chunks that have fallen out of range.
     *
     * @return the number of chunks published this tick
     */
    public int update(float playerX, float playerZ) {
        int published = drainFinished();
        int centreX = chunkOf((int) Math.floor(playerX));
        int centreZ = chunkOf((int) Math.floor(playerZ));

        processLighting();
        requestMissing(centreX, centreZ);
        unloadDistant(centreX, centreZ);
        return published;
    }

    private int drainFinished() {
        int published = 0;
        Chunk chunk;
        while ((chunk = finished.poll()) != null) {
            chunks.put(key(chunk.chunkX, chunk.chunkZ), chunk);
            pending.remove(key(chunk.chunkX, chunk.chunkZ));
            awaitingLight.add(chunk);
            published++;
        }
        return published;
    }

    /**
     * Lights a few newly published chunks. Kept on the main thread and rate limited: light
     * propagation writes into neighbouring chunks, so it cannot safely run alongside a worker
     * meshing those neighbours.
     */
    private void processLighting() {
        for (int i = 0; i < MAX_LIGHTING_PER_TICK && !awaitingLight.isEmpty(); i++) {
            Chunk chunk = awaitingLight.poll();
            // It may have been unloaded again while it sat in the queue.
            if (chunks.containsKey(key(chunk.chunkX, chunk.chunkZ))) {
                lightEngine.lightChunk(chunk);
            }
        }
    }

    public LightEngine getLightEngine() {
        return lightEngine;
    }

    public int chunksAwaitingLight() {
        return awaitingLight.size();
    }

    private void requestMissing(int centreX, int centreZ) {
        if (pending.size() >= MAX_GENERATION_REQUESTS_PER_TICK * 2) {
            return;
        }

        List<long[]> wanted = new ArrayList<>();
        for (int dx = -renderDistance; dx <= renderDistance; dx++) {
            for (int dz = -renderDistance; dz <= renderDistance; dz++) {
                // One ring beyond the render distance so edge chunks have the neighbours
                // meshing needs and nothing pops in with missing sides.
                if (dx * dx + dz * dz > (renderDistance + 1) * (renderDistance + 1)) {
                    continue;
                }
                int chunkX = centreX + dx;
                int chunkZ = centreZ + dz;
                long id = key(chunkX, chunkZ);
                if (chunks.containsKey(id) || pending.contains(id)) {
                    continue;
                }
                wanted.add(new long[]{dx * dx + dz * dz, chunkX, chunkZ});
            }
        }

        // Nearest first, so the ground under the player fills in before the horizon.
        wanted.sort(Comparator.comparingLong(entry -> entry[0]));

        int submitted = 0;
        for (long[] entry : wanted) {
            if (submitted >= MAX_GENERATION_REQUESTS_PER_TICK) {
                break;
            }
            int chunkX = (int) entry[1];
            int chunkZ = (int) entry[2];
            if (!pending.add(key(chunkX, chunkZ))) {
                continue;
            }
            submitted++;
            workers.submit(() -> {
                try {
                    Chunk loaded = chunkLoader.apply(chunkX, chunkZ);
                    if (loaded == null) {
                        loaded = new Chunk(chunkX, chunkZ);
                        generator.generate(loaded);
                    }
                    finished.add(loaded);
                } catch (Throwable t) {
                    pending.remove(key(chunkX, chunkZ));
                    System.err.println("Chunk generation failed at " + chunkX + "," + chunkZ);
                    t.printStackTrace();
                }
            });
        }
    }

    private void unloadDistant(int centreX, int centreZ) {
        int limit = renderDistance + UNLOAD_MARGIN;
        int limitSquared = limit * limit;

        chunks.values().removeIf(chunk -> {
            int dx = chunk.chunkX - centreX;
            int dz = chunk.chunkZ - centreZ;
            if (dx * dx + dz * dz <= limitSquared) {
                return false;
            }
            unloadListener.accept(chunk);
            return true;
        });
    }

    /** Blocks until enough chunks exist around a point for the player to stand on them. */
    public void loadInitialArea(int centreX, int centreZ, int radius) {
        List<java.util.concurrent.Future<?>> tasks = new ArrayList<>();
        for (int dx = -radius; dx <= radius; dx++) {
            for (int dz = -radius; dz <= radius; dz++) {
                int chunkX = centreX + dx;
                int chunkZ = centreZ + dz;
                if (!pending.add(key(chunkX, chunkZ))) {
                    continue;
                }
                tasks.add(workers.submit(() -> {
                    Chunk loaded = chunkLoader.apply(chunkX, chunkZ);
                    if (loaded == null) {
                        loaded = new Chunk(chunkX, chunkZ);
                        generator.generate(loaded);
                    }
                    finished.add(loaded);
                }));
            }
        }
        for (java.util.concurrent.Future<?> task : tasks) {
            try {
                task.get();
            } catch (Exception e) {
                System.err.println("Initial chunk load failed: " + e.getMessage());
            }
        }
        drainFinished();
    }

    public Iterable<Chunk> loadedChunks() {
        return chunks.values();
    }

    public int loadedChunkCount() {
        return chunks.size();
    }

    public int pendingChunkCount() {
        return pending.size();
    }

    public int getRenderDistance() {
        return renderDistance;
    }

    public void setRenderDistance(int renderDistance) {
        this.renderDistance = Math.max(2, Math.min(24, renderDistance));
    }

    public boolean isShuttingDown() {
        return shuttingDown;
    }

    public void shutdown() {
        shuttingDown = true;
        workers.shutdownNow();
        try {
            workers.awaitTermination(2, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
