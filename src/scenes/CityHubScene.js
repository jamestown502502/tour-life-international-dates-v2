import Phaser from 'phaser'
import stateManager from '../systems/StateManager.js'

const TILE_SIZE   = 16
const PLAYER_SPEED = 90
const INTERACT_DIST = 32

// NPC definitions per city
const CITY_NPCS = {
  chicago: [
    { id: 'ryder_npc',      x: 180, y: 120, sprite: 5,  label: 'Ryder',       dialogueNode: 'act1_ryder_agrees',    color: 0xff6644 },
    { id: 'nova_npc',       x: 300, y: 150, sprite: 6,  label: 'Nova',        dialogueNode: 'act1_nova_pleased',    color: 0xcc88ff },
    { id: 'jet_npc',        x: 420, y: 200, sprite: 7,  label: 'Jet',         dialogueNode: 'act1_jet_opinion',     color: 0x44ccaa },
    { id: 'venue_door',     x: 550, y: 300, sprite: 20, label: 'Stage [E]',   dialogueNode: 'act1_show_launch',     color: 0xffcc00, isStage: true },
    { id: 'local_fan_npc',  x: 220, y: 280, sprite: 3,  label: 'Fan',         dialogueNode: 'act1_venue_floor_npc', color: 0xaaaaaa, isAIFill: true }
  ],
  nashville: [
    { id: 'ryder_npc',      x: 160, y: 140, sprite: 5,  label: 'Ryder',       dialogueNode: 'act1_nashville_soundcheck', color: 0xff6644 },
    { id: 'nova_npc',       x: 320, y: 160, sprite: 6,  label: 'Nova',        dialogueNode: 'act1_nashville_hub',        color: 0xcc88ff },
    { id: 'jet_npc',        x: 440, y: 220, sprite: 7,  label: 'Jet',         dialogueNode: 'act1_nashville_soundcheck', color: 0x44ccaa },
    { id: 'rival_npc',      x: 260, y: 300, sprite: 4,  label: 'Rival Band',  dialogueNode: 'act1_nashville_hub',        color: 0xff4444, isAIFill: true },
    { id: 'stage_door',     x: 560, y: 280, sprite: 20, label: 'Stage [E]',   dialogueNode: 'act1_nashville_show_launch',color: 0xffcc00, isStage: true }
  ]
}

export default class CityHubScene extends Phaser.Scene {
  constructor () { super('CityHub') }

  init (data) {
    this.cityId       = data.cityId       || 'chicago'
    this.dialogueStart = data.dialogueStart || null
    this.returnNode   = data.returnNode   || null
  }

  create () {
    const W = this.scale.width
    const H = this.scale.height

    // --- Background ---
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d0d1a)
    this._buildCityBackground()

    // --- Player ---
    this.player = this._createPlayer(W / 2, H / 2)

    // --- NPCs ---
    this.npcs = this._spawnNPCs()

