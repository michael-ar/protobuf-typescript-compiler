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
      const depString = `${[...new Set(deps)]
        .filter(x => x !== namespace)
        .map(
          x =>
            `import * as ${x.split('.').slice(-1)} from './${x
              .split('.')
              .slice(-1)}';`,
        )
        .join('\n')}\n`;

      return `${depString}
        ${node.body.map(printer).join('\n')}
      `;

    case Types.Message:
      const oneofs = node.nodes.filter(x => x.type === Types.Oneof);
      let oneofString;
      if (oneofs.length) {
        oneofString = oneofs
          .reduce((acc, v) => {
            const names = v.children.map(x => x.name);
            const str = `(${names.join(' | ')})`;
            acc.push(str);
            return acc;
          }, [])
          .join(' & ');
      }
      return `${node.export ? 'export ' : ''}type ${node.name} = {
        ${node.nodes
          .filter(x => x.type !== Types.Oneof)
          .map(printer)
          .join(';\n')}${
        node.nodes.filter(x => x.type !== Types.Oneof).length ? ';' : ''
      }
      }${oneofString ? ` & ${oneofString}` : ''}\n`;

    case Types.Enum:
      return `export type ${node.name} = ${node.fields
        .map(field => `'${field.value}'`)
        .join(' | ')};\n`;

    case Types.Field:
      return `${node.name}${node.optional ? '?' : ''}: ${
        node.repeated ? 'Array<' : ''
      }${printer(node.value)}${node.repeated ? '>' : ''}`;

    case Types.Map: {
      return `{ [x: ${printer(node.key)}]: ${printer(node.value)} }`;
    }

    case Types.Oneof: {
      //   type Customer = {
      //     x?: string;
      // } & (incorporatedBusiness | individual | soleTrader);

      return; // `${node.children.map(field => `'${field.name}'`).join(' | ')}`;
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
