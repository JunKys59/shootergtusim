import { BaseScene } from './BaseScene';
import { BossEnemy } from './EnemyTypes';

export class GameScene5 extends BaseScene {
    constructor() {
        super({ key: 'GameScene5' });
        this.bossDefeated = false;
    }

    preload() {
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
    }

    create() {
        console.log('Creating Scene 5...'); // Debug log
        this.cameras.main.setBackgroundColor('#2A2A2A');
        super.create();

        const { width, height } = this.scale;

        this.player.x = width * 0.1;
        this.bossDefeated = false;

        // Add scene text
        this.add.text(width/2, height * 0.1, 'Boss Room - Scene 5', {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Clean up any existing boss
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }

        // Create enemies group with physics
        this.enemies = this.physics.add.group({
            bounceX: 0,
            bounceY: 0,
            collideWorldBounds: true,
            dragX: 100
        });

        // Wait a short moment for platforms to be fully set up
        this.time.delayedCall(100, () => {
            // Create the boss at the right side
            this.boss = new BossEnemy(this, width * 0.8, this.groundTop - 92); // Account for boss's larger size
            
            if (this.boss && this.boss.sprite) {
                this.enemies.add(this.boss.sprite);
                
                // Set up multiple collision handlers for redundancy
                this.physics.add.collider(this.boss.sprite, this.platforms);
                this.physics.add.collider(this.enemies, this.platforms);
                
                // Set up player and bullet collisions
                this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
                this.physics.add.collider(this.bullets, this.enemies, this.hitEnemyWithBullet, null, this);
                
                // Extra physics settings for boss sprite
                this.boss.sprite.body.setCollideWorldBounds(true);
                this.boss.sprite.body.setBounce(0);
                this.boss.sprite.body.setFriction(1);
                this.boss.sprite.body.setDragX(100);
            }

            // Add invisible wall on the left to prevent going back
            const wall = this.add.rectangle(0, height/2, 20, height, 0x000000, 0);
            this.physics.add.existing(wall, true);
            this.physics.add.collider(this.player, wall);
        });

        console.log('Scene 5 created successfully'); // Debug log
    }

    shutdown() {
        // Clean up when leaving the scene
        if (this.boss) {
            this.boss.destroy();
            this.boss = null;
        }
        super.shutdown();
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        this.hitSound.play(); // Play hit sound
        bullet.destroy();
        
        if (this.boss && this.boss.sprite === enemySprite) {
            if (this.boss.damage(1)) {
                // Boss is dead
                this.boss.destroy();
                this.addPoints(100); // Big points for killing the boss
                this.boss = null; // Set boss to null when destroyed
                this.bossDefeated = true;
            }
        }
    }

    update() {
        super.update();

        // Update boss patrol if it exists and ensure it stays above ground
        if (this.boss && this.boss.sprite && this.boss.sprite.active) {
            this.boss.update();
            
            // Extra check to keep boss above ground
            if (this.boss.sprite.y > this.groundTop - 46) {
                this.boss.sprite.y = this.groundTop - 46;
                this.boss.sprite.body.setVelocityY(0);
            }
        }

        // Check if boss is defeated
        if (!this.bossDefeated && this.boss && (!this.boss.sprite || !this.boss.sprite.active)) {
            this.bossDefeated = true;
            console.log('Boss defeated!'); // Debug log
            
            // Play victory music when boss is defeated
            if (this.victoryMusic && !this.victoryMusic.isPlaying) {
                this.victoryMusic.play();
            }
            
            // Transition to mission complete after a delay
            this.time.delayedCall(2000, () => {
                this.scene.start('MissionComplete');
            });
        }

        // Check for scene transition
        if (this.bossDefeated && this.player.x > this.scale.width - 20) {
            // Stop any current music
            if (this.sound.get('bgMusic')) {
                this.sound.get('bgMusic').stop();
            }
            this.scene.start('MissionComplete');
        }
    }
}
