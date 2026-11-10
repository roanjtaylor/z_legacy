package com.craft.world;

/**
 * The immutable description of one kind of block.
 *
 * <p>Instances are created through {@link Builder} and registered in {@link Blocks}. Texture
 * names are paths under {@code assets/textures/blocks} without the {@code .png}, or
 * {@code gen:<name>} for a tile synthesised at load time by
 * {@link com.craft.render.ProceduralTextures}.
 */
public class BlockType {

    public enum Render {
        /** Air: contributes no geometry. */
        NONE,
        /** A full cube; faces are culled against neighbours. */
        CUBE,
        /** Two crossed quads, for grass tufts and flowers. */
        CROSS
    }

    public final int id;
    public final String name;
    public final String displayName;
    public final Render render;

    /** Texture name per face, indexed by {@link Direction#ordinal()}. */
    private final String[] textures;

    public final boolean solid;
    public final boolean opaque;
    public final boolean liquid;
    public final boolean translucent;
    public final boolean replaceable;

    /**
     * Hide the shared face between two blocks of this type. Right for glass and water, where
     * internal faces would show as seams; wrong for leaves, whose internal faces are what give
     * a canopy its depth.
     */
    public final boolean cullAgainstSelf;

    public final float hardness;
    public final int lightEmission;
    public final int lightAttenuation;

    private BlockType(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.displayName = builder.displayName != null ? builder.displayName : prettify(builder.name);
        this.render = builder.render;
        this.textures = builder.textures;
        this.solid = builder.solid;
        this.opaque = builder.opaque;
        this.liquid = builder.liquid;
        this.translucent = builder.translucent;
        this.replaceable = builder.replaceable;
        this.cullAgainstSelf = builder.cullAgainstSelf;
        this.hardness = builder.hardness;
        this.lightEmission = builder.lightEmission;
        this.lightAttenuation = builder.lightAttenuation;
    }

    private static String prettify(String name) {
        String[] parts = name.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return sb.toString();
    }

    public String textureFor(Direction direction) {
        return textures[direction.ordinal()];
    }

    public boolean isAir() {
        return render == Render.NONE;
    }

    /** True if this block should be shown through — the test used when culling faces. */
    public boolean isSeeThrough() {
        return !opaque;
    }

    public static Builder builder(int id, String name) {
        return new Builder(id, name);
    }

    public static class Builder {
        private final int id;
        private final String name;
        private String displayName;
        private Render render = Render.CUBE;
        private final String[] textures = new String[6];

        private boolean solid = true;
        private boolean opaque = true;
        private boolean liquid = false;
        private boolean translucent = false;
        private boolean replaceable = false;
        private boolean cullAgainstSelf = false;

        private float hardness = 1.0f;
        private int lightEmission = 0;
        private int lightAttenuation = 15;

        Builder(int id, String name) {
            this.id = id;
            this.name = name;
        }

        /** Same texture on all six faces. */
        public Builder texture(String texture) {
            java.util.Arrays.fill(textures, texture);
            return this;
        }

        /** The usual layered block: one texture on top, one around the sides, one underneath. */
        public Builder textures(String top, String side, String bottom) {
            textures[Direction.UP.ordinal()] = top;
            textures[Direction.DOWN.ordinal()] = bottom;
            textures[Direction.NORTH.ordinal()] = side;
            textures[Direction.SOUTH.ordinal()] = side;
            textures[Direction.WEST.ordinal()] = side;
            textures[Direction.EAST.ordinal()] = side;
            return this;
        }

        /** A log or pillar: matching end caps, a different texture around the sides. */
        public Builder pillar(String end, String side) {
            return textures(end, side, end);
        }

        public Builder displayName(String displayName) {
            this.displayName = displayName;
            return this;
        }

        public Builder render(Render render) {
            this.render = render;
            return this;
        }

        public Builder notSolid() {
            this.solid = false;
            return this;
        }

        /** Light passes through and neighbouring faces are not culled against this block. */
        public Builder transparent(int attenuation) {
            this.opaque = false;
            this.lightAttenuation = attenuation;
            return this;
        }

        public Builder liquid() {
            this.liquid = true;
            this.solid = false;
            this.replaceable = true;
            return this;
        }

        /** Drawn in the blended pass rather than the opaque one. */
        public Builder translucent() {
            this.translucent = true;
            return this;
        }

        /** See {@link BlockType#cullAgainstSelf}. */
        public Builder cullAgainstSelf() {
            this.cullAgainstSelf = true;
            return this;
        }

        public Builder replaceable() {
            this.replaceable = true;
            return this;
        }

        public Builder hardness(float hardness) {
            this.hardness = hardness;
            return this;
        }

        /** Negative hardness means the block cannot be broken at all. */
        public Builder unbreakable() {
            this.hardness = -1f;
            return this;
        }

        public Builder emits(int level) {
            this.lightEmission = level;
            return this;
        }

        public BlockType build() {
            if (render != Render.NONE) {
                for (int i = 0; i < textures.length; i++) {
                    if (textures[i] == null) {
                        throw new IllegalStateException(
                                "Block '" + name + "' has no texture for " + Direction.VALUES[i]);
                    }
                }
            }
            return new BlockType(this);
        }
    }
}
