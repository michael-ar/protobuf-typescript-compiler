const { Types } = require('./constants');

function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node, parent) {
    let methods = visitor[node.type];

    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // console.log('node!');
    // console.dir(node);
    switch (node.type) {
      case Types.Program:
        traverseArray(node.body, node);
        break;

      case Types.Module:
        // console.log(node.type);
        // console.dir(node.body);
        // console.dir(parent);
        // console.log('module!');
        // console.dir(node);

        traverseArray(node.body.body, node);
        break;

      case Types.Message:
      case Types.Service:
        traverseArray(node.nodes, node);
        break;

      case Types.Field:
        traverseNode(node.value, node);
        break;

      case Types.NumberLiteral:
      case Types.StringLiteral:
      case Types.Enum:
      case Types.Map:
      case Types.Type:
      case Types.Oneof:
      case Types.RPC:
      case Types.CustomType:
      case Types.ImportDeclaration:
      case Types.SyntaxDeclaration:
      case Types.PackageDeclaration:
      case Types.UnusedModule:
        break;

      default:
        throw new TypeError(node.type);
    }

    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

module.exports = traverser;
