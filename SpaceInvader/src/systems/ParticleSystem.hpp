#pragma once
#include <SFML/Graphics.hpp>
#include "core/Constants.hpp"
#include <cmath>
#include <cstdlib>

struct Particle {
    sf::Vector2f position;
    sf::Vector2f velocity;
    sf::Color color;
    float lifetime = 0.f;
    float maxLifetime = 1.f;
    float size = 3.f;
    bool alive = false;
};

class ParticleSystem {
public:
    ParticleSystem() {
        m_particles.resize(Constants::MAX_PARTICLES);
        m_vertices.setPrimitiveType(sf::PrimitiveType::Triangles);
    }

    void emit(sf::Vector2f pos, sf::Color color, int count, float speed = 200.f, float lifetime = 0.8f) {
        for (int i = 0; i < count; i++) {
            Particle* p = getFreeParticle();
            if (!p) return;

            float angle = static_cast<float>(std::rand() % 360) * 3.14159f / 180.f;
            float spd = speed * (0.3f + static_cast<float>(std::rand() % 70) / 100.f);

            p->position = pos;
            p->velocity = {std::cos(angle) * spd, std::sin(angle) * spd};
            p->color = color;
            p->lifetime = lifetime * (0.5f + static_cast<float>(std::rand() % 50) / 100.f);
            p->maxLifetime = p->lifetime;
            p->size = 2.f + static_cast<float>(std::rand() % 30) / 10.f;
            p->alive = true;
        }
    }

    void emitExplosion(sf::Vector2f pos, sf::Color color) {
        emit(pos, color, 30, 250.f, 0.8f);
    }

    void emitBossExplosion(sf::Vector2f pos) {
        emit(pos, sf::Color(255, 100, 0), 80, 400.f, 1.5f);
        emit(pos, sf::Color(255, 255, 100), 40, 300.f, 1.0f);
        emit(pos, sf::Color::White, 20, 200.f, 0.5f);
    }

    void emitTrail(sf::Vector2f pos, sf::Color color) {
        emit(pos, color, 2, 50.f, 0.3f);
    }

    void update(float dt) {
        for (auto& p : m_particles) {
            if (!p.alive) continue;

            p.lifetime -= dt;
            if (p.lifetime <= 0.f) {
                p.alive = false;
                continue;
            }

            p.velocity.y += 50.f * dt; // slight gravity
            p.position += p.velocity * dt;
            p.velocity *= (1.0f - 2.0f * dt); // drag
        }
    }

    void draw(sf::RenderTarget& target) {
        m_vertices.clear();

        for (const auto& p : m_particles) {
            if (!p.alive) continue;

            float alpha = p.lifetime / p.maxLifetime;
            sf::Color c = p.color;
            c.a = static_cast<uint8_t>(alpha * 255.f);

            float s = p.size * alpha;

            // Triangle particle
            sf::Vertex v0, v1, v2;
            v0.position = {p.position.x, p.position.y - s};
            v1.position = {p.position.x - s, p.position.y + s};
            v2.position = {p.position.x + s, p.position.y + s};
            v0.color = v1.color = v2.color = c;

            m_vertices.append(v0);
            m_vertices.append(v1);
            m_vertices.append(v2);
        }

        target.draw(m_vertices, sf::BlendAdd);
    }

private:
    Particle* getFreeParticle() {
        for (auto& p : m_particles) {
            if (!p.alive) return &p;
        }
        return nullptr;
    }

    std::vector<Particle> m_particles;
    sf::VertexArray m_vertices;
};
