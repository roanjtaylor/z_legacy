package com.craft.render;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.List;

/**
 * A pixel font, baked at startup into the block texture array.
 *
 * <p>Rather than hand-encoding glyph bitmaps, the JDK's own font rasteriser draws printable
 * ASCII into 16x16 cells with antialiasing turned off — which is exactly the size of a block
 * texture, so the glyphs can live as extra layers of the same texture array. The whole HUD,
 * text included, then stays a single draw call.
 */
public class BitmapFont {

    public static final int FIRST_CHAR = 32;
    public static final int LAST_CHAR = 126;
    public static final int GLYPH_COUNT = LAST_CHAR - FIRST_CHAR + 1;

    private static final int CELL = TextureArray.TILE_SIZE;

    private int baseLayer;
    private float advanceRatio = 0.5f;

    /** Rasterises every printable ASCII character into its own 16x16 cell. */
    public List<BufferedImage> render() {
        List<BufferedImage> glyphs = new ArrayList<>(GLYPH_COUNT);

        // A monospaced logical font is guaranteed present on every JRE, and a fixed advance
        // keeps layout arithmetic trivial.
        Font font = new Font(Font.MONOSPACED, Font.BOLD, 14);

        BufferedImage probe = new BufferedImage(CELL, CELL, BufferedImage.TYPE_INT_ARGB);
        Graphics2D probeGraphics = probe.createGraphics();
        probeGraphics.setFont(font);
        FontMetrics metrics = probeGraphics.getFontMetrics();
        int advance = Math.max(1, metrics.charWidth('M'));
        int baseline = Math.min(CELL - 1, metrics.getAscent());
        probeGraphics.dispose();

        advanceRatio = advance / (float) CELL;

        for (int code = FIRST_CHAR; code <= LAST_CHAR; code++) {
            BufferedImage image = new BufferedImage(CELL, CELL, BufferedImage.TYPE_INT_ARGB);
            Graphics2D graphics = image.createGraphics();
            // Antialiasing would leave soft grey fringes that read as blur next to the
            // hard-edged block textures.
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING,
                    RenderingHints.VALUE_TEXT_ANTIALIAS_OFF);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                    RenderingHints.VALUE_ANTIALIAS_OFF);
            graphics.setFont(font);
            graphics.setColor(Color.WHITE);
            graphics.drawString(String.valueOf((char) code), 1, baseline);
            graphics.dispose();
            glyphs.add(image);
        }
        return glyphs;
    }

    /** Told to the font once the texture array knows where its glyphs landed. */
    public void setBaseLayer(int baseLayer) {
        this.baseLayer = baseLayer;
    }

    public int layerOf(char character) {
        if (character < FIRST_CHAR || character > LAST_CHAR) {
            character = '?';
        }
        return baseLayer + (character - FIRST_CHAR);
    }

    /** Horizontal distance from one character to the next, at a given glyph size. */
    public float advance(float size) {
        return size * advanceRatio;
    }

    public float width(String text, float size) {
        return text.length() * advance(size);
    }

    public void draw(HudRenderer hud, String text, float x, float y, float size,
                     float r, float g, float b, float a) {
        float cursor = x;
        for (int i = 0; i < text.length(); i++) {
            char character = text.charAt(i);
            if (character != ' ') {
                hud.glyph(cursor, y, size, layerOf(character), r, g, b, a);
            }
            cursor += advance(size);
        }
    }

    /** Draws with a one-pixel drop shadow, which keeps text legible over any background. */
    public void drawShadowed(HudRenderer hud, String text, float x, float y, float size,
                             float r, float g, float b, float a) {
        float offset = Math.max(1f, size / 16f);
        draw(hud, text, x + offset, y + offset, size, 0f, 0f, 0f, a * 0.7f);
        draw(hud, text, x, y, size, r, g, b, a);
    }

    public void drawCentred(HudRenderer hud, String text, float centreX, float y, float size,
                            float r, float g, float b, float a) {
        drawShadowed(hud, text, centreX - width(text, size) / 2f, y, size, r, g, b, a);
    }
}
