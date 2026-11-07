package com.craft.entity;

import com.craft.world.BlockType;
import com.craft.world.Direction;
import com.craft.world.World;
import org.joml.Vector3f;

/**
 * Finds the block under the crosshair.
 *
 * <p>Amanatides and Woo's voxel traversal: rather than stepping along the ray in small
 * increments and hoping not to skip anything, it tracks how far the ray must travel to cross
 * the next boundary on each axis and always advances the nearest one. Every block the ray
 * touches is visited exactly once, in order, at any distance and any angle.
 */
public final class Raycast {

    private Raycast() {
    }

    public static final class Hit {
        /** The block that was hit. */
        public final int x;
        public final int y;
        public final int z;
        /** The face entered through; its normal points back towards the viewer. */
        public final Direction face;
        public final float distance;

        Hit(int x, int y, int z, Direction face, float distance) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.face = face;
            this.distance = distance;
        }

        /** The empty cell against that face — where a placed block would go. */
        public int placeX() {
            return x + face.dx;
        }

        public int placeY() {
            return y + face.dy;
        }

        public int placeZ() {
            return z + face.dz;
        }
    }

    /**
     * @param includeLiquids whether water counts as a target; false for building, true for
     *                       working out what the camera is submerged in
     * @return the first block hit, or null if the ray reached its limit through empty space
     */
    public static Hit cast(World world, Vector3f origin, Vector3f direction,
                           float maxDistance, boolean includeLiquids) {
        int x = floor(origin.x);
        int y = floor(origin.y);
        int z = floor(origin.z);

        int stepX = signum(direction.x);
        int stepY = signum(direction.y);
        int stepZ = signum(direction.z);

        // Distance along the ray between successive boundaries on each axis. A zero component
        // never crosses a boundary at all, hence the infinity.
        float deltaX = stepX == 0 ? Float.POSITIVE_INFINITY : Math.abs(1f / direction.x);
        float deltaY = stepY == 0 ? Float.POSITIVE_INFINITY : Math.abs(1f / direction.y);
        float deltaZ = stepZ == 0 ? Float.POSITIVE_INFINITY : Math.abs(1f / direction.z);

        float maxX = boundaryDistance(origin.x, direction.x, x, stepX);
        float maxY = boundaryDistance(origin.y, direction.y, y, stepY);
        float maxZ = boundaryDistance(origin.z, direction.z, z, stepZ);

        Direction face = null;
        float travelled = 0;

        // One iteration per block crossed; the bound is a safety net against a degenerate ray.
        for (int i = 0; i < 512; i++) {
            if (face != null && isTarget(world, x, y, z, includeLiquids)) {
                return new Hit(x, y, z, face, travelled);
            }

            if (maxX <= maxY && maxX <= maxZ) {
                travelled = maxX;
                x += stepX;
                maxX += deltaX;
                face = stepX > 0 ? Direction.WEST : Direction.EAST;
            } else if (maxY <= maxZ) {
                travelled = maxY;
                y += stepY;
                maxY += deltaY;
                face = stepY > 0 ? Direction.DOWN : Direction.UP;
            } else {
                travelled = maxZ;
                z += stepZ;
                maxZ += deltaZ;
                face = stepZ > 0 ? Direction.NORTH : Direction.SOUTH;
            }

            if (travelled > maxDistance) {
                return null;
            }
        }
        return null;
    }

    private static boolean isTarget(World world, int x, int y, int z, boolean includeLiquids) {
        BlockType type = world.getBlock(x, y, z);
        if (type.isAir()) {
            return false;
        }
        if (type.liquid) {
            return includeLiquids;
        }
        return true;
    }

    /**
     * Distance along the ray from the origin to the first cell boundary on one axis. The
     * result is never negative: the boundary chosen is always the one the ray is heading
     * towards, so numerator and denominator share a sign.
     */
    private static float boundaryDistance(float origin, float direction, int cell, int step) {
        if (step == 0) {
            return Float.POSITIVE_INFINITY;
        }
        float boundary = step > 0 ? cell + 1 : cell;
        return (boundary - origin) / direction;
    }

    private static int signum(float value) {
        return value > 0 ? 1 : (value < 0 ? -1 : 0);
    }

    private static int floor(float value) {
        int i = (int) value;
        return value < i ? i - 1 : i;
    }
}
