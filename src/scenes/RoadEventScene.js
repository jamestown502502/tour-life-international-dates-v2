import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'

export default class RoadEventScene extends Phaser.Scene {
  constructor () { super('RoadEvent') ~

  init (data) {
    this.pool       = data.pool       || 'act1_road_events'
    this.returnNode = data.returnNode || 'act1_nashville_arrival'
    this.nextCityId = data.nextCityId || 'nashville'
  }

  create () {
    const W = this.scale.width
    const H = this.scale.height

    const events = this.cache.json.get('road_events')
    const ev = Phaser.Utils.Array.GetRandom(events)

    // Background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x050510, 0x050510, 0x0d0d1a, 0x0d0d1a, 1)
    bg.fillRect(0, 0, W, H)

    // Road visual
    const rg = this.add.graphics()
    rg.fillStyle(0x1a1a2e)
    rg.fillRect(0, H * 0.5, W, H * 0.5)
    rg.fillStyle(0x333344)
    for (let x = 0; x < W; x += 60) {
      rg.fillRect(x, H * 0.62, 15, 4)
    }

    // Title
    this.add.text(W / 2, 40, `\u26a1 ${ev.title}`, {
      fontFamily: 'Courier New', fontSize: '15px', color: '#ff3366'
    }).setOrigin(0.5)

    // Description
    this.add.text(W / 2, 80, ev.description, {
      fontFamily: 'Courier New', fontSize: '10px', color: '#888899',
      wordWrap: { width: W - 80 }, align: 'center'
    }).setOrigin(0.5)

    // Dialogue box
    const panelY = H * 0.62
    const box = this.add.rectangle(W / 2, panelY + 20, W - 20, 200, 0x0d0d1a, 0.95)
    box.setStrokeStyle(1, 0xff3366, 0.6)

    // Speaker
    this.add.text(24, panelY + 10, ev.speaker, {
      fontFamily: 'Courier New', fontSize: '12px', color: '#ff6644', fontStyle: 'bold'
    })

    // Speach text
    this.add.text(24, panelY + 28, `"${ev.text}"`, {
      fontFamily: 'Courier New', fontSize: '11px', color: '#ddddee',
      wordWrap: { width: W - 50 }, lineSpacing: 3
    })

    // Choices
    this._selected = 0
    this._choiceTexts = []
    ;(ev.choices || []).forEach((c, i) => {
      const yp = panelY + 100 + i * 22
      const isSel = i === 0
      const t = this.add.text(W / 2, yp, (isSel ? '\u25b6 ' : '  ') + c.label, {
        fontFamily: 'Courier New', fontSize: '11px', color: isSel ? '#ffcc00' : '#888899'
      }).setOrigin(0.5)
      t.setInteractive().on('pointerdown', () => {
        this._selected = i
        this._confirm(ev)
      })
      t.on('pointerover', () => {
        this._selected = i
        this._refresh(ev)
      })
      this._choiceTexts.push(t)
    })

    // Keyboard
    this.input.keyboard.addKey('UP').on('down', () => {
      this._selected = Math.max(0, this._selected - 1)
      this._refresh(ev)
    })
    this.input.keyboard.addKey('DOWN').on('down', () => {
      this._selected = Math.min((ev.choices || []).length - 1, this._selected + 1)
      this._refresh(ev)
    })
    this.input.keyboard.addKey('ENTER').on('down', () => this._confirm(ev))
    this.input.keyboard.addKey('SPACE').on('down', () => this._confirm(ev))

    this.cameras.main.fadeIn(500, 0, 0, 0)
  }

  _refresh (ev) {
    this._choiceTexts.forEach((t, i) => {
      const sel = i === this._selected
      t.setColor(sel ? '#ffcc00' : '#888899')
      const raw = t.text.replace(/^[\u25b6 ]+/, '')
      t.setText((sel ? '\u25b6 ' : '  ') + raw)
    })
  }

  _confirm (ev) {
    const c = (ev.choices || [])[this._selected]
    if (!c) return
    if (c.statChanges) stateManager.applyStatChanges(c.statChanges)
    if (c.setFlag) stateManager.setFlag(c.setFlag.key, c.setFlag.value)
    this._showOutcome(c.outcome || '', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('RoadEvent')
        this.scene.start('CityHub', {
          cityId:       this.nextCityId,
          dialogueStart: this.returnNode
        })
      })
    })
  }

  _showOutcome (text, onDone) {
    const W = this.scale.width
    const H = this.scale.height
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
    const t = this.add.text(W / 2, H / 2, text, {
      fontFamily: 'Courier New', fontSize: '12px', color: '#ffffff',
      wordWrap: { width: W - 80 }, align: 'center'
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: t, alpha: 1, duration: 600 })
    this.time.delayedCall(800, () => {
      this.input.keyboard.once('keydown-SPACE', onDone)
      this.input.keyboard.once('keydown-ENTER', onDone)
      this.input.once('pointerdown', onDone)
    })
  }
}
