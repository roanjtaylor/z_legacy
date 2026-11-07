package com.craft.world;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The block registry.
 *
 * <p>Ids are stored as a single byte per block in chunks and save files, so they must stay
 * stable once a world has been saved. Names are what {@code level.json} records, which means a
 * world survives ids being reshuffled.
 */
public final class Blocks {

    public static final int MAX_BLOCKS = 256;

    private static final BlockType[] BY_ID = new BlockType[MAX_BLOCKS];
    private static final Map<String, BlockType> BY_NAME = new HashMap<>();
    private static final List<BlockType> PALETTE = new ArrayList<>();

    // -------------------------------------------------------------------- terrain
    public static final BlockType AIR = register(BlockType.builder(0, "air")
            .render(BlockType.Render.NONE).notSolid().transparent(0).replaceable()
            .unbreakable(), false);

    public static final BlockType STONE = register(BlockType.builder(1, "stone")
            .texture("stone_generic").hardness(1.2f));

    public static final BlockType GRASS = register(BlockType.builder(2, "grass_block")
            .textures("grass_top", "grass_side", "dirt").hardness(0.5f));

    public static final BlockType DIRT = register(BlockType.builder(3, "dirt")
            .texture("dirt").hardness(0.4f));

    public static final BlockType SAND = register(BlockType.builder(4, "sand")
            .texture("sand_ugly").hardness(0.4f));

    public static final BlockType GRAVEL = register(BlockType.builder(5, "gravel")
            .texture("gravel").hardness(0.5f));

    public static final BlockType WATER = register(BlockType.builder(6, "water")
            .texture("gen:water").liquid().transparent(1).translucent().cullAgainstSelf()
            .unbreakable(), false);

    public static final BlockType BEDROCK = register(BlockType.builder(7, "bedrock")
            .texture("gabbro").unbreakable(), false);

    public static final BlockType SANDSTONE = register(BlockType.builder(8, "sandstone")
            .texture("sandstone").hardness(1.0f));

    public static final BlockType SNOWY_GRASS = register(BlockType.builder(9, "snowy_grass_block")
            .textures("snow", "grass_snowy_side", "dirt").hardness(0.5f));

    public static final BlockType SNOW = register(BlockType.builder(10, "snow")
            .texture("snow").hardness(0.3f));

    public static final BlockType ICE = register(BlockType.builder(11, "ice")
            .texture("ice_glacier").hardness(0.6f).transparent(1).translucent()
            .cullAgainstSelf());

    public static final BlockType MUD = register(BlockType.builder(12, "mud")
            .texture("mud").hardness(0.5f));

    // ----------------------------------------------------------------------- ores
    public static final BlockType COAL_ORE = register(BlockType.builder(13, "coal_ore")
            .texture("gen:coal_ore").hardness(1.8f));

    public static final BlockType IRON_ORE = register(BlockType.builder(14, "iron_ore")
            .texture("gen:iron_ore").hardness(2.0f));

    public static final BlockType GOLD_ORE = register(BlockType.builder(15, "gold_ore")
            .texture("gen:gold_ore").hardness(2.2f));

    public static final BlockType DIAMOND_ORE = register(BlockType.builder(16, "diamond_ore")
            .texture("gen:diamond_ore").hardness(2.6f));

    // ----------------------------------------------------------------------- wood
    public static final BlockType OAK_LOG = register(BlockType.builder(17, "oak_log")
            .pillar("oak_log_top", "oak_log_side").hardness(1.0f));

    public static final BlockType OAK_LEAVES = register(BlockType.builder(18, "oak_leaves")
            .texture("oak_leaves").hardness(0.2f).transparent(1).cullAgainstSelf());

    public static final BlockType OAK_PLANKS = register(BlockType.builder(19, "oak_planks")
            .texture("oak_planks").hardness(1.0f));

    public static final BlockType PINE_LOG = register(BlockType.builder(20, "pine_log")
            .pillar("pine_log_top", "pine_log_side").hardness(1.0f));

    public static final BlockType PINE_LEAVES = register(BlockType.builder(21, "pine_leaves")
            .texture("pine_leaves").hardness(0.2f).transparent(1).cullAgainstSelf());

    public static final BlockType PINE_PLANKS = register(BlockType.builder(22, "pine_planks")
            .texture("pine_planks").hardness(1.0f));

    public static final BlockType BEECH_LOG = register(BlockType.builder(23, "beech_log")
            .pillar("beech_log_top", "beech_log_side").hardness(1.0f));

    public static final BlockType BEECH_LEAVES = register(BlockType.builder(24, "beech_leaves")
            .texture("beech_leaves").hardness(0.2f).transparent(1).cullAgainstSelf());

    public static final BlockType BEECH_PLANKS = register(BlockType.builder(25, "beech_planks")
            .texture("beech_planks").hardness(1.0f));

    // ------------------------------------------------------------------- building
    public static final BlockType COBBLESTONE = register(BlockType.builder(26, "cobblestone")
            .texture("cobblestone").hardness(1.4f));

    public static final BlockType MOSSY_COBBLESTONE = register(
            BlockType.builder(27, "mossy_cobblestone")
                    .texture("cobblestone_mossy").hardness(1.4f));

    public static final BlockType STONE_BRICKS = register(BlockType.builder(28, "stone_bricks")
            .texture("cobblestone_bricks").hardness(1.4f));

    public static final BlockType GRANITE = register(BlockType.builder(29, "granite")
            .texture("granite").hardness(1.3f));

    public static final BlockType DIORITE = register(BlockType.builder(30, "diorite")
            .texture("diorite").hardness(1.3f));

