import { Scene } from 'phaser';

export class BaseScene extends Scene {
    create() {
        console.log('BaseScene create() started');
        
        // Initialize score if it doesn't exist
        if (typeof this.registry.get('score') !== 'number') {
            this.registry.set('score', 0);
        }

        // Initialize lives if it doesn't exist
        if (this.registry.get('lives') === undefined) {
            this.registry.set('lives', 3);
        }

        // Create sound effects
        this.laserSound = this.sound.add('laser', { volume: 0.05 });
        this.hitSound = this.sound.add('hit', { volume: 0.1 });

        // Get screen dimensions
        const width = this.scale.width;
        const height = this.scale.height;
        console.log('Screen dimensions:', width, 'x', height);

        // Set world gravity
        this.physics.world.gravity.y = 800;
        this.physics.world.setBounds(0, 0, width, height);

        // Add ground as a rectangle instead of an image - scaled to screen width
        this.platforms = this.physics.add.staticGroup();
        const ground = this.add.rectangle(width/2, height - 100, width, 32, 0x00ff00);
        this.physics.add.existing(ground, true);
        this.platforms.add(ground);

        // Store ground top position for spawning entities (16 is half of ground height)
        this.groundTop = ground.y - 16;

        // Helper method to get spawn height for entities
        this.getSpawnHeight = () => {
            return this.groundTop - 24; // Adjust based on entity height
        };

        // Create animations first
        this.createAnimations();

        // Debug texture information
        console.log('Checking character_idle texture...');
        if (this.textures.exists('character_idle')) {
            const texture = this.textures.get('character_idle');
            console.log('character_idle texture found:', texture);
            console.log('Frames:', texture.frameTotal);
            console.log('Frame dimensions:', texture.frames[0].width, 'x', texture.frames[0].height);
        } else {
            console.error('character_idle texture not found!');
        }

        // Verify animations exist before creating player
        if (!this.anims.exists('idle')) {
            console.error('Required animations not created. Using fallback sprite.');
            // Create a simple rectangle as fallback
            this.player = this.add.rectangle(
                this.game.config.width / 2,
                this.game.config.height / 2,
                32, 32, 0x00ff00
            );
            this.physics.add.existing(this.player);
        } else {
            console.log('Creating player sprite...');
            // Create player with physics
            this.player = this.physics.add.sprite(
                width / 2,  
                this.getSpawnHeight(),  // Spawn on ground (32 is player height)
                'character_idle'
            );

            // Scale the sprite up (since it's 32x32)
            this.player.setScale(2);

            // Set player properties
            this.player.setCollideWorldBounds(true);
            this.player.setBounce(0.1);
            this.player.setGravityY(300);
            
            // Set player body size and offset for better collisions
            this.player.body.setSize(32, 32); // Set collision box size
            this.player.body.setOffset(0, 0); // Adjust collision box position

            try {
                // Play idle animation by default
                if (this.anims.exists('idle')) {
                    console.log('Playing idle animation...');
                    this.player.play('idle');
                }
            } catch (error) {
                console.error('Error playing idle animation:', error);
            }

            console.log('Player sprite created successfully');
            console.log('Player position:', this.player.x, this.player.y);
            console.log('Player scale:', this.player.scaleX, this.player.scaleY);
            console.log('Player visible:', this.player.visible);
            console.log('Player alpha:', this.player.alpha);
        }

        // Debug info
        console.log('Player created at:', this.player.x, this.player.y);
        console.log('Player texture:', this.player.texture ? this.player.texture.key : 'No texture');
        console.log('Available animations:', this.anims.names);

        // Add colliders
        this.physics.add.collider(this.player, this.platforms);

        // Set up keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        // Add WASD keys for movement
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Add mouse input for shooting
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                // Determine shooting direction based on A/D keys
                if (this.wasd.left.isDown) {
                    this.shoot('left');
                } else if (this.wasd.right.isDown) {
                    this.shoot('right');
                } else {
                    // If no direction key is pressed, shoot based on mouse position
                    const mouseX = pointer.x;
                    const playerX = this.player.x;
                    this.shoot(mouseX < playerX ? 'left' : 'right');
                }
            }
        });

        // Create bullet group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 10
        });

        // Create score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Retronoid'
        });
        this.scoreText.setScrollFactor(0);

        // Create lives display
        this.livesText = this.add.text(16, 56, 'Lives: ' + this.registry.get('lives'), {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Retronoid'
        });
        this.livesText.setScrollFactor(0);

        // Update score display
        const score = this.registry.get('score');
        this.scoreText.setText('Score: ' + score);

        // Initialize enemy tracking
        this.remainingEnemies = 0;
        this.nextSceneName = '';

        // Add settings button in top right
        const settingsButton = this.add.text(width - 100, 20, '⚙️ Music', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);

        settingsButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => settingsButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => settingsButton.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                const bgMusic = this.sound.get('bgMusic');
                if (bgMusic) {
                    if (bgMusic.isPlaying) {
                        bgMusic.pause();
                        this.registry.set('musicEnabled', false);
                        settingsButton.setText('⚙️ Music: OFF');
                    } else {
                        bgMusic.resume();
                        this.registry.set('musicEnabled', true);
                        settingsButton.setText('⚙️ Music: ON');
                    }
                }
            });

        // Update button text based on current music state
        const bgMusic = this.sound.get('bgMusic');
        const musicEnabled = this.registry.get('musicEnabled');
        if (bgMusic && (!bgMusic.isPlaying || musicEnabled === false)) {
            settingsButton.setText('⚙️ Music: OFF');
            if (bgMusic.isPlaying) {
                bgMusic.pause();
            }
        }
    }

    createAnimations() {
        console.log('Creating animations...');
        
        // Animation configurations
        const animations = {
            idle: { key: 'character_idle', frames: 4, frameRate: 8 },
            run: { key: 'character_run', frames: 6, frameRate: 10 },
            jump: { key: 'character_jump', frames: 2, frameRate: 8 }
        };

        // Create all animations
        Object.entries(animations).forEach(([name, config]) => {
            if (!this.textures.exists(config.key)) {
                console.error(`Missing texture: ${config.key}`);
                return;
            }

            try {
                this.anims.create({
                    key: name,
                    frames: this.anims.generateFrameNumbers(config.key, {
                        start: 0,
                        end: config.frames
                    }),
                    frameRate: config.frameRate,
                    repeat: -1
                });
                console.log(`Created ${name} animation`);
            } catch (error) {
                console.error(`Error creating ${name} animation:`, error);
            }
        });
    }

    updateScoreText() {
        const score = this.registry.get('score');
        this.scoreText.setText('Score: ' + score);
    }

    addPoints(points) {
        const currentScore = this.registry.get('score');
        this.registry.set('score', currentScore + points);
        this.updateScoreText();
    }

    shoot(direction = 'right') {
        // Create bullet as a rectangle
        const bullet = this.add.rectangle(this.player.x, this.player.y, 10, 5, 0xFFFF00);
        this.bullets.add(bullet);

        if (bullet) {
            // Play laser sound
            this.laserSound.play();

            bullet.setActive(true);
            bullet.setVisible(true);

            // Add physics to the bullet
            this.physics.add.existing(bullet);

            // Set bullet properties based on direction
            const bulletSpeed = 800;
            bullet.body.setVelocityX(direction === 'left' ? -bulletSpeed : bulletSpeed);
            bullet.body.setAllowGravity(false);
            bullet.body.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;

            // Destroy bullet when it hits world bounds
            bullet.body.world.on('worldbounds', (body) => {
                if (body.gameObject === bullet) {
                    this.destroyBullet(bullet);
                }
            });
        }
    }

    destroyBullet(bullet) {
        bullet.setActive(false);
        bullet.setVisible(false);
        bullet.body.enable = false;
    }

    hitEnemyWithBullet(bullet, enemySprite) {
        bullet.destroy();
        
        // Find the enemy object that owns this sprite
        const enemy = [this.enemy1, this.enemy2].find(e => e && e.sprite === enemySprite);
        if (enemy) {
            enemy.currentHealth--;
            if (enemy.currentHealth <= 0) {
                enemy.sprite.destroy();
                this.remainingEnemies--;
                
                // Check if all enemies are defeated
                if (this.remainingEnemies <= 0 && this.nextSceneName) {
                    this.add.text(this.scale.width/2, this.scale.height/2, 'Level Complete!\nPress SPACE to continue', {
                        fontSize: '32px',
                        fill: '#fff',
                        align: 'center'
                    }).setOrigin(0.5);
                    
                    // Listen for spacebar to transition
                    this.input.keyboard.once('keydown-SPACE', () => {
                        this.scene.start(this.nextSceneName);
                    });
                }
            }
        }
    }

    update() {
        if (!this.player) return;

        // Update lives display
        if (this.livesText) {
            this.livesText.setText('Lives: ' + this.registry.get('lives'));
        }

        // Update score display
        if (this.scoreText) {
            this.scoreText.setText('Score: ' + this.registry.get('score'));
        }

        // Only handle animations if player is a sprite (not a rectangle fallback)
        const isSprite = this.player.hasOwnProperty('play');
        
        // Handle horizontal movement
        if (this.wasd.left.isDown) {
            this.player.setVelocityX(-300);
            if (isSprite) {
                this.player.flipX = true;
                if (this.player.body.onFloor() && this.anims.exists('run')) {
                    try {
                        this.player.play('run', true);
                    } catch (error) {
                        console.error('Error playing run animation:', error);
                    }
                }
            }
        } else if (this.wasd.right.isDown) {
            this.player.setVelocityX(300);
            if (isSprite) {
                this.player.flipX = false;
                if (this.player.body.onFloor() && this.anims.exists('run')) {
                    try {
                        this.player.play('run', true);
                    } catch (error) {
                        console.error('Error playing run animation:', error);
                    }
                }
            }
        } else {
            this.player.setVelocityX(0);
            if (isSprite && this.player.body.onFloor() && this.anims.exists('idle')) {
                try {
                    this.player.play('idle', true);
                } catch (error) {
                    console.error('Error playing idle animation:', error);
                }
            }
        }

        // Handle jumping
        if (this.wasd.up.isDown && this.player.body.onFloor()) {
            this.player.setVelocityY(-500);
            if (isSprite && this.anims.exists('jump')) {
                try {
                    this.player.play('jump', true);
                } catch (error) {
                    console.error('Error playing jump animation:', error);
                }
            }
        }

        // Clean up bullets that are out of bounds
        this.bullets.children.each((bullet) => {
            if (bullet.active && (bullet.x < 0 || bullet.x > this.scale.width)) {
                this.destroyBullet(bullet);
            }
        });
    }

    hitEnemy(player, enemy) {
        this.handlePlayerDeath();
    }

    handlePlayerDeath() {
        // Decrease lives
        let lives = this.registry.get('lives');
        lives--;
        this.registry.set('lives', lives);

        if (lives <= 0) {
            // Game Over - Transition to GameOver scene
            this.scene.start('GameOver');
        } else {
            // Restart current scene
            this.scene.restart();
        }
    }
}
