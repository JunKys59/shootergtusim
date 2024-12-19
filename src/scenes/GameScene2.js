import { BaseScene } from './BaseScene';
import { MediumEnemy } from './EnemyTypes';

export class GameScene2 extends BaseScene {
    constructor() {
        super({ key: 'GameScene2' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#4A4A4A');
        super.create();

        const { width, height } = this.scale;

        // Set player to left side
        this.player.x = width * 0.1;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Scene 2', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Set next scene (can be modified if you add more scenes)
        this.nextSceneName = 'GameScene1';

        // Create enemy group
        this.enemies = this.physics.add.group();

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Use helper method to get correct spawn height
            const enemyY = this.getSpawnHeight();

            // Create three medium enemies at different positions
            this.enemy1 = new MediumEnemy(this, width * 0.25, enemyY);
            this.enemy2 = new MediumEnemy(this, width * 0.5, enemyY);
            this.enemy3 = new MediumEnemy(this, width * 0.75, enemyY);

            // Add enemies to the group
            this.enemies.add(this.enemy1.sprite);
            this.enemies.add(this.enemy2.sprite);
            this.enemies.add(this.enemy3.sprite);

            // Set up collisions
            this.physics.add.collider(this.enemies, this.platforms);

            // Add collision between player and enemies
            this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
            this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
            this.physics.add.collider(this.bullets, this.platforms);

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);

            // Set number of enemies
            this.remainingEnemies = 3;
        });
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2, this.enemy3].find(e => e.sprite === enemySprite);
        if (enemy && enemy.damage(1)) {
            // Enemy is dead
            enemy.destroy();
            this.addPoints(10); // Changed from 20 to 10
        }
    }

    update() {
        super.update();

        // Update enemy patrols
        if (this.enemy1) this.enemy1.update();
        if (this.enemy2) this.enemy2.update();
        if (this.enemy3) this.enemy3.update();

        if (this.player.x > this.scale.width - 20) {
            // Store the current music state before transitioning
            const bgMusic = this.sound.get('bgMusic');
            const isMusicPlaying = bgMusic ? bgMusic.isPlaying : false;
            this.registry.set('musicEnabled', isMusicPlaying);
            
            this.scene.start('GameScene3');
        } else if (this.player.x < 20) {
            // Store the current music state before transitioning
            const bgMusic = this.sound.get('bgMusic');
            const isMusicPlaying = bgMusic ? bgMusic.isPlaying : false;
            this.registry.set('musicEnabled', isMusicPlaying);
            
            this.scene.start('GameScene1');
        }
    }
}
