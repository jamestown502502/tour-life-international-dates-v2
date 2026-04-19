import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'
export default class HUDScene extends Phaser.Scene{constructor(){super('HUD')}
create(){const W=this.scale.width
this.add.rectangle(W/2,14,W,28,0x0a0a12,0.9)
this._fameBg=this.add.rectangle(90,14,80,6,0x222233)
this._fameBar=this.add.rectangle(90-40,14,0,6,0xff3366).setOrigin(0,0.5)
this.add.text(16,14,'FAME', {fontFamily:'Courier New',fontSize:'9px',color:'#ff3366'}).setOrigin(0,0.5)
this._fundsText=this.add.text(190,14,'$0',{fontFamily:'Courier New',fontSize:'10px',color:'#44ffaa'}).setOrigin(0,0.5)
const rn=['R','N','J'],rc=['#ff6644','#cc88ff','#44ccaa']
this._relBars=[]
rn.forEach((n,i) => {const x=W-120+i*36;this.add.text(x,7,n,{fontFamily:'Courier New',fontSize:'8px',color:rc[i]}).setOrigin(0.5);this.add.rectangle(x,19,20,4,0x222233);const b=this.add.rectangle(x-10,19,0,4,parseInt(rc[i].replace('#',''),16)).setOrigin(0,0.5);this._relBars.push(b)})
this._cityText=this.add.text(W/2,14,'',{fontFamily:'Courier New',fontSize:'9px',color:'#666688'}).setOrigin(0.5)
this.time.addEvent({delay:500,loop:true,callback:this._refresh,callbackScope:this});this._refresh()}
_refresh(){const f=stateManager.get('fame'),fu=stateManager.get('funds'),r=stateManager.get('relationships'),c=stateManager.getCurrentCity()
this._fameBar.width=(f/100)*80;this._fundsText.setText('$'+fu.toLocaleString());this._cityText.setText('📍 '+c.name)
const rv=[r.ryder,r.nova,r.jet];this._relBars.forEach((bar,i) => {bar.width=((rv[i]+10)/20)*20})}}
