import { BaseScene } from './BaseScene';
import { WeakEnemy } from './EnemyTypes';

export class GameScene1 extends BaseScene {
    constructor() {
        super({ key: 'GameScene1' });
    }

    preload() {
        // Load all audio files
        this.load.audio('laser', 'assets/sounds/laser.wav');
        this.load.audio('hit', 'assets/sounds/hit.wav');
        this.load.audio('victoryMusic', 'assets/sounds/congratulations');
    }

    create() {
        super.create();
        
        const { width, height } = this.scale;
        
        // Set next scene
        this.nextSceneName = 'GameScene2';
        
        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 1', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add instruction text
        this.instructionText = this.add.text(width/2, height * 0.2, 'Defeat all enemies to proceed!', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#ff0'
        }).setOrigin(0.5);

        // Create enemy group
        this.enemies = this.physics.add.group();

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create two weak enemies at different positions
            this.enemy1 = new WeakEnemy(this, width * 0.3, enemyY);  // Left side
            this.enemy2 = new WeakEnemy(this, width * 0.7, enemyY);  // Right side

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);

            // Add collision between player and enemies
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
            
            // Set number of enemies
            this.remainingEnemies = 2;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10);
            this.remainingEnemies--;
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();

        // Check if player has reached the right side and all enemies are defeated
        const allEnemiesDefeated = !this.enemy1?.sprite?.active && !this.enemy2?.sprite?.active;
        if (this.player.x > this.scale.width - 20 && allEnemiesDefeated) {
            this.scene.start('GameScene2');
        }
    }
}
