import { runStep } from "./interpreter.mjs"
import { spec } from "./models/car-dealership.mjs"
import { range } from './utils.mjs';


let state = runStep(spec);
console.table(range(0, 100).
  reduce((statelog, _) => (statelog.push(runStep(spec, statelog[statelog.length - 1])), statelog), [])
)