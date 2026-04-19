/**
 * AIFillService — Claude API fill for minor NPCs only.
 * Named characters (Ryder, Nova, Jet) are NEVER routed here.
 */
import stateManager from './StateManager.js'
const NAMED=new Set(['Ryder Blaze','Nova Wilde','Jet','Player'])
class AIFillService{constructor(){this.cache=new Map();this.enabled=true}
isAICharacter(s){return!NAMED.has(s)}
async getFill(ctx){if(!this.enabled)return this._fallback(ctx)
const k=ctx.city+'_'+ctx.npcRole+'_'+stateManager.get('fame')
if(this.cache.has(k))return this.cache.get(k)
try{const res=await fetch('/api/npc-dialogue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({city:ctx.city,npcRole:ctx.npcRole,mood:ctx.mood,playerFame:stateManager.get('fame'),ryderRel:stateManager.get('relationships').ryder,novaRel:stateManager.get('relationships').nova,jetRel:stateManager.get('relationships').jet,act:stateManager.get('act'),flags:stateManager.get('flags')})})
if(!res.ok)throw new Error('API error')
const data=await res.json()
const text=data.text||this._fallback(ctx)
this.cache.set(k,text);return text}catch(err){return this._fallback(ctx)}}
_fallback(ctx){const f={rival_band_member:["Don't get too comfortable on that stage.","Heard you had a rough show last night.","We're headlining this festival next year."],local_fan:["I've been following you since the first show!","Sign my jacket? Please?","You're gonna be huge."],venue_owner:["You fill those seats, you get a cut.","Don't trash my dressing room.","You want a second night?"],default:["This city's seen a lot of acts.","Good luck tonight.","The scene here is something else."]}
const pool=f[ctx.npcRole]||f.default
return pool[Math.floor(Math.random()*pool.length)]}}
const aiFillService=new AIFillService()
export default aiFillService
