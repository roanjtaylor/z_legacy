package com.craft.mesh;

import com.craft.render.Mesh;
import com.craft.world.BlockType;
import com.craft.world.Blocks;
import com.craft.world.Chunk;
import com.craft.world.Direction;
import com.craft.world.World;

import java.util.Arrays;

/**
 * Turns a chunk into vertex data.
 *
 * <p>Runs on worker threads. Vertices are emitted in chunk-local space and positioned by a
 * per-chunk model matrix, which keeps coordinates small and floating point precise however far
 * out you walk.
 *
 * <p>Two buffers come out: opaque geometry (including alpha-tested cutouts like leaves and
 * flowers, which belong with the opaque pass because they write depth), and translucent
 * geometry for water and ice, which has to be blended after everything else.
 */
public final class ChunkMesher {

    private ChunkMesher() {
    }

    public static final class Result {
        public final int chunkX;
        public final int chunkZ;
        /** The chunk version this was built from; a mismatch on upload means rebuild. */
        public final int version;
        public final float[] opaque;
        public final int opaqueFloats;
        public final float[] translucent;
        public final int translucentFloats;

        public Result(int chunkX, int chunkZ, int version,
                      float[] opaque, int opaqueFloats,
                      float[] translucent, int translucentFloats) {
            this.chunkX = chunkX;
            this.chunkZ = chunkZ;
            this.version = version;
            this.opaque = opaque;
            this.opaqueFloats = opaqueFloats;
            this.translucent = translucent;
            this.translucentFloats = translucentFloats;
        }
    }

    /** A growable float array; cheaper than boxing into a List for millions of vertices. */
    private static final class Buffer {
        float[] data = new float[8192];
        int size;

        void ensure(int extra) {
            if (size + extra > data.length) {
                int capacity = data.length;
                while (capacity < size + extra) {
                    capacity <<= 1;
                }
                data = Arrays.copyOf(data, capacity);
            }
        }

        void vertex(float x, float y, float z, float u, float v,
                    float layer, float shade, float light) {
            data[size++] = x;
            data[size++] = y;
            data[size++] = z;
            data[size++] = u;
            data[size++] = v;
            data[size++] = layer;
            data[size++] = shade;
            data[size++] = light;
        }
    }

    /** Scratch space for one face's four corners, reused to keep meshing allocation-free. */
    private static final class Corner {
        final int[] ambient = new int[4];
        final float[] shade = new float[4];
        final float[] light = new float[4];
    }

    public static Result build(World world, Chunk chunk, BlockLayers layers) {
        int version = chunk.getVersion();

        // The 3x3 neighbourhood, indexed (dz + 1) * 3 + (dx + 1). Face culling only needs the
        // four sides, but ambient occlusion samples diagonals too.
        Chunk[] grid = new Chunk[9];
        for (int dz = -1; dz <= 1; dz++) {
            for (int dx = -1; dx <= 1; dx++) {
                grid[(dz + 1) * 3 + (dx + 1)] = world.getChunk(chunk.chunkX + dx, chunk.chunkZ + dz);
            }
        }

        Buffer opaque = new Buffer();
        Buffer translucent = new Buffer();
        Corner corner = new Corner();

        for (int y = 0; y < Chunk.HEIGHT; y++) {
            for (int z = 0; z < Chunk.SIZE_Z; z++) {
                for (int x = 0; x < Chunk.SIZE_X; x++) {
                    int id = chunk.getBlockId(x, y, z);
                    if (id == Blocks.AIR.id) {
                        continue;
                    }
                    BlockType type = Blocks.byId(id);
                    if (type.render == BlockType.Render.NONE) {
                        continue;
                    }

                    Buffer target = type.translucent ? translucent : opaque;
                    if (type.render == BlockType.Render.CROSS) {
                        emitCross(target, layers, grid, id, x, y, z);
                    } else {
                        emitCube(target, layers, grid, corner, type, id, x, y, z);
                    }
                }
            }
        }

        return new Result(chunk.chunkX, chunk.chunkZ, version,
                opaque.data, opaque.size, translucent.data, translucent.size);
    }

    private static void emitCube(Buffer buffer, BlockLayers layers, Chunk[] grid, Corner corner,
                                 BlockType type, int id, int x, int y, int z) {
        for (Direction direction : Direction.VALUES) {
            int neighbourId = blockAt(grid, x + direction.dx, y + direction.dy, z + direction.dz);
            if (!faceVisible(type, Blocks.byId(neighbourId))) {
                continue;
            }

            int face = direction.ordinal();
            float[][] corners = BlockGeometry.FACE_CORNERS[face];
            float[][] uvs = BlockGeometry.FACE_UVS[face];
            float layer = layers.layer(id, direction);
            float faceShade = direction.shade();

            for (int i = 0; i < 4; i++) {
                int[][] offsets = BlockGeometry.AO_OFFSETS[face][i];

                boolean edgeA = occludes(grid, x + offsets[0][0], y + offsets[0][1],
                        z + offsets[0][2]);
                boolean edgeB = occludes(grid, x + offsets[1][0], y + offsets[1][1],
                        z + offsets[1][2]);
                boolean diagonal = occludes(grid, x + offsets[2][0], y + offsets[2][1],
                        z + offsets[2][2]);

                // Two edges touching seals the corner completely; the diagonal behind them
                // cannot make it any darker, and testing it would brighten a sealed corner.
                int ambient = (edgeA && edgeB)
                        ? 0
                        : 3 - ((edgeA ? 1 : 0) + (edgeB ? 1 : 0) + (diagonal ? 1 : 0));

                corner.ambient[i] = ambient;
                corner.shade[i] = faceShade * BlockGeometry.AO_BRIGHTNESS[ambient];
                corner.light[i] = averageLight(grid, x, y, z, direction, offsets);
            }

            // Anisotropy fix: a quad is two triangles, and its shared diagonal shows as a hard
            // crease whenever the corners it joins are much darker than the other pair. Running
            // the split the other way hides it.
            int[] triangles = (corner.ambient[0] + corner.ambient[2]
                    > corner.ambient[1] + corner.ambient[3])
                    ? BlockGeometry.QUAD_TRIANGLES_FLIPPED
                    : BlockGeometry.QUAD_TRIANGLES;

            buffer.ensure(6 * Mesh.FLOATS_PER_VERTEX);
            for (int index : triangles) {
                buffer.vertex(
                        x + corners[index][0], y + corners[index][1], z + corners[index][2],
                        uvs[index][0], uvs[index][1], layer,
                        corner.shade[index], corner.light[index]);
            }
        }
    }

