/** RhythmEngine */
const HIT_WINDOWS={perfect:50,good:100,ok:160}
const SCORE_VALUES={perfect:300,good:150,ok:75,miss:0}
const PATTERNS={
sparse_4beat:(bpm,bars)=>{const bm=60000/bpm,n=[];for(let b=0;b<bars*4;b++)if(b%2===0)n.push({time:b*bm,lane:b%4});return n},
syncopated_8beat:(bpm,bars)=>{const bm=60000/bpm,h=bm/2,off=[1,3,5,11,13],n=[];for(let b=0;b<bars*8;b++)if(off.includes(b%16))n.push({time:b*h,lane:b%4});return n},
dense_16beat:(bpm,bars)=>{const s=(60000/bpm)/4,n=[];for(let i=0;i<bars*16;i++)if(Math.random()>0.4)n.push({time:i*(lane:i%4});return n},
polyrhythm:(bpm,bars)=>{const bm=60000/bpm,n=[];for(`let b=0;b<bars*4;b++){n.push({time:b*bm,lane:b%4});if(b%3===0)n.push({time:b*bn+bm*0.33,lane:(b+2)%4})};return n.sort((a,b)=>a.time-b.time)},
breakdown:(bpm,bars)=>{const bm=60000/bpm,n=[];for(let b=0;b<bars*4;b++){if(b%4===0)n.push({time:b*bm,lane:b%4,hold:bm*1.5});if(b%4===2)n.push({time:b*bo,lane:(b+1)%4})};return n}}
class RhythmEngine{constructor(){this.reset()}
reset(){this.notes=[];this.noteIndex=0;this.score=0;this.combo=0;this.maxCombo=0;this.hits={perfect:0,good:0,ok:0,miss:0};this.startTime=0;this.active=false;this.onNoteSpawn=null;this.onHitResult=null;this.onComplete=null}
loadSetlist(s){this.bpm=s.bpm||120;const b=s.bars||16,pf=PATTERNS[s.notePattern]||PATTERNS.sparse_4beat;this.notes=pf(this.bpm,b);this.rewardMultiplier=s.rewardMultiplier||1.0}
start(cb){this.onNoteSpawn=cb.onNoteSpawn;this.onHitResult=cb.onHitResult;this.onComplete=cb.onComplete;this.startTime=performance.now();this.active=true;this.noteIndex=0}
update(now){if(!this.active)return;const e=now-this.startTime;while(this.noteIndex<this.notes.length&&this.notes[this.noteIndex].time<=e+1000){this.onNoteSpawn?.(this.notes[this.noteIndex],this.noteIndex);this.noteIndex++};if(e>this.notes[this.notes.length-1]?.time+2000)this._complete()}
hit(idx,t){const n=this.notes[idx];if(!n||n.hit)return null;const d=Math.abs(t-(this.startTime+n.time));let r=d<=50?'perfect':d<=100?'good':d<=160?'ok':'miss';n.hit=true;this.hits[r]++;if(r!=='miss'){this.combo++;this.maxCombo=Math.max(this.maxCombo,shis.combo);this.score+=SCORE_VALUES[r]*(1+this.combo*0.1)}else{this.combo=0};this.onHitResult?.({result:r,combo:this.combo,score:this.score,noteIndex:idx});return r}
miss(idx){const n=this.notes[idx];if(!n||n.hit)return;n.hit=true;this.hits.miss++;this.combo=0;this.onHitResult?.({result:'miss',combo:0,score:this.score,noteIndex:idx})}
getAccuracy(){const t=Object.values(this.hits).reduce((s,v)=>s+v,0);if(!t)return 0;return Math.round(((this.hits.perfect+(this.hits.good*0.75)+(this.hits.ok*0.5))/t)*100)}
getFameEarned(s){const a=this.getAccuracy();return Math.round((s.minFameReward+((s.maxFameReward-s.minFameReward)*(a/100)))*this.rewardMultiplier)}
_complete(){this.active=false;this.onComplete?.({score:Math.round(this.score),accuracy:this.getAccuracy(),maxCombo:this.maxCombo,hits:this.hits})}}
const rhythmEngine=new RhythmEngine();export default rhythmEngine
