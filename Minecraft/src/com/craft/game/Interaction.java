package com.craft.game;

import com.craft.entity.AABB;
import com.craft.entity.Player;
import com.craft.entity.Raycast;
import com.craft.world.BlockType;
import com.craft.world.Blocks;
import com.craft.world.World;
import org.joml.Vector3f;

/**
 * Breaking and placing blocks.
 *
 * <p>Holds the current crosshair target and, in survival, how far through breaking it the
 * player is. Progress is tied to the specific block being mined: looking away, or at a
 * different block, abandons it and starts over — which is what stops a player from chipping
 * away at a whole wall at once.
 */
public class Interaction {

    /** Blocks broken per second against a hardness of 1. */
    private static final float BREAK_SPEED = 1.6f;

    private final Vector3f eye = new Vector3f();
    private final AABB placementBox = new AABB(0, 0, 0, 0, 0, 0);

    private Raycast.Hit target;

    private int breakingX = Integer.MIN_VALUE;
    private int breakingY;
    private int breakingZ;
    private float breakProgress;

    /** Set for one frame when a block breaks or is placed, so audio can react. */
    private BlockType lastBroken;
    private BlockType lastPlaced;

    public void update(World world, Player player, Vector3f lookDirection, Inventory inventory,
                       GameMode mode, boolean breaking, boolean placePressed, boolean pickPressed,
                       float delta) {
        lastBroken = null;
        lastPlaced = null;

        player.eyePosition(eye);
        target = Raycast.cast(world, eye, lookDirection, mode.reach, false);

        if (target == null) {
            resetProgress();
        } else {
            if (pickPressed) {
                inventory.pick(world.getBlock(target.x, target.y, target.z),
                        mode.infiniteBlocks);
            }
            if (placePressed) {
                tryPlace(world, player, inventory, mode);
            }
        }

        if (breaking && target != null) {
            updateBreaking(world, inventory, mode, delta);
        } else {
            resetProgress();
        }
    }

    private void updateBreaking(World world, Inventory inventory, GameMode mode, float delta) {
        BlockType type = world.getBlock(target.x, target.y, target.z);
        if (type.isAir() || type.hardness < 0) {
            resetProgress();
            return;
        }

        if (target.x != breakingX || target.y != breakingY || target.z != breakingZ) {
            breakingX = target.x;
            breakingY = target.y;
            breakingZ = target.z;
            breakProgress = 0;
        }

        breakProgress += mode.instantBreak
                ? 1f
                : delta * BREAK_SPEED / Math.max(0.05f, type.hardness);

        if (breakProgress >= 1f) {
            world.setBlock(target.x, target.y, target.z, Blocks.AIR.id);
            lastBroken = type;
            // No dropped-item entities: a broken block goes straight into the inventory.
            if (!mode.infiniteBlocks) {
                inventory.add(type, 1);
            }
            resetProgress();
        }
    }

    private void tryPlace(World world, Player player, Inventory inventory, GameMode mode) {
        BlockType held = inventory.selectedBlock();
        if (held == null) {
            return;
        }

        int x = target.placeX();
        int y = target.placeY();
        int z = target.placeZ();

        BlockType existing = world.getBlock(x, y, z);
        if (!existing.replaceable) {
            return;
        }

        // Refuse to place a solid block inside the player: it would leave them stuck in it.
        if (held.solid) {
            placementBox.setPosition(x + 0.5, y, z + 0.5, 1.0, 1.0);
            if (placementBox.intersects(player.getBox())) {
                return;
            }
        }

        if (!world.setBlock(x, y, z, held.id)) {
            return;
        }
        lastPlaced = held;
        if (!mode.infiniteBlocks) {
            inventory.consumeSelected();
        }
    }

    private void resetProgress() {
        breakingX = Integer.MIN_VALUE;
        breakProgress = 0;
    }

    public Raycast.Hit getTarget() {
        return target;
    }

    /** 0..1 through breaking the current block, or 0 when nothing is being mined. */
    public float getBreakProgress() {
        return breakProgress;
    }

    public BlockType getLastBroken() {
        return lastBroken;
    }

    public BlockType getLastPlaced() {
        return lastPlaced;
    }
}
