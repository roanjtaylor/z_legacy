#pragma once
#include "entities/Enemy.hpp"
#include "entities/Bullet.hpp"
#include "core/Constants.hpp"
#include <vector>
#include <cstdlib>
#include <cmath>

class EnemyFormation {
public:
    void init(int rows, int cols, float speedMult = 1.0f, int wave = 1) {
        m_enemies.clear();
        m_rows = rows;
        m_cols = cols;
        m_direction = 1.f;
        m_moveTimer = 0.f;
        m_shootTimer = 0.f;
        m_speedMultiplier = speedMult;
        m_wave = wave;
        m_baseX = Constants::ENEMY_START_X;
        m_baseY = Constants::ENEMY_START_Y;
        m_offsetX = 0.f;
        m_offsetY = 0.f;

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                Enemy enemy;
                EnemyType type = EnemyType::Basic;

                // Type assignment based on wave and row
                if (wave >= 4) {
                    if (r == 0) type = EnemyType::Shooter;
                    else if (r == 1 && wave >= 6) type = EnemyType::Tank;
                    else if (r >= rows - 1 && wave >= 5) type = EnemyType::Fast;
                }

                float x = m_baseX + c * Constants::ENEMY_SPACING_X;
                float y = m_baseY + r * Constants::ENEMY_SPACING_Y;
                enemy.init({x, y}, type, r, c);
                m_enemies.push_back(enemy);
            }
        }
    }

    void update(float dt, std::vector<Bullet>& enemyBullets) {
        int aliveCount = getAliveCount();
        if (aliveCount == 0) return;

        // Speed increases as enemies die
        float speedBoost = 1.0f + (1.0f - static_cast<float>(aliveCount) /
            static_cast<float>(m_rows * m_cols)) * 2.0f;
        float moveInterval = 0.8f / (m_speedMultiplier * speedBoost);

        m_moveTimer += dt;
        if (m_moveTimer >= moveInterval) {
            m_moveTimer = 0.f;
            moveStep();
        }

        // Update enemy positions based on formation offset
        for (auto& enemy : m_enemies) {
            if (!enemy.isAlive()) continue;
            float x = m_baseX + enemy.getCol() * Constants::ENEMY_SPACING_X + m_offsetX;
            float y = m_baseY + enemy.getRow() * Constants::ENEMY_SPACING_Y + m_offsetY;
            enemy.setPosition({x, y});
            enemy.update(dt);
        }

        // Enemy shooting
        float shootInterval = Constants::ENEMY_SHOOT_INTERVAL / m_speedMultiplier;
        m_shootTimer += dt;
        if (m_shootTimer >= shootInterval) {
            m_shootTimer = 0.f;
            tryShoot(enemyBullets);
        }
    }

    void draw(sf::RenderTarget& target) {
        for (auto& enemy : m_enemies) {
            if (enemy.isAlive()) enemy.draw(target);
        }
    }

    std::vector<Enemy>& getEnemies() { return m_enemies; }

    int getAliveCount() const {
        int count = 0;
        for (const auto& e : m_enemies) {
            if (e.isAlive()) count++;
        }
        return count;
    }

    bool hasReachedBottom() const {
        for (const auto& e : m_enemies) {
            if (e.isAlive() && e.getPosition().y >= Constants::PLAYER_Y - 40.f) {
                return true;
            }
        }
        return false;
    }

private:
    void moveStep() {
        float step = Constants::ENEMY_BASE_SPEED * m_speedMultiplier;
        m_offsetX += step * m_direction;

        // Check bounds
        float leftmost = 9999.f, rightmost = -9999.f;
        for (const auto& e : m_enemies) {
            if (!e.isAlive()) continue;
            float x = m_baseX + e.getCol() * Constants::ENEMY_SPACING_X + m_offsetX;
            if (x < leftmost) leftmost = x;
            if (x > rightmost) rightmost = x;
        }

        if (rightmost > Constants::WINDOW_WIDTH - 40.f || leftmost < 40.f) {
            m_direction *= -1.f;
            m_offsetY += Constants::ENEMY_DROP_DISTANCE;
        }
    }

    void tryShoot(std::vector<Bullet>& bullets) {
        // Find bottom-most alive enemies per column
        std::vector<Enemy*> shooters;
        for (int c = 0; c < m_cols; c++) {
            Enemy* bottomEnemy = nullptr;
            for (auto& e : m_enemies) {
                if (e.isAlive() && e.getCol() == c) {
                    if (!bottomEnemy || e.getRow() > bottomEnemy->getRow()) {
                        bottomEnemy = &e;
                    }
                }
            }
            if (bottomEnemy) shooters.push_back(bottomEnemy);
        }

        if (shooters.empty()) return;

        // Random shooter (weighted by type)
        int idx = std::rand() % static_cast<int>(shooters.size());
        Enemy* shooter = shooters[idx];

        // Find a free bullet slot
        for (auto& b : bullets) {
            if (!b.isAlive()) {
                float speed = Constants::ENEMY_BULLET_SPEED * m_speedMultiplier;
                b.init(shooter->getPosition() + sf::Vector2f(0.f, Constants::ENEMY_SIZE),
                       {0.f, speed}, BulletType::Enemy);
                break;
            }
        }
    }

    std::vector<Enemy> m_enemies;
    int m_rows = 0;
    int m_cols = 0;
    float m_direction = 1.f;
    float m_moveTimer = 0.f;
    float m_shootTimer = 0.f;
    float m_speedMultiplier = 1.0f;
    int m_wave = 1;
    float m_baseX = 0.f;
    float m_baseY = 0.f;
    float m_offsetX = 0.f;
    float m_offsetY = 0.f;
};
