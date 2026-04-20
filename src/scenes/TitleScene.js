import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'

export default class TitleScene extends Phaser.Scene {
  constructor () { super('Title') }

  create () {
    const W = this.scale.width
    const H = this.scale.height
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a0a2e, 0x1a0a2e, 1)
    bg.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += 4) { this.add.rectangle(W/2, y, W, 1, 0x000000, 0.15) }
    for (let i = 0; i < 80; i++) {
      const s=this.add.rectangle(Phaser.Math.Between(0,W),Phaser.Math.Between(0,H),1,1,0xffffff,Phaser.Math.FloatBetween(0.2,0.9))
      this.tweens.add({targets:s,alpha:0,duration:Phaser.Math.Between(1000,2800),yoyo:true,repeat:-1,delay:Phaser.Math.Between(0,2000)})
    }
    const title=this.add.text(W/2,H*0.32,'TOUR LIFE',{fontFamily:'Courier New',fontSize:'56px',color:'#ff3366',stroke:'#000000',strokeThickness:4,letterSpacing:12}).setOrigin(0.5).setAlpha(0)
    const sub=this.add.text(W/2,H*0.45,'INTERNATIONAL DATES',{fontFamily:'Courier New',fontSize:'18px',color:'#cc99ff',letterSpacing:8}).setOrigin(0.5).setAlpha(0)
    const tag=this.add.text(W/2,H*0.55,'Live loud. Love wild. Headline the world.',{fontFamily:'Courier New',fontSize:'13px',color:'#888899',letterSpacing:2}).setOrigin(0.5).setAlpha(0)
    this.tweens.add({targets:title,alpha:1,duration:1200})
    this.tweens.add({targets:sub,alpha:1,duration:1200,delay:400})
    this.tweens.add({targets:tag,alpha:1,duration:1200,delay:800})
    const prompt=this.add.text(W/2,H*0.72,'PRESS SPACE TO BEGIN',{fontFamily:'Courier New',fontSize:'14px',color:'#ffcc00',letterSpacing:4}).setOrigin(0.5).setAlpha(0)
    this.tweens.add({targets:prompt,alpha:{from:0,to:1},duration:600,yoyo:true,repeat:-1,delay:1400})
    this.add.text(W/2,H-16,'Art: Kenney.nl (CC0)  |  Audio: GameSounds.xyz  |  BAIS Session 3',{fontFamily:'Courier New',fontSize:'9px',color:'#444455'}).setOrigin(0.5)
    this.input.keyboard.on('keydown-SPACE',()=>this._startGame(true))
    this.input.keyboard.on('keydown-ENTER',()=>this._startGame(true))
    this.input.on('pointerdown',()=>this._startGame(true))
  }
  _startGame(fresh){if(fresh) stateManager.reset();this.cameras.main.fadeOut(600,0,0,0);this.cameras.main.once('camerafadeoutcomplete',()=>{this.scene.start('CityHub',{cityId:'chicago',dialogueStart:'act1_chicago_arrival'})})}}
