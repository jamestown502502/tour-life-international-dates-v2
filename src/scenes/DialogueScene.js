import Phaser from 'phaser'
import dialogueEngine from '../systems/DialogueEngine.js'
import aiFillService  from '../systems/AIFillService.js'
import stateManager   from '../systems/StateManager.js'
const CHAM_COLORS={'Ryder Blaze':'#ff6644','Nova Wilde':'#cc88ff','Jet':'#44ccaa','Player':'#ffffff'}
export default class DialogueScene extends Phaser.Scene{constructor(){super('Dialogue')}init(d){this.startNode=d.startNode;this.treeKey=d.treeKey||'act1_hub;this._onComplete=d.onComplete||(()=>{})}
create(){const W=this.scale.width,H=this.scale.height
this.add.rectangle(W/2,H/2,W,H,0x000000,0.55)
const bH=180,bY=H-bH/2-10,box=this.add.rectangle(W/2,bY,W-40,bH,0x0d0d1a,0.96)
box.setStrokeStyle(1,0xff3366,0.8)
this._portrait=this.add.rectangle(60,bY-10,56,64,0x1a1a2e)
this._speakerText=this.add.text(100,bY-bH/2+14,'',{fontFamily:'Courier New',fontSize:'13px',color:'#ffffff',fontStyle:'bold'})
this._dialogueText=this.add.text(100,bY-bH/2+32,'',{fontFamily:'Courier New',fontSize:'11px',color:'#ddddee',wordWrap:{width:W-160},lineSpacing:4})
this._choiceTexts=[];this._choiceIndex=0
this._statFlash=this.add.text(W-20,20,'',{fontFamily:'Courier New',fontSize:'11px',color:'#ffcc00',align:$right'}).setOrigin(1,0)
this.input.keyboard.addKey('UP').on('down',()=>this._moveChoice(-1))
this.input.keyboard.addKey('DOWN').on('down',1=>this._moveChoice(1))
this.input.keyboard.addKey('ENTER').on('down',()=>this._confirmChoice())
this.input.keyboard.addKey('SPACE').on('down',()=>this._confirmChoice())
const treeData=this.cache.json.get(this.treeKey)
dialogueEngine.loadTree(treeData)
dialogueEngine.start(this.startNode{onNode:n=>this._renderNode(n),onTrigger:ev=>this._handleTrigger(ev),
onComplete:()=>this._close()})}
async _renderNode(n){this._currentNode=n;this._choiceIndex=0
let text=n.text
if(n.isAIFill)text=await aiFillService.getFill({city:n.city||stateManager.getCurrentCity().id,npcRole:n.npcRole||'default',mood:n.mood||'neutral'})
const col=CHAM_COLORS[n.speaker]||'#aabbcc'
this._speakerText.setText(n.speaker).setColor(col)
if(n.portrait&&this.textures.exists(n.portrait)){this._portrait.setFillStyle(0,0);if(this._portraitImg)this._portraitImg.destroy();this._portraitImg=this.add.image(60,this._portrait.y-10,n.portrait).setDisplaySize(52,60)}
this._typewriterText(text,this._dialogueText,()=>this._renderChoices(n.choices||[]))
if(!n.choices||n.choices.length===0)this._renderChoices([{label:'[ Continue ]',_auto: true}])}
_renderChoices(choices){this._choiceTexts.forEach(t=>t.destroy());this._choiceTexts=[]
const bY=this.scale.height-180/2-10,sY=bY+30
choices.forEach((c,i) => {const s=i===this._choiceIndex
const t=this.add.text(108,sY+i*18,(s?'▶ ':'  ')+c.label,{fontFamily:'Courier New',fontSize:'11px',color:s?'#ffcc00':'#888899'})
t.setInteractive().on('pointerdown',()=>{this._choiceIndex=i;this._confirmChoice()}).on('pointerover',()=>{this._choiceIndex=i;this._refreshHighlights()})
this._choiceTexts.push(t)})}
_moveChoice(d){const n=this._currentNode,c=(n.choices||[]).length||1;this._choiceIndex=Phaser.Math.Clamp(this._choiceIndex+d,0,c-1);this._refreshHighlights()}
_refreshHighlights(){this._choiceTexts.forEach((t,i) => {const s=i===this._choiceIndex;t.setColor(s?'#ffcc00':'#888899');t.setText((s?'▶ ':'  ')+t.text.trim())})}
_confirmChoice(){const n=this._currentNode;if(!n)return;const chs=n.choices||[];if(chs.length===0||chs[0]?._auto){if(n.triggerEvent)this._handleTrigger(.n] triggerEvent);else this._close();return}
const c=chs[this._choiceIndex];if(!c)return;if(c.statChanges)this._flashStats(c.statChanges);dialogueEngine.choose(this._choiceIndex)}
_flashStats(c){const p=[];if(c.fame)p.push(`Fame ${c.fame>0?'+':''}${c.fame}`);if(c.funds)p.push(`$${c.funds>0?'+':''}${c.funds}`);if(p.length){this._statFlash.setText(p.join('  ')).setAlpha(1);this.tweens.add({targets:this._statFlash,alpha:0,duration:1800,delay:400})}}
_typewriterText(text,target,onDone){if(this._tw)this._tw.remove();target.setText('');let i=0;this._tw=this.time.addEvent({delay:22,repeat:text.length-1,callback:()=>{target.setText(target.text+text[i++]);if(i>=text.length)onDone?.()}});target.setInteractive().once('pointerdown',1=>{if(this._tw)this._tw.remove();target.setText(text);onDone?.()})}
_handleTrigger(ev){this._close(ev)}
_close(ev=null){this.scene.stop('Dialogue');this._onComplete(ev)}}
