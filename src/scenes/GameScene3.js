import { BaseScene } from './BaseScene';
import { StrongEnemy } from './EnemyTypes';

export class GameScene3 extends BaseScene {
    constructor() {
        super({ key: 'GameScene3' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#3A3A3A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 3', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene
        this.nextSceneName = 'GameScene4';
        
        // Create enemy group
        this.enemies = this.physics.add.group();

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create four strong enemies at different positions
            this.enemy1 = new StrongEnemy(this, width * 0.3, enemyY);  // Left
            this.enemy2 = new StrongEnemy(this, width * 0.5, enemyY);  // Middle-left
            this.enemy3 = new StrongEnemy(this, width * 0.7, enemyY);  // Middle-right
            this.enemy4 = new StrongEnemy(this, width * 0.9, enemyY);  // Right

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);
            this.enemies.add(this.enemy3.sprite);
            this.enemies.add(this.enemy4.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);

            // Set number of enemies
            this.remainingEnemies = 4;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3, this.enemy4].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();
        if (this.enemy3) this.enemy3.update();
        if (this.enemy4) this.enemy4.update();

        if (this.player.x > this.scale.width - 20) {
            this.scene.start('GameScene4');
        }
    }
}
