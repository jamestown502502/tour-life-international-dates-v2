import Phaser from 'phaser'
import dialogueEngine from '../systems/DialogueEngine.js'
import aiFillService  from '../systems/AIFillService.js'
import stateManager   from '../systems/StateManager.js'

const CHAR_COLORS = {
  'Ryder Blaze': '#ff6644',
  'Nova Wilde':  '#cc88ff',
  'Jet':         '#44ccaa',
  'Player':      '#ffffff'
}

export default class DialogueScene extends Phaser.Scene {
  constructor () { super('Dialogue') }

  init (data) {
    this.startNode   = data.startNode
    this.treeKey     = data.treeKey || 'act1_hub'
    this._onComplete = data.onComplete || (() => {})
  }

  create () {
    const W = this.scale.width
    const H = this.scale.height

    // Semi-transparent overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)

    // Dialogue box
    const boxH  = 180
    const boxY  = H - boxH / 2 - 10
    const box   = this.add.rectangle(W / 2, boxY, W - 40, boxH, 0x0d0d1a, 0.96)
    box.setStrokeStyle(1, 0xff3366, 0.8)

    // Portrait area
    this._portrait = this.add.rectangle(60, boxY - 10, 56, 64, 0x1a1a2e)
    this._portrait.setStrokeStyle(1, 0x444466)

    // Speaker name
    this._speakerText = this.add.text(100, boxY - boxH / 2 + 14, '', {
      fontFamily: 'Courier New', fontSize: '13px', color: '#ffffff',
      fontStyle: 'bold'
    })

    // Dialogue text
    this._dialogueText = this.add.text(100, boxY - boxH / 2 + 32, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#ddddee',
      wordWrap: { width: W - 160 }, lineSpacing: 4
    })

    // Choice buttons container
    this._choiceTexts = []
    this._choiceIndex = 0

    // Stat flash
    this._statFlash = this.add.text(W - 20, 20, '', {
      fontFamily: 'Courier New', fontSize: '11px', color: '#ffcc00',
      align: 'right'
    }).setOrigin(1, 0)

    // Keyboard navigation
    this._upKey   = this.input.keyboard.addKey('UP')
    this._downKey = this.input.keyboard.addKey('DOWN')
    this._enter   = this.input.keyboard.addKey('ENTER')
    this._space   = this.input.keyboard.addKey('SPACE')

    this._upKey.on('down',   () => this._moveChoice(-1))
    this._downKey.on('down', () => this._moveChoice(1))
    this._enter.on('down',   () => this._confirmChoice())
    this._space.on('down',   () => this._confirmChoice())

