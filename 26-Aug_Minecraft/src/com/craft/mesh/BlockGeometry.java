package com.craft.mesh;

import com.craft.world.Direction;

/**
 * Corner positions and texture coordinates for the six faces of a unit cube.
 *
 * <p>Each face lists four corners wound counter-clockwise as seen from outside the block, so
 * back-face culling keeps exactly the faces pointing at the camera. Quads are emitted as two
 * triangles in the order 0-1-2, 0-2-3.
 */
public final class BlockGeometry {

    private BlockGeometry() {
    }

    /** {@code [face][corner][x,y,z]} — corner offsets within the block, in the range 0..1. */
    public static final float[][][] FACE_CORNERS = new float[6][][];

    /** {@code [face][corner][u,v]} — unit texture coordinates, later remapped into the atlas. */
    public static final float[][][] FACE_UVS = new float[6][][];

    static {
        FACE_CORNERS[Direction.DOWN.ordinal()] = new float[][]{
                {0, 0, 0}, {1, 0, 0}, {1, 0, 1}, {0, 0, 1}};
        FACE_UVS[Direction.DOWN.ordinal()] = new float[][]{
                {0, 0}, {1, 0}, {1, 1}, {0, 1}};

        FACE_CORNERS[Direction.UP.ordinal()] = new float[][]{
                {0, 1, 0}, {0, 1, 1}, {1, 1, 1}, {1, 1, 0}};
        FACE_UVS[Direction.UP.ordinal()] = new float[][]{
                {0, 0}, {0, 1}, {1, 1}, {1, 0}};

        FACE_CORNERS[Direction.NORTH.ordinal()] = new float[][]{
                {0, 0, 0}, {0, 1, 0}, {1, 1, 0}, {1, 0, 0}};
        FACE_UVS[Direction.NORTH.ordinal()] = new float[][]{
                {0, 1}, {0, 0}, {1, 0}, {1, 1}};

        FACE_CORNERS[Direction.SOUTH.ordinal()] = new float[][]{
                {1, 0, 1}, {1, 1, 1}, {0, 1, 1}, {0, 0, 1}};
        FACE_UVS[Direction.SOUTH.ordinal()] = new float[][]{
                {0, 1}, {0, 0}, {1, 0}, {1, 1}};

        FACE_CORNERS[Direction.WEST.ordinal()] = new float[][]{
                {0, 0, 1}, {0, 1, 1}, {0, 1, 0}, {0, 0, 0}};
        FACE_UVS[Direction.WEST.ordinal()] = new float[][]{
                {0, 1}, {0, 0}, {1, 0}, {1, 1}};

        FACE_CORNERS[Direction.EAST.ordinal()] = new float[][]{
                {1, 0, 0}, {1, 1, 0}, {1, 1, 1}, {1, 0, 1}};
        FACE_UVS[Direction.EAST.ordinal()] = new float[][]{
                {0, 1}, {0, 0}, {1, 0}, {1, 1}};
    }

    /** The two triangles of a quad, as indices into the four corners. */
    public static final int[] QUAD_TRIANGLES = {0, 1, 2, 0, 2, 3};

    /** The same quad split along its other diagonal. See the anisotropy fix in ChunkMesher. */
    public static final int[] QUAD_TRIANGLES_FLIPPED = {1, 2, 3, 1, 3, 0};

    /**
     * The four quads of a cross-shaped plant: two diagonals through the block, each emitted in
     * both windings so the plant is visible from every side without turning off face culling
     * for a separate pass.
     */
    public static final float[][][] CROSS_QUADS = {
            {{0, 0, 0}, {0, 1, 0}, {1, 1, 1}, {1, 0, 1}},
            {{1, 0, 1}, {1, 1, 1}, {0, 1, 0}, {0, 0, 0}},
            {{1, 0, 0}, {1, 1, 0}, {0, 1, 1}, {0, 0, 1}},
            {{0, 0, 1}, {0, 1, 1}, {1, 1, 0}, {1, 0, 0}},
    };

    /** Corner order above is bottom, top, top, bottom, so the same UVs suit every cross quad. */
    public static final float[][] CROSS_UVS = {{0, 1}, {0, 0}, {1, 0}, {1, 1}};

    /**
     * Neighbour offsets for per-vertex ambient occlusion: {@code [face][corner][sample][xyz]}.
     *
     * <p>A face vertex is darkened by the three blocks that meet at its corner on the lit side
     * of the face — the two edge neighbours and the diagonal. Samples 0 and 1 are the edges,
     * sample 2 is the diagonal; the distinction matters because two edges touching is a fully
     * enclosed corner regardless of the diagonal.
     *
     * <p>Derived from {@link #FACE_CORNERS} rather than written out by hand, so the two tables
     * cannot drift apart.
     */
    public static final int[][][][] AO_OFFSETS = new int[6][4][3][3];

    static {
        for (Direction direction : Direction.VALUES) {
            int face = direction.ordinal();
            for (int corner = 0; corner < 4; corner++) {
                float[] position = FACE_CORNERS[face][corner];

                // Corner offsets are 0 or 1 within the block; map them to -1 or +1, and zero
                // out the axis the face points along, leaving exactly two tangent directions.
                int[] tangent = new int[3];
                tangent[0] = direction.dx != 0 ? 0 : (int) (position[0] * 2 - 1);
                tangent[1] = direction.dy != 0 ? 0 : (int) (position[1] * 2 - 1);
                tangent[2] = direction.dz != 0 ? 0 : (int) (position[2] * 2 - 1);

                int[][] axes = new int[2][];
                int found = 0;
                for (int axis = 0; axis < 3; axis++) {
                    if (tangent[axis] != 0) {
                        int[] step = new int[3];
                        step[axis] = tangent[axis];
                        axes[found++] = step;
                    }
                }

                int[] base = {direction.dx, direction.dy, direction.dz};
                for (int axis = 0; axis < 3; axis++) {
                    AO_OFFSETS[face][corner][0][axis] = base[axis] + axes[0][axis];
                    AO_OFFSETS[face][corner][1][axis] = base[axis] + axes[1][axis];
                    AO_OFFSETS[face][corner][2][axis] =
                            base[axis] + axes[0][axis] + axes[1][axis];
                }
            }
        }
    }

    /** Vertex brightness for ambient occlusion levels 0 (most enclosed) to 3 (open). */
    public static final float[] AO_BRIGHTNESS = {0.46f, 0.64f, 0.82f, 1.00f};
}
