import {Parser} from "acorn";

import {simple} from "acorn-walk";

export function getParams(input) {
    const body = Parser.parse(input);
    return findReferences(body);
}

export function findReferences(node) {
    const locals = new Set();
    let funcName;

    function declareLocal(node, id) {
        locals.add(id.name);
    }

    function declareFunction(node) {
        node.params.forEach((param) => declarePattern(param, node));
        if (node.id) funcName = node.id.name;
    }

    function declarePattern(node, parent) {
        switch (node.type) {
            case "Identifier":
                declareLocal(parent, node);
                break;
            case "ObjectPattern":
                node.properties.forEach((node) => declarePattern(node.type === "Property" ? node.value : node, parent));
                break;
            case "ArrayPattern":
                node.elements.forEach((node) => node && declarePattern(node, parent));
                break;
            case "RestElement":
                declarePattern(node.argument, parent);
                break;
            case "AssignmentPattern":
                declarePattern(node.left, parent);
                break;
        }
    }

    simple(node, {
        FunctionDeclaration(node, _state, parents) {
            declareFunction(node);
        },
        FunctionExpression: declareFunction,
        ArrowFunctionExpression: declareFunction,
    });
    
    return [funcName, locals]
}
