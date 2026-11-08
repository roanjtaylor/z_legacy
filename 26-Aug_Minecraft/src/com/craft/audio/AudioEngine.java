package com.craft.audio;

import org.lwjgl.openal.AL;
import org.lwjgl.openal.ALC;
import org.lwjgl.openal.ALCCapabilities;
import org.lwjgl.system.MemoryUtil;

import java.nio.ShortBuffer;
import java.util.ArrayList;
import java.util.List;

import static org.lwjgl.openal.AL10.*;
import static org.lwjgl.openal.ALC10.*;

/**
 * OpenAL device, plus a small pool of voices.
 *
 * <p>Every sound is a short mono buffer synthesised at startup and replayed with a random pitch
 * nudge, so a handful of buffers covers a whole session without ever sounding like a loop.
 *
 * <p>Audio is optional: if there is no output device — a headless machine, a broken driver — the
 * engine reports itself disabled and every call becomes a no-op rather than taking the game
 * down with it.
 */
public class AudioEngine {

    private static final int VOICES = 12;

    private long device;
    private long context;
    private boolean enabled;

    private final int[] sources = new int[VOICES];
    private final List<Integer> buffers = new ArrayList<>();
    private int nextVoice;

    public void init() {
        try {
            device = alcOpenDevice((java.nio.ByteBuffer) null);
            if (device == 0L) {
                System.out.println("No audio device; running without sound.");
                return;
            }
            ALCCapabilities capabilities = ALC.createCapabilities(device);
            context = alcCreateContext(device, (java.nio.IntBuffer) null);
            if (context == 0L || !alcMakeContextCurrent(context)) {
                System.out.println("Could not create an audio context; running without sound.");
                return;
            }
            AL.createCapabilities(capabilities);

            for (int i = 0; i < VOICES; i++) {
                sources[i] = alGenSources();
            }
            enabled = true;
        } catch (Throwable t) {
            System.out.println("Audio unavailable (" + t.getMessage() + "); running silent.");
            enabled = false;
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Uploads 16-bit mono PCM and returns its buffer id. */
    public int createBuffer(short[] samples, int sampleRate) {
        if (!enabled) {
            return 0;
        }
        int buffer = alGenBuffers();
        ShortBuffer data = MemoryUtil.memAllocShort(samples.length);
        try {
            data.put(samples).flip();
            alBufferData(buffer, AL_FORMAT_MONO16, data, sampleRate);
        } finally {
            MemoryUtil.memFree(data);
        }
        buffers.add(buffer);
        return buffer;
    }

    /**
     * Plays a buffer on the next free voice. If every voice is busy the oldest is stolen,
     * which is preferable to dropping the sound the player just caused.
     */
    public void play(int buffer, float pitch, float gain) {
        if (!enabled || buffer == 0) {
            return;
        }
        int source = findFreeVoice();
        alSourceStop(source);
        alSourcei(source, AL_BUFFER, buffer);
        alSourcef(source, AL_PITCH, Math.max(0.25f, pitch));
        alSourcef(source, AL_GAIN, Math.max(0f, gain));
        alSourcePlay(source);
    }

    private int findFreeVoice() {
        for (int i = 0; i < VOICES; i++) {
            int source = sources[(nextVoice + i) % VOICES];
            if (alGetSourcei(source, AL_SOURCE_STATE) != AL_PLAYING) {
                nextVoice = (nextVoice + i + 1) % VOICES;
                return source;
            }
        }
        int source = sources[nextVoice];
        nextVoice = (nextVoice + 1) % VOICES;
        return source;
    }

    public void destroy() {
        if (!enabled) {
            return;
        }
        for (int source : sources) {
            alSourceStop(source);
            alDeleteSources(source);
        }
        for (int buffer : buffers) {
            alDeleteBuffers(buffer);
        }
        alcMakeContextCurrent(0L);
        if (context != 0L) {
            alcDestroyContext(context);
        }
        if (device != 0L) {
            alcCloseDevice(device);
        }
        enabled = false;
    }
}
