import Phaser from 'phaser';import stateManager from '../systems/StateManager.js'
const E={legendary:{title:'LEGEND STATUS',color:'#ffcc00',sub:'Every stage. Every city. You owned them all.',bg:0x1a1000},headliner:{title:'HEADLINER',color:'#cc88ff',sub:'The world knows your name now.',bg:0x0d0020},cult_hero:{title:'CULT HERO',color:'#44ccaa',sub:'Underground legend. The fans didn't ignore you.',bg:0x001a14},band_intact:{title:'THE BAND SURVIVES',color:'#33ccff',sub:'The four of you are still standing.',bg:0x00101a},crash_and_burn:{title:'CRASH & BURN',color:'#ff3366',sub:'The tour ended early. The band is done.',bg:0x1a0005}}
export default class GameOverScene extends Phaser.Scene{constructor(){super('GameOver')}
create(){const W=this.scale.width,H=this.scale.height,en=stateManager.getEndingType(),e=E[en]||E.crash_and_burn
const bg=this.add.graphics();bg.fillStyle(e.bg);bg.fillRect(0,0,W,H)
const fame=stateManager.get('fame'),funds=stateManager.get('funds'),rels=stateManager.get('relationships')
this.add.text(W/2,H*0.28,e.title,{fontFamily:'Courier New',fontSize:'44px',color:e.color}).setOrigin(0.5)
this.add.text(W/2,H*0.41,e.sub,{fontFamily:'Courier New',fontSize:'13px',color:'#ccccdd', wordWrap:{width:W-80},align: 'center'}).setOrigin(0.5)
this.add.text(W/2,H*0.65,`FAME ${fame}   FUNDS $${funds}`,{fontFamily:'Courier New',fontSize:'12px',color:'#ffffff'}).setOrigin(0.5)
this.add.text(W/2,H*0.87,'[ SPACE ]  Play Again',{fontFamily:'Courier New',fontSize:'13px',color:'#ffcc00'}).setOrigin(0.5)
this.cameras.main.fadeIn(800,0,0,0)
this.time.delayedCall(1200,()=>{this.input.keyboard.on('keydown-SPACE',()=>this._r());this.input.on('pointerdown',()=>this._r())})
}
_r(){stateManager.reset();this.cameras.main.fadeOut(600,0,0,0);this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('Title'))}}