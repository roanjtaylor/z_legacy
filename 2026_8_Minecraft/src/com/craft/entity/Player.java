package com.craft.entity;

import com.craft.world.Blocks;
import com.craft.world.Chunk;
import com.craft.world.World;
import com.craft.world.WorldGen;
import org.joml.Vector3f;

/**
 * The player: an axis-aligned box with gravity, and the camera rides on its eyes.
 *
 * <p>Constants are tuned to feel like Minecraft rather than to be physically honest — a 32
 * block/s² gravity with an 8.4 m/s jump gives the familiar one-and-a-bit block hop, and
 * horizontal movement is velocity-clamped rather than force-driven so it stops the instant you
 * let go of the key.
 */
public class Player {

    public static final float WIDTH = 0.6f;
    public static final float HEIGHT = 1.8f;
    public static final float EYE_HEIGHT = 1.62f;

    private static final float GRAVITY = 32f;
    private static final float TERMINAL_VELOCITY = 78f;
    private static final float JUMP_VELOCITY = 8.4f;

    private static final float WALK_SPEED = 4.3f;
    private static final float SPRINT_SPEED = 5.6f;
    private static final float SNEAK_SPEED = 1.3f;
    private static final float FLY_SPEED = 11f;
    private static final float FLY_SPEED_FAST = 25f;

    private static final float SWIM_GRAVITY = 6f;
    private static final float SWIM_SPEED = 3.0f;
    private static final float SWIM_UP_VELOCITY = 4.2f;
    private static final float WATER_DRAG = 0.86f;

    /**
     * Fraction of the gap to the target velocity closed per 1/60 s tick. Movement approaches
     * its target exponentially rather than being accelerated by a fixed amount per frame:
     * the steady-state speed is then exactly the target whatever the frame rate, where a
     * per-frame impulse against per-second drag would run more than twice as fast at 120 fps
     * as at 60.
     */
    private static final double APPROACH_PER_TICK = 0.28;

    /** How much of that approach applies in each state: full on the ground, little in the air. */
    private static final float GROUND_CONTROL = 1.0f;
    private static final float AIR_CONTROL = 0.16f;
    private static final float WATER_CONTROL = 0.35f;

    public final Vector3f position = new Vector3f();
    public final Vector3f velocity = new Vector3f();

    private final AABB box = new AABB(0, 0, 0, 0, 0, 0);

    private boolean onGround;
    private boolean inWater;
    private boolean headUnderwater;
    private boolean flying;

    /** Highest point reached since leaving the ground, for working out fall damage. */
    private float fallStartY;
    private float lastFallDistance;

    public Player(float x, float y, float z) {
        position.set(x, y, z);
        syncBox();
        fallStartY = y;
    }

    private void syncBox() {
        box.setPosition(position.x, position.y, position.z, WIDTH, HEIGHT);
    }

    /**
     * Advances one frame.
     *
     * @param moveX   strafe input, -1..1, in world space already
     * @param moveZ   forward input, -1..1, in world space already
     * @param jump    whether the jump key is held
     * @param sneak   whether the sneak key is held
     * @param sprint  whether sprint is active
     */
    public void update(World world, float delta, float moveX, float moveZ,
                       boolean jump, boolean sneak, boolean sprint, boolean flyDown) {
        updateFluidState(world);

        if (flying) {
            updateFlying(world, delta, moveX, moveZ, jump, flyDown, sprint);
            return;
        }

        float speed = inWater ? SWIM_SPEED
                : sneak ? SNEAK_SPEED
                : sprint ? SPRINT_SPEED : WALK_SPEED;

        float control = inWater ? WATER_CONTROL : (onGround ? GROUND_CONTROL : AIR_CONTROL);
        float blend = (float) (1 - Math.pow(1 - APPROACH_PER_TICK, delta * 60f)) * control;
        velocity.x += (moveX * speed - velocity.x) * blend;
        velocity.z += (moveZ * speed - velocity.z) * blend;

        if (inWater) {
            velocity.y -= SWIM_GRAVITY * delta;
            if (jump) {
                velocity.y = SWIM_UP_VELOCITY;
            }
        } else {
            velocity.y -= GRAVITY * delta;
            if (jump && onGround) {
                velocity.y = JUMP_VELOCITY;
                onGround = false;
            }
        }

        if (velocity.y < -TERMINAL_VELOCITY) {
            velocity.y = -TERMINAL_VELOCITY;
        }

        moveWithCollision(world, delta);
        applyWaterDrag(delta);
        trackFall();
    }