    public static final BlockType LIMESTONE = register(BlockType.builder(31, "limestone")
            .texture("limestone").hardness(1.2f));

    public static final BlockType MARBLE = register(BlockType.builder(32, "marble")
            .texture("marble").hardness(1.3f));

    public static final BlockType SLATE = register(BlockType.builder(33, "slate")
            .texture("slate").hardness(1.3f));

    public static final BlockType BASALT = register(BlockType.builder(34, "basalt")
            .texture("basalt").hardness(1.4f));

    public static final BlockType OBSIDIAN = register(BlockType.builder(35, "obsidian")
            .texture("obsidian").hardness(4.0f));

    public static final BlockType SANDSTONE_BRICKS = register(
            BlockType.builder(36, "sandstone_bricks")
                    .texture("sandstone_bricks").hardness(1.0f));

    public static final BlockType MARBLE_BRICKS = register(BlockType.builder(37, "marble_bricks")
            .texture("marble_bricks").hardness(1.3f));

    public static final BlockType MUD_BRICKS = register(BlockType.builder(38, "mud_bricks")
            .texture("mud_bricks").hardness(0.9f));

    public static final BlockType LIMESTONE_BRICKS = register(
            BlockType.builder(39, "limestone_bricks")
                    .texture("limestone_bricks").hardness(1.2f));

    public static final BlockType GRANITE_BRICKS = register(BlockType.builder(40, "granite_bricks")
            .texture("granite_bricks").hardness(1.3f));

    public static final BlockType GLASS = register(BlockType.builder(41, "glass")
            .texture("glass").hardness(0.3f).transparent(0).cullAgainstSelf());

    public static final BlockType HAY = register(BlockType.builder(42, "hay_bale")
            .pillar("hay_top", "hay_side").hardness(0.5f));

    public static final BlockType FARMLAND = register(BlockType.builder(43, "farmland")
            .texture("farmland").hardness(0.4f));

    public static final BlockType AMETHYST = register(BlockType.builder(44, "amethyst")
            .texture("amethyst").hardness(1.5f).emits(6));

    public static final BlockType SLATE_TILES = register(BlockType.builder(45, "slate_tiles")
            .texture("slate_tiles").hardness(1.3f));

    public static final BlockType SERPENTINE = register(BlockType.builder(46, "serpentine")
            .texture("serpentine").hardness(1.3f));

    // --------------------------------------------------------------------- plants
    public static final BlockType TALL_GRASS = register(plant(47, "tall_grass", "plants/grass"));
    public static final BlockType FERN = register(plant(48, "fern", "plants/fern"));
    public static final BlockType DANDELION = register(plant(49, "dandelion", "plants/dandelion"));
    public static final BlockType DAISY = register(plant(50, "oxeye_daisy", "plants/oxeye_daisy"));
    public static final BlockType ASTER = register(plant(51, "aster", "plants/aster"));
    public static final BlockType LUPINE = register(plant(52, "lupine", "plants/lupine"));
    public static final BlockType RED_MUSHROOM = register(
            plant(53, "red_mushroom", "plants/mushroom_red"));
    public static final BlockType BROWN_MUSHROOM = register(
            plant(54, "brown_mushroom", "plants/mushroom_brown"));
    public static final BlockType PRICKLY_PEAR = register(
            plant(55, "prickly_pear", "plants/cactus_pricklypear"));
    public static final BlockType SAGEBRUSH = register(plant(56, "sagebrush", "plants/sagebrush"));
    public static final BlockType OAK_SAPLING = register(
            plant(57, "oak_sapling", "plants/sapling_oak"));
    public static final BlockType SEA_THRIFT = register(
            plant(58, "sea_thrift", "plants/sea_thrift"));

    private Blocks() {
    }

    private static BlockType.Builder plant(int id, String name, String texture) {
        return BlockType.builder(id, name)
                .render(BlockType.Render.CROSS)
                .texture(texture)
                .notSolid()
                .transparent(0)
                .replaceable()
                .hardness(0.05f);
    }

    private static BlockType register(BlockType.Builder builder) {
        return register(builder, true);
    }

    private static BlockType register(BlockType.Builder builder, boolean inPalette) {
        BlockType type = builder.build();
        if (BY_ID[type.id] != null) {
            throw new IllegalStateException(
                    "Duplicate block id " + type.id + " for '" + type.name + "'");
        }
        BY_ID[type.id] = type;
        BY_NAME.put(type.name, type);
        if (inPalette) {
            PALETTE.add(type);
        }
        return type;
    }

    public static BlockType byId(int id) {
        if (id < 0 || id >= MAX_BLOCKS) {
            return AIR;
        }
        BlockType type = BY_ID[id];
        return type != null ? type : AIR;
    }

    public static BlockType byName(String name) {
        return BY_NAME.get(name);
    }

    /** Every block offered in the creative inventory, in registration order. */
    public static List<BlockType> palette() {
        return PALETTE;
    }

    /**
     * Every distinct texture name any registered block uses, in a stable order so texture
     * array layer indices stay the same between runs.
     */
    public static java.util.LinkedHashSet<String> textureNames() {
        java.util.LinkedHashSet<String> names = new java.util.LinkedHashSet<>();
        for (BlockType type : all()) {
            if (type.render == BlockType.Render.NONE) {
                continue;
            }
            for (Direction direction : Direction.VALUES) {
                names.add(type.textureFor(direction));
            }
        }
        return names;
    }

    /** Every registered block, air included. */
    public static List<BlockType> all() {
        List<BlockType> list = new ArrayList<>();
        for (BlockType type : BY_ID) {
            if (type != null) {
                list.add(type);
            }
        }
        return list;
    }
}
