import { div, input, h3, hr, br, p, text, h, assert } from "../utils.mjs"
import { getInputId } from "../interpreter.mjs"

function convertNodeToType(node, type, model) {
    const newNode = {
        id: node.id,
        type: type,
        name: node.name,
    };

    switch (type) {
        case 'unit':
            break;
        case 'parameter':
            newNode.value = node.value || 0;
            newNode.unit = node.unit || model.model.find(n => n.type === 'unit')?.id;
            break;
        case 'boundary':
            newNode.unit = node.unit || model.model.find(n => n.type === 'unit')?.id;
            assert(newNode.unit, 'Model does not have any units');
            break;
        case 'stock':
            newNode.initialValue = node.initialValue || 0;
            newNode.unit = node.unit || model.model.find(n => n.type === 'unit')?.id;
            assert(newNode.unit, 'Model does not have any units');
            break;
        case 'flow':
            newNode.from = node.from || model.model.find(n => n.type === 'stock' || n.type === 'boundary')?.id;
            assert(newNode.from, 'Model does not have any stocks or boundaries');
            newNode.to = node.to || model.model.find(n => n.type === 'stock' || n.type === 'boundary')?.id;
            assert(newNode.to, 'Model does not have any stocks or boundaries');
            newNode.inputs = node.inputs || [];
            newNode.logic = node.logic || (() => 0)
            break;
        case 'converter':
            newNode.inputs = node.inputs || [];
            newNode.logic = node.logic || (() => 0)
            break;
    }

    return newNode;
}

function makeStockAndBoundarySelector(field, node, model) {
    return h('select', {
        value: node[field],
        oninput: evt => {
            node[field] = evt.target.value
        },
    }, model.model // TODO: units should match
        .filter(obj => obj.type === 'stock' || obj.type == 'boundary')
        .map(obj => h('option', { value: obj.id }, [text(obj.name)]))
    )
}

function makeField(element, field, node, model, state) {
    switch (field) {
        case 'name':
            return h('div', {}, [
                text('name:'),
                h('input', {
                    type: 'text',
                    value: node.name,
                    oninput: evt => {
                        node.name = evt.target.value;
                    }
                }),
            ])
        case 'type':
            return h('div', {}, [
                text('type:'),
                h('select', {
                    value: node.type,
                    oninput: evt => {
                        node = convertNodeToType(node, evt.target.value, model)
                        // TODO: Drop down loses focus because we deleted it and
                        //   created a new identical one.
                        element.parentElement.replaceChild(makeEditor(node, model), element);
                    }
                }, [
                    h('option', {}, [text('unit')]),
                    h('option', {}, [text('parameter')]),
                    h('option', {}, [text('boundary')]),
                    h('option', {}, [text('stock')]),
                    h('option', {}, [text('flow')]),
                    h('option', {}, [text('converter')]),
                ]),
            ])
        case 'logic':
            return h('div', {}, [
                text('logic: '),
                h('textarea', {
                    value: node.logic,
                    oninput: evt => {
                        node.logic = eval(`(0,${evt.target.value})`)
                    }
                })])
        case 'to':
            return h('div', {}, [
                text('to: '),
                makeStockAndBoundarySelector('to', node, model)
            ])
        case 'from':
            return h('div', {}, [
                text('from: '),
                makeStockAndBoundarySelector('from', node, model)
            ])
        case 'initialValue':
            return h('div', {}, [
                text('Initial value:'),
                h('input', { 
                    type: "number",
                    value: node.initialValue,
                    oninput: evt => {
                        node.initialValue = parseFloat(evt.target.value)
                    }
                })
            ])
        case 'inputs':
            {
                const currentInputs = {};
                node.inputs.forEach(input => {
                    currentInputs[getInputId(input)] = true;
                });
                const possibleInputs = (
                    model.model
                        .filter(obj => obj.type !== 'unit' && obj.type !== 'boundary')
                        .sort((a, b) => (''+a).localeCompare(''+b))
                );
                return h('div', {}, 
                    possibleInputs.map(obj =>
                        h('div', {}, [
                            h('input', {
                                type: 'checkbox',
                                checked: currentInputs[obj.id],
                            }),
                            text(' '),
                            text(obj.name)
                        ]
                    )) 
                )
            }
        default:
            return h('p', { type: field }, [])
    }
}

export function makeEditor(node, model) {
    const element = div([
        h('button', {
            onclick: evt => {
                model.upsert(Object.assign({}, newNode))
            }
        }, [text('Edit Node')])])
    const state = {}
    let newNode = Object.assign({}, node);
    Object.keys(newNode)
        .forEach(k => {
            element.appendChild(makeField(element, k, newNode, model, state))
        })

    return element;
}
