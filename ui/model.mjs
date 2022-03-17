import { runStep } from "../interpreter.mjs"
import { range } from "../utils.mjs"
import { Notifier } from "./notifier.mjs"

export class Model {
    constructor() {
	this.model = []
	this.notifier = new Notifier()
    }
    lookup(id) {
	for (const node of this.model) {
	    if (node.id === id) {
		return node
	    }
	}
	return undefined
    }
    upsert(node) {
	const oldNode = this.lookup(node.id)
	if (oldNode !== undefined) {
	    const idx = this.model.indexOf(oldNode)
	    this.model[idx] = node
	    this.notifier.emit("edit", node)
	} else {
	    this.model.push(node)
	    this.notifier.emit("insert", node)
	}
	return this
    }
    deleteNode(id) {
	const node = this.lookup(id)
	const idx = this.model.indexOf(node)
	this.model.splice(idx, 1)
	this.notifier.emit("delete", node)
	return this
    }
    simulate(steps) {
	return range(0, steps).reduce((state, _) => runStep(this.model, state), undefined)
    }
    [Symbol.iterator] () {
	return this.model[Symbol.iterator]()
    }
}
