package com.craft.game;

import com.craft.world.BlockType;
import com.craft.world.Blocks;

/**
 * A nine-slot hotbar plus a backing grid, and the rules for putting blocks into them.
 *
 * <p>Slots hold a block type and a count. In creative the counts are ignored and every block is
 * available from the palette; in survival a slot empties when its last block is placed, and
 * mined blocks stack into an existing slot before taking a new one.
 */
public class Inventory {

    public static final int HOTBAR_SIZE = 9;
    public static final int ROWS = 3;
    public static final int COLUMNS = 9;
    public static final int STORAGE_SIZE = ROWS * COLUMNS;
    public static final int MAX_STACK = 64;

    public static class Slot {
        public BlockType type;
        public int count;

        public boolean isEmpty() {
            return type == null || count <= 0;
        }

        public void clear() {
            type = null;
            count = 0;
        }
    }

    /** Index 0..8 is the hotbar; the rest is the backpack shown on the inventory screen. */
    private final Slot[] slots = new Slot[HOTBAR_SIZE + STORAGE_SIZE];
    private int selected;

    public Inventory() {
        for (int i = 0; i < slots.length; i++) {
            slots[i] = new Slot();
        }
    }

    public Slot slot(int index) {
        return slots[index];
    }

    public int size() {
        return slots.length;
    }

    public int getSelected() {
        return selected;
    }

    public void setSelected(int index) {
        selected = Math.floorMod(index, HOTBAR_SIZE);
    }

    public void scrollSelection(int amount) {
        setSelected(selected - amount);
    }

    public BlockType selectedBlock() {
        Slot slot = slots[selected];
        return slot.isEmpty() ? null : slot.type;
    }

    /**
     * Adds blocks, stacking onto a matching slot before claiming an empty one. The hotbar is
     * filled first so a freshly mined block is immediately usable.
     *
     * @return how many did not fit
     */
    public int add(BlockType type, int amount) {
        if (type == null || type == Blocks.AIR) {
            return 0;
        }

        for (int i = 0; i < slots.length && amount > 0; i++) {
            Slot slot = slots[i];
            if (slot.type == type && slot.count < MAX_STACK) {
                int room = MAX_STACK - slot.count;
                int moved = Math.min(room, amount);
                slot.count += moved;
                amount -= moved;
            }
        }
        for (int i = 0; i < slots.length && amount > 0; i++) {
            Slot slot = slots[i];
            if (slot.isEmpty()) {
                slot.type = type;
                slot.count = Math.min(MAX_STACK, amount);
                amount -= slot.count;
            }
        }
        return amount;
    }

    /** Consumes one of the selected block. Returns false if the slot was empty. */
    public boolean consumeSelected() {
        Slot slot = slots[selected];
        if (slot.isEmpty()) {
            return false;
        }
        slot.count--;
        if (slot.count <= 0) {
            slot.clear();
        }
        return true;
    }

    /** Points the selected slot at a block without spending anything. Used by creative pick. */
    public void setSlot(int index, BlockType type, int count) {
        Slot slot = slots[index];
        slot.type = type;
        slot.count = count;
    }

    public void clear() {
        for (Slot slot : slots) {
            slot.clear();
        }
    }

    /** Moves the selected slot onto a block already held, or drops it into the hotbar. */
    public void pick(BlockType type, boolean creative) {
        for (int i = 0; i < HOTBAR_SIZE; i++) {
            if (slots[i].type == type) {
                selected = i;
                return;
            }
        }
        if (creative) {
            setSlot(selected, type, 1);
        }
    }

    /** The starter kit a new survival world hands out, so building can begin immediately. */
    public void giveStartingKit() {
        setSlot(0, Blocks.OAK_PLANKS, 32);
        setSlot(1, Blocks.COBBLESTONE, 32);
        setSlot(2, Blocks.GLASS, 16);
        setSlot(3, Blocks.OAK_LOG, 16);
        setSlot(4, Blocks.AMETHYST, 8);
    }
}
