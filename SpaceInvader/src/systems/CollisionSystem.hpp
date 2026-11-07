#pragma once
#include "entities/Player.hpp"
#include "entities/Enemy.hpp"
#include "entities/EnemyFormation.hpp"
#include "entities/Bullet.hpp"
#include <vector>
#include <functional>

struct CollisionEvent {
    enum Type {
        PlayerBulletHitEnemy,
        EnemyBulletHitPlayer,
        PowerUpCollected
    };
    Type type;
    sf::Vector2f position;
    int scoreValue = 0;
    int enemyIndex = -1;
};

class CollisionSystem {
public:
    std::vector<CollisionEvent> update(
        Player& player,
        EnemyFormation& formation,
        std::vector<Bullet>& playerBullets,
        std::vector<Bullet>& enemyBullets)
    {
        std::vector<CollisionEvent> events;

        auto& enemies = formation.getEnemies();

        // Player bullets vs enemies
        for (auto& bullet : playerBullets) {
            if (!bullet.isAlive()) continue;

            for (int i = 0; i < static_cast<int>(enemies.size()); i++) {
                auto& enemy = enemies[i];
                if (!enemy.isAlive()) continue;

                if (bullet.getBounds().findIntersection(enemy.getBounds())) {
                    bool destroyed = enemy.hit();
                    if (!bullet.isPiercing()) {
                        bullet.setAlive(false);
                    }

                    if (destroyed) {
                        CollisionEvent evt;
                        evt.type = CollisionEvent::PlayerBulletHitEnemy;
                        evt.position = enemy.getPosition();
                        evt.scoreValue = enemy.getScore();
                        evt.enemyIndex = i;
                        events.push_back(evt);
                    }
                    if (!bullet.isPiercing()) break;
                }
            }
        }

        // Enemy bullets vs player
        if (player.isAlive() && !player.isInvincible()) {
            for (auto& bullet : enemyBullets) {
                if (!bullet.isAlive()) continue;

                if (bullet.getBounds().findIntersection(player.getBounds())) {
                    bullet.setAlive(false);
                    player.hit();

                    CollisionEvent evt;
                    evt.type = CollisionEvent::EnemyBulletHitPlayer;
                    evt.position = player.getPosition();
                    events.push_back(evt);
                    break;
                }
            }
        }

        return events;
    }
};
