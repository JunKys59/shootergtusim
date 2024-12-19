import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Create loading bar
        const loadingText = this.add.text(this.scale.width/2, this.scale.height/2, 'Loading...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(this.scale.width/2 - 160, this.scale.height/2 + 20, 320, 28);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ffff, 1);
            progressBar.fillRect(this.scale.width/2 - 156, this.scale.height/2 + 24, 312 * value, 20);
        });

        // Add load error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.src);
        });
    }

    preload() {
        // Debug logging for asset loading
        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded:', key, type);
            if (type === 'spritesheet') {
                const texture = this.textures.get(key);
                console.log(`Spritesheet ${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
                console.log(`Frame config:`, this.textures.get(key).customData);
            }
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading:', file.key, file.src);
            console.error('Error details:', file.data);
        });

        // Load styles
        this.load.css('style', './assets/css/style.css');
        
        // Load main menu background
        this.load.image('mainbg', './assets/mainbg.png');
        
        // Load character sprites with correct paths and frame sizes
        this.load.spritesheet('character_idle', './assets/character/character_Idle.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 4,
            spacing: 0,
            margin: 0
        });
        
        this.load.spritesheet('character_run', './assets/character/character_Run.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 6,
            spacing: 0,
            margin: 0
        });
        
        this.load.spritesheet('character_jump', './assets/character/character_Jump.png', {
            frameWidth: 48,
            frameHeight: 48,
            startFrame: 0,
            endFrame: 2,
            spacing: 0,
            margin: 0
        });
        
        // Load crouch animation spritesheet
        this.load.spritesheet('character_crouch', './assets/character/character_Crouch.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        // Load death animation spritesheet
        this.load.spritesheet('character_death', './assets/character/character_Death.png', {
            frameWidth: 48,
            frameHeight: 48
        });
        
        // Load bullet sprite
        this.load.image('bullet', './assets/bullet.png');
        
        // Load sound effects
        this.load.audio('laser', './assets/sounds/laser.wav');
        this.load.audio('bgMusic', './assets/sounds/background_music.mp3');
        this.load.audio('hit', './assets/sounds/hit.wav');
        
        // Load the font file directly
        this.load.binary('retronoid', './assets/fonts/retronoid/Retronoid.ttf');
    }

    create() {
        // Create a new style element
        const style = document.createElement('style');
        const fontData = this.cache.binary.get('retronoid');
        const fontFace = new FontFace('Retronoid', fontData);

        // Load the font face
        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            console.log('Font loaded successfully');
        }).catch(error => {
            console.error('Font loading error:', error);
        });

        // Debug logging for texture loading
        const textureKeys = ['character_idle', 'character_run', 'character_jump'];
        textureKeys.forEach(key => {
            if (this.textures.exists(key)) {
                console.log(`${key} texture loaded successfully`);
                const texture = this.textures.get(key);
                console.log(`${key} dimensions:`, texture.source[0].width, 'x', texture.source[0].height);
                console.log(`${key} frames:`, texture.frameTotal);
            } else {
                console.error(`${key} texture failed to load`);
            }
        });

        console.log('All assets loaded, starting MainMenu');
        this.scene.start('MainMenu');
    }
}
