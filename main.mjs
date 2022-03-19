import { runStep } from "./interpreter.mjs"
import { spec } from "./models/car-dealership.mjs"
import { makeChart } from "./chart.mjs"
import { range } from './utils.mjs';

const state = (
	range(0, 100)
		.reduce((state, _) => runStep(spec, state), undefined)
);

console.table(
	state.history['inventory']//['room temperature']
)

if (typeof(document) !== 'undefined') {
	document.body.appendChild(
		makeChart({
			coordinates: state.history['inventory'].map((value, index) => [index, value]),
			xRange: [0, 100],
			yRange: [0, 500],
			caption: 'Figure 30',
		})
	);
}