import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'

export default class BootScene extends Phaser.Scene {
  constructor () { super('Boot') }

  preload () {
    this.load.image('boot_bg', 'assets/ui/boot_bg.png')
  }

  create () {
    stateManager.init()
    this.scene.start('Preloader')
  }
}
