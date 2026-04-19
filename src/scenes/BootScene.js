import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'

export default class BootScene extends Phaser.Scene {
  constructor () { super('Boot') }
  preload () {}
  create () {
    stateManager._load()
    this.scene.start('Preloader')
  }
}