    // --- Camera ---
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1)
    this.cameras.main.setZoom(2.5)
    this.cameras.main.setBounds(0, 0, W * 2, H * 2)

    // --- Input ---
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' })
    this.eKey  = this.input.keyboard.addKey('E')
    this.eKey.on('down', () => this._tryInteract())

    // --- HUD (fixed camera, launched as overlay scene) ---
    this.scene.launch('HUD')

    // --- Fade in ---
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // --- Auto-start dialogue if provided ---
    if (this.dialogueStart) {
      this.time.delayedCall(700, () => {
        this._openDialogue(this.dialogueStart)
      })
    }

    // City label
    const city = stateManager.getCurrentCity()
    this.add.text(10, 10, `📍 ${city.name}, ${city.country}`, {
      fontFamily: 'Courier New', fontSize: '10px', color: '#888899'
    }).setScrollFactor(0).setDepth(10)

    // Interact hint
    this._interactHint = this.add.text(W / 2, H - 28, '', {
      fontFamily: 'Courier New', fontSize: '10px', color: '#ffcc00',
      backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setAlpha(0)
  }

  update () {
    if (this._dialogueOpen) return

    const up    = this.cursors.up.isDown    || this.wasd.up.isDown
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown
    const right = this.cursors.right.isDown || this.wasd.right.isDown

    const body = this.player.sprite.body
    body.setVelocity(0)

    if (left)  body.setVelocityX(-PLAYER_SPEED)
    if (right) body.setVelocityX(PLAYER_SPEED)
    if (up)    body.setVelocityY(-PLAYER_SPEED)
    if (down)  body.setVelocityY(PLAYER_SPEED)

    // Normalize diagonal
    if ((left || right) && (up || down)) {
      body.velocity.normalize().scale(PLAYER_SPEED)
    }

    // Animate player
    this._animatePlayer(left, right, up, down)

    // Check NPC proximity for hint
    this._checkProximityHints()
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  _buildCityBackground () {
    const W = this.scale.width * 2
    const H = this.scale.height * 2
    const g = this.add.graphics()

    // Floor
    g.fillStyle(0x1a1a2e)
    g.fillRect(0, 0, W, H)

    // Road grid
    g.fillStyle(0x222233)
    for (let x = 0; x < W; x += 80) {
      g.fillRect(x, 0, 2, H)
    }
    for (let y = 0; y < H; y += 80) {
      g.fillRect(0, y, W, 2)
    }

    // Buildings (decorative blocks)
    const buildingColors = [0x2a2a3e, 0x1e1e30, 0x252538, 0x303050]
    const rng = new Phaser.Math.RandomDataGenerator(['tourlife'])
    for (let i = 0; i < 30; i++) {
      const bx = rng.between(0, W - 60)
      const by = rng.between(0, H - 100)
      const bw = rng.between(30, 60)
      const bh = rng.between(40, 100)
      g.fillStyle(buildingColors[i % buildingColors.length])
      g.fillRect(bx, by, bw, bh)

      // Windows
      g.fillStyle(0xffee88, 0.6)
      for (let wy = by + 6; wy < by + bh - 6; wy += 10) {
        for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) {
          if (rng.frac() > 0.3) g.fillRect(wx, wy, 4, 6)
        }
      }
    }

    // Neon accent strips
    g.lineStyle(1, 0xff3366, 0.4)
    g.strokeRect(40, 40, W - 80, H - 80)
  }

  _createPlayer (x, y) {
    // Player represented as colored rect until real sprites loaded
    const sprite = this.physics.add.sprite(x, y, 'kenney_characters', 0)
    sprite.setCollideWorldBounds(true)
    sprite.setDepth(5)

    // Shadow
    const shadow = this.add.ellipse(x, y + 6, 10, 4, 0x000000, 0.4)
    shadow.setDepth(4)

    // Name label
    const label = this.add.text(0, -14, 'YOU', {
      fontFamily: 'Courier New', fontSize: '6px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(6)

    // Attach label/shadow to sprite via preUpdate
    this.events.on('update', () => {
      shadow.x = sprite.x
      shadow.y = sprite.y + 6
      label.x  = sprite.x
      label.y  = sprite.y - 14
    })

    return { sprite, shadow, label, facing: 'down' }
  }

  _spawnNPCs () {
    const defs = CITY_NPCS[this.cityId] || []
    return defs.map(def => {
      const sprite = this.add.rectangle(def.x, def.y, 10, 14, def.color)
      sprite.setDepth(5)

      const label = this.add.text(def.x, def.y - 14, def.label, {
        fontFamily: 'Courier New', fontSize: '6px', color: '#ffffff',
        backgroundColor: '#00000099', padding: { x: 2, y: 1 }
      }).setOrigin(0.5).setDepth(6)

      // Stage marker pulse
      if (def.isStage) {
        this.tweens.add({
          targets: sprite,
          alpha: 0.4,
          duration: 800,
          yoyo: true,
          repeat: -1
        })
      }

      return { ...def, sprite, label }
    })
  }

  _animatePlayer (left, right, up, down) {
    const moving = left || right || up || down
    if (!moving) return
    const t = Math.floor(this.time.now / 200) % 2
    this.player.sprite.setFrame(t)
  }

  _checkProximityHints () {
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    let nearest = null
    let nearestDist = INTERACT_DIST

    for (const npc of this.npcs) {
      const d = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y)
      if (d < nearestDist) {
        nearestDist = d
        nearest = npc
      }
    }

    if (nearest) {
      this._nearestNPC = nearest
      this._interactHint.setText(`[E] Talk to ${nearest.label}`)
      this._interactHint.setAlpha(1)
    } else {
      this._nearestNPC = null
      this._interactHint.setAlpha(0)
    }
  }

  _tryInteract () {
    if (!this._nearestNPC || this._dialogueOpen) return
    this._openDialogue(this._nearestNPC.dialogueNode)
  }

  _openDialogue (startNode) {
    this._dialogueOpen = true
    this.scene.pause('CityHub')
    this.scene.launch('Dialogue', {
      startNode,
      treeKey: 'act1_hub',
      onComplete: (triggerEvent) => {
        this._dialogueOpen = false
        this.scene.resume('CityHub')
        if (triggerEvent) this._handleTrigger(triggerEvent)
      }
    })
  }

  _handleTrigger (event) {
    switch (event.type) {
      case 'rhythm_performance':
        this.cameras.main.fadeOut(500, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('CityHub')
          this.scene.stop('HUD')
          this.scene.start('Rhythm', {
            setlistId:  event.setlistId,
            returnNode: event.returnNode,
            cityId:     this.cityId
          })
        })
        break

      case 'road_event':
        this.cameras.main.fadeOut(500, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('CityHub')
          this.scene.stop('HUD')
          this.scene.start('RoadEvent', {
            pool:       event.pool,
            returnNode: event.returnNode,
            nextCityId: this._getNextCityId()
          })
        })
        break

      case 'act_transition':
        stateManager.set('act', event.nextAct)
        stateManager.advanceCity()
        this.cameras.main.fadeOut(800, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('CityHub')
          this.scene.stop('HUD')
          const nextCity = stateManager.getCurrentCity()
          this.scene.start('CityHub', {
            cityId: nextCity.id,
            dialogueStart: `act${event.nextAct}_${nextCity.id}_arrival`
          })
        })
        break
    }
  }

  _getNextCityId () {
    const cities = stateManager.cities
    const idx = stateManager.get('cityIndex')
    return cities[idx + 1]?.id || 'london'
  }
}
