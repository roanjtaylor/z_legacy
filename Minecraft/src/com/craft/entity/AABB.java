package com.craft.entity;

import com.craft.world.BlockType;
import com.craft.world.World;

/**
 * An axis-aligned box, and the collision clipping the player moves by.
 *
 * <p>Movement is resolved one axis at a time rather than as a single swept test. That is the
 * standard voxel approach: it is simple, it cannot tunnel through a wall at sane speeds, and
 * sliding along a surface falls out of it for free — a diagonal run into a wall keeps the
 * component parallel to the wall and drops only the component into it.
 */
public class AABB {

    public double minX;
    public double minY;
    public double minZ;
    public double maxX;
    public double maxY;
    public double maxZ;

    public AABB(double minX, double minY, double minZ, double maxX, double maxY, double maxZ) {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    public AABB copy() {
        return new AABB(minX, minY, minZ, maxX, maxY, maxZ);
    }

    public void set(AABB other) {
        this.minX = other.minX;
        this.minY = other.minY;
        this.minZ = other.minZ;
        this.maxX = other.maxX;
        this.maxY = other.maxY;
        this.maxZ = other.maxZ;
    }

    public void offset(double dx, double dy, double dz) {
        minX += dx;
        maxX += dx;
        minY += dy;
        maxY += dy;
        minZ += dz;
        maxZ += dz;
    }

    /** Centres the box horizontally on a point, with its base at that point's y. */
    public void setPosition(double x, double y, double z, double width, double height) {
        double half = width / 2;
        minX = x - half;
        maxX = x + half;
        minY = y;
        maxY = y + height;
        minZ = z - half;
        maxZ = z + half;
    }

    public AABB expand(double amount) {
        return new AABB(minX - amount, minY - amount, minZ - amount,
                maxX + amount, maxY + amount, maxZ + amount);
    }

    public boolean intersects(AABB other) {
        return maxX > other.minX && minX < other.maxX
                && maxY > other.minY && minY < other.maxY
                && maxZ > other.minZ && minZ < other.maxZ;
    }

    // ------------------------------------------------------------------ axis clipping

    /**
     * Shortens a movement along one axis so the box stops flush against the first solid block
     * it would enter. Returns the distance that can actually be travelled.
     *
     * <p>{@code EDGE_BIAS} shrinks the box by a hair when choosing which blocks to test on the
     * two perpendicular axes. Standing exactly flush against a wall puts the box boundary on an
     * integer, and without the shrink the block beyond it would count as overlapping — so
     * walking along a flat wall would catch on every seam.
     *
     * <p>It has to be comfortably larger than the error from storing the player's position as a
     * float and rebuilding the box from it, which is around 1e-6 at world coordinates. At 1e-7
     * a box clipped flush to x=24 came back as 24.0000008, the next axis then saw the player as
     * embedded in the neighbouring block, and the push-out below launched them a block into the
     * air. A tenth of a millimetre is invisible and leaves three orders of magnitude of margin.
     */
    private static final double EDGE_BIAS = 1e-4;

    /**
     * Keeps a clipped movement between zero and what was asked for.
     *
     * <p>The push-out arithmetic assumes the box starts outside the block. If it ever starts
     * even slightly inside one, that same arithmetic returns a large movement in the
     * <em>opposite</em> direction — ejecting the player across the block rather than stopping
     * them short of it. Clamping here means the worst case of an overlap is standing still.
     */
    private static double clampToRequest(double clipped, double requested) {
        if (requested > 0) {
            return Math.max(0, Math.min(clipped, requested));
        }
        return Math.min(0, Math.max(clipped, requested));
    }

    public double clipX(World world, double dx) {
        if (dx == 0) {
            return 0;
        }
        final double requested = dx;
        int minYi = floor(minY + EDGE_BIAS);
        int maxYi = floor(maxY - EDGE_BIAS);
        int minZi = floor(minZ + EDGE_BIAS);
        int maxZi = floor(maxZ - EDGE_BIAS);

        int from = dx > 0 ? floor(maxX) : floor(minX + dx);
        int to = dx > 0 ? floor(maxX + dx) : floor(minX);

        for (int x = from; x <= to; x++) {
            for (int y = minYi; y <= maxYi; y++) {
                for (int z = minZi; z <= maxZi; z++) {
                    if (!isSolid(world, x, y, z)) {
                        continue;
                    }
                    if (dx > 0) {
                        dx = Math.min(dx, x - maxX);
                    } else {
                        dx = Math.max(dx, (x + 1) - minX);
                    }
                }
            }
        }
        return clampToRequest(dx, requested);
    }

    public double clipY(World world, double dy) {
        if (dy == 0) {
            return 0;
        }
        final double requested = dy;
        int minXi = floor(minX + EDGE_BIAS);
        int maxXi = floor(maxX - EDGE_BIAS);
        int minZi = floor(minZ + EDGE_BIAS);
        int maxZi = floor(maxZ - EDGE_BIAS);

        int from = dy > 0 ? floor(maxY) : floor(minY + dy);
        int to = dy > 0 ? floor(maxY + dy) : floor(minY);

        for (int y = from; y <= to; y++) {
            for (int x = minXi; x <= maxXi; x++) {
                for (int z = minZi; z <= maxZi; z++) {
                    if (!isSolid(world, x, y, z)) {
                        continue;
                    }
                    if (dy > 0) {
                        dy = Math.min(dy, y - maxY);
                    } else {
                        dy = Math.max(dy, (y + 1) - minY);
                    }
                }
            }
        }
        return clampToRequest(dy, requested);
    }

    public double clipZ(World world, double dz) {
        if (dz == 0) {
            return 0;
        }
        final double requested = dz;
        int minXi = floor(minX + EDGE_BIAS);
        int maxXi = floor(maxX - EDGE_BIAS);
        int minYi = floor(minY + EDGE_BIAS);
        int maxYi = floor(maxY - EDGE_BIAS);

        int from = dz > 0 ? floor(maxZ) : floor(minZ + dz);
        int to = dz > 0 ? floor(maxZ + dz) : floor(minZ);

        for (int z = from; z <= to; z++) {
            for (int x = minXi; x <= maxXi; x++) {
                for (int y = minYi; y <= maxYi; y++) {
                    if (!isSolid(world, x, y, z)) {
                        continue;
                    }
                    if (dz > 0) {
                        dz = Math.min(dz, z - maxZ);
                    } else {
                        dz = Math.max(dz, (z + 1) - minZ);
                    }
                }
            }
        }
        return clampToRequest(dz, requested);
    }

    /** True if any block overlapping this box is of the given type. */
    public boolean overlaps(World world, BlockType type) {
        for (int x = floor(minX); x <= floor(maxX - EDGE_BIAS); x++) {
            for (int y = floor(minY); y <= floor(maxY - EDGE_BIAS); y++) {
                for (int z = floor(minZ); z <= floor(maxZ - EDGE_BIAS); z++) {
                    if (world.getBlock(x, y, z) == type) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public boolean collidesWithWorld(World world) {
        for (int x = floor(minX + EDGE_BIAS); x <= floor(maxX - EDGE_BIAS); x++) {
            for (int y = floor(minY + EDGE_BIAS); y <= floor(maxY - EDGE_BIAS); y++) {
                for (int z = floor(minZ + EDGE_BIAS); z <= floor(maxZ - EDGE_BIAS); z++) {
                    if (isSolid(world, x, y, z)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static boolean isSolid(World world, int x, int y, int z) {
        return world.getBlock(x, y, z).solid;
    }

    private static int floor(double value) {
        int i = (int) value;
        return value < i ? i - 1 : i;
    }
}
