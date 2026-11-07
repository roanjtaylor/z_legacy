package com.craft.render;

import org.joml.Matrix4f;
import org.joml.Vector3f;

/**
 * A yaw/pitch fly camera.
 *
 * <p>Angles are degrees. Yaw of -90 looks down -Z; pitch is clamped just short of vertical so
 * the view matrix never degenerates when looking straight up or down.
 */
public class Camera {

    private static final float PITCH_LIMIT = 89.9f;

    public final Vector3f position = new Vector3f(0, 0, 0);

    private float yaw = -90f;
    private float pitch = 0f;

    private final Vector3f front = new Vector3f(0, 0, -1);
    private final Vector3f right = new Vector3f(1, 0, 0);
    private final Vector3f up = new Vector3f(0, 1, 0);

    private final Matrix4f view = new Matrix4f();
    private final Matrix4f projection = new Matrix4f();

    private float fovDegrees = 70f;
    private float near = 0.1f;
    private float far = 512f;

    public Camera() {
        updateVectors();
    }

    public void addRotation(float deltaYaw, float deltaPitch) {
        yaw += deltaYaw;
        pitch -= deltaPitch;
        if (pitch > PITCH_LIMIT) {
            pitch = PITCH_LIMIT;
        } else if (pitch < -PITCH_LIMIT) {
            pitch = -PITCH_LIMIT;
        }
        // Keep yaw bounded so it stays precise over a long session.
        if (yaw > 360f) {
            yaw -= 360f;
        } else if (yaw < -360f) {
            yaw += 360f;
        }
        updateVectors();
    }

    private void updateVectors() {
        double y = Math.toRadians(yaw);
        double p = Math.toRadians(pitch);
        front.set(
                (float) (Math.cos(y) * Math.cos(p)),
                (float) Math.sin(p),
                (float) (Math.sin(y) * Math.cos(p))).normalize();
        front.cross(0, 1, 0, right).normalize();
        right.cross(front, up).normalize();
    }

    public Matrix4f getViewMatrix() {
        return view.identity().lookAt(
                position.x, position.y, position.z,
                position.x + front.x, position.y + front.y, position.z + front.z,
                up.x, up.y, up.z);
    }

    public Matrix4f getProjectionMatrix(float aspectRatio) {
        return projection.identity()
                .perspective((float) Math.toRadians(fovDegrees), aspectRatio, near, far);
    }

    /** Forward vector flattened onto the XZ plane — the direction walking should follow. */
    public Vector3f getWalkForward(Vector3f dest) {
        dest.set(front.x, 0, front.z);
        if (dest.lengthSquared() > 1e-6f) {
            dest.normalize();
        }
        return dest;
    }

    public Vector3f getFront() {
        return front;
    }

    public Vector3f getRight() {
        return right;
    }

    public Vector3f getUp() {
        return up;
    }

    public float getYaw() {
        return yaw;
    }

    public float getPitch() {
        return pitch;
    }

    public void setRotation(float yaw, float pitch) {
        this.yaw = yaw;
        this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
        updateVectors();
    }

    public float getFovDegrees() {
        return fovDegrees;
    }

    public void setFovDegrees(float fovDegrees) {
        this.fovDegrees = fovDegrees;
    }

    public float getFar() {
        return far;
    }

    public void setFar(float far) {
        this.far = far;
    }

    public float getNear() {
        return near;
    }

    /** Compass heading for the debug overlay. */
    public String facing() {
        float y = ((yaw % 360f) + 360f) % 360f;
        if (y >= 315f || y < 45f) {
            return "east (+X)";
        }
        if (y < 135f) {
            return "south (+Z)";
        }
        if (y < 225f) {
            return "west (-X)";
        }
        return "north (-Z)";
    }
}
