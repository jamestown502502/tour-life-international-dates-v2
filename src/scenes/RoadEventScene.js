import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'
export default class RoadEventScene extends Phaser.Scene{
constructor(){ super('RoadEvent')}
init(d){this.pool=d.pool||'act1_road_events';this.returnNode=d.returnNode||'act1_nashville_arrival';this.nextCityId=d.nextCityId||'nashville'}
create(){
const W=this.scale.width,H=this.scale.height
const events=this.cache.json.get('road_events')
const ev=Phaser.Utils.Array.GetRandom(events)
const bg=this.add.graphics()
bg.fillGradientStyle(0x050510,0x050510,0x0d0d1a,0x0d0d1a,1)
bg.fillRect(0,0,W,H)
const panelY=H*0.62
this.add.rectangle(W/2,panelY,H-10,200,0x0d0d1a,0.95).strokeStyle(1,0xff3366,0.7)
this.add.text(W/2,panelY-80,`\u26a1 ${ev.title}`,{fontFamily:'Courier New',fontSize:'14px',color:'#ff3366',}).setOrigin(0.5)
this.add.text(W/2,panelY-35,`"${ev.text}"`,{fontFamily:'Courier New',11px',color:'#ddddee',wordWrap:{width:W-80},align: 'center',}).setOrigin(0.5)
this._selected=0;this._choiceTexts=[]
(ev.choices||[]).forEach((c,i)=>{this._choiceTexts.push(this.add.text(W/2,panelY+30+i*22,(i===0?'\u25b6 ':'  ')+c.label,{fontFamily:'Courier New',fontSize:'11px',color:i===0?'#ffcc00':'#888899'}).setOrigin(0.5))})
this.input.keyboard.addKey('UP').on('down',()=>{this._selected=Math.max(0,this._selected-1);this._refresh()})
this.input.keyboard.addKey('DOWN').on('down',()=>{this._selected=Math.min((events.choices||[]).length-1,this._selected+1);this._refresh()})
this.input.keyboard.addKey('ENTER').on('down',()=>this._confirm(ev))
this.input.keyboard.addKey('SPACE').on('down',()=>this._confirm(ev))
this.cameras.main.fadeIn(500,0,0,0)}
_refresh(){this._choiceTexts.forEach((t,i)=>{const s=i===this._selected;t.setColor(s?'#ffcc00':'#888899');const raw=t.text.replace(/^[\u25b6 ]+/,'');t.setText((s?'\u25b6 ':'  ')+raw)})}
_confirm(ev){const c=(ev.choices||[])[this._selected];if(!c)return;if(c.statChanges)stateManager.applyStatChanges(c.statChanges);if(c.setFlag)stateManager.setFlag(c.setFlag.key,c.setFlag.value);this._showOutcome(c.outcome||'',()=>{this.cameras.main.fadeOut(500,0,0,0);this.cameras.main.once('camerafadeoutcomplete',()=>{this.scene.stop('RoadEvent');this.scene.start('CityHub',{cityId:this.nextCityId,dialogueStart:this.returnNode})})})}
_showOutcome(text,onDone){const W=this.scale.width,H=this.scale.height;this.add.rectangle(W/2,H/2,W,H,0x000000,0.6);const t=this.add.text(W/2,H/2,text,{fontFamily:'Courier New',fontSize:'12px',color:'#ffffff', wordWrap:{width:W-80},align: 'center'}).setOrigin(0.5).setAlpha(0);this.tweens.add({targets:t,alpha:1,duration:600});this.time.delayedCall(600,()=>{this.input.keyboard.once('keydown-SPACE',onDone);this.input.keyboard.once('keydown-ENTER',onDone);this.input.once('pointerdown',onDone)})}}