    private static void emitCross(Buffer buffer, BlockLayers layers, Chunk[] grid,
                                  int id, int x, int y, int z) {
        float layer = layers.layer(id, Direction.UP);
        // A plant occupies its own cell, so it is lit by the light already stored there.
        float light = packLight(skyLightAt(grid, x, y, z), blockLightAt(grid, x, y, z));
        buffer.ensure(BlockGeometry.CROSS_QUADS.length * 6 * Mesh.FLOATS_PER_VERTEX);

        for (float[][] quad : BlockGeometry.CROSS_QUADS) {
            for (int index : BlockGeometry.QUAD_TRIANGLES) {
                buffer.vertex(
                        x + quad[index][0], y + quad[index][1], z + quad[index][2],
                        BlockGeometry.CROSS_UVS[index][0], BlockGeometry.CROSS_UVS[index][1],
                        layer, 1.0f, light);
            }
        }
    }

    /**
     * Smooth lighting: averages the four cells that meet at a vertex — the one the face looks
     * into and the three around that corner — skipping any that are solid and hold no light.
     * Sampling only the face-adjacent cell would light each face flatly and leave every block
     * edge visible as a step change.
     */
    private static float averageLight(Chunk[] grid, int x, int y, int z,
                                      Direction direction, int[][] offsets) {
        int skySum = skyLightAt(grid, x + direction.dx, y + direction.dy, z + direction.dz);
        int blockSum = blockLightAt(grid, x + direction.dx, y + direction.dy, z + direction.dz);
        int samples = 1;

        for (int[] offset : offsets) {
            int sx = x + offset[0];
            int sy = y + offset[1];
            int sz = z + offset[2];
            if (occludes(grid, sx, sy, sz)) {
                continue;
            }
            skySum += skyLightAt(grid, sx, sy, sz);
            blockSum += blockLightAt(grid, sx, sy, sz);
            samples++;
        }
        return packLight(skySum / samples, blockSum / samples);
    }

    /**
     * Both channels in one float, as {@code sky + block * 16}. Levels are 0..15, so the sum
     * stays a small exact integer in a float and the shader can split it back apart — cheaper
     * than spending another vertex attribute on it.
     */
    private static float packLight(int sky, int block) {
        return sky + block * 16;
    }

    private static boolean occludes(Chunk[] grid, int x, int y, int z) {
        return Blocks.byId(blockAt(grid, x, y, z)).opaque;
    }

    private static int skyLightAt(Chunk[] grid, int x, int y, int z) {
        if (y < 0) {
            return 0;
        }
        if (y >= Chunk.HEIGHT) {
            return 15;
        }
        Chunk chunk = chunkFor(grid, x, z);
        return chunk == null ? 15 : chunk.getSkyLight(x & 15, y, z & 15);
    }

    private static int blockLightAt(Chunk[] grid, int x, int y, int z) {
        if (y < 0 || y >= Chunk.HEIGHT) {
            return 0;
        }
        Chunk chunk = chunkFor(grid, x, z);
        return chunk == null ? 0 : chunk.getBlockLight(x & 15, y, z & 15);
    }

    private static Chunk chunkFor(Chunk[] grid, int x, int z) {
        int gridX = x < 0 ? 0 : (x >= Chunk.SIZE_X ? 2 : 1);
        int gridZ = z < 0 ? 0 : (z >= Chunk.SIZE_Z ? 2 : 1);
        return grid[gridZ * 3 + gridX];
    }

    /**
     * Whether the shared face between {@code self} and its neighbour should be drawn. Opaque
     * neighbours hide it; a matching neighbour hides it only for blocks like glass and water
     * that would otherwise show internal seams.
     */
    private static boolean faceVisible(BlockType self, BlockType neighbour) {
        if (neighbour.isAir()) {
            return true;
        }
        if (neighbour.opaque) {
            return false;
        }
        if (neighbour == self && self.cullAgainstSelf) {
            return false;
        }
        return true;
    }

    /**
     * Reads a block by chunk-local coordinate, where x and z may be -1 or 16 to reach into a
     * neighbouring chunk. A missing neighbour reads as air; meshing is gated on all four sides
     * being loaded, so that only happens for diagonals at the edge of the world.
     */
    static int blockAt(Chunk[] grid, int x, int y, int z) {
        if (y < 0 || y >= Chunk.HEIGHT) {
            return Blocks.AIR.id;
        }
        int gridX = x < 0 ? 0 : (x >= Chunk.SIZE_X ? 2 : 1);
        int gridZ = z < 0 ? 0 : (z >= Chunk.SIZE_Z ? 2 : 1);
        Chunk chunk = grid[gridZ * 3 + gridX];
        if (chunk == null) {
            return Blocks.AIR.id;
        }
        return chunk.getBlockId(x & 15, y, z & 15);
    }
}
