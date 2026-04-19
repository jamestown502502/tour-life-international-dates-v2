import Phaser from 'phaser'
import BootScene from './scenes/BootScene.js'
import PreloaderScene from './scenes/PreloaderScene.js'
import TitleScene from './scenes/TitleScene.js'
import CityHubScene from './scenes/CityHubScene.js'
import DialogueScene from './scenes/DialogueScene.js'
import RhythmScene from './scenes/RhythmScene.js'
import RoadEventScene from './scenes/RoadEventScene.js'
import GameOverScene from './scenes/GameOverScene.js'
import HUDScene from './scenes/HUDScene.js'
const config={type:Phaser.AUTO,width:960,height:540,parent:'aame-container', pixelArt:true,backgroundColor:'#0a0a0f',physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},scene:[BootScene,PreloaderScene,TitleScene,CityHubScene,DialogueScene,RhythmScene,RoadEventScene,GameOverScene,HUDScene]}
const game=new Phaser.Game(config)
export default game
