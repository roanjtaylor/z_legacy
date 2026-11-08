package com.craft.world;

/** The six axis-aligned neighbours of a block. Used by meshing, lighting and raycasting. */
public enum Direction {

    DOWN(0, -1, 0),
    UP(0, 1, 0),
    NORTH(0, 0, -1),
    SOUTH(0, 0, 1),
    WEST(-1, 0, 0),
    EAST(1, 0, 0);

    public static final Direction[] VALUES = values();

    public final int dx;
    public final int dy;
    public final int dz;

    Direction(int dx, int dy, int dz) {
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
    }

    public Direction opposite() {
        switch (this) {
            case DOWN: return UP;
            case UP: return DOWN;
            case NORTH: return SOUTH;
            case SOUTH: return NORTH;
            case WEST: return EAST;
            default: return WEST;
        }
    }

    /**
     * Fixed directional shading, the trick that makes untextured voxels read as solid: top
     * faces full brightness, bottom darkest, and the two horizontal axes distinct from each
     * other so corners are legible.
     */
    public float shade() {
        switch (this) {
            case UP: return 1.00f;
            case DOWN: return 0.50f;
            case NORTH:
            case SOUTH: return 0.80f;
            default: return 0.60f;
        }
    }
}
