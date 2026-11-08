package com.craft.game;

/** How the world responds to the player. Switchable in game with F4. */
public enum GameMode {

    /** Fly, reach further, break instantly, and draw on the full block palette. */
    CREATIVE("Creative", 5.0f, true, true, true, false),

    /** Feet on the ground, blocks take time to break and have to be carried. */
    SURVIVAL("Survival", 4.5f, false, false, false, true);

    public final String displayName;
    public final float reach;
    public final boolean instantBreak;
    public final boolean infiniteBlocks;
    public final boolean canFly;
    public final boolean takesDamage;

    GameMode(String displayName, float reach, boolean instantBreak, boolean infiniteBlocks,
             boolean canFly, boolean takesDamage) {
        this.displayName = displayName;
        this.reach = reach;
        this.instantBreak = instantBreak;
        this.infiniteBlocks = infiniteBlocks;
        this.canFly = canFly;
        this.takesDamage = takesDamage;
    }

    public GameMode other() {
        return this == CREATIVE ? SURVIVAL : CREATIVE;
    }

    public static GameMode byName(String name) {
        for (GameMode mode : values()) {
            if (mode.name().equalsIgnoreCase(name)) {
                return mode;
            }
        }
        return SURVIVAL;
    }
}
