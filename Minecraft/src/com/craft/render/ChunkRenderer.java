package com.craft.render;

import com.craft.mesh.BlockLayers;
import com.craft.mesh.ChunkMesher;
import com.craft.world.Chunk;
import com.craft.world.World;
import org.joml.FrustumIntersection;
import org.joml.Matrix4f;
import org.joml.Vector3f;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Owns one GPU mesh per loaded chunk and draws the visible ones.
 *
 * <p>Meshing happens on worker threads; the resulting vertex arrays are uploaded on the main
 * thread, because the GL context belongs to it alone. Uploads are capped per frame so a burst
 * of finished chunks cannot stall a frame.
 */
public class ChunkRenderer {

    private static final int MAX_UPLOADS_PER_FRAME = 4;
    private static final int MAX_QUEUED_MESH_JOBS = 12;

    private static final class ChunkMesh {
        Mesh opaque;
        Mesh translucent;
        int version = -1;

        void destroy() {
            if (opaque != null) {
                opaque.destroy();
            }
            if (translucent != null) {
                translucent.destroy();
            }
        }
    }

    private final Map<Long, ChunkMesh> meshes = new ConcurrentHashMap<>();
    private final Set<Long> inFlight = new HashSet<>();
    private final ConcurrentLinkedQueue<ChunkMesher.Result> completed = new ConcurrentLinkedQueue<>();
    private final ExecutorService workers;
    private final BlockLayers layers;

    private final FrustumIntersection frustum = new FrustumIntersection();
    private final Matrix4f viewProjection = new Matrix4f();
    private final Matrix4f model = new Matrix4f();

    private int visibleChunks;
    private int drawnTriangles;

