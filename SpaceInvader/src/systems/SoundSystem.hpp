#pragma once
#include <SFML/Audio.hpp>
#include <vector>
#include <cmath>
#include <cstdint>
#include <memory>

class SoundSystem {
public:
    enum SoundId {
        Shoot,
        EnemyDeath,
        PlayerHit,
        PowerUpCollect,
        BossHit,
        BossDeath,
        MenuSelect,
        MenuMove,
        COUNT
    };

    SoundSystem() {
        generateSounds();
    }

    void play(SoundId sound) {
        if (sound >= COUNT) return;

        // Find free sound slot or reuse oldest
        for (auto& s : m_activeSounds) {
            if (s->getStatus() != sf::Sound::Status::Playing) {
                s->stop();
                // Recreate with new buffer
                s = std::make_unique<sf::Sound>(m_buffers[sound]);
                s->play();
                return;
            }
        }
        // All busy - replace first
        m_activeSounds[0] = std::make_unique<sf::Sound>(m_buffers[sound]);
        m_activeSounds[0]->play();
    }

private:
    void generateSounds() {
        m_buffers.resize(COUNT);

        // Shoot: short high beep
        generateTone(m_buffers[Shoot], 880.f, 0.08f, 0.3f, true);

        // Enemy death: descending sweep
        generateSweep(m_buffers[EnemyDeath], 600.f, 100.f, 0.15f, 0.3f);

        // Player hit: low rumble
        generateTone(m_buffers[PlayerHit], 120.f, 0.3f, 0.5f, true);

        // Power-up collect: ascending sweep
        generateSweep(m_buffers[PowerUpCollect], 400.f, 1200.f, 0.2f, 0.3f);

        // Boss hit: mid thud
        generateTone(m_buffers[BossHit], 200.f, 0.1f, 0.4f, false);

        // Boss death: big explosion
        generateNoise(m_buffers[BossDeath], 0.5f, 0.6f);

        // Menu select
        generateTone(m_buffers[MenuSelect], 660.f, 0.1f, 0.2f, false);

        // Menu move
        generateTone(m_buffers[MenuMove], 440.f, 0.05f, 0.15f, false);

        // Initialize active sounds with first buffer
        for (auto& s : m_activeSounds) {
            s = std::make_unique<sf::Sound>(m_buffers[0]);
        }
    }

    void generateTone(sf::SoundBuffer& buffer, float freq, float duration,
                      float volume, bool square) {
        unsigned int sampleRate = 44100;
        unsigned int sampleCount = static_cast<unsigned int>(sampleRate * duration);
        std::vector<int16_t> samples(sampleCount);

        for (unsigned int i = 0; i < sampleCount; i++) {
            float t = static_cast<float>(i) / sampleRate;
            float envelope = 1.0f - t / duration;
            envelope *= envelope;

            float sample;
            if (!square) {
                sample = std::sin(2.f * 3.14159f * freq * t);
            } else {
                sample = std::sin(2.f * 3.14159f * freq * t) > 0 ? 1.f : -1.f;
            }

            samples[i] = static_cast<int16_t>(sample * envelope * volume * 32767.f);
        }

        std::vector<sf::SoundChannel> channelMap = {sf::SoundChannel::Mono};
        buffer.loadFromSamples(samples.data(), sampleCount, 1, sampleRate, channelMap);
    }

    void generateSweep(sf::SoundBuffer& buffer, float startFreq, float endFreq,
                       float duration, float volume) {
        unsigned int sampleRate = 44100;
        unsigned int sampleCount = static_cast<unsigned int>(sampleRate * duration);
        std::vector<int16_t> samples(sampleCount);

        for (unsigned int i = 0; i < sampleCount; i++) {
            float t = static_cast<float>(i) / sampleRate;
            float progress = t / duration;
            float freq = startFreq + (endFreq - startFreq) * progress;
            float envelope = 1.0f - progress;

            float sample = std::sin(2.f * 3.14159f * freq * t);
            samples[i] = static_cast<int16_t>(sample * envelope * volume * 32767.f);
        }

        std::vector<sf::SoundChannel> channelMap = {sf::SoundChannel::Mono};
        buffer.loadFromSamples(samples.data(), sampleCount, 1, sampleRate, channelMap);
    }

    void generateNoise(sf::SoundBuffer& buffer, float duration, float volume) {
        unsigned int sampleRate = 44100;
        unsigned int sampleCount = static_cast<unsigned int>(sampleRate * duration);
        std::vector<int16_t> samples(sampleCount);

        for (unsigned int i = 0; i < sampleCount; i++) {
            float t = static_cast<float>(i) / sampleRate;
            float envelope = 1.0f - t / duration;
            envelope *= envelope;

            float sample = static_cast<float>(std::rand()) / RAND_MAX * 2.f - 1.f;
            float freq = 150.f;
            sample *= std::sin(2.f * 3.14159f * freq * t);
            samples[i] = static_cast<int16_t>(sample * envelope * volume * 32767.f);
        }

        std::vector<sf::SoundChannel> channelMap = {sf::SoundChannel::Mono};
        buffer.loadFromSamples(samples.data(), sampleCount, 1, sampleRate, channelMap);
    }

    std::vector<sf::SoundBuffer> m_buffers;
    std::array<std::unique_ptr<sf::Sound>, 16> m_activeSounds;
};
