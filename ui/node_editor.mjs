import { makeElement, div, input, h3, hr, br, p, text } from "../utils.mjs"

export function makeEditor(node) {
    const children = Object.entries(node).map(([k, v]) => p([text(`${k}: ${v}`)]))
    return div(children)
}