    public ChunkRenderer(BlockLayers layers) {
        this.layers = layers;

        int threads = Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors() / 2));
        this.workers = Executors.newFixedThreadPool(threads, runnable -> {
            Thread thread = new Thread(runnable, "mesh-worker");
            thread.setDaemon(true);
            return thread;
        });
    }

    /** Queues rebuilds for stale chunks and uploads whatever finished since the last frame. */
    public void update(World world) {
        uploadCompleted();
        dropUnloadedChunks(world);
        queueRebuilds(world);
    }

    private void uploadCompleted() {
        for (int i = 0; i < MAX_UPLOADS_PER_FRAME; i++) {
            ChunkMesher.Result result = completed.poll();
            if (result == null) {
                return;
            }
            long key = World.key(result.chunkX, result.chunkZ);
            inFlight.remove(key);

            ChunkMesh mesh = meshes.computeIfAbsent(key, k -> new ChunkMesh());
            if (mesh.opaque != null) {
                mesh.opaque.destroy();
            }
            if (mesh.translucent != null) {
                mesh.translucent.destroy();
            }
            mesh.opaque = new Mesh(result.opaque, result.opaqueFloats);
            mesh.translucent = new Mesh(result.translucent, result.translucentFloats);
            mesh.version = result.version;
        }
    }

    private void dropUnloadedChunks(World world) {
        Iterator<Map.Entry<Long, ChunkMesh>> iterator = meshes.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<Long, ChunkMesh> entry = iterator.next();
            int chunkX = (int) (entry.getKey() >> 32);
            int chunkZ = entry.getKey().intValue();
            if (!world.isLoaded(chunkX, chunkZ)) {
                entry.getValue().destroy();
                iterator.remove();
            }
        }
    }

    private void queueRebuilds(World world) {
        if (inFlight.size() >= MAX_QUEUED_MESH_JOBS) {
            return;
        }

        for (Chunk chunk : world.loadedChunks()) {
            if (inFlight.size() >= MAX_QUEUED_MESH_JOBS) {
                return;
            }
            long key = World.key(chunk.chunkX, chunk.chunkZ);
            if (inFlight.contains(key)) {
                continue;
            }

            ChunkMesh existing = meshes.get(key);
            if (existing != null && existing.version == chunk.getVersion()) {
                continue;
            }
            // Meshing reads one block past every side, so wait for the neighbours rather than
            // baking faces against air that is about to become terrain. Waiting for light too
            // avoids building every chunk once pitch black and again a frame later.
            if (!chunk.isLit() || !world.hasMeshNeighbours(chunk.chunkX, chunk.chunkZ)) {
                continue;
            }

            inFlight.add(key);
            workers.submit(() -> {
                try {
                    completed.add(ChunkMesher.build(world, chunk, layers));
                } catch (Throwable t) {
                    System.err.println("Meshing failed for chunk "
                            + chunk.chunkX + "," + chunk.chunkZ);
                    t.printStackTrace();
                    completed.add(new ChunkMesher.Result(chunk.chunkX, chunk.chunkZ,
                            chunk.getVersion(), new float[0], 0, new float[0], 0));
                }
            });
        }
    }

    /**
     * Draws the world in two passes: opaque and cutout geometry front-to-back so the depth
     * buffer rejects hidden fragments early, then water back-to-front with blending, which is
     * the only order that composites overlapping transparent surfaces correctly.
     */
    public void render(Shader shader, Camera camera, Matrix4f projection, Matrix4f view) {
        viewProjection.set(projection).mul(view);
        frustum.set(viewProjection);

        List<long[]> visible = collectVisible(camera.position);
        visibleChunks = visible.size();
        drawnTriangles = 0;

        // Front to back.
        visible.sort((a, b) -> Long.compare(a[2], b[2]));
        for (long[] entry : visible) {
            ChunkMesh mesh = meshes.get(World.key((int) entry[0], (int) entry[1]));
            if (mesh == null || mesh.opaque == null || mesh.opaque.isEmpty()) {
                continue;
            }
            shader.setMatrix4("uModel", model.identity()
                    .translate(entry[0] * Chunk.SIZE_X, 0, entry[1] * Chunk.SIZE_Z));
            mesh.opaque.render();
            drawnTriangles += mesh.opaque.getVertexCount() / 3;
        }

        org.lwjgl.opengl.GL33.glEnable(org.lwjgl.opengl.GL33.GL_BLEND);
        org.lwjgl.opengl.GL33.glBlendFunc(org.lwjgl.opengl.GL33.GL_SRC_ALPHA,
                org.lwjgl.opengl.GL33.GL_ONE_MINUS_SRC_ALPHA);
        org.lwjgl.opengl.GL33.glDepthMask(false);
        shader.setFloat("uAlphaCutoff", 0f);

        // Back to front.
        visible.sort((a, b) -> Long.compare(b[2], a[2]));
        for (long[] entry : visible) {
            ChunkMesh mesh = meshes.get(World.key((int) entry[0], (int) entry[1]));
            if (mesh == null || mesh.translucent == null || mesh.translucent.isEmpty()) {
                continue;
            }
            shader.setMatrix4("uModel", model.identity()
                    .translate(entry[0] * Chunk.SIZE_X, 0, entry[1] * Chunk.SIZE_Z));
            mesh.translucent.render();
            drawnTriangles += mesh.translucent.getVertexCount() / 3;
        }

        org.lwjgl.opengl.GL33.glDepthMask(true);
        org.lwjgl.opengl.GL33.glDisable(org.lwjgl.opengl.GL33.GL_BLEND);
    }

    /** Chunk coordinates that survive frustum culling, tagged with squared distance. */
    private List<long[]> collectVisible(Vector3f eye) {
        List<long[]> visible = new ArrayList<>(meshes.size());

        for (Long key : meshes.keySet()) {
            int chunkX = (int) (key >> 32);
            int chunkZ = key.intValue();

            float minX = chunkX * Chunk.SIZE_X;
            float minZ = chunkZ * Chunk.SIZE_Z;
            if (!frustum.testAab(minX, 0, minZ,
                    minX + Chunk.SIZE_X, Chunk.HEIGHT, minZ + Chunk.SIZE_Z)) {
                continue;
            }

            float centreX = minX + Chunk.SIZE_X * 0.5f;
            float centreZ = minZ + Chunk.SIZE_Z * 0.5f;
            float dx = centreX - eye.x;
            float dz = centreZ - eye.z;
            visible.add(new long[]{chunkX, chunkZ, (long) (dx * dx + dz * dz)});
        }
        return visible;
    }

    public int getVisibleChunks() {
        return visibleChunks;
    }

    public int getDrawnTriangles() {
        return drawnTriangles;
    }

    public int getPendingMeshJobs() {
        return inFlight.size();
    }

    /**
     * Drops every mesh, for when the world underneath them is being replaced. Results already
     * in flight are discarded rather than uploaded against the new world's chunks.
     */
    public void clear() {
        completed.clear();
        inFlight.clear();
        for (ChunkMesh mesh : meshes.values()) {
            mesh.destroy();
        }
        meshes.clear();
    }

    public void destroy() {
        workers.shutdownNow();
        try {
            workers.awaitTermination(2, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        for (ChunkMesh mesh : meshes.values()) {
            mesh.destroy();
        }
        meshes.clear();
    }
}
