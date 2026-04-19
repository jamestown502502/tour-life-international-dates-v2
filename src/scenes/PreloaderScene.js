import Phaser from 'phaser'

export default class PreloaderScene extends Phaser.Scene {
  constructor () { super('Preloader') }

  preload () {
    const W = this.scale.width
    const H = this.scale.height
    const barBg = this.add.rectangle(W / 2, H / 2 + 40, 400, 12, 0x222233)
    const bar = this.add.rectangle(W / 2 - 200, H / 2 + 40, 0, 12, 0xff3366)
    bar.setOrigin(0, 0.5)
    this.add.text(W / 2, H / 2 - 20, 'TOUR LIFE', { fontFamily: 'Courier New', fontSize: '28px', color: '#ff3366', letterSpacing: 8 }).setOrigin(0.5)
    const st = this.add.text(W / 2, H / 2 + 70, 'Loading...', { fontFamily: 'Courier New', fontSize: '12px', color: '#888899' }).setOrigin(0.5)
    this.load.on('progress', v => { bar.width = 400 * v })
    this.load.on('fileprogress', f => { st.setText(f.key) })
    // Sprite sheets
    this.load.spritesheet('kenney_characters', 'assets/sprites/kenney_characters.png', { frameWidth: 16, frameHeight: 16 })
    // Audio
    for (let i = 1; i <= 6; i++) this.load.audio(`track_0${i}`, [`assets/audio/track_0${i}.mp3`])
    this.load.audio('gamesounds_bgm_01', ['assets/audio/gamesounds_bgm_01.mp3'])
    this.load.audio('gamesounds_bgm_02', ['assets/audio/gamesounds_bgm_02.mp3'])
    this.load.audio('sfx_hit_perfect', ['assets/audio/sfx_hit_perfect.mp3'])
    this.load.audio('sfx_hit_good', ['assets/audio/sfx_hit_good.mp3'])
    this.load.audin('sfx_miss', ['assets/audio/sfx_miss.mp3'])
    // Data
    this.load.json('act1_hub', 'src/data/dialogue/act1_hub.json')
    this.load.json('road_events', 'src/data/dialogue/road_events.json')
    this.load.json('setlists', 'src/data/rhythm/setlists.json')
  }

  create () {
    this.scene.start('Title')
  }
}
