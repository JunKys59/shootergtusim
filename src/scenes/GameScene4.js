import { BaseScene } from './BaseScene';
import { StrongEnemy } from './EnemyTypes';

export class GameScene4 extends BaseScene {
    constructor() {
        super({ key: 'GameScene4' });
    }

    preload() {
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2A2A2A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Create victory music with volume control
        this.victoryMusic = this.sound.add('victoryMusic', { volume: 0.3 });

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 4', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene (could be victory scene or back to start)
        this.nextSceneName = 'GameScene1';
        
        // Create enemy group
        this.enemies = this.physics.add.group();

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create five strong enemies at different positions
            this.enemy1 = new StrongEnemy(this, width * 0.2, enemyY);  // Far left
            this.enemy2 = new StrongEnemy(this, width * 0.4, enemyY);  // Left
            this.enemy3 = new StrongEnemy(this, width * 0.6, enemyY);  // Middle
            this.enemy4 = new StrongEnemy(this, width * 0.8, enemyY);  // Right
            this.enemy5 = new StrongEnemy(this, width * 0.95, enemyY); // Far right

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);
            this.enemies.add(this.enemy3.sprite);
            this.enemies.add(this.enemy4.sprite);
            this.enemies.add(this.enemy5.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);

            // Set number of enemies
            this.remainingEnemies = 5;
        });

        // Flag to track if all enemies are defeated
        this.allEnemiesDefeated = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
            this.remainingEnemies--;
            if (this.remainingEnemies === 0) {
                this.allEnemiesDefeated = true;
            }
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();
        if (this.enemy3) this.enemy3.update();
        if (this.enemy4) this.enemy4.update();
        if (this.enemy5) this.enemy5.update();

        // Check for scene transition
        if (this.allEnemiesDefeated && this.player.x > this.scale.width - 20) {
            console.log('Transitioning to Scene 5...'); // Debug log
            // Stop any current music
            if (this.sound.get('backgroundMusic')) {
                this.sound.get('backgroundMusic').stop();
            }
            this.scene.start('GameScene5');
            console.log('Scene 5 started'); // Debug log
        }
    }
}
