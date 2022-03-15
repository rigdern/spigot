export class Notifier {
    constructor () {
	this.callbacks = {}
    }
    subscribe(evt, handler) {
	if (this.callbacks[evt] === undefined) {
	    this.callbacks[evt] = []
	}
	this.callbacks[evt].push(handler)
	let called = undefined
	return () => {
	    if (called) {
		throw new Error(`Called unsubscribe on ${evt} twice`)
	    }
	    called = true
	    const idx = this.callbacks[evt].indexOf(handler)
	    this.callbacks[evt].splice(idx, 1)
	    return
	}
    }
    emit(evt, data) {
	if (this.callbacks[evt] !== undefined) {
	    for (const cb of this.callbacks[evt]) {
		cb(data)
	    }
	}
	return
    }
}