    // Load tree and start
    const treeData = this.cache.json.get(this.treeKey)
    dialogueEngine.loadTree(treeData)
    dialogueEngine.start(this.startNode, {
      onNode:     (node) => this._renderNode(node),
      onTrigger:  (evt)  => this._handleTrigger(evt),
      onComplete: ()     => this._close()
    })
  }

  async _renderNode (node) {
    this._currentNode = node
    this._choiceIndex = 0

    // Handle AI fill for minor NPCs
    let text = node.text
    if (node.isAIFill) {
      text = await aiFillService.getFill({
        city:    node.city    || stateManager.getCurrentCity().id,
        npcRole: node.npcRole || 'default',
        mood:    node.mood    || 'neutral'
      })
    }

    // Speaker name + color
    const color = CHAR_COLORS[node.speaker] || '#aabbcc'
    this._speakerText.setText(node.speaker).setColor(color)

    // Portrait
    if (node.portrait && this.textures.exists(node.portrait)) {
      this._portrait.setFillStyle(0x000000, 0)
      if (this._portraitImg) this._portraitImg.destroy()
      this._portraitImg = this.add.image(60, this._portrait.y - 10, node.portrait)
      this._portraitImg.setDisplaySize(52, 60)
    }

    // Typewriter effect
    this._typewriterText(text, this._dialogueText, () => {
      this._renderChoices(node.choices || [])
    })

    // If no choices, auto-advance hint
    if (!node.choices || node.choices.length === 0) {
      this._renderChoices([{ label: '[ Continue ]', _autoAdvance: true }])
    }
  }

  _renderChoices (choices) {
    // Clear old
    this._choiceTexts.forEach(t => t.destroy())
    this._choiceTexts = []

    const W  = this.scale.width
    const H  = this.scale.height
    const boxY = H - 180 / 2 - 10
    const startY = boxY + 30

    choices.forEach((choice, i) => {
      const isSelected = i === this._choiceIndex
      const prefix = isSelected ? '▶ ' : '  '
      const col    = isSelected ? '#ffcc00' : '#888899'

      const t = this.add.text(108, startY + i * 18, prefix + choice.label, {
        fontFamily: 'Courier New', fontSize: '11px', color: col
      })
      t.setInteractive().on('pointerdown', () => {
        this._choiceIndex = i
        this._confirmChoice()
      })
      t.on('pointerover', () => {
        this._choiceIndex = i
        this._refreshChoiceHighlights()
      })
      this._choiceTexts.push(t)
    })
  }

  _moveChoice (dir) {
    const node = this._currentNode
    if (!node) return
    const count = (node.choices || []).length || 1
    this._choiceIndex = Phaser.Math.Clamp(this._choiceIndex + dir, 0, count - 1)
    this._refreshChoiceHighlights()
  }

  _refreshChoiceHighlights () {
    this._choiceTexts.forEach((t, i) => {
      const sel = i === this._choiceIndex
      t.setColor(sel ? '#ffcc00' : '#888899')
      t.setText((sel ? '▶ ' : '  ') + t.text.trim())
    })
  }

  _confirmChoice () {
    const node = this._currentNode
    if (!node) return

    const choices = node.choices || []
    if (choices.length === 0 || choices[0]?._autoAdvance) {
      // Auto-advance
      if (node.triggerEvent) {
        this._handleTrigger(node.triggerEvent)
      } else {
        this._close()
      }
      return
    }

    const choice = choices[this._choiceIndex]
    if (!choice) return

    // Flash stat changes
    if (choice.statChanges) this._flashStats(choice.statChanges)

    dialogueEngine.choose(this._choiceIndex)
  }

  _flashStats (changes) {
    const parts = []
    if (changes.fame)      parts.push(`Fame ${changes.fame > 0 ? '+' : ''}${changes.fame}`)
    if (changes.funds)     parts.push(`$${changes.funds > 0 ? '+' : ''}${changes.funds}`)
    if (changes.ryder_rel) parts.push(`Ryder ${changes.ryder_rel > 0 ? '+' : ''}${changes.ryder_rel}`)
    if (changes.nova_rel)  parts.push(`Nova ${changes.nova_rel > 0 ? '+' : ''}${changes.nova_rel}`)
    if (changes.jet_rel)   parts.push(`Jet ${changes.jet_rel > 0 ? '+' : ''}${changes.jet_rel}`)
    if (!parts.length) return

    this._statFlash.setText(parts.join('  ')).setAlpha(1)
    this.tweens.add({
      targets: this._statFlash,
      alpha: 0,
      duration: 1800,
      delay: 400
    })
  }

  _typewriterText (text, target, onComplete) {
    if (this._typewriterEvent) this._typewriterEvent.remove()
    target.setText('')
    let i = 0
    this._typewriterEvent = this.time.addEvent({
      delay: 22,
      repeat: text.length - 1,
      callback: () => {
        target.setText(target.text + text[i])
        i++
        if (i >= text.length) onComplete?.()
      }
    })
    // Skip on click
    target.setInteractive().once('pointerdown', () => {
      if (this._typewriterEvent) this._typewriterEvent.remove()
      target.setText(text)
      onComplete?.()
    })
  }

  _handleTrigger (event) {
    this._close(event)
  }

  _close (triggerEvent = null) {
    this.scene.stop('Dialogue')
    this._onComplete(triggerEvent)
  }
}
