package com.craft.render;

import com.craft.world.Sky;
import org.joml.Matrix4f;

import static org.lwjgl.opengl.GL33.*;

/**
 * Draws the sky as a single fullscreen triangle at the far plane.
 *
 * <p>No geometry is uploaded: the vertex shader derives its positions from {@code gl_VertexID}
 * and unprojects each pixel to a world-space view ray. A vertex array object still has to be
 * bound, because the core profile forbids drawing without one even when nothing is read from it.
 */
public class SkyRenderer {

    private final Shader shader;
    private final int emptyVao;
    private final Matrix4f inverseViewProjection = new Matrix4f();
    private final Matrix4f rotationOnlyView = new Matrix4f();

    public SkyRenderer() {
        this.shader = Shader.load("sky");
        this.emptyVao = glGenVertexArrays();
    }

    public void render(Sky sky, Matrix4f projection, Matrix4f view) {
        // The sky is infinitely far away, so drop the camera translation and keep only its
        // rotation; otherwise the horizon would slide as the player walks.
        rotationOnlyView.set(view).setTranslation(0, 0, 0);
        inverseViewProjection.set(projection).mul(rotationOnlyView).invert();

        boolean depthWasEnabled = glIsEnabled(GL_DEPTH_TEST);
        glDisable(GL_DEPTH_TEST);
        glDepthMask(false);

        shader.bind();
        shader.setMatrix4("uInverseViewProjection", inverseViewProjection);
        shader.setVector3("uZenithColour", sky.getZenithColour());
        shader.setVector3("uHorizonColour", sky.getHorizonColour());
        shader.setVector3("uSunDirection", sky.getSunDirection());
        shader.setVector3("uSunColour", sky.getSunColour());
        shader.setFloat("uDaylight", sky.getSkyLightFactor());

        glBindVertexArray(emptyVao);
        glDrawArrays(GL_TRIANGLES, 0, 3);
        glBindVertexArray(0);

        Shader.unbind();

        glDepthMask(true);
        if (depthWasEnabled) {
            glEnable(GL_DEPTH_TEST);
        }
    }

    public void destroy() {
        glDeleteVertexArrays(emptyVao);
        shader.destroy();
    }
}
