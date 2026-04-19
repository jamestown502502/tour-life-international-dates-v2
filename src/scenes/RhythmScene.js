import Phaser from 'phaser'
import rhythmEngine  from '../systems/RhythmEngine.js'
import stateManager  from '../systems/StateManager.js'
const LANE_COUNT = 4
const LANE_COLORS = [0xff3366, 0xffaa00, 0x33ccff, 0xaa44ff]
const LANE_KEYS = ['D', 'F', 'J', 'K']
const HIT_Y = 420
const TRAVELTIME = 1800

export default class RhythmScene extends Phaser.Scene {
  constructor () { super('Rhythm') }

  init (data) {
    this.setlistId = data.setlistId  || 'act1_chicago_divebar'
    this.returnNode = data.returnNode || 'act1_post_show'
    this.cityId     = data.cityId     || 'chicago'
  }

  create () {
    const W = this.scale.width
    const H = this.scale.height

    this._setlists = this.cache.json.get('setlists')
    this._setlist  = this._setlists[this.setlistId]

    if (!this._setlist) {
      console.error('Setlist not found:', this.setlistId)
      this._endPerformance({ score: 0, accuracy: 0, maxCombo: 0, hits: {} })
      return
    }

    // Lane positions
    this._laneXs = []
    const laneSpacing = 60
    const startX = W / 2 - (LANE_COUNT - 1) * laneSpacing / 2
    for (let i = 0; i < LANE_COUNT; i++) {
      this._laneXs.push(startX + i * laneSpacing)
    }

    this._buildStageBackground()

    // Lane lines
    const laneGfx = this.add.graphics()
    laneGfx.lineStyle(1, 0x333355, 0.5)
    this._laneXs.forEach(x => { laneGfx.lineBetween(x, 0, x, H) })

    // Hit zone
    const hitGfx = this.add.graphics()
    this._laneXs.forEach((x, i) => {
      hitGfx.lineStyle(2, LANE_COLORS[i], 0.7)
      hitGfx.strokeCircle(x, HIT_Y, 20)
      hitGfx.fillStyle(LANE_COLORS[i], 0.15)
      hitGfx.fillCircle(x, HIT_Y, 20)
    })

    // Key labels
    this._laneXs.forEach((x, i) => {
      this.add.text(x, HIT_Y + 28, LANE_KEYS[i], {
        fontFamily: 'Courier New', fontSize: '12px',
        color: '#' + LANE_COLORS[i].toString(16).padStart(6, '0')
      }).setOrigin(0.5)
    })

    // HUD
    this._scoreText   = this.add.text(16, 16, 'SCORE  0', { fontFamily: 'Courier New', fontSize: '13px', color: '#ffffff' })
    this._comboText   = this.add.text(16, 34, 'COMBO  0', { fontFamily: 'Courier New', fontSize: '11px', color: '#ffcc00' })
    this._accText     = this.add.text(W - 16, 16, 'ACC  ---%', { fontFamily: 'Courier New', fontSize: '11px', color: '#aaaacc' }).setOrigin(1, 0)
    this._hitText     = this.add.text(W / 2, HIT_Y - 50, '', {
      fontFamily: 'Courier New', fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0)

    this.add.text(W / 2, 14, `${this._setlist.venue} —  ${this._setlist.city}`, {
      fontFamily: 'Courier New', fontSize: '11px', color: '#666688'
    }).setOrigin(0.5)

    this._activeNotes = []

    // Keys
    this._keys = LANE_KEYS.map(k => this.input.keyboard.addKey(k))
    this._keys.forEach((key, i) => {
      key.on('down', () => this._pressLane(i))
    })

    // Audio
    const trackKeys = ['track_01','track_02','track_03','track_04','track_05','track_06']
    const setlistKeys = Object.keys(this._setlists)
    const trackIdx = setlistKeys.indexOf(this.setlistId)
    const trackKey = trackKeys[trackIdx] || 'track_01'
    const fallbackKey = trackIdx === 0 ? 'gamesounds_bgm_01' : 'gamesounds_bgm_02'

    if (this.cache.audio.exists(trackKey)) {
      this._music = this.sound.add(trackKey, { loop: false, volume: 0.7 })
    } else if (this.cache.audio.exists(fallbackKey)) {
      this._music = this.sound.add(fallbackKey, { loop: false, volume: 0.7 })
    }

    this._countdownAndStart()
  }

  _countdownAndStart () {
    const W = this.scale.width
    let count = 3
    const ct = this.add.text(W / 2, this.scale.height / 2, String(count), {
      fontFamily: 'Courier New', fontSize: '72px', color: '#ff3366'
    }).setOrigin(0.5)
    this.time.addEvent({
      delay: 800, repeat: 3,
      callback: () => {
        count--
        if (count > 0) {
          ct.setText(String(count))
          this.tweens.add({ targets: ct, scaleX: 1.4, scaleY: 1.4, duration: 200, yoyo: true })
        } else {
          ct.destroy()
          this._startPerformance()
        }
      }
    })
  }

  _startPerformance () {
    rhythmEngine.reset()
    rhythmEngine.loadSetlist(this._setlist)
    rhythmEngine.start({
      onNoteSpawn: (note, idx) => this._spawnNote(note, idx),
      onHitResult: (res)       => this._showHitFeedback(res),
      onComplete:  (sum)       => this._endPerformance(sum)
    })
    if (this._music) this._music.play()
    this._updEvt = this.time.addEvent({
      delay: 16, loop: true,
      callback: () => rhythmEngine.update(performance.now())
    })
  }

  _spawnNote (note, idx) {
    const x = this._laneXs[note.lane]
    const col = LANE_COLORS[note.lane]
    const gfx = this.add.graphics()
    gfx.fillStyle(col, 1)
    gfx.fillCircle(0, 0, 10)
    gfx.x  = x
    gfx.y  = -40
    gfx.setDepth(3)
    const noteObj = { gfx, note, idx, hit: false, missed: false }
    this._activeNotes.push(noteObj)
    this.tweens.add({
      targets: gfx, y: HIT_Y, duration: TRAVELTIME, ease: 'Linear',
      onComplete: () => {
        if (!noteObj.hit) {
          noteObj.missed = true
          rhythmEngine.miss(idx)
          this.tweens.add({ targets: gfx, alpha: 0, y: HIT_Y + 40, duration: 200, onComplete: () => gfx1.destroy() })
        }
      }
    })
  }

  _pressLane (lane) {
    let best = null, bestDist = Infinity
    for (const n of this._activeNotes) {
      if (n.hit || n.missed || n.note.lane !== lane) continue
      const dist = Math.abs(n.gfx.y - HIT_Y)
      if (dist < bestDist && dist < 40) { bestDist = dist; best = n }
    }
    if (best) {
      best.hit = true
      rhythmEngine.hit(best.idx, performance.now())
      this.tweens.add({ targets: best.gfx, scaleX: 2, scaleY: 2, alpha: 0, duration: 150, onComplete: () => best.gfx.destroy() })
      this._flashLane(lane)
    }
    this._flashKeyPress(lane)
  }

  _flashLane (lane) {
    const x = this._laneXs[lane]
    const f = this.add.rectangle(x, HIT_Y, 30, 60, LANE_COLORS[lane], 0.4)
    this.tweens.add({ targets: f, alpha: 0, duration: 120, onComplete: () => f.destroy() })
  }

  _flashKeyPress (lane) {
    const x = this._laneXs[lane]
    const c = this.add.circle(x, HIT_Y, 22, LANE_COLORS[lane], 0.6)
    this.tweens.add({ targets: c, scaleX: 2, scaleY: 2, alpha: 0, duration: 200, onComplete: () => c.destroy() })
  }

  _showHitFeedback ({ result, combo, score }) {
    const colors = { perfect: '#ffcc00', good: '#44ffaa', ok: '#aaaaff', miss: '#ff4444' }
    const labels = { perfect: 'PERFECT!', good: 'GOOD', ok: 'OK', miss: 'MISS' }
    this._hitText.setText(labels[result]).setColor(colors[result]).setAlpha(1)
    this.tweens.add({ targets: this._hitText, alpha: 0, duration: 500 })
    this._scoreText.setText('SCORE  ' + Math.round(score))
    this._comboText.setText('COMBO  ' + combo).setColor(combo > 10 ? '#ff3366' : '#ffcc00')
    this._accText.setText('ACC  ' + rhythmEngine.getAccuracy() + '%')
    if (this.cache.audio.exists('s'u_hit_' + result)) {
      this.sound.play('sfx_hit_' + result, { volume: 0.5 })
    }
  }

  _endPerformance (summary) {
    if (this._updEvt) this._updEvt.remove()
    if (this._music) this._music.stop()
    const fameEarned  = rhythmEngine.getFameEarned(this._setlist)
    const fundsEarned = Math.round(
      this._setlist.minFundsReward +
      ((this._setlist.maxFundsReward - this._setlist.minFundsReward) * (summary.accuracy / 100))
    )
    stateManager.applyStatChanges({ fame: fameEarned, funds: fundsEarned })
    stateManager.recordPerformance(this.setlistId, summary.score, fameEarned)
    this._showResults(summary, fameEarned, fundsEarned)
  }

  _showResults (summary, fameEarned, fundsEarned) {
    const W = this.scale.width
    const H = this.scale.height
    this.cameras.main.fadeIn(400, 0, 0, 0)
    const panel = this.add.rectangle(W / 2, H / 2, 360, 260, 0x0d0d1a, 0.96)
    panel.setStrokeStyle(1, 0xff3366).setDepth(20)
    const lines = [
      { t: '-— SHOW REPORT —',                    c: '#ff3366', s: '15px', y: -90 },
      { t: `SCORE    ${summary.score}`,              c: '#ffffff', s: '13px', y: -55 },
      { t: `ACCURACY ${summary.accuracy}%`,          c: '#ffcc00', s: '13px', y: -35 },
      { t: `MAX COMBO ${summary.maxCombo}x`,         c: '#44ffaa', s: '13px', y: -15 },
      { t: `+${fameEarned} FAME  
  
  
  
  
  
  
  
  
  } +${fundsEarned}`, c: '#cc88ff', s: '14px', y: 62 },
      { t: '[ CONTINUE ]',                            c: '#ffcc00', s: '13px', y: 90 }
    ]
    lines.forEach(l => {
      this.add.text(W / 2, H / 2 + l.y, l.t, {
        fontFamily: 'Courier New', fontSize: l.s, color: l.c
      }).setOrigin(0.5).setDepth(21)
    })
    const proceed = () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('Rhythm')
        this.scene.start('CityHub', { cityId: this.cityId, dialogueStart: this.returnNode })
      })
    }
    this.input.keyboard.once('keydown-SPACE', proceed)
    this.input.keyboard.once('keydown-ENTER', proceed)
    this.input.once('pointerdown', proceed)
  }

  _buildStageBackground () {
    const W = this.scale.width
    const H = this.scale.height
    const g = this.add.graphics()
    g.fillStyle(0x0a0a18)
    g.fillRect(0, 0, W, H)
    g.fillStyle(0x1a1a2e)
    g.fillRect(0, H * 0.6, W, H * 0.4)
    const lcols = [0xff3366, 0xffaa00, 0x33ccff, 0xaa44ff]
    lcols.forEach((c, i) => {
      g.fillStyle(c, 0.04)
      const lx = (W / (lcols.length + 1)) * (i + 1)
      g.fillTriangle(lx, 0, lx - 60, H, lx + 60, H)
    })
    // Crowd silhouettes
    const crowdCol = this._setlist.crowdColor || 0x333344
    g.fillStyle(crowdCol, 0.25)
    for (let i = 0; i < 40; i++) {
      const cx = (i / 40) * W + 10
      const cy = H * 0.55 + Math.sin(i * 1.3) * 8
      g.fillCircle(cx, cy, 5)
      g.fillRect(cx - 4, cy, 8, 14)
    }
  }
}
