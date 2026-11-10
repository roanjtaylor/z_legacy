package com.craft.render;

import org.joml.Matrix4f;
import org.joml.Vector3f;
import org.lwjgl.system.MemoryStack;

import java.io.IOException;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.lwjgl.opengl.GL33.*;

/** A compiled and linked vertex + fragment shader program, with cached uniform locations. */
public class Shader {

    private final int programId;
    private final Map<String, Integer> uniformCache = new HashMap<>();

    private Shader(int programId) {
        this.programId = programId;
    }

    /** Loads a shader pair from {@code assets/shaders/<name>.vert} and {@code .frag}. */
    public static Shader load(String name) {
        Path dir = Path.of("assets", "shaders");
        String vertexSource = read(dir.resolve(name + ".vert"));
        String fragmentSource = read(dir.resolve(name + ".frag"));
        return compile(name, vertexSource, fragmentSource);
    }

    private static String read(Path path) {
        try {
            return Files.readString(path);
        } catch (IOException e) {
            throw new RuntimeException("Could not read shader " + path.toAbsolutePath(), e);
        }
    }

    private static Shader compile(String name, String vertexSource, String fragmentSource) {
        int vertex = compileStage(name + ".vert", GL_VERTEX_SHADER, vertexSource);
        int fragment = compileStage(name + ".frag", GL_FRAGMENT_SHADER, fragmentSource);

        int program = glCreateProgram();
        glAttachShader(program, vertex);
        glAttachShader(program, fragment);
        glLinkProgram(program);

        if (glGetProgrami(program, GL_LINK_STATUS) == GL_FALSE) {
            String log = glGetProgramInfoLog(program);
            throw new RuntimeException("Failed to link shader '" + name + "':\n" + log);
        }

        // Shader objects live on only as long as they are attached; detach so they are
        // freed with the program.
        glDetachShader(program, vertex);
        glDetachShader(program, fragment);
        glDeleteShader(vertex);
        glDeleteShader(fragment);

        return new Shader(program);
    }

    private static int compileStage(String label, int type, String source) {
        int id = glCreateShader(type);
        glShaderSource(id, source);
        glCompileShader(id);
        if (glGetShaderi(id, GL_COMPILE_STATUS) == GL_FALSE) {
            String log = glGetShaderInfoLog(id);
            glDeleteShader(id);
            throw new RuntimeException("Failed to compile " + label + ":\n" + log);
        }
        return id;
    }

    public void bind() {
        glUseProgram(programId);
    }

    public static void unbind() {
        glUseProgram(0);
    }

    private int location(String name) {
        return uniformCache.computeIfAbsent(name, n -> glGetUniformLocation(programId, n));
    }

    public void setMatrix4(String name, Matrix4f value) {
        try (MemoryStack stack = MemoryStack.stackPush()) {
            FloatBuffer buffer = stack.mallocFloat(16);
            value.get(buffer);
            glUniformMatrix4fv(location(name), false, buffer);
        }
    }

    public void setVector3(String name, Vector3f value) {
        glUniform3f(location(name), value.x, value.y, value.z);
    }

    public void setVector3(String name, float x, float y, float z) {
        glUniform3f(location(name), x, y, z);
    }

    public void setVector4(String name, float x, float y, float z, float w) {
        glUniform4f(location(name), x, y, z, w);
    }

    public void setFloat(String name, float value) {
        glUniform1f(location(name), value);
    }

    public void setInt(String name, int value) {
        glUniform1i(location(name), value);
    }

    public void setBoolean(String name, boolean value) {
        glUniform1i(location(name), value ? 1 : 0);
    }

    public void destroy() {
        glDeleteProgram(programId);
    }
}
