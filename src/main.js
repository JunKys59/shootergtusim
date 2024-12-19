import 'phaser';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { GameScene1 } from './scenes/GameScene1';
import { GameScene2 } from './scenes/GameScene2';
import { GameScene3 } from './scenes/GameScene3';
import { GameScene4 } from './scenes/GameScene4';
import { GameScene5 } from './scenes/GameScene5';
import { MissionComplete } from './scenes/MissionComplete';
import { GameOver } from './scenes/GameOver';
import Settings from './scenes/Settings';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%',
        min: {
            width: 800,
            height: 600
        },
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: 'game-container',
        expandParent: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    input: {
        mouse: {
            preventDefaultWheel: true
        }
    },
    scene: [
        Preloader,
        MainMenu,
        Settings,
        GameScene1,
        GameScene2,
        GameScene3,
        GameScene4,
        GameScene5,
        MissionComplete,
        GameOver
    ]
};

// Create game instance
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// Allow browser zoom controls
window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.stopPropagation();
        return true;
    }
}, true);

// Handle zoom changes
window.visualViewport.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
    game.scale.refresh();
});