    private void updateFlying(World world, float delta, float moveX, float moveZ,
                              boolean up, boolean down, boolean fast) {
        float speed = fast ? FLY_SPEED_FAST : FLY_SPEED;
        velocity.x = moveX * speed;
        velocity.z = moveZ * speed;
        velocity.y = 0;
        if (up) {
            velocity.y += speed * 0.8f;
        }
        if (down) {
            velocity.y -= speed * 0.8f;
        }

        moveWithCollision(world, delta);
        fallStartY = position.y;
    }

    /**
     * Water resists vertical motion too, so you sink slowly and stop rising the moment you
     * let go. Horizontal damping is already handled by the approach blend above.
     */
    private void applyWaterDrag(float delta) {
        if (!inWater) {
            return;
        }
        velocity.y *= (float) Math.pow(WATER_DRAG, delta * 60f);
    }

    // ----------------------------------------------------------------------- collision

    private void moveWithCollision(World world, float delta) {
        double dx = velocity.x * delta;
        double dy = velocity.y * delta;
        double dz = velocity.z * delta;

        syncBox();

        // Vertical first, so onGround is known before the step-up test below needs it.
        double clippedY = box.clipY(world, dy);
        box.offset(0, clippedY, 0);
        if (clippedY != dy) {
            onGround = dy < 0;
            velocity.y = 0;
        } else if (dy != 0) {
            onGround = false;
        }

        // No auto-step. Every block in the game is a full cube and nothing is shorter than the
        // 0.6 ledge Minecraft steps over automatically, so climbing means jumping — which is
        // the behaviour players expect anyway. Sub-block shapes would need it back.
        double clippedX = box.clipX(world, dx);
        double clippedZ = box.clipZ(world, dz);

        box.offset(clippedX, 0, 0);
        box.offset(0, 0, clippedZ);
        if (clippedX != dx) {
            velocity.x = 0;
        }
        if (clippedZ != dz) {
            velocity.z = 0;
        }

        position.set((float) ((box.minX + box.maxX) / 2), (float) box.minY,
                (float) ((box.minZ + box.maxZ) / 2));
    }

    // -------------------------------------------------------------------- fluid & fall

    private void updateFluidState(World world) {
        syncBox();
        inWater = box.overlaps(world, Blocks.WATER);
        headUnderwater = world.getBlock(
                (int) Math.floor(position.x),
                (int) Math.floor(position.y + EYE_HEIGHT),
                (int) Math.floor(position.z)) == Blocks.WATER;
        if (inWater) {
            fallStartY = position.y;
        }
    }

    private void trackFall() {
        if (onGround) {
            lastFallDistance = Math.max(0, fallStartY - position.y);
            fallStartY = position.y;
        } else if (position.y > fallStartY) {
            fallStartY = position.y;
        }
    }

    /** Distance fallen on the frame the player landed, then zero until the next landing. */
    public float consumeFallDistance() {
        float distance = lastFallDistance;
        lastFallDistance = 0;
        return distance;
    }

    // ------------------------------------------------------------------------- helpers

    /** Finds ground level for a spawn: the lowest gap tall enough to stand in, above water. */
    public static float findSpawnY(World world, int x, int z) {
        for (int y = Chunk.HEIGHT - 2; y > 1; y--) {
            if (!world.getBlock(x, y - 1, z).solid) {
                continue;
            }
            if (world.getBlock(x, y, z).isAir() && world.getBlock(x, y + 1, z).isAir()) {
                return y;
            }
        }
        return WorldGen.SEA_LEVEL + 1;
    }

    public Vector3f eyePosition(Vector3f dest) {
        return dest.set(position.x, position.y + EYE_HEIGHT, position.z);
    }

    public AABB getBox() {
        syncBox();
        return box;
    }

    public boolean isOnGround() {
        return onGround;
    }

    public boolean isInWater() {
        return inWater;
    }

    public boolean isHeadUnderwater() {
        return headUnderwater;
    }

    public boolean isFlying() {
        return flying;
    }

    public void setFlying(boolean flying) {
        this.flying = flying;
        if (flying) {
            velocity.y = 0;
        } else {
            fallStartY = position.y;
        }
    }

    public void setPosition(float x, float y, float z) {
        position.set(x, y, z);
        velocity.zero();
        fallStartY = y;
        syncBox();
    }

    public float horizontalSpeed() {
        return (float) Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    }
}
