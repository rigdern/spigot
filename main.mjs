import { runStep, topologicalSort, implicitSpec } from "./interpreter.mjs"
import { spec } from "./models/car-dealership.mjs"
import { range } from './utils.mjs';

console.table(topologicalSort(spec.concat(implicitSpec)))

console.table(range(0, 100).
	      reduce((statelog, _) => (statelog.push(runStep(spec, statelog[statelog.length - 1])), statelog), []).map(state => state.history.inventory)
)
