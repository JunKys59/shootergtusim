import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init() {
        this.score = 0;
        this.lastFired = 0;
    }

    create() {
        // Background
        this.add.image(512, 384, 'background');

        // Score Text with arcade style
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
            fontFamily: 'ArcadeClassic',
            fontSize: '32px',
            fill: '#00ffff',
            stroke: '#ffffff',
            strokeThickness: 1
        });

        // Player
        this.player = this.physics.add.sprite(512, 700, 'player')
            .setCollideWorldBounds(true);

        // Bullets group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Enemies group
        this.enemies = this.physics.add.group();

        // Energy Bar
        this.energyBar = this.add.rectangle(100, 50, 200, 20, 0x00ff00);
        this.energyBar.setOrigin(0);

        // Input Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Shooting with spacebar
        this.input.keyboard.on('keydown-SPACE', () => {
            this.shoot();
        });

        // Spawn enemies
        this.spawnEnemies();

        // Collision detection
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this.hitEnemy,
            null,
            this
        );

        // Add collision between player and enemies
        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.hitPlayer,
            null,
            this
        );
    }

    update() {
        this.handlePlayerMovement();

        // Update energy bar
        this.energyBar.width = Math.max(this.energyBar.width - 0.05, 0);

        // Remove bullets and enemies that are out of bounds
        this.bullets.children.each(bullet => {
            if (bullet.active && (bullet.y < -10 || bullet.y > 800)) {
                bullet.destroy();
            }
        });

        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.y > 800) {
                enemy.destroy();
            }
        });
    }

    handlePlayerMovement() {
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        }
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-300);
        }
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(300);
        }
    }

    shoot() {
        const bullet = this.bullets.get(this.player.x, this.player.y - 20);
        if (bullet) {
            bullet.setActive(true)
                .setVisible(true)
                .setVelocityY(-400);
        }
    }

    spawnEnemies() {
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                const x = Phaser.Math.Between(50, 974);
                const enemy = this.enemies.create(x, -20, 'enemy');
                enemy.setVelocityY(150);
            },
            loop: true
        });
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);

        // Increase energy
        this.energyBar.width = Math.min(this.energyBar.width + 20, 200);
    }

    hitPlayer(player, enemy) {
        enemy.destroy();
        this.energyBar.width = Math.max(this.energyBar.width - 50, 0);

        if (this.energyBar.width <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.scene.start('GameOver');
    }
}
