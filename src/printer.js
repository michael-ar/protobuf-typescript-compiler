const { Types } = require('./constants');

const printer = node => {
  switch (node.type) {
    case Types.Program:
      const namespace = node.body.find(x => x.type === Types.PackageDeclaration)
        .value;
      const dependencies = node.body.filter(x => x.type === Types.Module);
      let deps = [];
      if (dependencies.length) {
        deps = dependencies.map(
          x => x.body.body.find(x => x.type === Types.PackageDeclaration).value,
        );
      }
      const depString = `${[ ...new Set(deps) ]
        .filter(x => x !== namespace)
        .map(
          x =>
            `import * as ${x.replace('paybase.', '')} from './${x.replace(
              'paybase.',
              '',
            )}';`,
        )
        .join('\n')}\n`;

      return `${depString}
        ${node.body.map(printer).join('\n')}
      `;

    case Types.Message:
      return `export type ${node.name} = {
        ${node.nodes.map(printer).join(';\n')}${node.nodes.length ? ';' : ''}
      }`;

    case Types.Enum:
      return `export type ${node.name} = ${node.fields
        .map(field => `'${field.value}'`)
        .join(' | ')};`;

    case Types.Field:
      return `${node.name}${node.optional === 'true' ? '?' : ''}: ${
        node.repeated ? 'Array<' : ''
      }${printer(node.value)}${node.repeated ? '>' : ''}`;

    case Types.Map: {
      return `{ [x: ${printer(node.key)}]: ${printer(node.value)} }`;
    }

    case Types.Oneof: {
      return `${node.children.map(field => `'${field.name}'`).join(' | ')}`;
    }

    case Types.CustomType:
    case Types.Type:
      return node.value;

    case Types.ImportDeclaration:
    case Types.SyntaxDeclaration:
    case Types.PackageDeclaration:
    case Types.UnusedModule:
    case Types.Module:
      return;

    default:
      throw new TypeError(node.type);
  }
};

module.exports = printer;
