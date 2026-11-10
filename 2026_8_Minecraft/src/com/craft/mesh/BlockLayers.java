package com.craft.mesh;

import com.craft.render.TextureArray;
import com.craft.world.BlockType;
import com.craft.world.Blocks;
import com.craft.world.Direction;

/**
 * Flat lookup from (block id, face) to texture array layer.
 *
 * <p>Built once on the main thread after the textures are uploaded. Meshing runs on worker
 * threads and hits this table millions of times per chunk, so it is a plain int array rather
 * than a map: no hashing, no synchronisation, nothing to get wrong across threads.
 */
public class BlockLayers {

    private final int[] layers = new int[Blocks.MAX_BLOCKS * 6];

    public BlockLayers(TextureArray textures) {
        for (BlockType type : Blocks.all()) {
            if (type.render == BlockType.Render.NONE) {
                continue;
            }
            for (Direction direction : Direction.VALUES) {
                layers[type.id * 6 + direction.ordinal()] =
                        textures.layerOf(type.textureFor(direction));
            }
        }
    }

    public int layer(int blockId, Direction direction) {
        return layers[blockId * 6 + direction.ordinal()];
    }

    public int layer(int blockId, int faceOrdinal) {
        return layers[blockId * 6 + faceOrdinal];
    }
}
