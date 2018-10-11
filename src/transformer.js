const { Types } = require('./constants');
const traverser = require('./traverser');

function transformer(ast) {
  let newAst = {
    type: 'Program',
    body: [],
    modules: {},
  };

  const noTransform = (node, parent) => parent._context.push(node);
  ast._context = newAst.body;
  ast._modules = newAst.modules;

  traverser(ast, {
    SyntaxDeclaration: {
      enter(node, parent) {
        parent._context.push({
          type: 'SyntaxDeclaration',
          value: node.value,
        });
      },
    },
    Module: {
      enter(node, parent) {
        if (!node._context) node._context = [];
        newAst.modules[node.name] = node;
      },
    },

    Field: {
      enter(node, parent) {
        if (node.value.type === Types.Oneof) {
          const transformed = node.value.children.map(x => ({
            ...x,
            optional: 'true',
          }));
          transformed.map(x => parent.nodes.push(x));
        }
      },
    },
    Enum: {
      enter: noTransform,
    },

    Message: {
      enter: noTransform,
    },

    Service: {
      enter: noTransform,
    },
  });

  // At the end of our transformer function we'll return the new ast that we
  // just created.
  const unnestModules = Object.values(newAst.modules).map(x => x.body);
  const mergedModules = unnestModules.reduce((acc, mod) => {
    const name = mod.body.find(x => x.type === 'PackageDeclaration').value;
    if (!acc[name]) acc[name] = mod;
    else {
      acc[name].body = acc[name].body.concat(mod.body);
    }
    return acc;
  }, {});
  newAst.modules = Object.values(mergedModules);
  return newAst;
}

module.exports = transformer;
