/**
 * StateManager — single source of truth for all player state.
 * Tracks fame, funds, relationship scores, current act/city, flags.
 * Persists to localStorage between sessions.
 */

const DEFAULT_STATE = {
  fame: 10, funds: 500,
  relationships: { ryder: 0, nova: 0, jet: 0 },
  act: 1, cityIndex: 0, venueIndex: 0,
  flags: {}, performances: [], citiesVisited: [], dialogueCompleted: []
}
const CITIES = [
  { id: 'chicago',   name: 'Chicago',    country: 'USA',     venue: 'The Dive Bar',       act: 1 },
  { id: 'nashville', name: 'Nashville',  country: 'USA',     venue: 'The Honky Tonk',     act: 1 },
  { id: 'london',    name: 'London',     country: 'UK',      venue: 'Electric Ballroom',  act: 2 },
  { id: 'berlin',    name: 'Berlin',     country: 'Germany', venue: 'Tresor Club',         act: 2 },
  { id: 'tokyo',     name: 'Tokyo',      country: 'Japan',   venue: 'Zepp DiverCity',     act: 3 },
  { id: 'rio',       name: 'Rio',        country: 'Brazil',  venue: 'Lapa Arches Stage',  act: 3 }
]
class StateManager {
  constructor () { this.state = null; this.cities = CITIES }
  init () { const s=localStorage.getItem('tourlife_state'); this.state=s?{...DEFAULT_STATE,...JSON.parse(s)}:{...DEFAULT_STATE} }
  save () { localStorage.setItem('tourlife_state',JSON.stringify(this.state)) }
  reset () { this.state={...DEFAULT_STATE}; localStorage.removeItem('tourlife_state') }
  get (k) { return this.state[k] }
  set (k,v) { this.state[k]=v; this.save() }
  getFlag (k) { return this.state.flags[k]||false }
  setFlag (k,v=true) { this.state.flags[k]=v; this.save() }
  applyStatChanges (c) {
    if(!c)return
    if(c.fame)this.state.fame=Math.max(0,Math.min(100,this.state.fame+c.fame))
    if(c.funds)this.state.funds=Math.max(0,this.state.funds+c.funds)
    if(c.ryder_rel)this.state.relationships.ryder=Math.max(-10,Math.min(10,this.state.relationships.ryder+c.ryder_rel))
    if(c.nova_rel)this.state.relationships.nova=Math.max(-10,Math.min(10,this.state.relationships.nova+c.nova_rel))
    if(c.jet_rel)this.state.relationships.jet=Math.max(-10,Math.min(10,this.state.relationships.jet+c.jet_rel))
    this.save()
  }
  markDialogueComplete (id) { if(!this.state.dialogueCompleted.includes(id)){this.state.dialogueCompleted.push(id);this.save()} }
  recordPerformance (id,s,f) { this.state.performances.push({venueId:id,score:s,fameEarned:f,timestamp:Date.now()}); this.save() }
  getCurrentCity () { return this.cities[this.state.cityIndex]||this.cities[0] }
  advanceCity () { if(this.state.cityIndex<this.cities.length-1){this.state.cityIndex++;this.save();return true};return false }
  getEndingType () {
    const {fame,relationships,performances}=this.state
    const avg=performances.length?performances.reduce((s,p)=>s+p.score,0)/performances.length:0
    const happy=(relationships.ryder+relationships.nova+relationships.jet)>=5
    if(fame>=80&&avg>=70&&happy)return 'legendary'
    if(fame>=60&&avg>=50)return 'headliner'
    if(fame>=40)return 'cult_hero'
    if(happy)return 'band_intact'
    return 'crash_and_burn'
  }
}
const stateManager = new StateManager()
export default stateManager
