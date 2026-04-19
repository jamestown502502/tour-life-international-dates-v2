/**
 * DialogueEngine — walks the authored JSON spine.
 * Named characters (Ryder, Nova, Jet, Player) are always spine nodes.
 * Minor NPCs flagged isAIFill:true route to AIFillService.
 */

import stateManager from './StateManager.js'

class DialogueEngine {
  constructor () {
    this.tree = {}
    this.currentNodeId = null
    this.onNodeCallback = null
    this.onTriggerCallback = null
    this.onCompleteCallback = null
  }

  loadTree (treeData) {
    this.tree = {}
    treeData.forEach(node => { this.tree[node.id] = node })
  }

  start (startNodeId, { onNode, onTrigger, onComplete }) {
    this.onNodeCallback = onNode
    this.onTriggerCallback = onTrigger
    this.onCompleteCallback = onComplete
    this.goTo(startNodeId)
  }

  goTo (nodeId) {
    if (!nodeId) { this.onCompleteCallback?.(); return }
    const node = this.tree[nodeId]
    if (!node) { console.warn('node not found:', nodeId); this.onCompleteCallback?.(); return }
    this.currentNodeId = nodeId
    if (node.condition) {
      const passes = this._evalCondition(node.condition)
      if (!passes && node.conditionFail) { this.goTo(node.conditionFail); return }
    }
    stateManager.markDialogueComplete(nodeId)
    if (node.triggerEvent && (!node.choices || node.choices.length === 0)) {
      this.onTriggerCallback?.(node.triggerEvent); return
    }
    this.onNodeCallback?.(node)
  }

  choose (choiceIndex) {
    const node = this.tree[this.currentNodeId]
    if (!node || !node.choices[choiceIndex]) return
    const choice = node.choices[choiceIndex]
    if (choice.statChanges) stateManager.applyStatChanges(choice.statChanges)
    if (choice.setFlag) stateManager.setFlag(choice.setFlag.key, choice.setFlag.value)
    if (choice.triggerEvent) { this.onTriggerCallback?.(choice.triggerEvent); return }
    this.goTo(choice.next)
  }

  _evalCondition (condition) {
    const { type, key, value } = condition
    switch (type) {
      case 'flag': return stateManager.getFlag(key) === value
      case 'fame_gte': return stateManager.get('fame') >= value
      case 'fame_lte': return stateManager.get('fame') <= value
      case 'rel_gte': return stateManager.get('relationships')[key] >= value
      case 'funds_gte': return stateManager.get('funds') >= value
      default: return true
    }
  }
}

const dialogueEngine = new DialogueEngine()
export default dialogueEngine
