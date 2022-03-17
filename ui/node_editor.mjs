import { div, input, h3, hr, br, p, text, h, assert } from "../utils.mjs"

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
}
