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

        // Set up physics
        this.physics.world.gravity.y = 1000;  // Increased world gravity
        this.physics.world.setBounds(0, 0, width, height);

        // Helper method to get spawn height for entities
        this.getSpawnHeight = () => {
            return height - 42; // Moved 1 pixel higher (was 41)
        };

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();
        
        // Calculate ground position and size
        const spawnY = this.getSpawnHeight();
        const groundStartY = spawnY + 24; // Start from middle of character (48/2 = 24)
        const groundHeight = height - groundStartY; // Height from middle of character to bottom
        
        // Add ground as a rectangle
        const ground = this.add.rectangle(width/2, groundStartY + groundHeight/2, width, groundHeight, 0x006400);
        this.physics.add.existing(ground, true);
        
        // Set up ground physics for precise collision
        ground.body.setSize(width, groundHeight);
        ground.body.setOffset(0, 0);
        ground.body.immovable = true;
        ground.body.moves = false;
        ground.body.allowGravity = false;
        ground.body.checkCollision.up = true;    // Only collide with the top
        ground.body.checkCollision.down = false;
        ground.body.checkCollision.left = false;
        ground.body.checkCollision.right = false;
        
        this.platforms.add(ground);

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
            // Set up player physics and collisions
            this.player = this.physics.add.sprite(
                width / 2,  
                this.getSpawnHeight(),
                'character_idle'
            );

            // Scale the sprite to exactly 2
            this.player.setScale(2);

            // Set player properties
            this.player.setCollideWorldBounds(true);
            this.player.setBounce(0);
            this.player.setGravityY(200);  // Changed from 500 to 200
            this.player.body.setAllowGravity(true);
            
            // Customize world bounds collision
            this.player.body.onWorldBounds = true;
            this.player.body.customBoundsRectangle = new Phaser.Geom.Rectangle(
                -1000,              // x (far left to allow movement)
                0,                  // y (top)
                this.scale.width + 2000,  // width (extra wide to allow movement)
                this.scale.height   // height (full height for bottom collision)
            );

            // Set player body size and offset for better collisions
            this.player.body.setSize(48, 48);
            this.player.body.setOffset(0, 0);

            // Add collision between player and platforms with custom handler
            this.physics.add.collider(this.player, this.platforms, (player, platform) => {
                // Ensure player lands at the exact spawn height
                if (player.body.touching.down) {
                    player.y = this.getSpawnHeight();
                }
            });

            // Set up keyboard controls
            this.cursors = this.input.keyboard.createCursorKeys();
            // Add WASD keys for movement
            this.wasd = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            });

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
        
        // Check if texture exists
        if (!this.textures.exists('character_Walking')) {
            console.error('character_Walking texture not found!');
            return;
        }

        // Get texture dimensions
        const walkingTexture = this.textures.get('character_Walking');
        const frameWidth = 48;
        const totalFrames = Math.floor(walkingTexture.source[0].width / frameWidth);
        console.log(`Total walking frames: ${totalFrames}`);

        console.log('Creating walking animation...');
        try {
            // Create walking animation
            this.anims.create({
                key: 'walking',
                frames: this.anims.generateFrameNumbers('character_Walking', {
                    start: 0,
                    end: totalFrames - 1,
                    first: 0
                }),
                frameRate: 12,
                repeat: -1,
                yoyo: false
            });
            console.log('Walking animation created successfully');
        } catch (error) {
            console.error('Error creating walking animation:', error);
        }

        // Create idle animation
        if (this.textures.exists('character_idle')) {
            const idleTexture = this.textures.get('character_idle');
            const idleFrames = Math.floor(idleTexture.source[0].width / 48);
            try {
                this.anims.create({
                    key: 'idle',
                    frames: this.anims.generateFrameNumbers('character_idle', {
                        start: 0,
                        end: idleFrames - 1
                    }),
                    frameRate: 8,
                    repeat: -1
                });
                console.log('Idle animation created successfully');
            } catch (error) {
                console.error('Error creating idle animation:', error);
            }
        }

        // Create jump animation
        if (this.textures.exists('character_jump')) {
            const jumpTexture = this.textures.get('character_jump');
            const jumpFrames = Math.floor(jumpTexture.source[0].width / 48);
            try {
                this.anims.create({
                    key: 'jump',
                    frames: [
                        { key: 'character_jump', frame: 0 },  // First frame
                        { key: 'character_jump', frame: 1 },  // Second frame
                        { key: 'character_jump', frame: 1 }   // Third frame (reusing second frame)
                    ],
                    frameRate: 12,  // Increased from 8 to 12 for smoother animation
                    repeat: 0,
                    duration: 300   // Total animation duration in milliseconds
                });
                console.log('Jump animation created successfully');
            } catch (error) {
                console.error('Error creating jump animation:', error);
            }
        }
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

        const isSprite = this.player.type === 'Sprite';

        // Handle left/right movement
        const moveSpeed = 300;
        if (this.wasd.left.isDown) {
            this.player.setVelocityX(-moveSpeed);
            this.player.setFlipX(true);
            if (isSprite && this.player.body.onFloor()) {
                try {
                    if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'walking') {
                        this.player.play('walking', true);
                    }
                } catch (error) {
                    console.error('Error playing walking animation:', error);
                }
            }
        } else if (this.wasd.right.isDown) {
            this.player.setVelocityX(moveSpeed);
            this.player.setFlipX(false);
            if (isSprite && this.player.body.onFloor()) {
                try {
                    if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'walking') {
                        this.player.play('walking', true);
                    }
                } catch (error) {
                    console.error('Error playing walking animation:', error);
                }
            }
        } else {
            this.player.setVelocityX(0);
            if (isSprite && this.player.body.onFloor()) {
                try {
                    if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'idle') {
                        this.player.play('idle', true);
                    }
                } catch (error) {
                    console.error('Error playing idle animation:', error);
                }
            }
        }

        // Handle jumping
        if (this.wasd.up.isDown && this.player.body.onFloor()) {
            this.player.setVelocityY(-500);  // Strong initial jump velocity
            if (isSprite && this.anims.exists('jump')) {
                try {
                    this.player.play('jump', true);
                    // Reset to idle when landing
                    this.player.once('animationcomplete', () => {
                        if (this.player.body.onFloor()) {
                            this.player.play('idle', true);
                        }
                    });
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
