import { Scene } from 'phaser';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    create() {
        // Set background color to dark red
        this.cameras.main.setBackgroundColor('#660000');

        const width = this.scale.width;
        const height = this.scale.height;

        // Create a semi-transparent black box in the center
        const box = this.add.rectangle(width/2, height/2, width * 0.6, height * 0.3, 0x000000, 0.8);
        box.setStrokeStyle(4, 0xff0000); // Red border

        // Add "YOU'RE DEAD" text
        this.add.text(width/2, height/2 - 40, "YOU'RE DEAD", {
            fontFamily: 'Retronoid',
            fontSize: '48px',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        // Add instruction text
        this.add.text(width/2, height/2 + 40, 'PRESS SPACE TO RESPAWN', {
            fontFamily: 'Retronoid',
            fontSize: '24px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add space key listener
        this.input.keyboard.once('keydown-SPACE', () => {
            // Reset lives and score
            this.registry.set('lives', 3);
            this.registry.set('score', 0);
            this.scene.start('MainMenu');
        });
    }
}
