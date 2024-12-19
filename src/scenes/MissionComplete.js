import { Scene } from 'phaser';

export class MissionComplete extends Scene {
    constructor() {
        super({ key: 'MissionComplete' });
    }

    preload() {
        // Load particle image
        this.load.image('particle', 'assets/particle.png');
        // Load victory music
        this.load.audio('victoryMusic', 'assets/sounds/congratulations.mp3');
        // Load background music for restart
        this.load.audio('bgMusic', 'assets/sounds/background_music.mp3');
    }

    createFirework(x, y) {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const particles = [];
        
        // Create multiple particles for the firework
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(100, 400);
            const particle = this.add.circle(x, y, 2, Phaser.Math.RND.pick(colors));
            
            // Add physics to the particle
            this.physics.add.existing(particle);
            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            particle.body.setAllowGravity(false);
            
            particles.push(particle);
        }

        // Fade out and destroy particles
        this.tweens.add({
            targets: particles,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                particles.forEach(particle => particle.destroy());
            }
        });
    }

    create() {
        // Stop any existing music
        this.sound.stopAll();

        // Stop any existing background music first
        const existingMusic = this.sound.get('bgMusic');
        if (existingMusic) {
            existingMusic.stop();
        }

        // Get music state
        const musicEnabled = this.registry.get('musicEnabled');

        // Create and play victory music only if music is enabled
        this.victoryMusic = this.sound.add('victoryMusic', { volume: 0.3, loop: true });
        if (musicEnabled !== false) {
            this.victoryMusic.play();
        }
        console.log('Playing victory music in mission complete scene'); // Debug log

        this.cameras.main.setBackgroundColor('#000000');
        
        const width = this.scale.width;
        const height = this.scale.height;

        // Add music control button
        const musicButton = this.add.text(width - 100, 20, '⚙️ Music: ON', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0);

        // Update initial button state
        if (musicEnabled === false) {
            musicButton.setText('⚙️ Music: OFF');
        }

        musicButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => musicButton.setStyle({ fill: '#ff0' }))
            .on('pointerout', () => musicButton.setStyle({ fill: '#fff' }))
            .on('pointerdown', () => {
                if (this.victoryMusic.isPlaying) {
                    this.victoryMusic.pause();
                    this.registry.set('musicEnabled', false);
                    musicButton.setText('⚙️ Music: OFF');
                } else {
                    this.victoryMusic.resume();
                    this.registry.set('musicEnabled', true);
                    musicButton.setText('⚙️ Music: ON');
                }
            });

        // Add congratulations text
        this.add.text(width/2, height * 0.3, 'Congratulations!', {
            fontFamily: 'Retronoid',
            fontSize: '48px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add mission completion text
        this.add.text(width/2, height * 0.5, "You've finished Mission ONE:", {
            fontFamily: 'Retronoid',
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width/2, height * 0.6, 'Ledger Heist', {
            fontFamily: 'Retronoid',
            fontSize: '40px',
            fill: '#ffd700'  // Gold color for mission name
        }).setOrigin(0.5);

        // Add instruction text
        this.add.text(width/2, height * 0.8, 'Press SPACE to return to menu', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Add space key listener
        this.input.keyboard.on('keydown-SPACE', () => {
            // Stop and cleanup all music
            this.sound.stopAll();
            const victoryMusic = this.sound.get('victoryMusic');
            const bgMusic = this.sound.get('bgMusic');
            if (victoryMusic) victoryMusic.destroy();
            if (bgMusic) bgMusic.destroy();
            
            // Reset the score to 0
            this.registry.set('score', 0);
            
            this.scene.start('MainMenu');
        });

        // Create periodic fireworks
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                // Random positions for fireworks
                const x = Phaser.Math.Between(width * 0.2, width * 0.8);
                const y = Phaser.Math.Between(height * 0.2, height * 0.6);
                this.createFirework(x, y);
            },
            loop: true
        });

        // Initial fireworks burst
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(width * 0.2, width * 0.8);
            const y = Phaser.Math.Between(height * 0.2, height * 0.6);
            this.createFirework(x, y);
        }
    }
}
