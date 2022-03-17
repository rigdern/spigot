import { div, input, h3, hr, br, p, text, h, assert } from "../utils.mjs"

// implicit:
// - id: string (readonly, hidden)
// - type: unit | parameter | boundary | stock | flow | converter
// - name: string

const commonSchema = {
    // id (readonly, hidden)
    type: 'type',
    name: 'string',
}

const schemas = {
    unit: {},
    parameter: {
        valueType: 'parameter-value-type',
        value: 'parameter-value',
    },
    boundary: {
        unit: 'unit',
    },
    stock: {
        initialValue: 'number',
        unit: 'unit',
    },
    flow: {
        from: 'stock-or-boundary',
        to: 'stock-or-boundary',
        inputs: 'input-list',
        logic: 'function',
    },
    converter: {
        inputs: 'input-list',
        logic: 'function',
    },
}

const templates = {
    unit: {},
    parameter: {
        value: 0,
    },
    boundary: {
        unit: '',
    },
    stock: {
        initialValue: 0,
        unit: '',
    },
    flow: {
        from: 'stock-or-boundary',
        to: 'stock-or-boundary',
        inputs: 'input-list',
        logic: 'function',
    },
    converter: {
        inputs: 'input-list',
        logic: 'function',
    },
}

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

export function makeEditor(node, model) {
    let element;
    let newNode = Object.assign({}, node);
    const children = [
        h('div', {}, [
            text('name:'),
            h('input', {
                type: 'text',
                value: node.name,
                oninput: evt => {
                    newNode.name = evt.target.value;
                }
            }),
        ]),
        h('div', {}, [
            text('type:'),
            h('select', {
                value: node.type,
                oninput: evt => {
                    console.log('oldNode:' + JSON.stringify(newNode));
                    newNode = convertNodeToType(newNode, evt.target.value, model)
                    console.log('newNode:' + JSON.stringify(newNode));
                    // TODO: Drop down loses focus because we deleted it and
                    //   created a new identical one.
                    element.parentElement.replaceChild(makeEditor(newNode, model), element);
                }
            }, [
                h('option', {}, [text('unit')]),
                h('option', {}, [text('parameter')]),
                h('option', {}, [text('boundary')]),
                h('option', {}, [text('stock')]),
                h('option', {}, [text('flow')]),
                h('option', {}, [text('converter')]),
            ]),
        ]),
    ];

    element = div(children);
    return element;

    // switch (x) {
    //    case 'unit':
    //        break;
    //    case 'parameter':
    //        break;
    //    case 'boundary':
    //        break;
    //    case 'stock':
    //        break;
    //    case 'flow':
    //        break;
    //    case 'converter':
    //        break;
    // }
}

// export function makeEditor(node, model) {
//     return renderNode(node, model);
//     const newNode = Object.assign({}, node);
//     const children = (
//         Object.entries(node)
//             .filter(([k, v]) => k !== 'id')
//             .map(([k, v]) =>
//                 h('div', {}, [
//                     text(`${k}:`),
//                     h('input', {
//                         type: 'text',
//                         value: v,
//                         oninput: evt => {
//                             newNode[k] = evt.target.value;
//                         }
//                     }),
//                 ])
//             )
//     );

//     return div(children.concat([
//         h('button', {
//             onclick: evt => {
//                 model.upsert(Object.assign({}, newNode))
//             }
//         }, [
//             text('Add/edit Node')
//         ])
//     ]))
// }

