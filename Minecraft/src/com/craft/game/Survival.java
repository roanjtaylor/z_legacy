package com.craft.game;

import com.craft.entity.Player;
import com.craft.world.World;

/**
 * Health, breath and the things that take them away.
 *
 * <p>Kept apart from {@link Player}, which stays purely kinematic: the physics has to behave
 * identically in creative, where none of this applies.
 */
public class Survival {

    public static final int MAX_HEALTH = 20;
    public static final int MAX_AIR = 20;

    /** Falls shorter than this are free; beyond it, half a heart per block. */
    private static final float SAFE_FALL_DISTANCE = 3.0f;

    private static final float SECONDS_PER_AIR_BUBBLE = 1.0f;
    private static final float DROWN_DAMAGE_INTERVAL = 1.0f;
    private static final float REGENERATION_INTERVAL = 4.0f;
    private static final float DAMAGE_FLASH_TIME = 0.4f;

    private int health = MAX_HEALTH;
    private int air = MAX_AIR;

    private float airTimer;
    private float drownTimer;
    private float regenerationTimer;
    private float damageFlash;

    private boolean dead;

    public void update(World world, Player player, GameMode mode, float delta) {
        damageFlash = Math.max(0, damageFlash - delta);

        if (!mode.takesDamage) {
            health = MAX_HEALTH;
            air = MAX_AIR;
            dead = false;
            return;
        }
        if (dead) {
            return;
        }

        updateBreath(player, delta);
        updateFallDamage(player);
        updateRegeneration(delta);

        // The world is 128 blocks tall and bedrock seals the bottom, so falling out of it
        // should be impossible; this is a backstop, not a mechanic.
        if (player.position.y < -4) {
            damage(MAX_HEALTH);
        }
    }

    private void updateBreath(Player player, float delta) {
        if (player.isHeadUnderwater()) {
            airTimer += delta;
            while (airTimer >= SECONDS_PER_AIR_BUBBLE && air > 0) {
                airTimer -= SECONDS_PER_AIR_BUBBLE;
                air--;
            }
            if (air == 0) {
                drownTimer += delta;
                while (drownTimer >= DROWN_DAMAGE_INTERVAL) {
                    drownTimer -= DROWN_DAMAGE_INTERVAL;
                    damage(2);
                }
            }
        } else {
            air = MAX_AIR;
            airTimer = 0;
            drownTimer = 0;
        }
    }

    private void updateFallDamage(Player player) {
        float fall = player.consumeFallDistance();
        if (fall > SAFE_FALL_DISTANCE && !player.isInWater()) {
            damage(Math.round(fall - SAFE_FALL_DISTANCE));
        }
    }

    private void updateRegeneration(float delta) {
        if (health >= MAX_HEALTH || health <= 0) {
            regenerationTimer = 0;
            return;
        }
        regenerationTimer += delta;
        if (regenerationTimer >= REGENERATION_INTERVAL) {
            regenerationTimer = 0;
            health++;
        }
    }

    public void damage(int amount) {
        if (amount <= 0 || dead) {
            return;
        }
        health -= amount;
        damageFlash = DAMAGE_FLASH_TIME;
        regenerationTimer = 0;
        if (health <= 0) {
            health = 0;
            dead = true;
        }
    }

    public void respawn() {
        health = MAX_HEALTH;
        air = MAX_AIR;
        airTimer = 0;
        drownTimer = 0;
        regenerationTimer = 0;
        dead = false;
    }

    public int getHealth() {
        return health;
    }

    public void setHealth(int health) {
        this.health = Math.max(0, Math.min(MAX_HEALTH, health));
        this.dead = this.health == 0;
    }

    public int getAir() {
        return air;
    }

    public boolean isDead() {
        return dead;
    }

    /** 0..1, fading out after a hit. Drives the red flash at the screen edges. */
    public float getDamageFlash() {
        return damageFlash / DAMAGE_FLASH_TIME;
    }
}
