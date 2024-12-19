import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        this.load.setBaseURL(window.location.href);
    }

    create() {
        this.scene.start('Preloader');
    }
}
